import { useState } from 'react';
import { Settings, CheckCircle } from 'lucide-react';
import { DisplayCard } from '../shared/DisplayCard';
import axios from 'axios';

type HttpMethod = 'POST' | 'PUT' | 'PATCH';

export default function PostPutPatch() {
  const [showSetup, setShowSetup] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [method, setMethod] = useState<HttpMethod>('POST');
  const [url, setUrl] = useState('/api/users');
  const [requestBody, setRequestBody] = useState(`{
  "firstName": "Alice",
  "lastName": "Johnson",
  "email": "alice@example.com"
}`);
  const [response, setResponse] = useState<any>(null);
  const [status, setStatus] = useState<string>('idle');
  const [error, setError] = useState<string>('');

  const sendRequest = async () => {
    setStatus('loading');
    setError('');
    setResponse(null);

    try {
      const data = JSON.parse(requestBody);
      let res;

      if (method === 'POST') {
        res = await axios.post(`http://localhost:3001${url}`, data);
      } else if (method === 'PUT') {
        res = await axios.put(`http://localhost:3001${url}`, data);
      } else {
        res = await axios.patch(`http://localhost:3001${url}`, data);
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
        <h2 className="test-section-title">POST, PUT, PATCH Requests</h2>
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
            <li><strong>Method Selector</strong> → Choose between POST, PUT, or PATCH</li>
            <li><strong>POST</strong> → <code>axios.post(url, data)</code> - Creates new resources</li>
            <li><strong>PUT</strong> → <code>axios.put(url, data)</code> - Replaces entire resource</li>
            <li><strong>PATCH</strong> → <code>axios.patch(url, data)</code> - Updates partial resource</li>
            <li><strong>Request Body</strong> → JSON data sent to server</li>
          </ul>
        </div>
      )}

      {showTests && (
        <div className="what-this-tests">
          <h4>✓ WHAT THIS TESTS</h4>
          <ul>
            <li>✅ POST request - Creates new resources</li>
            <li>✅ PUT request - Replaces entire resource</li>
            <li>✅ PATCH request - Updates partial resource</li>
            <li>✅ JSON serialization - Objects automatically converted to JSON</li>
            <li>✅ Automatic Content-Type - Header set based on data type</li>
            <li>✅ Status codes - 201 Created (POST), 200 OK (PUT/PATCH)</li>
          </ul>
        </div>
      )}

      <DisplayCard title="Request Configuration">
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Method:</label>
          <div className="button-group">
            <button
              onClick={() => setMethod('POST')}
              data-testid="method-post"
              style={{
                background: method === 'POST' ? 'var(--primary-color)' : 'white',
                color: method === 'POST' ? 'white' : 'var(--text-primary)'
              }}
            >
              POST
            </button>
            <button
              onClick={() => {
                setMethod('PUT');
                setUrl('/api/users/1');
              }}
              data-testid="method-put"
              style={{
                background: method === 'PUT' ? 'var(--primary-color)' : 'white',
                color: method === 'PUT' ? 'white' : 'var(--text-primary)'
              }}
            >
              PUT
            </button>
            <button
              onClick={() => {
                setMethod('PATCH');
                setUrl('/api/users/1');
              }}
              data-testid="method-patch"
              style={{
                background: method === 'PATCH' ? 'var(--primary-color)' : 'white',
                color: method === 'PATCH' ? 'white' : 'var(--text-primary)'
              }}
            >
              PATCH
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

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Request Body (JSON):</label>
          <textarea
            value={requestBody}
            onChange={(e) => setRequestBody(e.target.value)}
            data-testid="request-body"
            style={{
              width: '100%',
              minHeight: '150px',
              padding: '1rem',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius)',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              background: 'var(--bg-secondary)'
            }}
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
            <div>
              <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Response Data</h4>
              <pre style={{
                background: 'var(--bg-secondary)',
                padding: '1rem',
                borderRadius: 'var(--border-radius)',
                overflow: 'auto',
                maxHeight: '300px',
                fontSize: '0.875rem'
              }}>
                {JSON.stringify(response.data, null, 2)}
              </pre>
            </div>
          )}
        </DisplayCard>
      )}
    </section>
  );
}
