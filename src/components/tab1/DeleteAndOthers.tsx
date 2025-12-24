import { useState } from 'react';
import { Settings, CheckCircle } from 'lucide-react';
import { DisplayCard } from '../shared/DisplayCard';
import axios from 'axios';

type HttpMethod = 'DELETE' | 'HEAD' | 'OPTIONS';

export default function DeleteAndOthers() {
  const [showSetup, setShowSetup] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [method, setMethod] = useState<HttpMethod>('DELETE');
  const [url, setUrl] = useState('/api/users/1');
  const [response, setResponse] = useState<any>(null);
  const [status, setStatus] = useState<string>('idle');
  const [error, setError] = useState<string>('');

  const sendRequest = async () => {
    setStatus('loading');
    setError('');
    setResponse(null);

    try {
      let res;

      if (method === 'DELETE') {
        res = await axios.delete(`http://localhost:3001${url}`);
      } else if (method === 'HEAD') {
        res = await axios.head(`http://localhost:3001${url.replace('/1', '')}`);
      } else {
        res = await axios.options(`http://localhost:3001${url.replace('/1', '')}`);
      }

      setResponse(res);
      setStatus('success');
    } catch (err: any) {
      setError(err.message);
      setStatus('error');
    }
  };

  return (
    <section className="test-section">
      <header className="test-section-header">
        <h2 className="test-section-title">DELETE & Other Methods</h2>
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
            <li><strong>DELETE</strong> → <code>axios.delete(url)</code> - Removes resources</li>
            <li><strong>HEAD</strong> → <code>axios.head(url)</code> - Returns only headers (no body)</li>
            <li><strong>OPTIONS</strong> → <code>axios.options(url)</code> - Returns allowed methods</li>
          </ul>
        </div>
      )}

      {showTests && (
        <div className="what-this-tests">
          <h4>✓ WHAT THIS TESTS</h4>
          <ul>
            <li>✅ DELETE request - Removes resources successfully</li>
            <li>✅ HEAD request - Headers-only response (no body)</li>
            <li>✅ OPTIONS request - Returns allowed methods</li>
            <li>✅ Status codes - 204 No Content, 200 OK, 404 Not Found</li>
          </ul>
        </div>
      )}

      <DisplayCard title="Request Configuration">
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Method:</label>
          <div className="button-group">
            <button
              onClick={() => {
                setMethod('DELETE');
                setUrl('/api/users/1');
              }}
              data-testid="method-delete"
              style={{
                background: method === 'DELETE' ? 'var(--primary-color)' : 'white',
                color: method === 'DELETE' ? 'white' : 'var(--text-primary)'
              }}
            >
              DELETE
            </button>
            <button
              onClick={() => {
                setMethod('HEAD');
                setUrl('/api/users');
              }}
              data-testid="method-head"
              style={{
                background: method === 'HEAD' ? 'var(--primary-color)' : 'white',
                color: method === 'HEAD' ? 'white' : 'var(--text-primary)'
              }}
            >
              HEAD
            </button>
            <button
              onClick={() => {
                setMethod('OPTIONS');
                setUrl('/api/users');
              }}
              data-testid="method-options"
              style={{
                background: method === 'OPTIONS' ? 'var(--primary-color)' : 'white',
                color: method === 'OPTIONS' ? 'white' : 'var(--text-primary)'
              }}
            >
              OPTIONS
            </button>
          </div>
        </div>

        <div className="form-row">
          <label>URL:</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/api/users"
            data-testid="url-input"
          />
        </div>

        <button onClick={sendRequest} data-testid="send-request" disabled={status === 'loading'}>
          {status === 'loading' ? 'Sending...' : `Send ${method} Request`}
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
              {method === 'HEAD' && (
                <div>
                  <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Headers Only (No Body)</h4>
                  <pre style={{
                    background: 'var(--bg-secondary)',
                    padding: '1rem',
                    borderRadius: 'var(--border-radius)',
                    overflow: 'auto',
                    maxHeight: '200px',
                    fontSize: '0.875rem'
                  }}>
                    {JSON.stringify(response.headers, null, 2)}
                  </pre>
                </div>
              )}

              {method === 'OPTIONS' && (
                <div>
                  <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Allowed Methods</h4>
                  <p style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--border-radius)' }}>
                    <strong>Allow:</strong> {response.headers['allow'] || 'Not specified'}
                  </p>
                  <p style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--border-radius)', marginTop: '0.5rem' }}>
                    <strong>Access-Control-Allow-Methods:</strong> {response.headers['access-control-allow-methods'] || 'Not specified'}
                  </p>
                </div>
              )}

              {method === 'DELETE' && (
                <div style={{ padding: '1rem', background: 'var(--success-color)', color: 'white', borderRadius: 'var(--border-radius)' }}>
                  ✓ Resource deleted successfully
                </div>
              )}
            </>
          )}
        </DisplayCard>
      )}
    </section>
  );
}
