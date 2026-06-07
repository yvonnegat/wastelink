/**
 * visionService.js
 * Handles image upload and AI waste classification.
 *
 * Connects to the Waste Link CV FastAPI backend.
 * Set REACT_APP_VISION_API_URL in your .env file:
 *
 *   Local:      REACT_APP_VISION_API_URL=http://localhost:8000
 *   Production: REACT_APP_VISION_API_URL=https://your-render-url.onrender.com
 */

const BASE_URL = process.env.REACT_APP_VISION_API_URL || '';

// ── Single image analysis ─────────────────────────────────────────

/**
 * Analyse a single waste image using computer vision.
 * Use analyseBatch() for better accuracy with multiple images.
 *
 * @param {File} imageFile           - Image file from input
 * @param {string} declaredCategory  - e.g. 'Glass', 'Plastic', 'Metal'
 * @param {string} declaredSubcategory - e.g. 'PET Bottles', 'Clear Glass'
 * @returns {Promise<VisionResult>}
 */
export async function analyseImage(
  imageFile,
  declaredCategory = null,
  declaredSubcategory = null
) {
  if (!BASE_URL) {
    await delay(2200);
    return mockVisionResult(declaredCategory);
  }

  const formData = new FormData();
  formData.append('image', imageFile);

  if (declaredCategory) {
    formData.append('declared_category', declaredCategory);
  }
  if (declaredSubcategory) {
    formData.append('declared_subcategory', declaredSubcategory);
  }

  const response = await fetch(`${BASE_URL}/analyse`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Vision API error: ${response.status}`);
  }

  return response.json();
}

// ── Batch image analysis (recommended) ───────────────────────────

/**
 * Analyse multiple images of the same material from different angles.
 * Enables SM3 batch consistency analysis for better confidence scores.
 *
 * @param {File[]} imageFiles        - Array of image files (2–10)
 * @param {string} declaredCategory  - e.g. 'Glass', 'Plastic', 'Metal'
 * @param {string} declaredSubcategory - e.g. 'PET Bottles', 'Clear Glass'
 * @returns {Promise<VisionResult>}
 */
export async function analyseBatch(
  imageFiles,
  declaredCategory = null,
  declaredSubcategory = null
) {
  if (!BASE_URL) {
    await delay(2800);
    return mockVisionResult(declaredCategory);
  }

  const formData = new FormData();

  // Append each image with its named slot (image1, image2, etc.)
  // This matches the FastAPI batch endpoint parameter names
  imageFiles.forEach((file, index) => {
    formData.append(`image${index + 1}`, file);
  });

  if (declaredCategory) {
    formData.append('declared_category', declaredCategory);
  }
  if (declaredSubcategory) {
    formData.append('declared_subcategory', declaredSubcategory);
  }

  const response = await fetch(`${BASE_URL}/analyse/batch`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Vision API error: ${response.status}`);
  }

  return response.json();
}

// ── Utilities ─────────────────────────────────────────────────────

/**
 * Convert a File to base64 string for image preview.
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

/**
 * Check if the CV API is reachable.
 * Call this on component mount to show a warning if offline.
 * @returns {Promise<boolean>}
 */
export async function checkApiHealth() {
  if (!BASE_URL) return false;
  try {
    const response = await fetch(`${BASE_URL}/`, { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
}

// ── Mock ──────────────────────────────────────────────────────────

/**
 * Mock result used when REACT_APP_VISION_API_URL is not set.
 * Mirrors the exact shape returned by the real FastAPI backend.
 */
function mockVisionResult(declaredCategory = null) {
  const category = declaredCategory || 'Plastic';
  const subtypes = {
    Plastic: 'PET Bottles',
    Metal:   'Aluminium',
    Paper:   'Cardboard',
    Glass:   'Clear Glass',
    Other:   'Mixed Waste',
  };

  return {
    detectedType:     category,
    detectedSubtype:  subtypes[category] || 'General',
    confidence:       88.0,
    qualityScore:     76.0,
    consistencyScore: 82.0,
    verdict:          'verified',
    notes:            `${category} detected with high confidence (88.0%). Listing approved for publication.`,
    boundingBoxes:    [],
    rawLabels:        [category, 'Other', 'Glass'],
  };
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Types ─────────────────────────────────────────────────────────

/**
 * @typedef {Object} VisionResult
 * @property {string}   detectedType       - Top-level category
 * @property {string}   detectedSubtype    - Sub-category
 * @property {number}   confidence         - SM4 confidence C (0–100)
 * @property {number}   qualityScore       - Image quality score (0–100)
 * @property {number}   consistencyScore   - SM3 consistency S (0–100)
 * @property {string}   verdict            - verified | low_confidence | rejected
 * @property {string}   notes              - Human-readable explanation
 * @property {Array}    boundingBoxes      - Reserved for future object detection
 * @property {string[]} rawLabels          - Top-3 predicted categories
 */