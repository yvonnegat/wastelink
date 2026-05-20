// src/hooks/useMapLocations.js
// Fetches map pins from Supabase and subscribes to real-time updates.

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { fetchLocationsByRole } from '../services/locationService';

/**
 * Hook: fetch map locations based on current user role.
 * - Sellers  → see recycling_centre + collection_point pins
 * - Recyclers → see waste_generator pins
 *
 * Includes real-time subscription so new locations appear without refresh.
 */
export function useMapLocations(role) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchLocationsByRole(role);
      setLocations(data);
    } catch (err) {
      console.error('useMapLocations error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    load();

    // Real-time subscription — new pins appear instantly on the map
    const channel = supabase
      .channel('map_locations_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'map_locations' },
        () => {
          // Re-fetch on any change (insert, update, delete)
          load();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  return { locations, loading, error, refetch: load };
}

/**
 * Hook: get/save current user's own location pin.
 */
export function useMyLocation(userId) {
  const [myLocation, setMyLocation] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('map_locations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => setMyLocation(data));
  }, [userId]);

  return { myLocation, setMyLocation, saving, setSaving };
}