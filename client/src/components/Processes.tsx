import { useEffect, useState } from 'react';
import { api, BuyerRequest, Offer, Operation } from '../lib/api';
import { Badge, Card, GREEN, money, primaryButton, shortDate, statusLabels } from './ui';

export function Processes({
  role,
  refreshKey,
  onChanged,
}: {
  role: string;
  refreshKey: number;
  onChanged: () => void;
}) {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [requests, setRequests] = useState<BuyerRequest[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const operationList = await api.getMyOperations();
      setOperations(operationList);

      if (role === 'producer') setOffers(await api.getMyOffers());
      else if (role === 'buyer') setRequests(await api.getMyRequests());
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar tus procesos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, role]);

  const changeStatus = async (operation: Operation, status: string) => {
    setUpdating(operation.id);
    setError('');
    try {
      await api.updateOperationStatus(operation.id, status);
      await load();
      onChanged();
    } catch (err: any) {
      setError(err.message || 'No se pudo actualizar el proceso');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <p style={{ color: '#5b6b5b' }}>Cargando…</p>;
  if (error) return <p style={{ color: '#b3261e' }}>{error}</p>;

  return (
    <div style={{ display: 'grid', gap: '18px' }}>
      <section>
        <h2 style={{ fontSize: '1.15rem', color: GREEN }}>
          {role === 'transporter' ? 'Mis viajes' : 'Mis operaciones'}
        </h2>
        {operations.length === 0 && (
          <p style={{ color: '#5b6b5b' }}>
            {role === 'transporter'
              ? 'Aún no has aceptado viajes. Revisa el Mercado para ver cargas disponibles.'
              : role === 'buyer'
              ? 'Aún no has comprado nada. Entra al Mercado y elige una oferta.'
              : 'Aún no tienes operaciones. Cuando alguien compre tu producto aparecerá aquí.'}
          </p>
        )}

        <div style={{ display: 'grid', gap: '12px' }}>
          {operations.map((operation) => {
            const acceptedQuote = operation.transportQuotes.find((quote) => quote.status === 'accepted');
            return (
              <Card key={operation.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{operation.offer?.productName || 'Operación'}</h3>
                    <p style={{ margin: '4px 0 0', color: '#7a877a', fontSize: '0.8rem' }}>
                      Creada el {shortDate(operation.createdAt)}
                    </p>
                  </div>
                  <Badge tone={operation.status === 'completed' ? 'green' : 'orange'}>
                    {statusLabels[operation.status] || operation.status}
                  </Badge>
                </div>

                <div style={{ display: 'grid', gap: '4px', marginTop: '10px', fontSize: '0.9rem', color: '#3d4a3d' }}>
                  <span>
                    <strong>Cantidad:</strong> {operation.quantity ?? operation.offer?.quantity} {operation.offer?.unit}
                  </span>
                  <span>
                    <strong>Precio acordado:</strong> {money.format(operation.agreedPrice || 0)}
                  </span>
                  <span>
                    <strong>Productor:</strong> {operation.offer?.producer?.name || '—'}
                    {operation.offer?.producer?.producerProfile?.location
                      ? ` (${operation.offer.producer.producerProfile.location})`
                      : ''}
                  </span>
                  <span>
                    <strong>Comprador:</strong> {operation.buyer?.name || '—'}
                    {operation.buyer?.buyerProfile?.deliveryLocation
                      ? ` (${operation.buyer.buyerProfile.deliveryLocation})`
                      : ''}
                  </span>
                  {acceptedQuote && (
                    <span>
                      <strong>Transporte:</strong> {acceptedQuote.transporter?.user?.name || 'Asignado'} ·{' '}
                      {acceptedQuote.origin} → {acceptedQuote.destination} ({acceptedQuote.distanceKm} km,{' '}
                      {money.format(acceptedQuote.quotedPrice)})
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                  {role === 'transporter' && operation.status === 'transport_pending' && (
                    <button
                      onClick={() => changeStatus(operation, 'in_transit')}
                      disabled={updating === operation.id}
                      style={{ ...primaryButton, padding: '8px 14px', fontSize: '0.85rem' }}
                    >
                      Marcar en tránsito
                    </button>
                  )}
                  {operation.status === 'in_transit' && (role === 'transporter' || role === 'producer' || role === 'buyer') && (
                    <button
                      onClick={() => changeStatus(operation, 'delivered')}
                      disabled={updating === operation.id}
                      style={{ ...primaryButton, padding: '8px 14px', fontSize: '0.85rem' }}
                    >
                      Marcar entregado
                    </button>
                  )}
                  {operation.status === 'delivered' && (
                    <button
                      onClick={() => changeStatus(operation, 'completed')}
                      disabled={updating === operation.id}
                      style={{ ...primaryButton, padding: '8px 14px', fontSize: '0.85rem' }}
                    >
                      Finalizar operación
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {role === 'producer' && (
        <section>
          <h2 style={{ fontSize: '1.15rem', color: GREEN }}>Mis ofertas</h2>
          {offers.length === 0 && <p style={{ color: '#5b6b5b' }}>Aún no has publicado ofertas.</p>}
          <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {offers.map((offer) => (
              <Card key={offer.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{offer.productName}</h3>
                  <Badge tone="gray">{statusLabels[offer.status] || offer.status}</Badge>
                </div>
                <p style={{ margin: '8px 0 0', color: '#5b6b5b', fontSize: '0.9rem' }}>
                  {offer.quantity} {offer.unit} · {money.format(offer.pricePerUnit)}
                </p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {role === 'buyer' && (
        <section>
          <h2 style={{ fontSize: '1.15rem', color: GREEN }}>Mis solicitudes</h2>
          {requests.length === 0 && <p style={{ color: '#5b6b5b' }}>Aún no has publicado solicitudes.</p>}
          <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {requests.map((request) => (
              <Card key={request.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{request.productName}</h3>
                  <Badge tone="gray">{statusLabels[request.status] || request.status}</Badge>
                </div>
                <p style={{ margin: '8px 0 0', color: '#5b6b5b', fontSize: '0.9rem' }}>
                  {request.quantity} {request.unit} · {money.format(request.targetPriceMin)} – {money.format(request.targetPriceMax)}
                </p>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
