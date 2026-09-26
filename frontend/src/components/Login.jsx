import React, { useState } from 'react';
import { loginUser, registerUser } from '../api';
import { useTheme } from '../utils/ThemeContext';

export default function Login({ onAuthSuccess }) {
  const { theme, toggleTheme } = useTheme();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Fleet Manager');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) await registerUser({ email, password, role });
      const res = await loginUser(email, password);
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data));
      onAuthSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={darkLoginStyles.container}>
      {/* Theme Switcher Button */}
      <button
        onClick={toggleTheme}
        style={{
          position: 'absolute',
          top: '20px',
          right: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.06)',
          color: theme === 'dark' ? '#f8fafc' : '#0f172a',
          border: '1px solid rgba(148, 163, 184, 0.3)',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '700',
          cursor: 'pointer',
          zIndex: 100,
          backdropFilter: 'blur(8px)'
        }}
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
        <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
      </button>

      {/* Background ambient glow */}
      <div style={darkLoginStyles.ambientGlow} />

      <div style={darkLoginStyles.card}>
        <div style={darkLoginStyles.logoWrap}>
          <div style={darkLoginStyles.logoIcon}>⚡</div>
          <h1 style={darkLoginStyles.brand}>FLEETFLOW</h1>
          <div style={darkLoginStyles.brandSub}>INTELLIGENT LOGISTICS PLATFORM</div>
        </div>

        <h2 style={darkLoginStyles.title}>{isRegister ? 'Register Platform Account' : 'Operator Portal Sign In'}</h2>
        <p style={darkLoginStyles.subtitle}>
          {isRegister ? 'Create commercial operator credentials' : 'Enter credentials to access live fleet dispatch console'}
        </p>

        {error && <div style={darkLoginStyles.error}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={darkLoginStyles.label}>Operator Email</label>
            <input
              required
              type="email"
              placeholder="e.g. dispatcher@fleetflow.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={darkLoginStyles.input}
            />
          </div>

          <div>
            <label style={darkLoginStyles.label}>Access Password</label>
            <input
              required
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={darkLoginStyles.input}
            />
          </div>

          {isRegister && (
            <div>
              <label style={darkLoginStyles.label}>Authorized Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} style={darkLoginStyles.input}>
                <option value="Administrator">Administrator</option>
                <option value="Fleet Manager">Fleet Manager</option>
                <option value="Dispatcher">Dispatcher</option>
                <option value="Driver">Driver</option>
              </select>
            </div>
          )}

          <button type="submit" disabled={loading} style={darkLoginStyles.btn}>
            {loading ? 'Authenticating...' : (isRegister ? 'Register Operator Account' : 'Authenticate & Enter Console')}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <span
            style={darkLoginStyles.toggle}
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
          >
            {isRegister ? 'Already registered? Sign in here' : 'Need new operator credentials? Register'}
          </span>
        </div>
      </div>
    </div>
  );
}

const darkLoginStyles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg-primary, #05070a)',
    position: 'relative',
    overflow: 'hidden',
    padding: '24px'
  },
  ambientGlow: {
    position: 'absolute',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, rgba(99, 102, 241, 0.03) 50%, transparent 70%)',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none'
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    background: 'var(--bg-card, #0d131f)',
    border: '1px solid var(--border-subtle, #1e293b)',
    padding: '40px',
    borderRadius: '16px',
    boxShadow: 'var(--shadow-card)',
    position: 'relative',
    zIndex: 10
  },
  logoWrap: {
    textAlign: 'center',
    marginBottom: '24px'
  },
  logoIcon: {
    display: 'inline-flex',
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    color: '#fff',
    boxShadow: '0 0 16px rgba(56, 189, 248, 0.4)',
    marginBottom: '10px'
  },
  brand: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '800',
    color: 'var(--text-primary, #f8fafc)',
    letterSpacing: '1.5px'
  },
  brandSub: {
    fontSize: '9px',
    fontWeight: '700',
    color: '#38bdf8',
    letterSpacing: '2px',
    marginTop: '2px'
  },
  title: {
    margin: '0 0 6px 0',
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--text-primary, #f8fafc)',
    textAlign: 'center'
  },
  subtitle: {
    margin: '0 0 20px 0',
    fontSize: '13px',
    color: 'var(--text-secondary, #94a3b8)',
    textAlign: 'center'
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--text-muted, #64748b)',
    textTransform: 'uppercase'
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '8px',
    border: '1px solid var(--border-subtle, #1e293b)',
    background: 'var(--bg-card-sub, #070a0f)',
    color: 'var(--text-primary, #f8fafc)',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border 0.2s'
  },
  btn: {
    width: '100%',
    padding: '13px',
    background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '800',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '6px',
    boxShadow: '0 0 15px rgba(56, 189, 248, 0.35)'
  },
  error: {
    background: 'rgba(248, 113, 113, 0.1)',
    border: '1px solid rgba(248, 113, 113, 0.3)',
    color: '#f87171',
    padding: '10px 14px',
    marginBottom: '16px',
    borderRadius: '8px',
    fontSize: '13px',
    textAlign: 'center'
  },
  toggle: {
    color: '#38bdf8',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
  }
};