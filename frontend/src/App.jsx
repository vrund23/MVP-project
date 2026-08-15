import React, { useState } from 'react';
import AuthPage from './components/AuthPage';
import OwnerView from './components/OwnerView';
import CustomerView from './components/CustomerView';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('m_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('m_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('m_user');
  };

  if (!currentUser) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Application Bar */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 28px',
        background: '#2b1712',
        color: '#fff'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '18px', letterSpacing: '1px' }}>M Chocolate & Cakes</h1>
          <small style={{ color: '#d7ccc8' }}>{currentUser.role === 'owner' ? 'Owner Portal' : 'Artisanal Bakery'}</small>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '13px' }}>
            {currentUser.name} (<strong>{currentUser.role.toUpperCase()}</strong>)
          </span>
          <button
            onClick={handleLogout}
            style={{
              background: '#b71c1c',
              color: '#fff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '12px'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* View Switcher based on Verified Role */}
      <main style={{ flex: 1 }}>
        {currentUser.role === 'owner' ? (
          <OwnerView user={currentUser} />
        ) : (
          <CustomerView user={currentUser} />
        )}
      </main>
    </div>
  );
}