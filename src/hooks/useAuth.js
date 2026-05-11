/**
 * useAuth — re-exports from AuthContext.
 * All existing components that import from this file continue to work.
 * All auth state and logic now lives in context/AuthContext.jsx (JWT + REST backend).
 */
export { useAuth } from '../context/AuthContext';
