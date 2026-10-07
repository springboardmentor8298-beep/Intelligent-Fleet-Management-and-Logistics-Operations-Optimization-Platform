import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTheme } from '../utils/ThemeContext';

export default function Navbar({ user, onLogout }) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  const navItems = [
    { to: '/', label: 'Command Center', icon: '⚡' },
    { to: '/fleet', label: 'Fleet Registry', icon: '🚛' },
    { to: '/shipments', label: 'Shipment Tracking', icon: '📦' },
    { to: '/routes', label: 'Route Optimizer', icon: '🛣️' },
    { to: '/drivers', label: 'Driver Roster', icon: '👨‍✈️' },
    { to: '/maintenance', label: 'Maintenance', icon: '🔧' },
    { to: '/analytics', label: 'Analytics', icon: '📊' }
  ];

  const dynamicStyles = {
    nav: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: isLight ? '#ffffff' : 'rgba(9, 13, 20, 0.95)',
      backgroundColor: isLight ? '#ffffff' : 'rgba(9, 13, 20, 0.95)',
      backdropFilter: isLight ? 'none' : 'blur(16px)',
      WebkitBackdropFilter: isLight ? 'none' : 'blur(16px)',
      borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
      padding: '12px 28px',
      position: 'sticky',
      top: 0,
      zIndex: 9000,
      boxShadow: isLight
        ? '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)'
        : '0 4px 20px rgba(0, 0, 0, 0.3)'
    },
    brandTitle: {
      fontSize: '17px',
      fontWeight: '800',
      color: isLight ? '#0f172a' : '#f8fafc',
      letterSpacing: '1px'
    },
    brandSubtitle: {
      fontSize: '9px',
      fontWeight: '700',
      color: '#0284c7',
      letterSpacing: '1.5px'
    },
    link: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 12px',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '600',
      color: isLight ? '#1e293b' : '#94a3b8',
      textDecoration: 'none',
      transition: 'all 0.15s ease'
    },
    activeLink: {
      color: '#0284c7',
      background: isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.12)',
      border: isLight ? '1px solid #bae6fd' : '1px solid rgba(56, 189, 248, 0.3)',
      boxShadow: isLight ? '0 1px 2px rgba(2, 132, 199, 0.08)' : '0 0 10px rgba(56, 189, 248, 0.1)',
      fontWeight: '700'
    },
    userEmail: {
      fontSize: '12px',
      color: isLight ? '#0f172a' : '#f1f5f9',
      fontWeight: '600'
    },
    roleBadge: {
      fontSize: '10px',
      color: isLight ? '#4338ca' : '#a5b4fc',
      background: isLight ? '#eef2ff' : 'rgba(99, 102, 241, 0.15)',
      border: isLight ? '1px solid #c7d2fe' : 'none',
      padding: '2px 6px',
      borderRadius: '4px',
      fontWeight: '600',
      marginTop: '2px'
    },
    themeToggleBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      background: isLight ? '#f1f5f9' : 'rgba(56, 189, 248, 0.08)',
      color: isLight ? '#0f172a' : '#38bdf8',
      border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(56, 189, 248, 0.3)',
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '700',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    logoutBtn: {
      background: isLight ? '#f1f5f9' : '#161f30',
      color: isLight ? '#1e293b' : '#cbd5e1',
      border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
      padding: '8px 18px',
      borderRadius: '8px',
      fontSize: '13.5px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease'
    }
  };

  return (
    <nav className="navbar-container" style={dynamicStyles.nav}>
      <div style={staticNavStyles.brandSection}>
        <Link to="/" className="navbar-brand-link" style={staticNavStyles.brandLink}>
          <div style={staticNavStyles.logoIcon}>⚡</div>
          <div>
            <div className="navbar-brand-title" style={dynamicStyles.brandTitle}>
              FLEETFLOW
              <span style={{ marginLeft: '6px', fontSize: '9px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 700, verticalAlign: 'middle' }}>
                M4 PROD
              </span>
            </div>
            <div style={dynamicStyles.brandSubtitle}>INTELLIGENT LOGISTICS</div>
          </div>
        </Link>
      </div>

      <div className="nav-links-wrapper" style={staticNavStyles.linksContainer}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-tab-link ${isActive ? 'active' : ''}`}
            style={({ isActive }) => ({
              ...dynamicStyles.link,
              ...(isActive ? dynamicStyles.activeLink : {})
            })}
          >
            <span style={{ fontSize: '15px' }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div style={staticNavStyles.userSection}>
        {/* Dark Mode / Light Mode Switcher */}
        <button
          onClick={toggleTheme}
          style={dynamicStyles.themeToggleBtn}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle dark/light mode"
        >
          <span style={{ fontSize: '14px' }}>{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span style={staticNavStyles.themeLabel}>
            {theme === 'dark' ? 'Light' : 'Dark'}
          </span>
        </button>

        <div style={staticNavStyles.userInfo}>
          <span className="navbar-user-email" style={dynamicStyles.userEmail}>{user?.email}</span>
          <span style={dynamicStyles.roleBadge}>{user?.role || 'Fleet Manager'}</span>
        </div>
        <button onClick={onLogout} className="navbar-logout-btn" style={dynamicStyles.logoutBtn}>
          Sign Out
        </button>
      </div>
    </nav>
  );
}

const staticNavStyles = {
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
  linksContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
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
  themeLabel: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  }
};
