import { FormEvent, useState } from 'react';
import { authClient, Role } from '../lib/auth-client';
import { Card, Centered, Field, GREEN, demoButton, inputStyle, tabButton } from './ui';

const DEMO_PASSWORD = 'campo1234';

export function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('producer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result =
        mode === 'login'
          ? await authClient.signIn.email({ email, password })
          : await authClient.signUp.email({ name, email, password, role } as any);

      if (result.error) {
        setError(result.error.message || 'No se pudo autenticar');
      }
    } catch (err: any) {
      setError(err.message || 'No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (demoEmail: string) => {
    setError('');
    setLoading(true);
    try {
      const result = await authClient.signIn.email({ email: demoEmail, password: DEMO_PASSWORD });
      if (result.error) setError(result.error.message || 'No se pudo autenticar');
    } catch (err: any) {
      setError(err.message || 'No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Centered>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '2rem', color: GREEN, margin: 0 }}>Campo Inteligente</h1>
          <p style={{ color: '#5b6b5b', marginTop: '6px' }}>Plataforma agrocomercial</p>
        </div>

        <Card>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button type="button" onClick={() => { setMode('login'); setError(''); }} style={tabButton(mode === 'login')}>
              Iniciar Sesión
            </button>
            <button type="button" onClick={() => { setMode('register'); setError(''); }} style={tabButton(mode === 'register')}>
              Crear Cuenta
            </button>
          </div>

          <form onSubmit={submit}>
            {mode === 'register' && (
              <Field label="Nombre">
                <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required />
              </Field>
            )}

            <Field label="Correo">
              <input
                style={inputStyle}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prod-01@campo.test"
                required
              />
            </Field>

            <Field label="Contraseña">
              <input
                style={inputStyle}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </Field>

            {mode === 'register' && (
              <Field label="Tipo de usuario">
                <select style={inputStyle} value={role} onChange={(e) => setRole(e.target.value as Role)}>
                  <option value="producer">Productor</option>
                  <option value="transporter">Transportista</option>
                  <option value="buyer">Comprador</option>
                </select>
              </Field>
            )}

            {error && <p style={{ color: '#b3261e', fontSize: '0.85rem', margin: '4px 0 12px' }}>{error}</p>}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: GREEN,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                cursor: loading ? 'wait' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Procesando…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>
        </Card>

        <Card style={{ marginTop: '16px' }}>
          <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#5b6b5b' }}>
            Acceso rápido con perfiles de prueba (contraseña <strong>{DEMO_PASSWORD}</strong>):
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button style={demoButton} onClick={() => demoLogin('prod-01@campo.test')} disabled={loading}>
              Productor
            </button>
            <button style={demoButton} onClick={() => demoLogin('tran-01@campo.test')} disabled={loading}>
              Transportista
            </button>
            <button style={demoButton} onClick={() => demoLogin('buy-01@campo.test')} disabled={loading}>
              Comprador
            </button>
          </div>
        </Card>
      </div>
    </Centered>
  );
}
