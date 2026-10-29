import { FormEvent, useEffect, useState } from 'react';
import { api, BuyerRequest, Offer, Operation } from '../lib/api';
import {
  Badge,
  BuyDialog,
  Card,
  Field,
  GREEN,
  inputStyle,
  money,
  primaryButton,
  shortDate,
} from './ui';

export function Market({
  role,
  refreshKey,
  highlight,
  onChanged,
}: {
  role: string;
  refreshKey: number;
  highlight: { kind: 'offer' | 'request'; id: string } | null;
  onChanged: () => void;
}) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [requests, setRequests] = useState<BuyerRequest[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [buyOffer, setBuyOffer] = useState<Offer | null>(null);
  const [accepting, setAccepting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [offerList, requestList] = await Promise.all([api.getOffers(), api.getRequests()]);
      setOffers(offerList);
      setRequests(requestList);
      if (role === 'transporter') {
        setOperations(await api.getAvailableOperations());
      }
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar el mercado');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, role]);

  useEffect(() => {
    if (!highlight) return;
    const element = document.getElementById(`${highlight.kind}-${highlight.id}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlight, offers, requests]);

  const acceptTrip = async (operation: Operation) => {
    setError('');
    setSuccess('');
    setAccepting(operation.id);
    try {
      const quote = await api.acceptTransport(operation.id);
      setSuccess(
        `¡Viaje aceptado! 🚚 Recogerás en ${quote.origin} y entregarás en ${quote.destination} ` +
          `(${quote.distanceKm} km aprox., ${money.format(quote.quotedPrice)}).`
      );
      await load();
      onChanged();
    } catch (err: any) {
      setError(err.message || 'No se pudo aceptar el viaje');
    } finally {
      setAccepting(null);
    }
  };

  const highlightStyle = (kind: 'offer' | 'request', id: string): React.CSSProperties =>
    highlight?.kind === kind && highlight.id === id
      ? { outline: `3px solid ${GREEN}`, outlineOffset: '2px' }
      : {};

  return (
    <div style={{ display: 'grid', gap: '18px' }}>
      {success && (
        <div style={{ background: '#e3f1e7', color: GREEN, padding: '12px 16px', borderRadius: '10px', fontSize: '0.9rem' }}>
          {success}
        </div>
      )}
      {error && <p style={{ color: '#b3261e', margin: 0 }}>{error}</p>}

      {role === 'producer' && <CreateOfferForm onCreated={() => { load(); onChanged(); }} />}
      {role === 'buyer' && <CreateRequestForm onCreated={() => { load(); onChanged(); }} />}

      {role === 'transporter' && (
        <section>
          <h2 style={{ fontSize: '1.15rem', color: GREEN }}>Viajes disponibles</h2>
          <p style={{ margin: '0 0 10px', color: '#5b6b5b', fontSize: '0.85rem' }}>
            Estos son viajes que ya tienen comprador. Acepta uno y encárgate de llevarlo.
          </p>
          {!loading && operations.length === 0 && (
            <p style={{ color: '#5b6b5b' }}>Por ahora no hay viajes. Cuando un comprador compre una oferta, aparecerá aquí.</p>
          )}
          <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {operations.map((operation) => {
              const origin = operation.offer?.producer?.producerProfile?.location || 'Origen';
              const destination = operation.buyer?.buyerProfile?.deliveryLocation || 'Destino';
              return (
                <Card key={operation.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{operation.offer?.productName || 'Carga'}</h3>
                    <Badge tone="orange">Nuevo viaje</Badge>
                  </div>
                  <p style={{ margin: '8px 0 4px', color: '#5b6b5b', fontSize: '0.9rem' }}>
                    {origin} → {destination}
                  </p>
                  <p style={{ margin: '0 0 4px', color: '#5b6b5b', fontSize: '0.9rem' }}>
                    {operation.quantity ?? operation.offer?.quantity} {operation.offer?.unit} · {money.format(operation.agreedPrice || 0)}
                  </p>
                  <p style={{ margin: '0 0 12px', color: '#7a877a', fontSize: '0.8rem' }}>
                    Productor: {operation.offer?.producer?.name || '—'} · Comprador: {operation.buyer?.name || '—'}
                  </p>
                  <button
                    onClick={() => acceptTrip(operation)}
                    disabled={accepting === operation.id}
                    style={{ ...primaryButton, width: '100%', opacity: accepting === operation.id ? 0.6 : 1 }}
                  >
                    {accepting === operation.id ? 'Aceptando…' : 'Aceptar viaje'}
                  </button>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 style={{ fontSize: '1.15rem', color: GREEN }}>Ofertas de productores</h2>
        {!loading && offers.length === 0 && <p style={{ color: '#5b6b5b' }}>No hay ofertas publicadas.</p>}
        <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {offers.map((offer) => (
            <Card key={offer.id} style={highlightStyle('offer', offer.id)}>
              <div id={`offer-${offer.id}`} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{offer.productName}</h3>
                <Badge tone="gray">{offer.quality}</Badge>
              </div>
              <p style={{ margin: '8px 0', color: '#5b6b5b', fontSize: '0.9rem' }}>
                {offer.quantity} {offer.unit} · {money.format(offer.pricePerUnit)} / {offer.unit}
              </p>
              <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: '#7a877a' }}>
                {offer.producer?.name || offer.producerId} · disponible {shortDate(offer.availableDate)}
              </p>
              {role === 'buyer' && (
                <button onClick={() => setBuyOffer(offer)} style={{ ...primaryButton, width: '100%' }}>
                  Comprar
                </button>
              )}
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: '1.15rem', color: GREEN }}>Solicitudes de compradores</h2>
        {!loading && requests.length === 0 && <p style={{ color: '#5b6b5b' }}>No hay solicitudes publicadas.</p>}
        <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {requests.map((request) => (
            <Card key={request.id} style={highlightStyle('request', request.id)}>
              <div id={`request-${request.id}`} />
              <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{request.productName}</h3>
              <p style={{ margin: '8px 0', color: '#5b6b5b', fontSize: '0.9rem' }}>
                {request.quantity} {request.unit} · {money.format(request.targetPriceMin)} – {money.format(request.targetPriceMax)}
              </p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#7a877a' }}>
                {request.buyer?.name || request.buyerId} · entrega {shortDate(request.deliveryDate)}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {buyOffer && (
        <BuyDialog
          offer={buyOffer}
          onClose={() => setBuyOffer(null)}
          onDone={() => {
            setSuccess(`¡Compra realizada! 🎉 Revisa el detalle en "Procesos".`);
            load();
            onChanged();
          }}
        />
      )}
    </div>
  );
}

function CreateOfferForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({
    productName: '',
    quantity: '',
    unit: 'toneladas',
    quality: 'primera',
    pricePerUnit: '',
    availableDate: new Date().toISOString().slice(0, 10),
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.createOffer(form);
      setForm({ ...form, productName: '', quantity: '', pricePerUnit: '' });
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <h2 style={{ margin: '0 0 12px', fontSize: '1.1rem', color: GREEN }}>Publicar oferta</h2>
      <form onSubmit={submit} style={{ display: 'grid', gap: '0 12px', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        <Field label="Producto">
          <input style={inputStyle} value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} required />
        </Field>
        <Field label="Cantidad">
          <input style={inputStyle} type="number" min="0" step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
        </Field>
        <Field label="Unidad">
          <select style={inputStyle} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
            <option>toneladas</option>
            <option>kg</option>
            <option>bultos</option>
          </select>
        </Field>
        <Field label="Calidad">
          <select style={inputStyle} value={form.quality} onChange={(e) => setForm({ ...form, quality: e.target.value })}>
            <option>primera</option>
            <option>segunda</option>
          </select>
        </Field>
        <Field label="Precio por unidad (MXN)">
          <input style={inputStyle} type="number" min="0" step="0.01" value={form.pricePerUnit} onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })} required />
        </Field>
        <Field label="Fecha disponible">
          <input style={inputStyle} type="date" value={form.availableDate} onChange={(e) => setForm({ ...form, availableDate: e.target.value })} required />
        </Field>
        <div style={{ display: 'flex', alignItems: 'end', marginBottom: '12px' }}>
          <button type="submit" disabled={saving} style={{ ...primaryButton, width: '100%' }}>
            {saving ? 'Publicando…' : 'Publicar'}
          </button>
        </div>
      </form>
      {error && <p style={{ color: '#b3261e', fontSize: '0.85rem', margin: 0 }}>{error}</p>}
    </Card>
  );
}

function CreateRequestForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({
    productName: '',
    quantity: '',
    unit: 'toneladas',
    targetPriceMin: '',
    targetPriceMax: '',
    deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.createRequest(form);
      setForm({ ...form, productName: '', quantity: '', targetPriceMin: '', targetPriceMax: '' });
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <h2 style={{ margin: '0 0 12px', fontSize: '1.1rem', color: GREEN }}>Publicar solicitud de compra</h2>
      <form onSubmit={submit} style={{ display: 'grid', gap: '0 12px', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        <Field label="Producto">
          <input style={inputStyle} value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} required />
        </Field>
        <Field label="Cantidad">
          <input style={inputStyle} type="number" min="0" step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
        </Field>
        <Field label="Unidad">
          <select style={inputStyle} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
            <option>toneladas</option>
            <option>kg</option>
            <option>bultos</option>
          </select>
        </Field>
        <Field label="Precio mínimo (MXN)">
          <input style={inputStyle} type="number" min="0" step="0.01" value={form.targetPriceMin} onChange={(e) => setForm({ ...form, targetPriceMin: e.target.value })} required />
        </Field>
        <Field label="Precio máximo (MXN)">
          <input style={inputStyle} type="number" min="0" step="0.01" value={form.targetPriceMax} onChange={(e) => setForm({ ...form, targetPriceMax: e.target.value })} required />
        </Field>
        <Field label="Fecha de entrega">
          <input style={inputStyle} type="date" value={form.deliveryDate} onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })} required />
        </Field>
        <div style={{ display: 'flex', alignItems: 'end', marginBottom: '12px' }}>
          <button type="submit" disabled={saving} style={{ ...primaryButton, width: '100%' }}>
            {saving ? 'Publicando…' : 'Publicar'}
          </button>
        </div>
      </form>
      {error && <p style={{ color: '#b3261e', fontSize: '0.85rem', margin: 0 }}>{error}</p>}
    </Card>
  );
}
