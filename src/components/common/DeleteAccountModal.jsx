import React, { useState, useCallback } from 'react';
import { X, Trash2, AlertTriangle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { tokenStore } from '../../services/apiClient';

export default function DeleteAccountModal({ onClose }) {
  const { logout } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    setError('');
    
    try {
      // Get token from your tokenStore
      const token = tokenStore.getAccess();
      
      if (!token) {
        throw new Error('Please login again to delete your account');
      }

      // Make the delete request
      const response = await fetch('http://localhost:4000/api/v1/auth/me', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      // Handle response
      if (response.status === 401 || response.status === 403) {
        // Token expired or invalid - clear token and ask to relogin
        tokenStore.clearTokens();
        throw new Error('Your session has expired. Please login again.');
      }
      
      if (!response.ok) {
        let errorMessage = 'Failed to delete account';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      // CRITICAL: Clear all local data first
      localStorage.removeItem('wastelink_user_profile');
      sessionStorage.clear(); // Clear any session storage
      tokenStore.clearTokens(); // Clear tokens
      
      // Manually clear the user state without calling the problematic logout
      // Instead of await logout(), we'll do a hard redirect
      
      // Dispatch a custom event that your AuthContext listens for
      window.dispatchEvent(new CustomEvent('wl:logout'));
      
      // Force a hard redirect to login page
      window.location.href = '/login';
      
    } catch (e) {
      console.error('Delete account error:', e);
      setError(e.message || 'Could not delete account. Please try again.');
      setDeleting(false);
    }
  }, []);

  const handleBackdrop = (e) => { 
    if (e.target === e.currentTarget) onClose(); 
  };

  return (
    <>
      <div className="delete-modal-backdrop" onClick={handleBackdrop}>
        <div className="delete-modal-container" role="dialog" aria-modal="true" aria-labelledby="da-title">
          <div className="delete-modal-header">
            <div className="delete-modal-header-left">
              <div className="delete-modal-icon">
                <Trash2 size={20} />
              </div>
              <h2 id="da-title" className="delete-modal-title">Delete Account</h2>
            </div>
            <button className="delete-modal-close" onClick={onClose} aria-label="Close" disabled={deleting}>
              <X size={18} />
            </button>
          </div>

          <div className="delete-modal-body">
            <div className="delete-warning-box">
              <AlertTriangle size={22} />
              <div className="delete-warning-content">
                <p className="delete-warning-title">This action cannot be undone</p>
                <p className="delete-warning-message">
                  This will <strong>permanently delete</strong> your account, profile, and all
                  associated data — including your map listing.
                </p>
              </div>
            </div>

            {error && (
              <div className="delete-error-alert">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <p className="delete-confirm-question">
              Are you sure you want to permanently delete your account?
            </p>
          </div>

          <div className="delete-modal-footer">
            <button className="delete-btn-secondary" onClick={onClose} disabled={deleting}>
              Cancel
            </button>
            <button
              className="delete-btn-danger"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <span className="delete-spinner" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={14} />
                  Yes, Delete My Account
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .delete-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
          animation: deleteFadeIn 0.2s ease-out;
        }

        .delete-modal-container {
          max-width: 480px;
          width: 100%;
          background: #ffffff;
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          animation: deleteSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .delete-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #f0f0f0;
          background: #ffffff;
        }

        .delete-modal-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .delete-modal-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 14px;
          background: #fee2e2;
          color: #dc2626;
        }

        .delete-modal-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .delete-modal-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: transparent;
          border: none;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .delete-modal-close:hover:not(:disabled) {
          background: #f3f4f6;
          color: #1f2937;
        }

        .delete-modal-close:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .delete-modal-body {
          padding: 1.5rem;
          background: #ffffff;
        }

        .delete-warning-box {
          display: flex;
          gap: 14px;
          padding: 1rem;
          background: #fffbeb;
          border-left: 4px solid #f59e0b;
          border-radius: 14px;
          margin-bottom: 1.5rem;
        }

        .delete-warning-box svg {
          color: #f59e0b;
          flex-shrink: 0;
        }

        .delete-warning-content {
          flex: 1;
        }

        .delete-warning-title {
          font-weight: 600;
          color: #78350f;
          margin: 0 0 4px 0;
          font-size: 0.875rem;
        }

        .delete-warning-message {
          margin: 0;
          font-size: 0.875rem;
          color: #78350f;
          line-height: 1.5;
        }

        .delete-warning-message strong {
          font-weight: 600;
          color: #b45309;
        }

        .delete-error-alert {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fef2f2;
          color: #b91c1c;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-size: 0.875rem;
          margin-bottom: 1.5rem;
          border: 1px solid #fee2e2;
        }

        .delete-confirm-question {
          font-size: 0.9375rem;
          color: #374151;
          text-align: center;
          margin: 0.5rem 0 0 0;
          font-weight: 500;
        }

        .delete-modal-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          padding: 1rem 1.5rem;
          background: #f9fafb;
          border-top: 1px solid #f0f0f0;
        }

        .delete-btn-secondary {
          padding: 0.5rem 1.25rem;
          font-size: 0.875rem;
          font-weight: 500;
          background: transparent;
          border: none;
          border-radius: 10px;
          color: #4b5563;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .delete-btn-secondary:hover:not(:disabled) {
          background: #f3f4f6;
          color: #1f2937;
        }

        .delete-btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .delete-btn-danger {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0.5rem 1.25rem;
          font-size: 0.875rem;
          font-weight: 500;
          background: #dc2626;
          border: none;
          border-radius: 12px;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .delete-btn-danger:hover:not(:disabled) {
          background: #b91c1c;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(220, 38, 38, 0.2);
        }

        .delete-btn-danger:active:not(:disabled) {
          transform: translateY(0);
        }

        .delete-btn-danger:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .delete-spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: deleteSpin 0.6s linear infinite;
        }

        @keyframes deleteSpin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes deleteFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes deleteSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}