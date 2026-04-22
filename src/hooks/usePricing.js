import { useState, useCallback } from 'react';
import { getPrice, getMarketRates } from '../services/pricingService';

/**
 * usePricing
 * Manages ML pricing state and API calls.
 *
 * @example
 * const { pricing, loading, error, fetchPrice, acceptPrice } = usePricing();
 * await fetchPrice({ wasteType: 'Plastic', quantity: 50, quality: 80 });
 */
export function usePricing() {
  const [pricing, setPricing]     = useState(null);
  const [rates, setRates]         = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [accepted, setAccepted]   = useState(false);

  const fetchPrice = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    setAccepted(false);
    try {
      const result = await getPrice(params);
      setPricing(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getMarketRates();
      setRates(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const acceptPrice = useCallback(() => {
    if (pricing) setAccepted(true);
  }, [pricing]);

  const reset = useCallback(() => {
    setPricing(null);
    setAccepted(false);
    setError(null);
  }, []);

  return { pricing, rates, loading, error, accepted, fetchPrice, fetchRates, acceptPrice, reset };
}
