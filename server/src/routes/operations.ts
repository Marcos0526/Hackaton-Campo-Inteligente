import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { protect } from '../lib/session';

const router = Router();

const operationInclude = {
  offer: {
    include: {
      producer: {
        select: {
          id: true,
          name: true,
          producerProfile: { select: { farmName: true, location: true } },
        },
      },
    },
  },
  buyer: {
    select: {
      id: true,
      name: true,
      buyerProfile: { select: { companyName: true, deliveryLocation: true } },
    },
  },
  buyerRequest: { include: { buyer: { select: { id: true, name: true } } } },
  transportQuotes: {
    include: {
      transporter: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
  },
} as const;

// Rough coordinates for the cities used by the demo seed.
const CITY_COORDS: Record<string, [number, number]> = {
  celaya: [20.52, -100.82],
  uruapan: [19.42, -102.06],
  tepatitlan: [20.82, -102.76],
  hermosillo: [29.07, -110.96],
  torreon: [25.54, -103.41],
  culiacan: [24.8, -107.39],
  irapuato: [20.67, -101.35],
  xalapa: [19.54, -96.91],
  pachuca: [20.1, -98.74],
  oaxaca: [17.07, -96.72],
  queretaro: [20.59, -100.39],
  guadalajara: [20.67, -103.35],
  morelia: [19.7, -101.19],
  monterrey: [25.69, -100.32],
  mazatlan: [23.25, -106.42],
  cdmx: [19.43, -99.13],
  cancun: [21.16, -86.85],
  puebla: [19.04, -98.2],
  veracruz: [19.17, -96.13],
  toluca: [19.29, -99.66],
  zapopan: [20.72, -103.39],
  leon: [21.12, -101.68],
  chihuahua: [28.63, -106.08],
  ensenada: [31.87, -116.6],
};

function cityKey(location: string): string {
  return (location || '')
    .split(',')[0]
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function estimateDistanceKm(origin: string, destination: string): number {
  const from = CITY_COORDS[cityKey(origin)];
  const to = CITY_COORDS[cityKey(destination)];
  if (!from || !to) return 300;
  return Math.max(20, Math.round(haversineKm(from, to) * 1.25));
}

export function estimateFreightPrice(distanceKm: number): number {
  const raw = distanceKm * 24;
  return Math.max(1500, Math.round(raw / 50) * 50);
}

// ------------------------------------------------------------- Buyer: buy
router.post('/buy', protect, async (req: any, res) => {
  if (req.user.role !== 'buyer') {
    return res.status(403).json({ message: 'Solo los compradores pueden comprar ofertas' });
  }

  const { offerId } = req.body;
  const quantity = parseFloat(req.body.quantity);

  if (!offerId || !Number.isFinite(quantity) || quantity <= 0) {
    return res.status(400).json({ message: 'Indica la oferta y una cantidad válida' });
  }

  const offer = await prisma.commercialOffer.findUnique({ where: { id: offerId } });
  if (!offer) return res.status(404).json({ message: 'La oferta ya no existe' });
  if (offer.status !== 'published') {
    return res.status(409).json({ message: 'Esta oferta ya no está disponible' });
  }
  if (quantity > offer.quantity) {
    return res.status(400).json({ message: `Solo hay ${offer.quantity} ${offer.unit} disponibles` });
  }

  const [operation] = await prisma.$transaction([
    prisma.commercialOperation.create({
      data: {
        offerId,
        buyerId: req.user.id,
        quantity,
        agreedPrice: quantity * offer.pricePerUnit,
        status: 'confirmed',
      },
      include: operationInclude,
    }),
    prisma.commercialOffer.update({
      where: { id: offerId },
      data:
        offer.quantity - quantity > 0
          ? { quantity: offer.quantity - quantity }
          : { status: 'confirmed' },
    }),
    prisma.notification.create({
      data: {
        userId: offer.producerId,
        title: 'Nueva compra',
        message: `${req.user.name} quiere comprar ${quantity} ${offer.unit} de ${offer.productName}.`,
      },
    }),
  ]);

  res.status(201).json(operation);
});

// ------------------------------------------- Transporter: available trips
router.get('/available', protect, async (req: any, res) => {
  if (req.user.role !== 'transporter') {
    return res.status(403).json({ message: 'Solo los transportistas pueden ver viajes' });
  }

  const operations = await prisma.commercialOperation.findMany({
    where: {
      status: { in: ['confirmed', 'transport_pending'] },
      transportQuotes: { none: { status: 'accepted' } },
    },
    include: operationInclude,
    orderBy: { createdAt: 'desc' },
  });

  res.json(operations);
});

// --------------------------------------------- Transporter: accept a trip
router.post('/:id/accept-transport', protect, async (req: any, res) => {
  if (req.user.role !== 'transporter') {
    return res.status(403).json({ message: 'Solo los transportistas pueden aceptar viajes' });
  }

  const profile = await prisma.transporterProfile.findUnique({ where: { userId: req.user.id } });
  if (!profile) {
    return res.status(400).json({ message: 'Tu perfil de transportista está incompleto' });
  }

  const operation = await prisma.commercialOperation.findUnique({
    where: { id: req.params.id },
    include: operationInclude,
  });
  if (!operation) return res.status(404).json({ message: 'El viaje ya no existe' });
  if (!['confirmed', 'transport_pending'].includes(operation.status)) {
    return res.status(409).json({ message: 'Este viaje ya no está disponible' });
  }
  if (operation.transportQuotes.some((quote) => quote.status === 'accepted')) {
    return res.status(409).json({ message: 'Otro transportista ya aceptó este viaje' });
  }

  const origin = operation.offer?.producer?.producerProfile?.location || 'Origen';
  const destination = operation.buyer?.buyerProfile?.deliveryLocation || 'Destino';
  const distanceKm = estimateDistanceKm(origin, destination);
  const quotedPrice = estimateFreightPrice(distanceKm);

  const [quote] = await prisma.$transaction([
    prisma.transportQuote.create({
      data: {
        transporterId: profile.id,
        operationId: operation.id,
        origin,
        destination,
        distanceKm,
        quotedPrice,
        status: 'accepted',
      },
      include: {
        transporter: { include: { user: { select: { id: true, name: true } } } },
      },
    }),
    prisma.commercialOperation.update({
      where: { id: operation.id },
      data: { status: 'transport_pending' },
    }),
    ...(operation.offer?.producerId
      ? [
          prisma.notification.create({
            data: {
              userId: operation.offer.producerId,
              title: 'Transporte asignado',
              message: `${req.user.name} recogerá tu carga en ${origin}.`,
            },
          }),
        ]
      : []),
    ...(operation.buyerId
      ? [
          prisma.notification.create({
            data: {
              userId: operation.buyerId,
              title: 'Transporte asignado',
              message: `${req.user.name} llevará tu compra a ${destination}.`,
            },
          }),
        ]
      : []),
  ]);

  res.status(201).json(quote);
});

// ------------------------------------------------------ My operations
router.get('/mine', protect, async (req: any, res) => {
  const user = req.user;

  let where: any;
  if (user.role === 'transporter') {
    where = { transportQuotes: { some: { transporter: { userId: user.id } } } };
  } else if (user.role === 'producer') {
    where = { offer: { producerId: user.id } };
  } else {
    where = { buyerId: user.id };
  }

  const operations = await prisma.commercialOperation.findMany({
    where,
    include: operationInclude,
    orderBy: { createdAt: 'desc' },
  });

  res.json(operations);
});

// ------------------------------------------------------ Update status
const ALLOWED_STATUSES = ['in_transit', 'delivered', 'completed', 'cancelled'];

router.patch('/:id/status', protect, async (req: any, res) => {
  const { status } = req.body;
  if (!ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Estado no válido' });
  }

  const operation = await prisma.commercialOperation.findUnique({
    where: { id: req.params.id },
    include: operationInclude,
  });
  if (!operation) return res.status(404).json({ message: 'Operación no encontrada' });

  const user = req.user;
  const isBuyer = operation.buyerId === user.id;
  const isProducer = operation.offer?.producerId === user.id;
  const isTransporter = operation.transportQuotes.some((quote) => quote.transporter.userId === user.id);

  if (!isBuyer && !isProducer && !isTransporter) {
    return res.status(403).json({ message: 'No participas en esta operación' });
  }

  const updated = await prisma.commercialOperation.update({
    where: { id: operation.id },
    data: { status },
    include: operationInclude,
  });

  res.json(updated);
});

export default router;
