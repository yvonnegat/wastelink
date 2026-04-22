import React from 'react';
import { useVision } from '../../hooks/useVision';
import { Button, Alert, Badge } from '../common';
import Icon from '../common/Icon';

function ConfidenceBar({ label, value, low }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: 'var(--text2)' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: low ? '#C06010' : 'var(--olive-deep)' }}>
          {value}%
        </span>
      </div>
      <div className="conf-bar">
        <div className={`conf-fill${low ? ' low' : ''}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function VisionModule() {
  const { result, preview, loading, error, analyse, setImagePreview, clear } = useVision();
  const fileRef = React.useRef();

  async function handleFile(f) {
    if (!f) return;
    await setImagePreview(f);
  }

  async function handleAnalyse() {
    const file = fileRef.current?.files?.[0];
    if (!file && !preview) return;
    // Re-create File from input ref if available
    if (fileRef.current?.files?.[0]) {
      await analyse(fileRef.current.files[0]);
    } else {
      // Preview already set — simulate analysis on mock
      await analyse(new File([], 'mock.jpg', { type: 'image/jpeg' }));
    }
  }

  const isLow = result && result.confidence < 70;

  return (
    <div className="page">
      <div className="section-hd" style={{ marginBottom: 20 }}>
        <div>
          <div className="page-heading">AI Vision Verification</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>
            Upload a photo to automatically classify waste type and quality
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Upload panel */}
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Upload Waste Image</div>

          <div
            className="upload-zone"
            style={{ marginBottom: 16 }}
            onClick={() => fileRef.current.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files[0])}
            />
            {preview ? (
              <div>
                <img src={preview} alt="Waste preview" className="img-preview" />
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--olive)' }}>
                  Click to replace image
                </div>
              </div>
            ) : (
              <>
                <div className="upload-icon">
                  <Icon name="camera" size={22} color="var(--olive-deep)" />
                </div>
                <div className="upload-text">Click to upload image</div>
                <div className="upload-sub">JPEG, PNG · max 10MB</div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Button
              variant="primary"
              full
              disabled={!preview || loading}
              loading={loading}
              onClick={handleAnalyse}
            >
              {loading ? 'Analysing with AI…' : 'Analyse Image'}
            </Button>
            {preview && (
              <Button variant="secondary" onClick={clear}>Clear</Button>
            )}
          </div>

          <Alert type="info" style={{ marginTop: 14 }}>
            For best results: place waste on a flat, well-lit surface and take the photo from above.
          </Alert>
        </div>

        {/* Results panel */}
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Detection Results</div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div className="loading-spinner" style={{ margin: '0 auto 12px', width: 28, height: 28 }} />
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>Running computer vision analysis…</div>
            </div>
          )}

          {error && !loading && (
            <Alert type="warn">{error}</Alert>
          )}

          {!loading && !result && !error && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text3)', fontSize: 13 }}>
              <Icon name="eye" size={36} color="var(--border2)" />
              <div style={{ marginTop: 12 }}>Upload an image and click Analyse to see results</div>
            </div>
          )}

          {result && !loading && (
            <>
              <div className="vision-card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                      Detected Type
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--olive-deep)' }}>
                      {result.detectedType} — {result.detectedSubtype}
                    </div>
                  </div>
                  <Badge color={isLow ? 'yellow' : 'green'} dot>
                    {isLow ? 'Low Confidence' : 'Verified ✓'}
                  </Badge>
                </div>

                <ConfidenceBar label="Detection Confidence" value={result.confidence} low={result.confidence < 70} />
                <ConfidenceBar label="Quality Score"        value={result.qualityScore} low={result.qualityScore < 70} />
                <ConfidenceBar label="Consistency Score"   value={result.consistencyScore} low={false} />
              </div>

              <Alert type={isLow ? 'warn' : 'success'}>
                {result.notes}
              </Alert>

              {!isLow && (
                <div style={{ marginTop: 14 }}>
                  <Button variant="primary" full>
                    Proceed to Pricing →
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
