import { FormEvent, useEffect, useRef, useState } from 'react';
import { api, BuyerRequest, ChatHistoryItem, Offer } from '../lib/api';
import { Badge, BuyDialog, Card, GREEN, inputStyle, money, primaryButton, shortDate } from './ui';

type Tab = 'home' | 'market' | 'processes' | 'profile';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  offers?: Offer[];
  requests?: BuyerRequest[];
}

export function Chat({
  name,
  role,
  onNavigate,
  onGoToItem,
  onChanged,
}: {
  name: string;
  role: string;
  onNavigate: (tab: Tab) => void;
  onGoToItem: (kind: 'offer' | 'request', id: string) => void;
  onChanged: () => void;
}) {
  const greeting =
    role === 'buyer'
      ? `¡Hola, ${name}! 👋 Soy Campo, tu asistente. Dime qué producto necesitas y te muestro las mejores ofertas disponibles.`
      : role === 'producer'
      ? `¡Hola, ${name}! 👋 Soy Campo, tu asistente. Dime qué cosecha quieres vender y te muestro quién la está comprando.`
      : `¡Hola, ${name}! 👋 Soy Campo, tu asistente. Dime desde dónde sales y te ayudo a encontrar viajes disponibles.`;

  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'assistant', text: greeting }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [buyOffer, setBuyOffer] = useState<Offer | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  const send = async (text: string) => {
    const clean = text.trim();
    if (!clean || loading) return;

    const history: ChatHistoryItem[] = messages.map((message) => ({
      role: message.role,
      content: message.text,
    }));

    setMessages((prev) => [...prev, { role: 'user', text: clean }]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.chat(clean, history);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: response.answer, offers: response.offers, requests: response.requests },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Uy, tuve un problema para responder 😅 (${err.message || 'error de conexión'}). Intenta de nuevo en un momento.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const suggestions =
    role === 'producer'
      ? ['Quiero vender mi cosecha', '¿Quién compra maíz?', '¿Cómo publico una oferta?']
      : role === 'transporter'
      ? ['¿Qué viajes hay?', '¿Cómo acepto un viaje?', '¿Qué capacidad tengo?']
      : ['¿Qué hay disponible hoy?', 'Busco jitomate', '¿Cómo compro?'];

  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid #eef0ee',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: GREEN,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
            }}
          >
            C
          </div>
          <div>
            <strong style={{ display: 'block', color: GREEN }}>Campo</strong>
            <span style={{ fontSize: '0.78rem', color: '#7a877a' }}>Asistente con IA · en línea</span>
          </div>
          <Badge tone="gray">Beta</Badge>
        </div>

        <div style={{ height: '52vh', minHeight: '340px', overflowY: 'auto', padding: '18px', background: '#fbfcfb' }}>
          {messages.map((message, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '14px',
              }}
            >
              <div
                style={{
                  maxWidth: '86%',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  background: message.role === 'user' ? '#e1f0e6' : 'white',
                  border: message.role === 'user' ? 'none' : '1px solid #e6ece6',
                  fontSize: '0.95rem',
                  lineHeight: 1.45,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {message.text}

                {!!message.offers?.length && (
                  <div style={{ display: 'grid', gap: '8px', marginTop: '12px' }}>
                    {message.offers.map((offer) => (
                      <div key={offer.id} style={{ border: '1px solid #dbe5db', borderRadius: '10px', padding: '10px 12px', background: '#fbfdfb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                          <strong style={{ fontSize: '0.92rem' }}>{offer.productName}</strong>
                          <span style={{ fontSize: '0.85rem', color: GREEN, fontWeight: 700 }}>
                            {money.format(offer.pricePerUnit)}
                          </span>
                        </div>
                        <p style={{ margin: '4px 0 8px', fontSize: '0.8rem', color: '#5b6b5b' }}>
                          {offer.quantity} {offer.unit} · {offer.producer?.name || offer.producerId} · disponible {shortDate(offer.availableDate)}
                        </p>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {role === 'buyer' && (
                            <button
                              onClick={() => setBuyOffer(offer)}
                              style={{ ...primaryButton, padding: '6px 12px', fontSize: '0.8rem' }}
                            >
                              Comprar
                            </button>
                          )}
                          <button
                            onClick={() => onGoToItem('offer', offer.id)}
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.8rem',
                              borderRadius: '8px',
                              border: '1px solid #cfd8cf',
                              background: 'white',
                              cursor: 'pointer',
                            }}
                          >
                            Ver en el mercado
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!!message.requests?.length && (
                  <div style={{ display: 'grid', gap: '8px', marginTop: '12px' }}>
                    {message.requests.map((request) => (
                      <div key={request.id} style={{ border: '1px solid #dbe5db', borderRadius: '10px', padding: '10px 12px', background: '#fbfdfb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                          <strong style={{ fontSize: '0.92rem' }}>{request.productName}</strong>
                          <span style={{ fontSize: '0.85rem', color: GREEN, fontWeight: 700 }}>
                            {money.format(request.targetPriceMin)} – {money.format(request.targetPriceMax)}
                          </span>
                        </div>
                        <p style={{ margin: '4px 0 8px', fontSize: '0.8rem', color: '#5b6b5b' }}>
                          {request.quantity} {request.unit} · {request.buyer?.name || request.buyerId} · entrega {shortDate(request.deliveryDate)}
                        </p>
                        <button
                          onClick={() => onGoToItem('request', request.id)}
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.8rem',
                            borderRadius: '8px',
                            border: '1px solid #cfd8cf',
                            background: 'white',
                            cursor: 'pointer',
                          }}
                        >
                          Ver en el mercado
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {message.role === 'assistant' && (message.offers?.length || message.requests?.length) ? (
                  <div style={{ marginTop: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => onNavigate('market')}
                      style={{ ...primaryButton, padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      Ir al mercado
                    </button>
                    {role === 'transporter' && (
                      <button
                        onClick={() => onNavigate('processes')}
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.8rem',
                          borderRadius: '8px',
                          border: '1px solid #cfd8cf',
                          background: 'white',
                          cursor: 'pointer',
                        }}
                      >
                        Ver viajes
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ background: 'white', border: '1px solid #e6ece6', borderRadius: '14px', padding: '12px 14px', color: '#7a877a', fontSize: '0.9rem' }}>
                Campo está pensando… 🌱
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <form onSubmit={submit} style={{ display: 'flex', gap: '8px', padding: '12px', borderTop: '1px solid #eef0ee' }}>
          <input
            style={{ ...inputStyle, flex: 1 }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe lo que necesitas, por ejemplo: busco jitomate barato"
          />
          <button type="submit" disabled={loading} style={{ ...primaryButton, opacity: loading ? 0.6 : 1 }}>
            Enviar
          </button>
        </form>
      </Card>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => send(suggestion)}
            disabled={loading}
            style={{
              padding: '8px 12px',
              borderRadius: '999px',
              border: '1px solid #cfd8cf',
              background: 'white',
              cursor: 'pointer',
              fontSize: '0.85rem',
              color: '#3d4a3d',
            }}
          >
            {suggestion}
          </button>
        ))}
      </div>

      <p style={{ margin: 0, fontSize: '0.8rem', color: '#7a877a' }}>
        💡 Consejo: puedes escribir como si platicaras con una persona. Por ejemplo: "quiero comprar 5 toneladas de jitomate".
      </p>

      {buyOffer && (
        <BuyDialog
          offer={buyOffer}
          onClose={() => setBuyOffer(null)}
          onDone={() => {
            onChanged();
            setMessages((prev) => [
              ...prev,
              {
                role: 'assistant',
                text: `¡Listo! 🎉 Tu compra de ${buyOffer.productName} quedó registrada. Puedes seguir el proceso en la sección "Procesos".`,
              },
            ]);
          }}
        />
      )}
    </div>
  );
}
