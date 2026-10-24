// frontend/src/App.jsx
import React, { useState } from 'react';
import AuthPage from './components/AuthPage';
import OwnerView from './components/OwnerView';
import CustomerView from './components/CustomerView';

// ─── Brand Tokens ─────────────────────────────────────────────────────────────
const C = {
  headerBg:   '#2B1E16',
  headerText: '#FAF7F2',
  gold:       '#D4AF37',
  muted:      '#D7CCC8',
  danger:     '#B71C1C',
  dangerBg:   'rgba(183,28,28,0.15)',
};

export default function App() {
  // ── Restore session from localStorage on first render ──────────────────────
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('m_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('m_user', JSON.stringify(user));
    // Note: token is already stored as 'm_token' by AuthPage
  };

  const handleLogout = () => {
    setCurrentUser(null);
    // Clear both the user object AND the JWT token
    localStorage.removeItem('m_user');
    localStorage.removeItem('m_token');
  };

  // ── Unauthenticated ─────────────────────────────────────────────────────────
  if (!currentUser) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  const isOwner = currentUser.role === 'owner';

  // ── Authenticated Shell ─────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FAF7F2' }}>

      {/* ── Application Header ──────────────────────────────────────────────── */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 28px',
        height: '56px',
        background: C.headerBg,
        color: C.headerText,
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        position: 'sticky',
        top: 0,
        zIndex: 200,
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px', lineHeight: 1 }}>🍫</span>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', letterSpacing: '0.5px', lineHeight: 1.2 }}>
              M Chocolates &amp; Cakes
            </div>
            <div style={{ fontSize: '10px', color: C.gold, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              {isOwner ? 'Owner Portal' : 'Artisanal Bakery'}
            </div>
          </div>
        </div>

        {/* User Info + Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: C.headerText }}>
              {currentUser.name}
            </div>
            <div style={{ fontSize: '10px', color: C.gold, textTransform: 'uppercase', letterSpacing: '1px' }}>
              {currentUser.role}
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: C.dangerBg,
              color: '#FF6B6B',
              border: '1px solid rgba(183,28,28,0.4)',
              padding: '6px 13px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '12px',
              letterSpacing: '0.3px',
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* ── Role-Gated View ──────────────────────────────────────────────────── */}
      <main style={{ flex: 1, minHeight: 0 }}>
        {isOwner
          ? <OwnerView user={currentUser} />
          : <CustomerView user={currentUser} />}
      </main>
    </div>
  );
}
