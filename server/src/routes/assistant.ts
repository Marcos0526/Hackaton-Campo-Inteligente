import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { protect } from '../lib/session';
import { chatComplete, currentProviderName } from '../lib/llm';

const router = Router();

const ROLE_LABELS: Record<string, string> = {
  producer: 'productor',
  transporter: 'transportista',
  buyer: 'comprador',
};

const STOPWORDS = new Set([
  'que', 'con', 'por', 'para', 'los', 'las', 'una', 'uno', 'del', 'como', 'mas', 'muy',
  'hola', 'buenas', 'quiero', 'necesito', 'busco', 'tengo', 'hay', 'donde', 'cuando',
  'soy', 'me', 'mi', 'mis', 'tu', 'sus', 'el', 'la', 'de', 'en', 'y', 'o', 'un', 'es',
  'al', 'se', 'lo', 'su', 'pero', 'sin', 'sobre', 'este', 'esta', 'estos', 'estas',
  'puedo', 'podrias', 'ayuda', 'ayudame', 'favor', 'gracias', 'vender', 'comprar',
]);

function normalize(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

function scoreText(text: string, tokens: string[]): number {
  const haystack = normalize(text);
  return tokens.reduce((acc, token) => (haystack.includes(token) ? acc + 1 : acc), 0);
}

interface OfferRow {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
  quality: string;
  pricePerUnit: number;
  availableDate: Date;
  producer: { name: string; producerProfile: { location: string } | null };
}

interface RequestRow {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
  targetPriceMin: number;
  targetPriceMax: number;
  deliveryDate: Date;
  buyer: { name: string; buyerProfile: { deliveryLocation: string } | null };
}

function compactOffer(offer: OfferRow) {
  return {
    id: offer.id,
    tipo: 'oferta',
    producto: offer.productName,
    cantidad: `${offer.quantity} ${offer.unit}`,
    calidad: offer.quality,
    precioPorUnidad: offer.pricePerUnit,
    moneda: 'MXN',
    productor: offer.producer.name,
    ubicacion: offer.producer.producerProfile?.location || null,
    disponibleDesde: offer.availableDate.toISOString().slice(0, 10),
  };
}

function compactRequest(request: RequestRow) {
  return {
    id: request.id,
    tipo: 'solicitud',
    producto: request.productName,
    cantidad: `${request.quantity} ${request.unit}`,
    precioMin: request.targetPriceMin,
    precioMax: request.targetPriceMax,
    moneda: 'MXN',
    comprador: request.buyer.name,
    entregaEn: request.buyer.buyerProfile?.deliveryLocation || null,
    fechaEntrega: request.deliveryDate.toISOString().slice(0, 10),
  };
}

function parseAssistantJson(raw: string): { answer: string; offerIds: string[]; requestIds: string[] } | null {
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;

  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    return {
      answer: typeof parsed.answer === 'string' ? parsed.answer.trim() : '',
      offerIds: Array.isArray(parsed.offerIds) ? parsed.offerIds.filter((id: any) => typeof id === 'string') : [],
      requestIds: Array.isArray(parsed.requestIds) ? parsed.requestIds.filter((id: any) => typeof id === 'string') : [],
    };
  } catch {
    return null;
  }
}

