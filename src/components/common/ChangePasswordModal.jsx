import React, { useState, useCallback } from 'react';
import { X, Lock, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { authService } from '../../services/authService';

// ── ChangePasswordModal ────────────────────────────────────────────
// Drop this anywhere near the top of ProfilePage's JSX (inside the
// profile-page div) and toggle it with a `showChangePassword` state.
//
// Usage:
//   {showChangePassword && (
//     <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
//   )}
// ──────────────────────────────────────────────────────────────────

export default function ChangePasswordModal({ onClose }) {
  const [form, setForm]       = useState({ current: '', next: '', confirm: '' });
  const [show, setShow]       = useState({ current: false, next: false, confirm: false });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);

  const toggle = (field) => setShow(prev => ({ ...prev, [field]: !prev[field] }));
  const set    = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    if (!form.current)            return 'Please enter your current password.';
    if (form.next.length < 8)     return 'New password must be at least 8 characters.';
    if (form.next !== form.confirm) return 'New passwords do not match.';
    return null;
  };

  const handleSave = useCallback(async () => {
    const err = validate();
    if (err) { setError(err); return; }

    setSaving(true);
    setError('');
    try {
      await authService.changePassword({
        current_password: form.current,
        new_password:     form.next,
      });
      setSuccess(true);
      setTimeout(onClose, 1800);
    } catch (e) {
      setError(e.message || 'Could not update password. Please try again.');
    } finally {
      setSaving(false);
    }
    // eslint-disable-next-line
  }, [form, onClose]);

  // Close on backdrop click
  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div className="wl-modal-backdrop" onClick={handleBackdrop}>
      <div className="wl-modal" role="dialog" aria-modal="true" aria-labelledby="cp-title">

        {/* Header */}
        <div className="wl-modal-hd">
          <div className="wl-modal-hd-left">
            <div className="wl-modal-icon"><Lock size={16}/></div>
            <h2 id="cp-title" className="wl-modal-title">Change Password</h2>
          </div>
          <button className="wl-modal-close" onClick={onClose} aria-label="Close">
            <X size={16}/>
          </button>
        </div>

        {/* Body */}
        <div className="wl-modal-body">
          {success ? (
            <div className="wl-modal-success">
              <div className="wl-success-icon"><Check size={22}/></div>
              <p>Password updated successfully!</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="alert alert-warn" style={{ marginBottom: 16 }}>
                  <AlertCircle size={14}/> {error}
                </div>
              )}

              <PasswordField
                label="Current Password"
                value={form.current}
                visible={show.current}
                onChange={set('current')}
                onToggle={() => toggle('current')}
                placeholder="Enter current password"
                autoComplete="current-password"
              />
              <PasswordField
                label="New Password"
                value={form.next}
                visible={show.next}
                onChange={set('next')}
                onToggle={() => toggle('next')}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                hint={
                  form.next.length > 0 && form.next.length < 8
                    ? `${8 - form.next.length} more character${8 - form.next.length !== 1 ? 's' : ''} needed`
                    : null
                }
              />
              <PasswordField
                label="Confirm New Password"
                value={form.confirm}
                visible={show.confirm}
                onChange={set('confirm')}
                onToggle={() => toggle('confirm')}
                placeholder="Re-enter new password"
                autoComplete="new-password"
                hint={
                  form.confirm.length > 0 && form.confirm !== form.next
                    ? 'Passwords do not match'
                    : null
                }
                hintOk={form.confirm.length > 0 && form.confirm === form.next}
              />
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="wl-modal-ft">
            <button className="btn btn-ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving
                ? <><span className="spinner"/> Updating…</>
                : <><Lock size={13}/> Update Password</>}
            </button>
          </div>
        )}
      </div>

      <style>{modalCSS}</style>
    </div>
  );
}

// ── Reusable password field ──────────────────────────────────────
function PasswordField({ label, value, visible, onChange, onToggle, placeholder, autoComplete, hint, hintOk }) {
  return (
    <div className="wl-field" style={{ marginBottom: 14 }}>
      <label className="form-label">{label}</label>
      <div className="wl-pw-wrap">
        <input
          type={visible ? 'text' : 'password'}
          className="form-input"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        <button type="button" className="wl-pw-eye" onClick={onToggle} aria-label={visible ? 'Hide' : 'Show'}>
          {visible ? <EyeOff size={15}/> : <Eye size={15}/>}
        </button>
      </div>
      {hint && (
        <span className={`wl-field-hint ${hintOk ? 'ok' : 'warn'}`}>
          {hintOk ? <Check size={11}/> : <AlertCircle size={11}/>} {hint}
        </span>
      )}
      {hintOk && (
        <span className="wl-field-hint ok">
          <Check size={11}/> Passwords match
        </span>
      )}
    </div>
  );
}

