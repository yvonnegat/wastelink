import React, { useState, useMemo } from 'react';
import debounce from 'lodash.debounce';

export default function LocationAutocomplete({
  value,
  onSelect,
  placeholder = 'Search location...',
}) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchLocations = async (query) => {
  if (!query || query.length < 2) {
    setResults([]);
    return;
  }
  try {
    setLoading(true);
    const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete');
    url.searchParams.set('text', query);
    url.searchParams.set('apiKey', process.env.REACT_APP_GEOAPIFY_KEY);
    url.searchParams.set('filter', 'countrycode:ke');
    url.searchParams.set('limit', '6');
    url.searchParams.set('lang', 'en');

    const data = await fetch(url.toString()).then(r => r.json());

    const formatted = (data.features || []).map(f => ({
      label:   f.properties.formatted,
      lat:     f.geometry.coordinates[1],
      lng:     f.geometry.coordinates[0],
      city:    f.properties.city || f.properties.county || '',
      address: f.properties.formatted,
    }));

    setResults(formatted);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};

  const debouncedSearch = useMemo(
    () => debounce(searchLocations, 200),
    []
  );

  return (
    <div style={{ position: 'relative' }}>
      <input
        className="form-input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onSelect(null, e.target.value);
          debouncedSearch(e.target.value);
        }}
      />

      {loading && (
        <div
          style={{
            marginTop: 8,
            fontSize: 13,
            color: 'var(--text3)',
          }}
        >
          Finding locations...
        </div>
      )}

      {results.length > 0 && (
        <div
          style={{
            position: 'absolute',
            zIndex: 1000,
            width: '100%',
            background: 'white',
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid #ddd',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            marginTop: 4,
          }}
        >
          {results.map((r, idx) => (
            <div
              key={idx}
              onClick={() => {
                onSelect(r, r.label);
                setResults([]);
              }}
              style={{
                padding: 14,
                cursor: 'pointer',
                borderBottom: '1px solid #f3f3f3',
                fontSize: 14,
              }}
            >
              {r.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}