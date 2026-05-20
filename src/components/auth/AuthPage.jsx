import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import './AuthPage.css';

/* ── tiny inline SVG illustrations ─────────────────────────────── */
// const LeafIcon = () => (
//   <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
//     <path d="M12 2C6 2 2 8 2 14s4 6 10 6 10-2 10-8S18 2 12 2z"/>
//     <path d="M12 2c0 6-4 10-4 14"/>
//   </svg>
// );

const EyeIcon = ({ show }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {show
      ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
      : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
    }
  </svg>
);

// const CheckIcon = () => (
//   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
//     <polyline points="20 6 9 17 4 12"/>
//   </svg>
// );

// const FEATURES = [
//   'Instantly connect waste sellers with certified recyclers',
//   'AI-powered waste verification & fair pricing',
//   'Track transactions end-to-end with full transparency',
//   'Kenya-wide recycler network — growing daily',
// ];

// const STATS = [
//   { val: '2,400+', label: 'kg Recycled' },
//   { val: '180+',   label: 'Active Users' },
//   { val: '95%',    label: 'Match Rate' },
// ];

function InputField({ label, type = 'text', value, onChange, placeholder, autoComplete }) {
  const [showPass, setShowPass] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPass ? 'text' : 'password') : type;

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4A5830', marginBottom: 6, letterSpacing: '0.01em' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          style={{
            width: '100%', padding: '11px 14px',
            paddingRight: isPassword ? 42 : 14,
            borderRadius: 10,
            border: '1.5px solid #D8DFC0',
            background: '#FAFBF7',
            fontSize: 14,
            color: '#2C2E1F',
            outline: 'none',
            transition: 'border .18s, box-shadow .18s',
            fontFamily: 'inherit',
          }}
          onFocus={e => { e.target.style.borderColor = '#6B7C45'; e.target.style.boxShadow = '0 0 0 3px rgba(107,124,69,0.12)'; e.target.style.background = '#fff'; }}
          onBlur={e => { e.target.style.borderColor = '#D8DFC0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFBF7'; }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPass(s => !s)}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8A8E72', padding: 2, display: 'flex', alignItems: 'center' }}>
            <EyeIcon show={showPass} />
          </button>
        )}
      </div>
    </div>
  );
}

