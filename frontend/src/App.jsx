import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './components/Login';
import HomePage from './pages/HomePage';
import FleetPage from './pages/FleetPage';
import ShipmentsPage from './pages/ShipmentsPage';
import RoutesPage from './pages/RoutesPage';
import DriversPage from './pages/DriversPage';
import MaintenancePage from './pages/MaintenancePage';
import AnalyticsPage from './pages/AnalyticsPage';

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const cached = localStorage.getItem('user');
    if (cached) {
      try {
        setUser(JSON.parse(cached));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    setCheckingAuth(false);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  if (checkingAuth) {
    return (
      <div style={{ minHeight: '100vh', background: '#05070a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
        ⚡ Initializing FleetFlow Console...
      </div>
    );
  }

  if (!user) {
    return <Login onAuthSuccess={setUser} />;
  }

  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', backgroundColor: '#05070a', color: '#f8fafc' }}>
        <Navbar user={user} onLogout={handleLogout} />
        <main>
          <Routes>
            <Route path="/" element={<HomePage user={user} />} />
            <Route path="/fleet" element={<FleetPage user={user} />} />
            <Route path="/shipments" element={<ShipmentsPage user={user} />} />
            <Route path="/routes" element={<RoutesPage user={user} />} />
            <Route path="/drivers" element={<DriversPage user={user} />} />
            <Route path="/maintenance" element={<MaintenancePage user={user} />} />
            <Route path="/analytics" element={<AnalyticsPage user={user} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}