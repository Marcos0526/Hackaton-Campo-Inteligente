import { useEffect, useState } from 'react';
import { api, Profile } from '../lib/api';
import { Badge, Card, GREEN, roleLabels } from './ui';

export function ProfileView() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getProfile()
      .then(setProfile)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: '#5b6b5b' }}>Cargando perfil…</p>;
  if (error) return <p style={{ color: '#b3261e' }}>{error}</p>;
  if (!profile) return null;

  return (
    <Card>
      <h2 style={{ margin: '0 0 4px', color: GREEN }}>{profile.name}</h2>
      <p style={{ margin: '0 0 16px', color: '#5b6b5b' }}>{profile.email}</p>
      <Badge>{roleLabels[profile.role] || profile.role}</Badge>

      {profile.producerProfile && (
        <dl style={dlStyle}>
          <Row label="Rancho" value={profile.producerProfile.farmName} />
          <Row label="Ubicación" value={profile.producerProfile.location} />
          <Row label="Superficie total" value={`${profile.producerProfile.totalLand} ha`} />
          <Row label="Superficie cultivada" value={`${profile.producerProfile.cultivatedLand} ha`} />
          <Row label="Cultivos" value={profile.producerProfile.crops} />
        </dl>
      )}

      {profile.transporterProfile && (
        <dl style={dlStyle}>
          <Row label="Base" value={profile.transporterProfile.baseLocation} />
          <Row label="Vehículo" value={profile.transporterProfile.vehicleType} />
          <Row label="Capacidad" value={`${profile.transporterProfile.loadCapacityKg} kg`} />
          <Row label="Rutas" value={profile.transporterProfile.routes} />
        </dl>
      )}

      {profile.buyerProfile && (
        <dl style={dlStyle}>
          <Row label="Empresa" value={profile.buyerProfile.companyName} />
          <Row label="Entrega" value={profile.buyerProfile.deliveryLocation} />
          <Row label="Productos de interés" value={profile.buyerProfile.preferredCrops} />
        </dl>
      )}
    </Card>
  );
}

const dlStyle: React.CSSProperties = { margin: '16px 0 0', display: 'grid', gap: '8px' };

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', borderBottom: '1px solid #eef0ee', paddingBottom: '6px' }}>
      <dt style={{ color: '#7a877a', fontSize: '0.85rem' }}>{label}</dt>
      <dd style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500, textAlign: 'right' }}>{value}</dd>
    </div>
  );
}
