import { FormEvent, useState } from 'react';
import { api, Offer } from '../lib/api';

export const GREEN = '#1a4731';

export const roleLabels: Record<string, string> = {
  producer: 'Productor',
  transporter: 'Transportista',
  buyer: 'Comprador',
};

export const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  published: 'Publicada',
  negotiating: 'En negociación',
  awaiting_confirmation: 'Por confirmar',
  confirmed: 'Confirmada',
  transport_pending: 'Transporte asignado',
  in_transit: 'En tránsito',
  delivered: 'Entregada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

export const money = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
});

export const shortDate = (value: string) => new Date(value).toLocaleDateString('es-MX');

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid #cfd8cf',
  fontSize: '0.95rem',
  boxSizing: 'border-box',
};

export const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#3d4a3d',
  marginBottom: '4px',
};

export const primaryButton: React.CSSProperties = {
  padding: '10px 18px',
  background: GREEN,
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 600,
  cursor: 'pointer',
};

export function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif',
        background: '#f4f6f4',
        padding: '20px',
      }}
    >
      {children}
    </div>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #e2e8e2',
        borderRadius: '14px',
        padding: '18px',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = 'green',
}: {
  children: React.ReactNode;
  tone?: 'green' | 'gray' | 'orange';
}) {
  const tones = {
    green: { background: '#e3f1e7', color: GREEN },
    gray: { background: '#eef0ee', color: '#555' },
    orange: { background: '#fdf0e3', color: '#9a5b00' },
  } as const;

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        ...tones[tone],
      }}
    >
      {children}
    </span>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

export const tabButton = (active: boolean): React.CSSProperties => ({
  flex: 1,
  minWidth: '110px',
  padding: '9px',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 600,
  background: active ? GREEN : '#eef0ee',
  color: active ? 'white' : '#3d4a3d',
});

export const demoButton: React.CSSProperties = {
  flex: 1,
  minWidth: '100px',
  padding: '9px',
  borderRadius: '8px',
  border: `1px solid ${GREEN}`,
  background: 'white',
  color: GREEN,
  fontWeight: 600,
  cursor: 'pointer',
};

/* ------------------------------------------------------------ buy dialog */

export function BuyDialog({
  offer,
  onClose,
  onDone,
}: {
  offer: Offer;
  onClose: () => void;
  onDone: () => void;
}) {
  const [quantity, setQuantity] = useState(String(offer.quantity));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const parsed = Number(quantity);
  const total = Number.isFinite(parsed) ? parsed * offer.pricePerUnit : 0;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.buy(offer.id, parsed);
      onDone();
      onClose();
    } catch (err: any) {
      setError(err.message || 'No se pudo completar la compra');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{ background: 'white', padding: '24px', borderRadius: '14px', width: '100%', maxWidth: '420px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 4px', color: GREEN, fontSize: '1.2rem' }}>Comprar {offer.productName}</h2>
        <p style={{ margin: '0 0 16px', color: '#5b6b5b', fontSize: '0.9rem' }}>
          {offer.producer?.name || offer.producerId} · {money.format(offer.pricePerUnit)} por {offer.unit}
        </p>

        <form onSubmit={submit}>
          <Field label={`Cantidad (máximo ${offer.quantity} ${offer.unit})`}>
            <input
              style={inputStyle}
              type="number"
              min="0.01"
              max={offer.quantity}
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </Field>

          <p style={{ margin: '0 0 16px', fontSize: '0.95rem' }}>
            Total estimado: <strong>{money.format(total)}</strong>
          </p>

          {error && <p style={{ color: '#b3261e', fontSize: '0.85rem', margin: '0 0 12px' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={onClose} style={{ ...primaryButton, background: '#eef0ee', color: '#3d4a3d', flex: 1 }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} style={{ ...primaryButton, flex: 1 }}>
              {saving ? 'Comprando…' : 'Confirmar compra'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
