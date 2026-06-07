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
 *
 * FIX: seeded rows have user_id = NULL so we can't use the foreign-key
 * join (.select('*, users(...)')) — Supabase silently drops rows where
 * the FK is null.  We fetch map_locations and users separately, then
 * merge them in JS. Seeded rows simply get users: null.
 */
export async function fetchLocationsByRole(role) {
  const types =
    role === 'recycler'
      ? ['waste_generator']
      : ['recycling_centre', 'collection_point'];

  // 1. Fetch locations (no join)
  const { data: locations, error: locErr } = await supabase
    .from('map_locations')
    .select('*')
    .eq('is_active', true)
    .in('location_type', types)
    .order('created_at', { ascending: false });

  if (locErr) throw locErr;
  if (!locations?.length) return [];

  // 2. Collect the non-null user_ids (real user registrations only)
  const userIds = [...new Set(
    locations.map(l => l.user_id).filter(Boolean)
  )];

  // 3. Fetch those users in one query (skip if all seeded)
  let usersMap = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, avatar_url, rating, rating_count')
      .in('id', userIds);

    if (users) {
      usersMap = Object.fromEntries(users.map(u => [u.id, u]));
    }
  }

  // 4. Merge — seeded rows get users: null, real rows get their user
  return locations.map(loc => ({
    ...loc,
    users: loc.user_id ? (usersMap[loc.user_id] || null) : null,
  }));
}

/**
 * Save or update a recycler's centre/collection-point location.
 * Also checks for a nearby seeded centre within 200m.
 */
export async function saveRecyclerLocation({
  userId,
  name,
  locationType = 'recycling_centre',
  lat,
  lng,
  address,
  city,
  acceptedTypes = [],
  operatingHours,
  phone,
  description,
}) {
  const nearby = await findNearbySeededCentre(lat, lng, 0.2);

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
  return { location: data, nearbySeededCentre: nearby };
}

/**
 * Register a waste generator on the map (called when listing is verified).
 */
/**
 * Register a waste generator on the map.
 * Called from ProfilePage when a seller saves their profile.
 * Uses onConflict: 'user_id' so repeated saves update the existing pin.
 */
export async function saveWasteGeneratorLocation({
  userId,
  listingId = null,
  name,
  lat,
  lng,
  address,
  city,
  // These were missing — sellers need them to be visible/useful to recyclers
  wasteTypes    = [],
  description   = '',
  phone         = '',
}) {
  const { data, error } = await supabase
    .from('map_locations')
    .upsert(
      {
        user_id:       userId,
        listing_id:    listingId,
        name,
        location_type: 'waste_generator',
        lat,
        lng,
        address,
        city,
        accepted_types: wasteTypes,   // what types of waste they have
        description,                  // about the seller / their waste
        phone,                        // so recyclers can call them
        is_active: true,
      },
      {
        onConflict:       'user_id',
        ignoreDuplicates: false,       // always update if exists
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

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

/**
 * Nominatim geocoding — convert address text to lat/lng.
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

// ─────────────────────────────────────────────────────────────
// Seeded centre helpers
// ─────────────────────────────────────────────────────────────

export async function findNearbySeededCentre(lat, lng, radiusKm = 0.5) {
  const { data, error } = await supabase
    .from('map_locations')
    .select('id, name, lat, lng, address, city, claimed_by_user_id')
    .eq('is_seeded', true)
    .eq('is_active', true);

  if (error || !data?.length) return null;

  const withDist = data
    .map((r) => ({ ...r, dist: haversine(lat, lng, r.lat, r.lng) }))
    .filter((r) => r.dist <= radiusKm)
    .sort((a, b) => a.dist - b.dist);

  return withDist[0] || null;
}

export async function claimSeededCentre(centreId, userId) {
  const { data, error } = await supabase.rpc('claim_seeded_centre', {
    p_centre_id: centreId,
    p_user_id:   userId,
  });

  if (error) throw error;
  if (!data.success) throw new Error(data.error);
  return data;
}

export async function updateClaimedCentre(centreId, userId, updates) {
  const allowed = ['operating_hours', 'phone', 'website', 'accepted_types', 'description'];
  const safe = Object.fromEntries(
    Object.entries(updates).filter(([k]) => allowed.includes(k))
  );

  const { data, error } = await supabase
    .from('map_locations')
    .update(safe)
    .eq('id', centreId)
    .eq('claimed_by_user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────────────────────────
// Internal helper
// ─────────────────────────────────────────────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dL = ((lat2 - lat1) * Math.PI) / 180;
  const dG = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dL / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dG / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}