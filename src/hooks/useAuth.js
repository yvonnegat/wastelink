import { useState, useEffect, useCallback } from 'react';
import supabase from '../services/supabaseClient';

/**
 * useAuth
 * Manages authentication state via Supabase.
 * Falls back to mock auth when Supabase is not configured.
 */
export function useAuth() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // Listen for Supabase session changes
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async ({ email, password, role }) => {
    setError(null);

    if (!supabase) {
      // Mock login
      await delay(1200);
      const mockUser = { id: 'mock-uid', email, name: 'Amara Osei', role };
      setUser(mockUser);
      return mockUser;
    }

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError(authError.message); throw authError; }
    return data.user;
  }, []);

  const signup = useCallback(async ({ email, password, name, role, phone }) => {
    setError(null);

    if (!supabase) {
      await delay(1500);
      const mockUser = { id: 'mock-uid-new', email, name, role };
      setUser(mockUser);
      return mockUser;
    }

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role, phone } },
    });
    if (authError) { setError(authError.message); throw authError; }
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  }, []);

  return { user, loading, error, login, signup, logout };
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
