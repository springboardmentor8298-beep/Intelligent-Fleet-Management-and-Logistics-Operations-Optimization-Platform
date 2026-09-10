import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/DashBoard';

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const cached = localStorage.getItem('user');
    if (cached) setUser(JSON.parse(cached));
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  return user ? <Dashboard user={user} onLogout={handleLogout} /> : <Login onAuthSuccess={setUser} />;
}