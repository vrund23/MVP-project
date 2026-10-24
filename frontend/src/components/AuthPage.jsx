// frontend/src/components/AuthPage.jsx
import React, { useState } from 'react';
import { api } from '../api';

// ─── Brand Tokens ────────────────────────────────────────────────────────────
const C = {
  bg:        '#FAF7F2',
  dark:      '#2B1E16',
  medium:    '#3B2820',
  cta:       '#C86A28',
  gold:      '#D4AF37',
  border:    '#E8DDD5',
  error:     '#C0392B',
  errorBg:   '#FEF0EE',
  muted:     '#8A7060',
};

const inputStyle = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: '8px',
  border: `1.5px solid ${C.border}`,
  background: '#FFFFFF',
  fontSize: '14px',
  color: C.dark,
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: '700',
  color: C.medium,
  marginBottom: '5px',
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
};

export default function AuthPage({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    phone: '', role: 'customer', ownerPasscode: '',
  });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const switchMode = (m) => { setMode(m); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let res;
      if (mode === 'register') {
        res = await api.register({
          name:  form.name,
          email: form.email,
          password: form.password,
          phone: form.phone || undefined,
          role:  form.role,
          // ownerPasscode is only sent (and validated) when role === 'owner'
          ...(form.role === 'owner' ? { ownerPasscode: form.ownerPasscode } : {}),
        });
      } else {
        res = await api.login({ email: form.email, password: form.password });
      }

      // ── Persist JWT token and user profile ──────────────────────────────
      localStorage.setItem('m_token', res.token);
      localStorage.setItem('m_user', JSON.stringify(res.user));
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 0%, #3B2820 0%, #1A0E09 70%)',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* ── Brand Mark ──────────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '38px', lineHeight: 1, marginBottom: '8px' }}>🍫</div>
          <h1 style={{
            color: C.bg, fontSize: '24px', fontWeight: '700',
            margin: '0 0 6px', letterSpacing: '0.5px',
          }}>
            M Chocolates &amp; Cakes
          </h1>
          <p style={{
            color: C.gold, fontSize: '11px', letterSpacing: '2.5px',
            textTransform: 'uppercase', margin: 0,
          }}>
            Artisanal · Bespoke · Handcrafted
          </p>
        </div>

        {/* ── Card ────────────────────────────────────────────────────────── */}
        <div style={{
          background: C.bg,
          borderRadius: '16px',
          padding: '32px 28px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
        }}>

          {/* Mode Toggle Pill */}
          <div style={{
            display: 'flex',
            background: '#EDE5DC',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '24px',
          }}>
            {[
              { id: 'login',    label: 'Sign In' },
              { id: 'register', label: 'Create Account' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => switchMode(m.id)}
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: '7px',
                  border: 'none',
                  background:  mode === m.id ? C.dark  : 'transparent',
                  color:       mode === m.id ? C.bg    : C.muted,
                  fontWeight:  mode === m.id ? '700'   : '500',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{
              background: C.errorBg, color: C.error,
              border: '1px solid #F5C6CB',
              padding: '10px 14px', borderRadius: '8px',
              fontSize: '13px', marginBottom: '18px',
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {mode === 'register' && (
              <div>
                <label style={labelStyle}>Full Name</label>
                <input required type="text" value={form.name} onChange={set('name')}
                  placeholder="e.g. Ananya Sharma" autoComplete="name" style={inputStyle} />
              </div>
            )}

            <div>
              <label style={labelStyle}>Email Address</label>
              <input required type="email" value={form.email} onChange={set('email')}
                placeholder="you@example.com" autoComplete="email" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <input required type="password" value={form.password} onChange={set('password')}
                placeholder="••••••••" minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                style={inputStyle} />
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label style={labelStyle}>Phone <span style={{ fontWeight: '400', textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                  <input type="tel" value={form.phone} onChange={set('phone')}
                    placeholder="+91 98765 43210" autoComplete="tel" style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Account Type</label>
                  <select value={form.role} onChange={set('role')}
                    style={{ ...inputStyle, cursor: 'pointer', background: '#fff' }}>
                    <option value="customer">Customer — Storefront Access</option>
                    <option value="owner">Owner — Kitchen Dashboard</option>
                  </select>
                </div>

                {form.role === 'owner' && (
                  <div>
                    <label style={labelStyle}>Owner Passcode</label>
                    <input required type="password" value={form.ownerPasscode}
                      onChange={set('ownerPasscode')}
                      placeholder="Bakery registration passcode"
                      style={inputStyle} />
                    <p style={{ fontSize: '11px', color: C.muted, marginTop: '4px' }}>
                      Only one owner account can exist. Contact the bakery admin for the passcode.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* CTA */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '6px',
                padding: '13px',
                background: loading ? '#B08060' : C.cta,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '15px',
                cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: '0.3px',
              }}
            >
              {loading
                ? 'Please wait…'
                : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Switch Mode Link */}
          <p style={{ textAlign: 'center', marginTop: '18px', fontSize: '12px', color: C.muted }}>
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              style={{
                background: 'none', border: 'none', color: C.cta,
                cursor: 'pointer', fontWeight: '700', fontSize: '12px', padding: 0,
              }}
            >
              {mode === 'login' ? 'Register here' : 'Sign in instead'}
            </button>
          </p>
        </div>

        {/* Footer tagline */}
        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px', color: 'rgba(250,247,242,0.4)', letterSpacing: '0.5px' }}>
          Freshly baked with love. Delivered with care.
        </p>
      </div>
    </div>
  );
}
