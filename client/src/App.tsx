import React, { useState } from 'react';

// Tipos básicos
type Role = 'producer' | 'transporter' | 'buyer';
interface User { id: string; name: string; email: string; role: Role; }

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'processes' | 'profile'>('home');
  const [showModal, setShowModal] = useState<null | 'login' | 'register'>(null);

  // Login/Registro simple
  const handleLogin = (role: Role) => {
    setUser({ id: '1', name: 'Usuario Ejemplo', email: 'user@test.com', role });
    setShowModal(null);
    setActiveTab('home');
  };

  if (!user) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', background: '#f9f9f9' }}>
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '30px', color: '#1a4731' }}>Campo Inteligente</h1>
          <button style={{ display: 'block', width: '100%', padding: '15px', fontSize: '1.2rem', marginBottom: '10px', background: '#1a4731', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }} onClick={() => setShowModal('login')}>Iniciar Sesión</button>
          <button style={{ display: 'block', width: '100%', padding: '15px', fontSize: '1.2rem', background: '#e0e0e0', border: 'none', borderRadius: '10px', cursor: 'pointer' }} onClick={() => setShowModal('register')}>Crear Cuenta</button>
        </div>
      </div>
    );
  }

  // Si hay usuario, interfaz principal
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'sans-serif' }}>
      {/* Barra superior funcional */}
      <header style={{ padding: '20px', borderBottom: '1px solid #ddd', display: 'flex', gap: '20px', background: 'white' }}>
        <button onClick={() => setActiveTab('home')} style={{ fontWeight: activeTab === 'home' ? 'bold' : 'normal' }}>Asistente Inteligente</button>
        <button onClick={() => setActiveTab('processes')} style={{ fontWeight: activeTab === 'processes' ? 'bold' : 'normal' }}>Procesos en Marcha</button>
        <button onClick={() => setActiveTab('profile')} style={{ fontWeight: activeTab === 'profile' ? 'bold' : 'normal' }}>Mi Perfil</button>
      </header>

      {/* Cuerpo */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {activeTab === 'home' && <ChatInterface user={user} />}
        {activeTab === 'processes' && <div><h2>Procesos en Marcha</h2><p>Aquí verás tus ventas/compras activas.</p></div>}
        {activeTab === 'profile' && <div><h2>Perfil de {user.role}</h2><p>Nombre: {user.name}</p></div>}
      </div>
    </div>
  );
}

function ChatInterface({ user }: { user: User }) {
  const [messages, setMessages] = useState<any[]>([{ sender: 'ai', text: 'Hola, soy tu asistente. ¿Qué deseas hacer hoy?' }]);
  const [input, setInput] = useState('');
  const [detailModal, setDetailModal] = useState<any>(null);

  const sendMessage = () => {
    if (!input) return;
    setMessages([...messages, { sender: 'user', text: input }]);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: 'He analizado tu solicitud. Basado en tu perfil de ' + user.role + ', aquí tienes opciones:',
        options: [{ id: 1, title: 'Oferta Maíz', price: '$5,000' }]
      }]);
    }, 500);
    setInput('');
  };

  return (
    <div style={{ maxWidth: '800px', margin: 'auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, marginBottom: '20px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ margin: '15px 0', padding: '15px', background: m.sender === 'ai' ? '#f0f0f0' : '#e1f5fe', borderRadius: '10px' }}>
            {m.text}
            {m.options?.map((opt: any) => (
              <div key={opt.id} style={{ marginTop: '10px', padding: '10px', background: 'white', border: '1px solid #ccc' }}>
                {opt.title} - {opt.price}
                <div style={{ marginTop: '10px' }}>
                  <button onClick={() => setDetailModal(opt)}>Ver Detalles</button>
                  <button style={{ marginLeft: '10px' }}>Comprar</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input value={input} onChange={e => setInput(e.target.value)} style={{ flex: 1, padding: '10px' }} />
        <button onClick={sendMessage}>Enviar</button>
      </div>

      {detailModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '10px' }}>
            <h2>Detalles: {detailModal.title}</h2>
            <p>Precio: {detailModal.price}</p>
            <button onClick={() => setDetailModal(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
