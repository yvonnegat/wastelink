import { useState, useCallback } from 'react';
import { analyseImage, fileToBase64 } from '../services/visionService';

/**
 * useVision
 * Manages computer vision analysis state.
 *
 * @example
 * const { result, preview, loading, error, analyse, clear } = useVision();
 * await analyse(fileObject);
 */
export function useVision() {
  const [result, setResult]   = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const analyse = useCallback(async (file) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // Generate preview URL for the UI
      const base64 = await fileToBase64(file);
      setPreview(base64);

      // Call vision API
      const data = await analyseImage(file);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const setImagePreview = useCallback(async (file) => {
    const base64 = await fileToBase64(file);
    setPreview(base64);
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setPreview(null);
    setError(null);
  }, []);

  return { result, preview, loading, error, analyse, setImagePreview, clear };
}
