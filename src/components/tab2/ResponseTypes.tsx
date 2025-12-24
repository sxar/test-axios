import { useState } from 'react';
import { Settings, CheckCircle } from 'lucide-react';
import { DisplayCard } from '../shared/DisplayCard';
import axios, { AxiosResponse } from 'axios';

type ResponseType = 'json' | 'text' | 'arraybuffer' | 'blob';

export default function ResponseTypes() {
  const [showSetup, setShowSetup] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [responseType, setResponseType] = useState<ResponseType>('json');
  const [endpoint, setEndpoint] = useState('/api/users');
  const [response, setResponse] = useState<AxiosResponse | null>(null);
  const [status, setStatus] = useState<string>('idle');
  const [error, setError] = useState<string>('');
  const [blobUrl, setBlobUrl] = useState<string>('');

  const endpointOptions = [
    { value: '/api/users', label: '/api/users (JSON)', type: 'json' },
    { value: '/api/text', label: '/api/text (Plain Text)', type: 'text' },
    { value: '/api/wrapped', label: '/api/wrapped (Nested JSON)', type: 'json' },
    { value: '/api/download/file.pdf', label: '/api/download/file.pdf (Binary)', type: 'blob' }
  ];

  const fetchData = async () => {
    setStatus('loading');
    setError('');
    setResponse(null);
    setBlobUrl('');

    try {
      const res = await axios.get(`http://localhost:3001${endpoint}`, {
        responseType: responseType
      });

      setResponse(res);
      setStatus('success');

      if (responseType === 'blob' && res.data) {
        const url = URL.createObjectURL(res.data);
        setBlobUrl(url);
      }
    } catch (err: any) {
      setError(err.message);
      setStatus('error');
    }
  };

  const renderResponseData = () => {
    if (!response) return null;

    if (responseType === 'json') {
      return (
        <pre style={{
          background: 'var(--bg-secondary)',
          padding: '1rem',
          borderRadius: 'var(--border-radius)',
          overflow: 'auto',
          maxHeight: '400px',
          fontSize: '0.875rem'
        }}>
          {JSON.stringify(response.data, null, 2)}
        </pre>
      );
    }

    if (responseType === 'text') {
      return (
        <div style={{
          background: 'var(--bg-secondary)',
          padding: '1rem',
          borderRadius: 'var(--border-radius)',
          fontFamily: 'monospace',
          fontSize: '0.875rem',
          whiteSpace: 'pre-wrap'
        }}>
          {response.data}
        </div>
      );
    }

    if (responseType === 'arraybuffer') {
      const buffer = response.data as ArrayBuffer;
      const uint8Array = new Uint8Array(buffer);
      const bytes = Array.from(uint8Array.slice(0, 100));
      const hexDump = bytes.map(b => b.toString(16).padStart(2, '0')).join(' ');

      return (
        <div>
          <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            <strong>ArrayBuffer Size:</strong> {buffer.byteLength} bytes
          </p>
          <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
            First 100 bytes (hex):
          </p>
          <pre style={{
            background: 'var(--bg-secondary)',
            padding: '1rem',
            borderRadius: 'var(--border-radius)',
            overflow: 'auto',
            fontSize: '0.75rem',
            fontFamily: 'monospace'
          }}>
            {hexDump}
          </pre>
        </div>
      );
    }

    if (responseType === 'blob') {
      const blob = response.data as Blob;
      return (
        <div>
          <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            <strong>Type:</strong> {blob.type || 'unknown'}
          </p>
          <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            <strong>Size:</strong> {blob.size} bytes
          </p>
          {blobUrl && (
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = 'download';
                link.click();
              }}
              data-testid="download-blob"
              style={{ marginTop: '0.5rem' }}
            >
              Download File
            </button>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <section className="test-section">
      <header className="test-section-header">
        <h2 className="test-section-title">Response Types & Transformation</h2>
        <div className="info-buttons-group">
          <button
            className={`info-button ${showSetup ? 'active' : ''}`}
            onClick={() => setShowSetup(!showSetup)}
            data-testid="toggle-setup"
          >
            <Settings size={20} />
          </button>
          <button
            className={`info-button ${showTests ? 'active' : ''}`}
            onClick={() => setShowTests(!showTests)}
            data-testid="toggle-tests"
          >
            <CheckCircle size={20} />
          </button>
        </div>
      </header>

      {showSetup && (
        <div className="setup-section">
          <h4>⚙️ SETUP</h4>
          <ul>
            <li><strong>Response Type Selector</strong> → <code>responseType: 'json' | 'text' | 'arraybuffer' | 'blob'</code></li>
            <li><strong>JSON</strong> → Automatically parsed to JavaScript object (default)</li>
            <li><strong>Text</strong> → Returns raw string</li>
            <li><strong>ArrayBuffer</strong> → Returns binary data as ArrayBuffer</li>
            <li><strong>Blob</strong> → Returns file-like Blob object (for downloads)</li>
          </ul>
        </div>
      )}

      {showTests && (
        <div className="what-this-tests">
          <h4>✓ WHAT THIS TESTS</h4>
          <ul>
            <li>✅ JSON response - Automatic parsing (default)</li>
            <li>✅ Text response - Plain string</li>
            <li>✅ ArrayBuffer response - Binary data</li>
            <li>✅ Blob response - File-like objects</li>
            <li>✅ Content-Type handling - Automatic detection and parsing</li>
            <li>✅ File downloads - Blob to download conversion</li>
          </ul>
        </div>
      )}

      <DisplayCard title="Response Type Configuration">
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Response Type:</label>
          <div className="button-group">
            <button
              onClick={() => setResponseType('json')}
              data-testid="type-json"
              style={{
                background: responseType === 'json' ? 'var(--primary-color)' : 'white',
                color: responseType === 'json' ? 'white' : 'var(--text-primary)'
              }}
            >
              JSON
            </button>
            <button
              onClick={() => setResponseType('text')}
              data-testid="type-text"
              style={{
                background: responseType === 'text' ? 'var(--primary-color)' : 'white',
                color: responseType === 'text' ? 'white' : 'var(--text-primary)'
              }}
            >
              Text
            </button>
            <button
              onClick={() => setResponseType('arraybuffer')}
              data-testid="type-arraybuffer"
              style={{
                background: responseType === 'arraybuffer' ? 'var(--primary-color)' : 'white',
                color: responseType === 'arraybuffer' ? 'white' : 'var(--text-primary)'
              }}
            >
              ArrayBuffer
            </button>
            <button
              onClick={() => setResponseType('blob')}
              data-testid="type-blob"
              style={{
                background: responseType === 'blob' ? 'var(--primary-color)' : 'white',
                color: responseType === 'blob' ? 'white' : 'var(--text-primary)'
              }}
            >
              Blob
            </button>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Select Endpoint:</label>
          <select
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            data-testid="endpoint-selector"
            style={{
              width: '100%',
              maxWidth: '500px',
              padding: '0.5rem',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius)',
              fontSize: '0.875rem'
            }}
          >
            {endpointOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <button onClick={fetchData} data-testid="fetch-data" disabled={status === 'loading'}>
          {status === 'loading' ? 'Fetching...' : 'Fetch Data'}
        </button>
      </DisplayCard>

      {(response || error) && (
        <DisplayCard title="Response">
          <div>
            <span className={`status-badge status-${status}`}>
              {status === 'success' ? `${response?.status} ${response?.statusText}` : 'Error'}
            </span>
          </div>

          {error && (
            <div style={{ color: 'var(--error-color)', fontWeight: 600 }}>
              Error: {error}
            </div>
          )}

          {response && (
            <>
              <div style={{ marginTop: '1rem' }}>
                <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
                  Response Type: <code>{responseType}</code>
                </h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Content-Type: {response.headers['content-type'] || 'unknown'}
                </p>
              </div>

              <div>
                <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Response Data:</h4>
                {renderResponseData()}
              </div>
            </>
          )}
        </DisplayCard>
      )}

      <DisplayCard title="Response Type Guide">
        <div style={{ fontSize: '0.875rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Type</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Description</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Use Case</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.5rem' }}><code>json</code></td>
                <td style={{ padding: '0.5rem' }}>Automatically parsed JSON</td>
                <td style={{ padding: '0.5rem' }}>API responses (default)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.5rem' }}><code>text</code></td>
                <td style={{ padding: '0.5rem' }}>Plain text string</td>
                <td style={{ padding: '0.5rem' }}>HTML, CSV, plain text</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.5rem' }}><code>arraybuffer</code></td>
                <td style={{ padding: '0.5rem' }}>Raw binary data</td>
                <td style={{ padding: '0.5rem' }}>Image processing, binary files</td>
              </tr>
              <tr>
                <td style={{ padding: '0.5rem' }}><code>blob</code></td>
                <td style={{ padding: '0.5rem' }}>File-like object</td>
                <td style={{ padding: '0.5rem' }}>File downloads, images</td>
              </tr>
            </tbody>
          </table>

          <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem', fontWeight: 600 }}>Code Example:</h4>
          <pre style={{
            background: 'var(--bg-secondary)',
            padding: '1rem',
            borderRadius: 'var(--border-radius)',
            overflow: 'auto',
            fontSize: '0.75rem'
          }}>
{`// JSON (default)
const res = await axios.get('/api/users');
console.log(res.data); // Object

// Text
const res = await axios.get('/api/text', {
  responseType: 'text'
});
console.log(res.data); // String

// Blob (for downloads)
const res = await axios.get('/api/file', {
  responseType: 'blob'
});
const url = URL.createObjectURL(res.data);`}
          </pre>
        </div>
      </DisplayCard>
    </section>
  );
}
