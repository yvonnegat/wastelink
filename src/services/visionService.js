/**
 * visionService.js
 * Handles image upload and AI waste classification.
 * Replace BASE_URL with your real computer vision endpoint.
 */

const BASE_URL = process.env.REACT_APP_VISION_API_URL || '';

/**
 * Analyse a waste image using computer vision.
 * @param {File|string} imageData - File object or base64 string
 * @returns {Promise<VisionResult>}
 */
export async function analyseImage(imageData) {
  if (!BASE_URL) {
    // Simulate network delay then return mock result
    await delay(2200);
    return mockVisionResult();
  }

  const formData = new FormData();
  if (imageData instanceof File) {
    formData.append('image', imageData);
  } else {
    // base64 string
    formData.append('imageBase64', imageData);
  }

  const response = await fetch(`${BASE_URL}/analyse`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Vision API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Convert a File to base64 string for preview + API transmission.
 * @param {File} file
 * @returns {Promise<string>} base64 data URL
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

// ── MOCK ──────────────────────────────────────────────────────────
function mockVisionResult() {
  return {
    detectedType: 'Plastic',
    detectedSubtype: 'PET Bottles',
    confidence: 88,
    qualityScore: 76,
    consistencyScore: 82,
    verdict: 'verified',          // 'verified' | 'low_confidence' | 'rejected'
    notes: 'Clear PET plastic detected. Minor contamination visible — rinsing recommended before collection.',
    boundingBoxes: [],            // real API returns bounding box coords
    rawLabels: ['plastic', 'transparent', 'bottles', 'PET'],
  };
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @typedef {Object} VisionResult
 * @property {string}   detectedType
 * @property {string}   detectedSubtype
 * @property {number}   confidence        0–100
 * @property {number}   qualityScore      0–100
 * @property {number}   consistencyScore  0–100
 * @property {string}   verdict
 * @property {string}   notes
 * @property {Array}    boundingBoxes
 * @property {string[]} rawLabels
 */
