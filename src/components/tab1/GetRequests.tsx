import { useState } from 'react';
import { Settings, CheckCircle } from 'lucide-react';
import { DisplayCard } from '../shared/DisplayCard';
import axios from 'axios';

export default function GetRequests() {
  const [showSetup, setShowSetup] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [url, setUrl] = useState('/api/users');
  const [queryParams, setQueryParams] = useState<Array<{ key: string; value: string }>>([]);
  const [headers, setHeaders] = useState<Array<{ key: string; value: string }>>([]);
  const [response, setResponse] = useState<any>(null);
  const [status, setStatus] = useState<string>('idle');
  const [error, setError] = useState<string>('');
  const [responseTime, setResponseTime] = useState<number>(0);

  const addQueryParam = () => {
    setQueryParams([...queryParams, { key: '', value: '' }]);
  };

  const updateQueryParam = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...queryParams];
    updated[index][field] = value;
    setQueryParams(updated);
  };

  const removeQueryParam = (index: number) => {
    setQueryParams(queryParams.filter((_, i) => i !== index));
  };

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '' }]);
  };

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...headers];
    updated[index][field] = value;
    setHeaders(updated);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const sendGetRequest = async () => {
    setStatus('loading');
    setError('');
    setResponse(null);

    try {
      const params: any = {};
      queryParams.forEach(param => {
        if (param.key && param.value) {
          params[param.key] = param.value;
        }
      });

      const customHeaders: any = {};
      headers.forEach(header => {
        if (header.key && header.value) {
          customHeaders[header.key] = header.value;
        }
      });

      const startTime = Date.now();
      const res = await axios.get(`http://localhost:3001${url}`, {
        params,
        headers: customHeaders
      });
      const endTime = Date.now();

      setResponseTime(endTime - startTime);
      setResponse(res);
      setStatus('success');
    } catch (err: any) {
      setError(err.message);
      setStatus('error');
    }
  };

  const computedUrl = () => {
    if (queryParams.length === 0) return url;
    const params = queryParams
      .filter(p => p.key && p.value)
      .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
      .join('&');
    return params ? `${url}?${params}` : url;
  };

  return (
    <section className="test-section">
      <header className="test-section-header">
        <h2 className="test-section-title">GET Requests</h2>
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
            <li><strong>URL Input</strong> → <code>axios.get(url)</code> - The endpoint to request</li>
            <li><strong>Query Parameters Panel</strong> → <code>axios.get(url, &#123; params: &#123; key: 'value' &#125; &#125;)</code> - Appended as URL query string</li>
            <li><strong>Headers Panel</strong> → <code>axios.get(url, &#123; headers: &#123; 'X-Custom': 'value' &#125; &#125;)</code> - Custom request headers</li>
            <li><strong>"Send GET Request" button</strong> → Executes the configured GET request</li>
          </ul>
        </div>
      )}

      {showTests && (
        <div className="what-this-tests">
          <h4>✓ WHAT THIS TESTS</h4>
          <ul>
            <li>✅ Basic GET request - <code>axios.get(url)</code> executes successfully</li>
            <li>✅ Query parameter serialization - Params object converted to URL query string</li>
            <li>✅ Custom headers - Headers sent with request</li>
            <li>✅ Response schema - Full response object structure (data, status, headers, config)</li>
            <li>✅ Async/await pattern - Promise-based execution</li>
            <li>✅ Error handling - Invalid URLs or failed requests throw errors</li>
          </ul>
        </div>
      )}

      <DisplayCard title="Request Configuration">
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
          <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Query Parameters</h4>
          {queryParams.map((param, index) => (
            <div key={index} className="form-row">
              <input
                type="text"
                value={param.key}
                onChange={(e) => updateQueryParam(index, 'key', e.target.value)}
                placeholder="Key"
                data-testid={`query-key-${index}`}
                style={{ maxWidth: '150px' }}
              />
              <input
                type="text"
                value={param.value}
                onChange={(e) => updateQueryParam(index, 'value', e.target.value)}
                placeholder="Value"
                data-testid={`query-value-${index}`}
                style={{ maxWidth: '150px' }}
              />
              <button onClick={() => removeQueryParam(index)} data-testid={`remove-query-${index}`}>Remove</button>
            </div>
          ))}
          <button onClick={addQueryParam} data-testid="add-query-param">Add Query Parameter</button>
        </div>

        <div>
          <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Headers</h4>
          {headers.map((header, index) => (
            <div key={index} className="form-row">
              <input
                type="text"
                value={header.key}
                onChange={(e) => updateHeader(index, 'key', e.target.value)}
                placeholder="Header Name"
                data-testid={`header-key-${index}`}
                style={{ maxWidth: '150px' }}
              />
              <input
                type="text"
                value={header.value}
                onChange={(e) => updateHeader(index, 'value', e.target.value)}
                placeholder="Header Value"
                data-testid={`header-value-${index}`}
                style={{ maxWidth: '150px' }}
              />
              <button onClick={() => removeHeader(index)} data-testid={`remove-header-${index}`}>Remove</button>
            </div>
          ))}
          <button onClick={addHeader} data-testid="add-header">Add Header</button>
        </div>

        <div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <strong>Computed URL:</strong> {computedUrl()}
          </p>
        </div>

        <button onClick={sendGetRequest} data-testid="send-get-request" disabled={status === 'loading'}>
          {status === 'loading' ? 'Sending...' : 'Send GET Request'}
        </button>
      </DisplayCard>

      {(response || error) && (
        <DisplayCard title="Response">
          <div>
            <span className={`status-badge status-${status}`}>
              {status === 'success' ? `${response?.status} ${response?.statusText}` : 'Error'}
            </span>
            {status === 'success' && (
              <span style={{ marginLeft: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Response time: {responseTime}ms
              </span>
            )}
          </div>

          {error && (
            <div style={{ color: 'var(--error-color)', fontWeight: 600 }}>
              Error: {error}
            </div>
          )}

          {response && (
            <>
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

              <div>
                <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Response Headers</h4>
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
            </>
          )}
        </DisplayCard>
      )}
    </section>
  );
}