function RoleCard({ id, emoji, title, sub, selected, onClick }) {
  return (
    <div onClick={onClick} style={{
      flex: 1, padding: '14px 10px', cursor: 'pointer', textAlign: 'center',
      border: `2px solid ${selected ? '#6B7C45' : '#D8DFC0'}`,
      borderRadius: 12,
      background: selected ? '#EEF2E0' : '#FAFBF7',
      transition: 'all .18s',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {selected && (
        <div style={{ position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: '50%', background: '#6B7C45', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
      )}
      <div style={{ fontSize: 26, marginBottom: 6 }}>{emoji}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: selected ? '#4A5830' : '#2C2E1F', marginBottom: 2 }}>{title}</div>
      <div style={{ fontSize: 11, color: '#8A8E72', lineHeight: 1.4 }}>{sub}</div>
    </div>
  );
}

export default function AuthPage({ onLogin }) {
  const { login, register, setError } = useAuth();

  const [mode, setMode]             = useState('login');
  const [role, setRole]             = useState('seller');
  const [email, setEmail]           = useState('');
  const [pass, setPass]             = useState('');
  const [full_name, setFullName]    = useState('');
  const [phone, setPhone]           = useState('');
  const [location, setLocation]     = useState('Nairobi, Kenya');
  const [loading, setLoading]       = useState(false);
  const [localError, setLocalError] = useState('');
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent]   = useState(false);

  function switchMode(m) {
    setMode(m);
    setLocalError('');
    if (setError) setError(null);
  }

  async function handleForgot() {
    if (!forgotEmail) { setLocalError('Please enter your email address'); return; }
    setLoading(true); setLocalError('');
    try {
      await authService.forgotPassword(forgotEmail);
      setForgotSent(true);
    } catch (e) { setLocalError(e.message); } finally { setLoading(false); }
  }

  async function handleSubmit() {
    setLocalError('');
    if (setError) setError(null);

    if (mode === 'login') {
      if (!email || !pass) { setLocalError('Email and password are required'); return; }
    } else {
      if (!full_name.trim()) { setLocalError('Full name is required'); return; }
      if (!email)            { setLocalError('Email is required'); return; }
      if (pass.length < 8)   { setLocalError('Password must be at least 8 characters'); return; }
    }

    setLoading(true);
    try {
      let user;
      if (mode === 'login') {
        user = await login({ email, password: pass });
      } else {
        user = await register({ email, password: pass, full_name: full_name.trim(), phone, role, location });
      }
      onLogin(user);
    } catch (e) {
      const msg = e.message || '';
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('user already') || msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('unique')) {
        setLocalError('An account with this email already exists. Try signing in instead.');
      } else if (msg.toLowerCase().includes('invalid') && msg.toLowerCase().includes('password')) {
        setLocalError('Incorrect email or password.');
      } else {
        // Show the real backend message — it's more accurate than guessing
        setLocalError(msg || 'Something went wrong. Please try again.');
      }
    } finally { setLoading(false); }
  }

  function handleKey(e) { if (e.key === 'Enter') handleSubmit(); }

  /* ── LEFT PANEL ─────────────────────────────────────────────── */
  const LeftPanel = () => (
  <div className="hero-wrapper">

    <div className="hero-overlay" />

    <div className="hero-content">

      {/* LOGO */}
      <div className="brand-row">

        <div className="brand-icon">
          ♻
        </div>

        <h1>WasteLink</h1>

      </div>

      {/* HERO TEXT */}
      <div className="hero-text">

        <h2>
          Turn Waste Into
          <span> Opportunity</span>
        </h2>

        <p>
          Kenya's smartest waste recycling marketplace.
          Connect with verified recyclers and make recycling effortless.
        </p>

      </div>

      {/* FEATURES */}
      <div className="feature-grid">

        <div className="feature-card">
          <h3>AI Verification</h3>
          <p>Computer vision waste analysis</p>
        </div>

        <div className="feature-card">
          <h3>Smart Pricing</h3>
          <p>ML-powered fair prices</p>
        </div>

        <div className="feature-card">
          <h3>Local Matching</h3>
          <p>Find recyclers near you</p>
        </div>

        <div className="feature-card">
          <h3>Fast Payments</h3>
          <p>Secure transactions</p>
        </div>

      </div>

    </div>

  </div>
);

  /* ── FORGOT PASSWORD ────────────────────────────────────────── */
  if (forgotMode) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', background: '#F7F5EE' }}>
        <LeftPanel />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 48px' }}>
          <div style={{ width: '100%', maxWidth: 380 }}>
            <button onClick={() => { setForgotMode(false); setForgotSent(false); setForgotEmail(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A8E72', fontSize: 13, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 6, padding: 0, fontFamily: 'inherit' }}>
              ← Back to sign in
            </button>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: '#2C2E1F', marginBottom: 8 }}>Reset your password</div>
            <div style={{ fontSize: 14, color: '#8A8E72', marginBottom: 32, lineHeight: 1.6 }}>We'll send a secure reset link to your email.</div>

            {forgotSent ? (
              <div style={{ background: '#EEF2E0', border: '1px solid #D4DFB5', borderRadius: 12, padding: '20px 18px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📬</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#4A5830', marginBottom: 6 }}>Check your inbox</div>
                <div style={{ fontSize: 13, color: '#6B7C45', lineHeight: 1.5 }}>A reset link has been sent to <strong>{forgotEmail}</strong></div>
              </div>
            ) : (
              <>
                {localError && <ErrorBanner msg={localError} />}
                <InputField label="Email address" type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="you@example.com" />
                <SubmitButton loading={loading} onClick={handleForgot} label="Send reset link" />
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── MAIN AUTH ──────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#F7F5EE' }}>
      <LeftPanel />

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 48px', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Heading */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#2C2E1F', marginBottom: 6, letterSpacing: '-0.3px' }}>
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </div>
            <div style={{ fontSize: 14, color: '#8A8E72' }}>
              {mode === 'login'
                ? 'Sign in to your WasteLink account'
                : "Join Kenya's recycling marketplace today"}
            </div>
          </div>

          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: 0, background: '#EEEBE0', padding: 4, borderRadius: 12, marginBottom: 28 }}>
            {[['login', 'Sign In'], ['signup', 'Create Account']].map(([m, l]) => (
              <button key={m} onClick={() => switchMode(m)} style={{
                flex: 1, padding: '9px 12px', borderRadius: 9, border: 'none',
                background: mode === m ? '#fff' : 'transparent',
                color: mode === m ? '#4A5830' : '#8A8E72',
                fontWeight: mode === m ? 700 : 500,
                fontSize: 13, cursor: 'pointer',
                boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                transition: 'all .18s',
                fontFamily: 'inherit',
              }}>
                {l}
              </button>
            ))}
          </div>

          {/* Role selector (signup only) */}
          {mode === 'signup' && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#4A5830', marginBottom: 10 }}>I am a…</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <RoleCard id="seller"   emoji="🌿" title="Waste Seller"  sub="I generate waste to sell"    selected={role === 'seller'}   onClick={() => setRole('seller')} />
                <RoleCard id="recycler" emoji="♻️" title="Recycler"      sub="I collect & process waste"   selected={role === 'recycler'} onClick={() => setRole('recycler')} />
              </div>
            </div>
          )}

          {/* Form fields */}
          {mode === 'signup' && (
            <InputField label="Full Name" value={full_name} onChange={e => setFullName(e.target.value)} placeholder="e.g. Amara Osei" autoComplete="name" />
          )}

          <InputField label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
          <InputField
            label={mode === 'signup' ? 'Password (min. 8 characters)' : 'Password'}
            type="password" value={pass} onChange={e => setPass(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />

          {mode === 'signup' && (
            <>
              <InputField label="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254 700 000 000" autoComplete="tel" />
              <InputField label="Location" value={location} onChange={e => setLocation(e.target.value)} placeholder="Nairobi, Kenya" />
            </>
          )}

          {/* Error */}
          {localError && <ErrorBanner msg={localError} />}

          {/* Submit */}
          <SubmitButton
            loading={loading}
            onClick={handleSubmit}
            onKeyDown={handleKey}
            label={mode === 'login' ? 'Sign In →' : 'Create Account →'}
          />

          {/* Forgot password */}
          {mode === 'login' && (
            <button onClick={() => setForgotMode(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7C45', fontSize: 13, fontWeight: 500, display: 'block', textAlign: 'center', width: '100%', marginTop: 14, fontFamily: 'inherit' }}>
              Forgot your password?
            </button>
          )}

          {/* Admin hint */}
          <div style={{ marginTop: 28, padding: '12px 14px', background: 'rgba(107,124,69,0.07)', borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>🛡️</span>
            <div style={{ fontSize: 12, color: '#6B7C45', lineHeight: 1.5 }}>
              <strong>Admin access</strong> is assigned via the database. Log in with your admin email and your role is applied automatically.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Shared sub-components ──────────────────────────────────────── */
function ErrorBanner({ msg }) {
  return (
    <div style={{
      background: '#FFF0D0', border: '1px solid #F0D080',
      borderRadius: 10, padding: '11px 14px',
      fontSize: 13, color: '#7A5000',
      marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 8,
    }}>
      <span style={{ flexShrink: 0, fontSize: 15 }}>⚠️</span>
      <span>{msg}</span>
    </div>
  );
}

function SubmitButton({ loading, onClick, label, onKeyDown }) {
  return (
    <button
      onClick={onClick}
      onKeyDown={onKeyDown}
      disabled={loading}
      style={{
        width: '100%', padding: '13px 20px',
        background: loading ? '#8A9B5E' : 'linear-gradient(135deg, #4A5830 0%, #6B7C45 100%)',
        color: '#fff',
        border: 'none', borderRadius: 12,
        fontSize: 15, fontWeight: 700,
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all .2s',
        fontFamily: 'inherit',
        letterSpacing: '0.01em',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        boxShadow: loading ? 'none' : '0 4px 14px rgba(74,88,48,0.3)',
      }}
      onMouseEnter={e => { if (!loading) e.target.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; }}
    >
      {loading ? (
        <>
          <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
          Please wait…
        </>
      ) : label}
    </button>
  );
}