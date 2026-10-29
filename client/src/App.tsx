import { useState } from 'react';
import { authClient } from './lib/auth-client';
import { AuthScreen } from './components/AuthScreen';
import { Chat } from './components/Chat';
import { Market } from './components/Market';
import { Processes } from './components/Processes';
import { ProfileView } from './components/ProfileView';
import { Badge, Centered, GREEN, roleLabels, tabButton } from './components/ui';

type Tab = 'home' | 'market' | 'processes' | 'profile';

export default function App() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <Centered>
        <p>Cargando…</p>
      </Centered>
    );
  }

  if (!session) return <AuthScreen />;

  return <MainApp user={session.user as any} />;
}

function MainApp({ user }: { user: { id: string; name: string; email: string; role: string } }) {
  const [tab, setTab] = useState<Tab>('home');
  const [refreshKey, setRefreshKey] = useState(0);
  const [highlight, setHighlight] = useState<{ kind: 'offer' | 'request'; id: string } | null>(null);
  const role = user.role || 'producer';

  const onChanged = () => setRefreshKey((key) => key + 1);

  const goToItem = (kind: 'offer' | 'request', id: string) => {
    setHighlight({ kind, id });
    setTab('market');
  };

  const goToTab = (next: Tab) => {
    if (next === 'market') setHighlight(null);
    setTab(next);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f4', fontFamily: 'sans-serif' }}>
      <header
        style={{
          background: 'white',
          borderBottom: '1px solid #e2e8e2',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <strong style={{ color: GREEN, fontSize: '1.1rem' }}>Campo Inteligente</strong>
        <Badge>{roleLabels[role] || role}</Badge>
        <span style={{ color: '#5b6b5b', fontSize: '0.9rem' }}>{user.name}</span>
        <button
          onClick={() => authClient.signOut()}
          style={{
            marginLeft: 'auto',
            padding: '7px 14px',
            borderRadius: '8px',
            border: '1px solid #cfd8cf',
            background: 'white',
            cursor: 'pointer',
          }}
        >
          Salir
        </button>
      </header>

      <nav style={{ display: 'flex', gap: '8px', padding: '14px 20px 0', maxWidth: '1000px', margin: '0 auto', flexWrap: 'wrap' }}>
        <button style={tabButton(tab === 'home')} onClick={() => goToTab('home')}>
          Inicio
        </button>
        <button style={tabButton(tab === 'market')} onClick={() => goToTab('market')}>
          Mercado
        </button>
        <button style={tabButton(tab === 'processes')} onClick={() => goToTab('processes')}>
          Procesos
        </button>
        <button style={tabButton(tab === 'profile')} onClick={() => goToTab('profile')}>
          Mi Perfil
        </button>
      </nav>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
        {tab === 'home' && (
          <Chat
            name={user.name}
            role={role}
            onNavigate={goToTab}
            onGoToItem={goToItem}
            onChanged={onChanged}
          />
        )}
        {tab === 'market' && (
          <Market role={role} refreshKey={refreshKey} highlight={highlight} onChanged={onChanged} />
        )}
        {tab === 'processes' && <Processes role={role} refreshKey={refreshKey} onChanged={onChanged} />}
        {tab === 'profile' && <ProfileView />}
      </main>
    </div>
  );
}
