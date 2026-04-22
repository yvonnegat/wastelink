import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Icon from '../common/Icon';
import { Button, Spinner } from '../common';

export default function AuthPage({ onLogin }) {
  const { login, signup, error } = useAuth();
  const [mode, setMode]   = useState('login');
  const [role, setRole]   = useState('seller');
  const [email, setEmail] = useState('demo@wastelink.co.ke');
  const [pass, setPass]   = useState('password123');
  const [name, setName]   = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    try {
      let user;
      if (mode === 'login') {
        user = await login({ email, password: pass, role });
      } else {
        user = await signup({ email, password: pass, name, role, phone });
      }
      onLogin({ ...user, name: name || 'Amara Osei', role });
    } catch {
      // error already set in hook
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div style={{ width: 48, height: 48, background: 'var(--olive-deep)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <Icon name="leaf" size={26} color="var(--olive-pale)" strokeWidth={1.8} />
          </div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: 'var(--text)' }}>WasteLink</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 3 }}>Kenya's Recycling Marketplace</div>
        </div>

        {/* Mode tabs */}
        <div className="tabs">
          <button className={`tab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>Sign In</button>
          <button className={`tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => setMode('signup')}>Create Account</button>
        </div>

        {/* Role picker */}
        <div className="form-group">
          <label className="form-label">I am a…</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { id: 'seller',   label: 'Waste Seller',  sub: 'I generate waste' },
              { id: 'recycler', label: 'Recycler',       sub: 'I collect & recycle' },
            ].map((r) => (
              <div
                key={r.id}
                onClick={() => setRole(r.id)}
                style={{
                  flex: 1, padding: '10px 14px', cursor: 'pointer',
                  border: `2px solid ${role === r.id ? 'var(--olive)' : 'var(--border)'}`,
                  borderRadius: 'var(--r2)', textAlign: 'center',
                  background: role === r.id ? 'var(--olive-bg)' : 'var(--white)',
                  transition: 'all .2s',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 14, color: role === r.id ? 'var(--olive-deep)' : 'var(--text)' }}>{r.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>{r.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Fields */}
        {mode === 'signup' && (
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Amara Osei" />
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
        </div>
        {mode === 'signup' && (
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254 700 000 000" />
          </div>
        )}

        {error && (
          <div className="alert alert-warn" style={{ marginBottom: 12 }}>
            {error}
          </div>
        )}

        <Button variant="primary" size="lg" full loading={loading} onClick={handleSubmit}>
          {loading ? 'Signing in…' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
        </Button>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text3)' }}>
          By continuing you agree to our{' '}
          <span style={{ color: 'var(--olive)', cursor: 'pointer' }}>Terms of Service</span>
        </div>
      </div>
    </div>
  );
}