// ── Scoped CSS (injected via <style> so it works without a CSS file) ──
const modalCSS = `
/* ── Modal backdrop & shell ── */
.wl-modal-backdrop {
  position: fixed; inset: 0; z-index: 1200;
  background: rgba(13, 27, 18, 0.45);
  backdrop-filter: blur(3px);
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
  animation: wlFadeIn .15s ease;
}
@keyframes wlFadeIn { from { opacity:0 } to { opacity:1 } }

.wl-modal {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(13,27,18,.18);
  width: 100%; max-width: 420px;
  overflow: hidden;
  animation: wlSlideUp .2s ease;
}
@keyframes wlSlideUp { from { transform:translateY(12px); opacity:0 } to { transform:translateY(0); opacity:1 } }

/* ── Header ── */
.wl-modal-hd {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1px solid #e8f0eb;
}
.wl-modal-hd-left { display: flex; align-items: center; gap: 10px; }
.wl-modal-icon {
  width: 32px; height: 32px; border-radius: 8px;
  background: #e6f4ec; color: #1a7a4a;
  display: flex; align-items: center; justify-content: center;
}
.wl-modal-title { font-size: 15px; font-weight: 700; color: #0d1b12; margin: 0; }

.wl-modal-close {
  width: 28px; height: 28px; border-radius: 6px;
  border: none; background: #f4f7f5; color: #5a7a65;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background .15s;
}
.wl-modal-close:hover { background: #e2ebe5; color: #0d1b12; }

/* ── Body ── */
.wl-modal-body { padding: 20px; }

/* ── Password input wrapper ── */
.wl-pw-wrap { position: relative; }
.wl-pw-wrap .form-input { padding-right: 38px; }
.wl-pw-eye {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  border: none; background: transparent; color: #7a9e87;
  cursor: pointer; padding: 2px; display: flex; align-items: center;
  transition: color .15s;
}
.wl-pw-eye:hover { color: #1a7a4a; }

/* ── Inline field hints ── */
.wl-field-hint {
  display: flex; align-items: center; gap: 4px;
  font-size: 11px; margin-top: 4px; font-weight: 500;
}
.wl-field-hint.warn { color: #c0392b; }
.wl-field-hint.ok   { color: #1a7a4a; }

/* ── Success state ── */
.wl-modal-success {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; padding: 16px 0 8px; text-align: center;
}
.wl-success-icon {
  width: 48px; height: 48px; border-radius: 50%;
  background: #e6f4ec; color: #1a7a4a;
  display: flex; align-items: center; justify-content: center;
}
.wl-modal-success p { font-size: 14px; font-weight: 600; color: #0d1b12; margin: 0; }

/* ── Footer ── */
.wl-modal-ft {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 14px 20px 18px;
  border-top: 1px solid #e8f0eb;
}

/* ── Delete modal danger variant ── */
.wl-modal.danger .wl-modal-icon { background: #fdecea; color: #c0392b; }
.wl-modal.danger .wl-modal-title { color: #7b1c1c; }
.wl-modal-danger-body { padding: 20px; }
.wl-danger-warning {
  display: flex; gap: 12px; align-items: flex-start;
  background: #fef6f5; border: 1px solid #f5c6c2;
  border-radius: 10px; padding: 14px; margin-bottom: 18px;
}
.wl-danger-warning svg { color: #c0392b; flex-shrink:0; margin-top:1px; }
.wl-danger-warning p { font-size: 13px; color: #7b1c1c; margin: 0; line-height: 1.5; }
.wl-confirm-label { font-size: 13px; color: #3d5c47; font-weight: 500; margin-bottom: 6px; }
.wl-confirm-label strong { color: #c0392b; }
.wl-modal-ft .btn-danger {
  background: #c0392b; color: #fff; border: none;
  padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600;
  cursor: pointer; display: flex; align-items: center; gap: 6px;
  transition: background .15s;
}
.wl-modal-ft .btn-danger:hover:not(:disabled) { background: #a93226; }
.wl-modal-ft .btn-danger:disabled { opacity: .6; cursor: not-allowed; }
`;