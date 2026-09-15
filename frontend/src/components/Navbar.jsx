import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Navbar({ user, onLogout }) {
  const navItems = [
    { to: '/', label: 'Command Center', icon: '⚡' },
    { to: '/fleet', label: 'Fleet Registry', icon: '🚛' },
    { to: '/shipments', label: 'Shipment Tracking', icon: '📦' },
    { to: '/routes', label: 'Route Optimizer', icon: '🛣️' },
    { to: '/drivers', label: 'Driver Roster', icon: '👨‍✈️' },
    { to: '/maintenance', label: 'Maintenance', icon: '🔧' },
    { to: '/analytics', label: 'Analytics', icon: '📊' }
  ];

  return (
    <nav style={navStyles.nav}>
      <div style={navStyles.brandSection}>
        <NavLink to="/" style={navStyles.brandLink}>
          <div style={navStyles.logoIcon}>⚡</div>
          <div>
            <div style={navStyles.brandTitle}>FLEETFLOW</div>
            <div style={navStyles.brandSubtitle}>INTELLIGENT LOGISTICS</div>
          </div>
        </NavLink>
        <div style={navStyles.liveIndicator}>
          <span style={navStyles.liveDot}></span>
          LIVE OPERATIONS
        </div>
      </div>

      <div style={navStyles.linksContainer}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => ({
              ...navStyles.link,
              ...(isActive ? navStyles.activeLink : {})
            })}
          >
            <span style={{ fontSize: '15px' }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div style={navStyles.userSection}>
        <div style={navStyles.userInfo}>
          <span style={navStyles.userEmail}>{user?.email}</span>
          <span style={navStyles.roleBadge}>{user?.role || 'Fleet Manager'}</span>
        </div>
        <button onClick={onLogout} style={navStyles.logoutBtn}>
          Sign Out
        </button>
      </div>
    </nav>
  );
}

const navStyles = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(9, 13, 20, 0.95)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid #1e293b',
    padding: '12px 28px',
    position: 'sticky',
    top: 0,
    zIndex: 9000,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)'
  },
  brandSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  brandLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none'
  },
  logoIcon: {
    background: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)',
    color: '#ffffff',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    boxShadow: '0 0 12px rgba(56, 189, 248, 0.4)'
  },
  brandTitle: {
    fontSize: '17px',
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: '1px'
  },
  brandSubtitle: {
    fontSize: '9px',
    fontWeight: '700',
    color: '#38bdf8',
    letterSpacing: '1.5px'
  },
  liveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    color: '#10b981',
    padding: '4px 8px',
    borderRadius: '9999px',
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '0.5px'
  },
  liveDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#10b981',
    boxShadow: '0 0 8px #10b981'
  },
  linksContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#94a3b8',
    textDecoration: 'none',
    transition: 'all 0.15s ease'
  },
  activeLink: {
    color: '#38bdf8',
    background: 'rgba(56, 189, 248, 0.12)',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    boxShadow: '0 0 10px rgba(56, 189, 248, 0.1)'
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px'
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end'
  },
  userEmail: {
    fontSize: '12px',
    color: '#f1f5f9',
    fontWeight: '600'
  },
  roleBadge: {
    fontSize: '10px',
    color: '#a5b4fc',
    background: 'rgba(99, 102, 241, 0.15)',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: '600',
    marginTop: '2px'
  },
  logoutBtn: {
    background: '#161f30',
    color: '#cbd5e1',
    border: '1px solid #334155',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  }
};
