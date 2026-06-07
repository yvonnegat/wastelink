import React from 'react';
import { useVision } from '../../hooks/useVision';
import { Button, Alert, Badge } from '../common';
import Icon from '../common/Icon';

// ── Category options matching the backend exactly ─────────────────
const CATEGORIES = ['Glass', 'Metal', 'Paper', 'Plastic', 'Other'];

const SUBCATEGORIES = {
  Plastic: ['PET Bottles', 'HDPE Containers', 'PVC', 'General Plastic'],
  Metal:   ['Aluminium',   'Copper',           'Steel', 'General Metal'],
  Paper:   ['Cardboard',   'Office Paper',     'Newspaper', 'General Paper'],
  Glass:   ['Clear Glass', 'Coloured Glass',   'General Glass'],
  Other:   ['Mixed Waste', 'Unclassified'],
};

// ── Verdict config — maps API verdict to UI colours and labels ────
const VERDICT_CONFIG = {
  verified: {
    badgeColor: 'green',
    badgeText:  'Verified ✓',
    alertType:  'success',
    canProceed: true,
  },
  low_confidence: {
    badgeColor: 'yellow',
    badgeText:  'Low Confidence',
    alertType:  'warn',
    canProceed: false,
  },
  rejected: {
    badgeColor: 'red',
    badgeText:  'Manual Review Required',
    alertType:  'warn',
    canProceed: false,
  },
};

