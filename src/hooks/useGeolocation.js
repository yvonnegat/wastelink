import { useState, useCallback, useEffect } from 'react';
import { getUserLocation, getNearbyRecyclers } from '../services/geoService';
import { MAP_DEFAULTS } from '../data/mockData';

/**
 * useGeolocation
 * Manages user location, nearby recyclers, and map state.
 *
 * @example
 * const { location, recyclers, loading, error, requestLocation, filterByType } = useGeolocation();
 */
export function useGeolocation() {
  const [location, setLocation]     = useState({
    lat: MAP_DEFAULTS.center[0],
    lng: MAP_DEFAULTS.center[1],
  });
  const [recyclers, setRecyclers]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [activeFilter, setActiveFilter] = useState('All Types');
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Load all recyclers on mount
  useEffect(() => {
    loadRecyclers(location, []);
  }, []); // eslint-disable-line

  const loadRecyclers = useCallback(async (loc, wasteTypes) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getNearbyRecyclers({
        lat: loc.lat,
        lng: loc.lng,
        radiusKm: 50,
        wasteTypes,
      });
      setRecyclers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const requestLocation = useCallback(async () => {
    setLoading(true);
    try {
      const loc = await getUserLocation();
      setLocation(loc);
      await loadRecyclers(loc, activeFilter === 'All Types' ? [] : [activeFilter]);
    } catch (err) {
      setPermissionDenied(true);
      setError('Location access denied. Showing all Kenya recyclers.');
    } finally {
      setLoading(false);
    }
  }, [activeFilter, loadRecyclers]);

  const filterByType = useCallback((type) => {
    setActiveFilter(type);
    const types = type === 'All Types' ? [] : [type];
    loadRecyclers(location, types);
  }, [location, loadRecyclers]);

  return {
    location,
    recyclers,
    loading,
    error,
    activeFilter,
    permissionDenied,
    requestLocation,
    filterByType,
  };
}
