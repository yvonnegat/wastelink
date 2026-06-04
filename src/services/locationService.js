// src/services/locationService.js
// Handles all map_locations CRUD with Supabase

import { supabase } from './supabaseClient';

/**
 * Fetch all active locations from Supabase.
 * @param {Object} filters - Optional filters: { type, city, accepted_types }
 */
export async function fetchMapLocations({ type, city, accepted_types } = {}) {
  let query = supabase
    .from('map_locations')
    .select(`
      *,
      users (
        full_name,
        avatar_url,
        rating,
        rating_count
      )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (type) query = query.eq('location_type', type);
  if (city) query = query.ilike('city', `%${city}%`);
  if (accepted_types && accepted_types.length > 0) {
    query = query.overlaps('accepted_types', accepted_types);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Fetch locations by role perspective:
 * - Sellers see: recycling_centre + collection_point
 * - Recyclers see: waste_generator
 */
export async function fetchLocationsByRole(role) {
  const types =
    role === 'recycler'
      ? ['waste_generator']
      : ['recycling_centre', 'collection_point'];

  let query = supabase
    .from('map_locations')
    .select(`
      *,
      users (
        full_name,
        avatar_url,
        rating,
        rating_count
      )
    `)
    .eq('is_active', true)
    .in('location_type', types)
    .order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Save or update a recycler's centre/collection-point location.
 * Call this after signup or from the recycler profile page.
 */
export async function saveRecyclerLocation({
  userId,
  name,
  locationType = 'recycling_centre', // 'recycling_centre' | 'collection_point'
  lat,
  lng,
  address,
  city,
  acceptedTypes = [],
  operatingHours,
  phone,
  description,
}) {
  const { data, error } = await supabase
    .from('map_locations')
    .upsert(
      {
        user_id: userId,
        name,
        location_type: locationType,
        lat,
        lng,
        address,
        city,
        accepted_types: acceptedTypes,
        operating_hours: operatingHours,
        phone,
        description,
        is_active: true,
      },
      {
        onConflict: 'user_id',
        ignoreDuplicates: false,
      }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Register a waste generator on the map (called when listing is verified).
 * For sellers, their pin appears automatically when they have a verified listing.
 */
export async function saveWasteGeneratorLocation({
  userId,
  listingId,
  name,
  lat,
  lng,
  address,
  city,
}) {
  const { data, error } = await supabase
    .from('map_locations')
    .upsert(
      {
        user_id: userId,
        listing_id: listingId,
        name,
        location_type: 'waste_generator',
        lat,
        lng,
        address,
        city,
        is_active: true,
      },
      {
        onConflict: 'user_id',
        ignoreDuplicates: false,
      }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Deactivate a user's location pin (soft delete).
 */
export async function deactivateLocation(userId) {
  const { error } = await supabase
    .from('map_locations')
    .update({ is_active: false })
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Get a single user's own location.
 */
export async function getMyLocation(userId) {
  const { data, error } = await supabase
    .from('map_locations')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data || null;
}

/**
 * Nominatim geocoding — convert address text to lat/lng.
 * Free, no API key required. Rate limit: 1 req/sec.
 */
export async function geocodeAddress(address) {
  const encoded = encodeURIComponent(address + ', Kenya');
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=5&countrycodes=ke`,
    { headers: { 'Accept-Language': 'en' } }
  );
  const results = await res.json();
  return results.map((r) => ({
    display_name: r.display_name,
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
    city: r.address?.city || r.address?.town || r.address?.county || '',
  }));
}

/**
 * Nominatim reverse geocoding — lat/lng to address.
 */
export async function reverseGeocode(lat, lng) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
    { headers: { 'Accept-Language': 'en' } }
  );
  const result = await res.json();
  return {
    display_name: result.display_name,
    city:
      result.address?.city ||
      result.address?.town ||
      result.address?.suburb ||
      result.address?.county ||
      '',
    address: result.display_name,
  };
}