function fallbackSelection(message: string, offers: OfferRow[], requests: RequestRow[]) {
  const tokens = tokenize(message);
  const rankedOffers = offers
    .map((offer) => ({
      offer,
      score: scoreText(`${offer.productName} ${offer.producer.producerProfile?.location || ''}`, tokens),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.offer);

  const rankedRequests = requests
    .map((request) => ({
      request,
      score: scoreText(`${request.productName} ${request.buyer.buyerProfile?.deliveryLocation || ''}`, tokens),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.request);

  return { offers: rankedOffers, requests: rankedRequests };
}

function friendlyFallback(message: string, offers: OfferRow[], requests: RequestRow[]) {
  const { offers: matchedOffers, requests: matchedRequests } = fallbackSelection(message, offers, requests);
  const total = matchedOffers.length + matchedRequests.length;

  if (total === 0) {
    return {
      answer:
        '¡Claro que sí! 😊 Por ahora no encontré opciones que coincidan exactamente con lo que buscas. ' +
        'Puedes revisar la sección Mercado para ver todo lo disponible, o decirme el nombre del producto y te ayudo a buscar otra vez.',
      offers: [] as OfferRow[],
      requests: [] as RequestRow[],
    };
  }

  return {
    answer:
      '¡Claro! Encontré estas opciones que pueden servirte 👇 ' +
      'Toca cualquiera para verla con más detalle. Si quieres, dime cuánto necesitas o cuánto quieres gastar y te ayudo a elegir.',
    offers: matchedOffers,
    requests: matchedRequests,
  };
}

router.post('/chat', protect, async (req: any, res) => {
  const message = String(req.body?.message || '').trim();
  if (!message) {
    return res.status(400).json({ message: 'Escribe tu pregunta' });
  }

  const history = Array.isArray(req.body?.history)
    ? req.body.history
        .filter((item: any) => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
        .slice(-6)
        .map((item: any) => ({ role: item.role, content: item.content.slice(0, 500) }))
    : [];

  const [offers, requests, profile] = await Promise.all([
    prisma.commercialOffer.findMany({
      where: { status: 'published' },
      include: {
        producer: {
          select: { name: true, producerProfile: { select: { location: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 25,
    }),
    prisma.buyerRequest.findMany({
      where: { status: 'published' },
      include: {
        buyer: {
          select: { name: true, buyerProfile: { select: { deliveryLocation: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 25,
    }),
    prisma.user.findUnique({
      where: { id: req.user.id },
      include: { producerProfile: true, transporterProfile: true, buyerProfile: true },
    }),
  ]);

  const compactOffers = offers.map(compactOffer);
  const compactRequests = requests.map(compactRequest);
  const role = ROLE_LABELS[req.user.role] || req.user.role;

  const systemPrompt = `Eres "Campo", el asistente virtual de Campo Inteligente, una plataforma mexicana que conecta a productores del campo, transportistas y compradores.

Habla en español sencillo, cálido y cercano. La persona que te escribe puede no saber de tecnología: evita tecnicismos, usa frases cortas y sé paciente. Tutéala siempre. Usa como máximo 3 emojis.

Tu trabajo:
- Ayudar a encontrar ofertas de productores y solicitudes de compradores usando SOLO los datos que recibes.
- Si la persona es compradora, sugiérele ofertas que le convengan.
- Si es productora, sugiérele solicitudes de compradores.
- Si es transportista, cuéntale que puede aceptar viajes desde la sección Mercado o Procesos.
- Si pregunta cómo usar la app, explícalo en pasos muy simples.
- Nunca inventes productos, precios, ubicaciones ni IDs que no estén en los datos.

Devuelve SOLO un objeto JSON válido, sin markdown y sin texto extra, con esta forma exacta:
{"answer":"respuesta amable en español","offerIds":["id-de-oferta"],"requestIds":["id-de-solicitud"]}

Reglas:
- "answer": máximo 4 frases, claro y amable.
- "offerIds" y "requestIds": solo IDs de las listas recibidas, máximo 3 de cada una. Si no hay opciones relevantes, deja los arreglos vacíos.
- Si no sabes algo, dilo con amabilidad y sugiere revisar la sección Mercado.`;

  const userPayload = {
    usuario: {
      nombre: req.user.name,
      rol: role,
      perfil: {
        productor: profile?.producerProfile
          ? {
              rancho: profile.producerProfile.farmName,
              ubicacion: profile.producerProfile.location,
              cultivos: profile.producerProfile.crops,
            }
          : null,
        transportista: profile?.transporterProfile
          ? {
              base: profile.transporterProfile.baseLocation,
              vehiculo: profile.transporterProfile.vehicleType,
              capacidadKg: profile.transporterProfile.loadCapacityKg,
            }
          : null,
        comprador: profile?.buyerProfile
          ? {
              empresa: profile.buyerProfile.companyName,
              entregaEn: profile.buyerProfile.deliveryLocation,
              intereses: profile.buyerProfile.preferredCrops,
            }
          : null,
      },
    },
    mensaje: message,
    ofertasDisponibles: compactOffers,
    solicitudesDisponibles: compactRequests,
  };

  try {
    const { content, provider } = await chatComplete([
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: JSON.stringify(userPayload) },
    ]);

    const parsed = parseAssistantJson(content);

    if (!parsed) {
      const fallback = friendlyFallback(message, offers, requests);
      return res.json({ ...fallback, provider: `${provider}+fallback` });
    }

    const offerMap = new Map(offers.map((offer) => [offer.id, offer]));
    const requestMap = new Map(requests.map((request) => [request.id, request]));

    const selectedOffers = parsed.offerIds.map((id) => offerMap.get(id)).filter(Boolean).slice(0, 3) as OfferRow[];
    const selectedRequests = parsed.requestIds.map((id) => requestMap.get(id)).filter(Boolean).slice(0, 3) as RequestRow[];

    const answer =
      parsed.answer ||
      '¡Listo! Aquí tienes las opciones que encontré para ti. Si quieres, dime más detalles y te ayudo a elegir 😊';

    return res.json({ answer, offers: selectedOffers, requests: selectedRequests, provider });
  } catch (error) {
    console.error('Assistant error:', error);
    const fallback = friendlyFallback(message, offers, requests);
    return res.json({ ...fallback, provider: `${currentProviderName()}+fallback` });
  }
});

export default router;
