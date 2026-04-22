import React, { useEffect } from 'react';
import Icon from './Icon';

// ── BUTTON ──────────────────────────────────────────────────────────
export function Button({ children, variant = 'primary', size = '', full = false, loading = false, icon, onClick, disabled, type = 'button' }) {
  const classes = ['btn', `btn-${variant}`, size && `btn-${size}`, full && 'btn-full'].filter(Boolean).join(' ');
  return (
    <button className={classes} onClick={onClick} disabled={disabled || loading} type={type}>
      {loading && <span className="loading-spinner" style={{ width: 16, height: 16 }} />}
      {!loading && icon && <Icon name={icon} size={15} />}
      {children}
    </button>
  );
}

// ── BADGE ────────────────────────────────────────────────────────────
export function Badge({ children, color = 'olive', dot = false }) {
  return (
    <span className={`badge badge-${color}`}>
      {dot && <span className={`dot dot-${color}`} />}
      {children}
    </span>
  );
}

// ── TOAST ────────────────────────────────────────────────────────────
export function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [message, onClose]);

  if (!message) return null;
  return <div className="toast">{message}</div>;
}

// ── SPINNER ──────────────────────────────────────────────────────────
export function Spinner({ size = 20, style = {} }) {
  return (
    <span
      className="loading-spinner"
      style={{ width: size, height: size, ...style }}
    />
  );
}

// ── ALERT ────────────────────────────────────────────────────────────
export function Alert({ type = 'info', children }) {
  return (
    <div className={`alert alert-${type}`}>
      <Icon name="info" size={14} style={{ flexShrink: 0 }} />
      <span>{children}</span>
    </div>
  );
}

// ── CARD ─────────────────────────────────────────────────────────────
export function Card({ children, style = {} }) {
  return <div className="card" style={style}>{children}</div>;
}

// ── SECTION HEADER ────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="section-hd">
      <div>
        <div className="page-heading">{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

// ── STEP INDICATOR ─────────────────────────────────────────────────────
export function StepIndicator({ steps, current }) {
  return (
    <div className="steps">
      {steps.map((label, i) => {
        const num = i + 1;
        const isDone   = current > num;
        const isActive = current === num;
        return (
          <React.Fragment key={num}>
            <div className={`step ${isDone ? 'done' : isActive ? 'active' : ''}`} title={label}>
              {isDone
                ? <Icon name="check" size={12} color="white" strokeWidth={3} />
                : num}
            </div>
            {i < steps.length - 1 && (
              <div className={`step-line ${current > num + 1 ? 'done' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── EMPTY STATE ───────────────────────────────────────────────────────
export function EmptyState({ icon = 'recycle', title, message, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
      <div style={{ width: 56, height: 56, background: 'var(--olive-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
        <Icon name={icon} size={24} color="var(--olive)" />
      </div>
      <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13 }}>{message}</div>
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}
