// src/services/usersService.js
import api from './apiClient';
import { supabase } from './supabaseClient';

export const usersService = {

  async getMe() {
  const user = await api.get('/auth/me');
  if (!user?.id) return user;

  console.log('getMe — role:', user.role, '| id:', user.id);

  const { data: location, error: locErr } = await supabase
    .from('map_locations')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  console.log('map_locations query result:', { location, locErr });

  let recyclerProfile = null;
  if (user.role === 'recycler') {
    const { data: rp, error: rpErr } = await supabase
      .from('recycler_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    console.log('recycler_profiles query result:', { rp, rpErr });

    recyclerProfile = rp ? {
      ...rp,
      address:     location?.address     || '',
      city:        location?.city        || '',
      lat:         location?.lat         || null,
      lng:         location?.lng         || null,
      description: location?.description || '',
      phone:       location?.phone       || rp.phone || '',
      website:     location?.website     || null,
    } : null;
  }

  const result = {
    ...user,
    map_locations:     user.role !== 'recycler' ? (location || null) : null,
    recycler_profiles: recyclerProfile,
  };

  console.log('getMe — final result:', result);
  return result;
},
  async updateMe(payload) {
    return api.patch('/users/me', payload);
  },

  async upsertRecyclerProfile(payload) {
    const { data, error } = await supabase
      .from('recycler_profiles')
      .upsert(payload, { onConflict: 'user_id', ignoreDuplicates: false })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.upload('/users/me/avatar', formData);
  },
    deleteAccount: async () => {
    try {
      const response = await api.delete('/users/account'); // Adjust endpoint as needed
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete account');
    }
  },
};
