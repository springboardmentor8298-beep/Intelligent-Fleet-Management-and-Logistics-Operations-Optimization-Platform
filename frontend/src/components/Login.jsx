import React, { useState } from 'react';
import { loginUser, registerUser } from '../api';

export default function Login({ onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Fleet Manager');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) await registerUser({ email, password, role });
      const res = await loginUser(email, password);
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data));
      onAuthSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>{isRegister ? 'Create Account' : 'Welcome to FleetFlow'}</h2>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} />
          </div>
          {isRegister && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Assigned Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} style={styles.input}>
                <option value="Administrator">Administrator</option>
                <option value="Fleet Manager">Fleet Manager</option>
                <option value="Dispatcher">Dispatcher</option>
                <option value="Driver">Driver</option>
              </select>
            </div>
          )}
          <button type="submit" style={styles.btn}>{isRegister ? 'Register' : 'Sign In'}</button>
        </form>
        <p style={styles.toggle} onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? 'Already have an account? Sign in' : 'Need an account? Register'}
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' },
  card: { width: '100%', maxWidth: '400px', background: '#ffffff', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', boxSizing: 'border-box' },
  title: { margin: '0 0 24px 0', fontSize: '24px', fontWeight: '700', textAlign: 'center', color: '#111827' },
  inputGroup: { marginBottom: '20px' },
  label: { display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#4b5563' },
  input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px', boxSizing: 'border-box', outline: 'none' },
  btn: { width: '100%', padding: '12px', background: '#2563eb', color: '#ffffff', fontSize: '16px', fontWeight: '600', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s' },
  error: { background: '#fee2e2', color: '#b91c1c', padding: '12px', marginBottom: '20px', borderRadius: '8px', fontSize: '14px', textAlign: 'center' },
  toggle: { marginTop: '24px', textAlign: 'center', cursor: 'pointer', color: '#2563eb', fontSize: '14px', fontWeight: '500' }
};