// ── Confidence bar component ───────────────────────────────────────
function ConfidenceBar({ label, value, low }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 4,
      }}>
        <span style={{ fontSize: 13, color: 'var(--text2)' }}>{label}</span>
        <span style={{
          fontSize: 13,
          fontWeight: 600,
          color: low ? '#C06010' : 'var(--olive-deep)',
        }}>
          {value}%
        </span>
      </div>
      <div className="conf-bar">
        <div
          className={`conf-fill${low ? ' low' : ''}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// ── Image thumbnail row ────────────────────────────────────────────
function ImageThumbnails({ previews, onRemove }) {
  if (!previews.length) return null;
  return (
    <div style={{
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap',
      marginTop: 10,
    }}>
      {previews.map((src, i) => (
        <div key={i} style={{ position: 'relative' }}>
          <img
            src={src}
            alt={`Preview ${i + 1}`}
            style={{
              width: 64,
              height: 64,
              objectFit: 'cover',
              borderRadius: 8,
              border: '2px solid var(--border2)',
            }}
          />
          <button
            onClick={() => onRemove(i)}
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              background: '#e53e3e',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: 18,
              height: 18,
              fontSize: 10,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────
export default function VisionModule({
  // Optional props — if used inside a listing form, pass these in
  // so the declared category flows through to the API automatically
  declaredCategory:    externalCategory    = null,
  declaredSubcategory: externalSubcategory = null,
  onVerified = null,   // callback when verdict is 'verified'
}) {
  const {
    result, loading, error,
    analyse, clear,
  } = useVision();

  const fileRef = React.useRef();

  // Local state
  const [files,    setFiles]    = React.useState([]);   // File objects
  const [previews, setPreviews] = React.useState([]);   // base64 previews

  // Category selection — use external props if inside listing form,
  // otherwise let the user select here
  const [localCategory,    setLocalCategory]    = React.useState('');
  const [localSubcategory, setLocalSubcategory] = React.useState('');

  const category    = externalCategory    || localCategory    || null;
  const subcategory = externalSubcategory || localSubcategory || null;

  // ── File handling ──────────────────────────────────────────────

  async function handleFilesSelected(selectedFiles) {
    const newFiles = Array.from(selectedFiles);
    if (!newFiles.length) return;

    // Limit to 10 total
    const combined = [...files, ...newFiles].slice(0, 10);
    setFiles(combined);

    // Generate previews
    const newPreviews = await Promise.all(
      combined.map(f => fileToBase64(f))
    );
    setPreviews(newPreviews);
  }

  function handleRemoveImage(index) {
    const newFiles    = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviews(newPreviews);
  }

  function handleClear() {
    setFiles([]);
    setPreviews([]);
    setLocalCategory('');
    setLocalSubcategory('');
    clear();
  }

  // ── Analysis ───────────────────────────────────────────────────

  async function handleAnalyse() {
    if (!files.length) return;

    await analyse(files, category, subcategory);
  }

  // Call onVerified callback when listing is approved
  React.useEffect(() => {
    if (result?.verdict === 'verified' && onVerified) {
      onVerified(result);
    }
  }, [result, onVerified]);

  // ── Verdict config ─────────────────────────────────────────────
  const verdictConfig = result
    ? (VERDICT_CONFIG[result.verdict] || VERDICT_CONFIG.low_confidence)
    : null;

  

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="page">
      <div className="section-hd" style={{ marginBottom: 20 }}>
        <div>
          <div className="page-heading">AI Vision Verification</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>
            Upload photos from different angles to classify waste type and verify quality
          </div>
        </div>
      </div>

      <div className="grid-2">

        {/* ── Upload panel ─────────────────────────────────────── */}
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>
            Upload Waste Images
          </div>

          {/* Category selector — hidden if parent passes category */}
          {!externalCategory && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>
                Material Category *
              </label>
              <select
                value={localCategory}
                onChange={e => {
                  setLocalCategory(e.target.value);
                  setLocalSubcategory('');
                }}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid var(--border2)',
                  fontSize: 13,
                  marginBottom: 8,
                }}
              >
                <option value="">Select category…</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {localCategory && (
                <select
                  value={localSubcategory}
                  onChange={e => setLocalSubcategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--border2)',
                    fontSize: 13,
                  }}
                >
                  <option value="">Select sub-type…</option>
                  {(SUBCATEGORIES[localCategory] || []).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Drop zone */}
          <div
            className="upload-zone"
            style={{ marginBottom: 12 }}
            onClick={() => fileRef.current.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={e => handleFilesSelected(e.target.files)}
            />

            {previews.length === 0 ? (
              <>
                <div className="upload-icon">
                  <Icon name="camera" size={22} color="var(--olive-deep)" />
                </div>
                <div className="upload-text">Click to upload images</div>
                <div className="upload-sub">
                  Upload 3–5 photos from different angles · JPEG, PNG · max 10 images
                </div>
              </>
            ) : (
              <div>
                <div style={{ fontSize: 12, color: 'var(--olive)', marginBottom: 6 }}>
                  {files.length} image{files.length > 1 ? 's' : ''} selected
                  {files.length < 10 && ' · Click to add more'}
                </div>
                <ImageThumbnails
                  previews={previews}
                  onRemove={handleRemoveImage}
                />
              </div>
            )}
          </div>

          {/* Photo guideline tip */}
          {previews.length === 0 && (
            <div style={{
              fontSize: 12,
              color: 'var(--text3)',
              background: 'var(--surface2)',
              borderRadius: 8,
              padding: '10px 12px',
              marginBottom: 12,
            }}>
              📸 <strong>Photo tips for best results:</strong>
              <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                <li>Place material on a dark contrasting background</li>
                <li>Fill at least 70% of the frame with the material</li>
                <li>Upload 3–5 photos from different angles</li>
                <li>Avoid backlighting and flash glare</li>
              </ul>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <Button
              variant="primary"
              full
              disabled={!files.length || loading || (!category && !externalCategory)}
              loading={loading}
              onClick={handleAnalyse}
            >
              {loading
                ? 'Analysing with AI…'
                : files.length > 1
                  ? `Analyse ${files.length} Images`
                  : 'Analyse Image'}
            </Button>
            {(files.length > 0 || result) && (
              <Button variant="secondary" onClick={handleClear}>
                Clear
              </Button>
            )}
          </div>

          {/* Prompt to select category */}
          {!category && !externalCategory && (
            <Alert type="info" style={{ marginTop: 10 }}>
              Please select a material category before analysing.
            </Alert>
          )}
        </div>

        {/* ── Results panel ─────────────────────────────────────── */}
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>
            Detection Results
          </div>

          {/* Loading state */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div className="loading-spinner" style={{
                margin: '0 auto 12px',
                width: 28,
                height: 28,
              }} />
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>
                Running AI verification across {files.length} image{files.length > 1 ? 's' : ''}…
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>
                SM1 → SM2 → SM3 → SM4 pipeline
              </div>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <Alert type="warn">{error}</Alert>
          )}

          {/* Empty state */}
          {!loading && !result && !error && (
            <div style={{
              textAlign: 'center',
              padding: '32px 0',
              color: 'var(--text3)',
              fontSize: 13,
            }}>
              <Icon name="eye" size={36} color="var(--border2)" />
              <div style={{ marginTop: 12 }}>
                Upload images and click Analyse to see results
              </div>
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <>
              <div className="vision-card" style={{ marginBottom: 16 }}>

                {/* Header row — detected type + verdict badge */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 14,
                }}>
                  <div>
                    <div style={{
                      fontSize: 11,
                      color: 'var(--text3)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: 4,
                    }}>
                      Detected Type
                    </div>
                    <div style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: 'var(--olive-deep)',
                    }}>
                      {result.detectedType} — {result.detectedSubtype}
                    </div>
                  </div>
                  <Badge color={verdictConfig.badgeColor} dot>
                    {verdictConfig.badgeText}
                  </Badge>
                </div>

                {/* Confidence bars */}
                <ConfidenceBar
                  label="Detection Confidence"
                  value={result.confidence}
                  low={result.confidence < 65}
                />
                <ConfidenceBar
                  label="Quality Score"
                  value={result.qualityScore}
                  low={result.qualityScore < 65}
                />
                <ConfidenceBar
                  label="Batch Consistency"
                  value={result.consistencyScore}
                  low={result.consistencyScore < 65}
                />

                {/* Raw labels */}
                {result.rawLabels?.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>
                      Top predictions
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {result.rawLabels.map((label, i) => (
                        <span key={i} style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 12,
                          background: i === 0 ? 'var(--olive-light)' : 'var(--surface2)',
                          color: i === 0 ? 'var(--olive-deep)' : 'var(--text3)',
                          fontWeight: i === 0 ? 600 : 400,
                        }}>
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Notes from API */}
              <Alert type={verdictConfig.alertType}>
                {result.notes}
              </Alert>

              {/* Proceed button — only shown when verified */}
              {verdictConfig.canProceed && (
                <div style={{ marginTop: 14 }}>
                  <Button variant="primary" full>
                    Proceed to Pricing →
                  </Button>
                </div>
              )}

              {/* Retry suggestion for low confidence */}
              {result.verdict === 'low_confidence' && (
                <div style={{
                  marginTop: 10,
                  fontSize: 12,
                  color: 'var(--text3)',
                  textAlign: 'center',
                }}>
                  Try adding more photos from different angles for a better result.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helper ─────────────────────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}