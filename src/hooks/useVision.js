import { useState, useCallback } from 'react';
import { analyseBatch, analyseImage } from '../services/visionService';

/**
 * useVision
 * Manages computer vision analysis state.
 *
 * Supports both single and batch image analysis.
 * Batch analysis (3-5 images from different angles) gives
 * better confidence scores through SM3 consistency analysis.
 *
 * @example
 * const { result, loading, error, analyse, clear } = useVision();
 *
 * // Single image
 * await analyse([file], 'Plastic', 'PET Bottles');
 *
 * // Batch (recommended)
 * await analyse([file1, file2, file3], 'Glass', 'Clear Glass');
 */
export function useVision() {
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  /**
   * Run CV analysis on one or more images.
   *
   * @param {File|File[]} files            - Single file or array of files
   * @param {string}      declaredCategory - e.g. 'Glass', 'Plastic'
   * @param {string}      declaredSubcategory - e.g. 'Clear Glass'
   */
  const analyse = useCallback(async (
    files,
    declaredCategory    = null,
    declaredSubcategory = null,
  ) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Normalise — accept single File or array of Files
      const fileArray = Array.isArray(files) ? files : [files];

      if (!fileArray.length) {
        throw new Error('No images provided for analysis.');
      }

      let data;

      if (fileArray.length === 1) {
        // Single image — use /analyse endpoint
        data = await analyseImage(
          fileArray[0],
          declaredCategory,
          declaredSubcategory,
        );
      } else {
        // Multiple images — use /analyse/batch endpoint
        // This enables SM3 batch consistency analysis
        data = await analyseBatch(
          fileArray,
          declaredCategory,
          declaredSubcategory,
        );
      }

      setResult(data);
    } catch (err) {
      setError(err.message || 'Vision analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    result,
    loading,
    error,
    analyse,
    clear,
  };
}