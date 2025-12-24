import { useState } from 'react';
import { Settings, CheckCircle } from 'lucide-react';
import { DisplayCard } from '../shared/DisplayCard';
import axios from 'axios';

type AuthType = 'none' | 'bearer' | 'basic' | 'apikey';

export default function HeadersAuth() {
  const [showSetup, setShowSetup] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [authType, setAuthType] = useState<AuthType>('none');
  const [bearerToken, setBearerToken] = useState('test-token-123');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [apiKeyName, setApiKeyName] = useState('X-API-Key');
  const [apiKeyValue, setApiKeyValue] = useState('sk-test-1234567890');
  const [customHeaders, setCustomHeaders] = useState<Array<{ key: string; value: string }>>([]);
  const [response, setResponse] = useState<any>(null);
  const [status, setStatus] = useState<string>('idle');
  const [error, setError] = useState<string>('');

  const addCustomHeader = () => {
    setCustomHeaders([...customHeaders, { key: '', value: '' }]);
  };

  const updateCustomHeader = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...customHeaders];
    updated[index][field] = value;
    setCustomHeaders(updated);
  };

  const removeCustomHeader = (index: number) => {
    setCustomHeaders(customHeaders.filter((_, i) => i !== index));
  };

  const sendAuthenticatedRequest = async () => {
    setStatus('loading');
    setError('');
    setResponse(null);

    try {
      const headers: any = {};

      if (authType === 'bearer') {
        headers['Authorization'] = `Bearer ${bearerToken}`;
      } else if (authType === 'basic') {
        const credentials = btoa(`${username}:${password}`);
        headers['Authorization'] = `Basic ${credentials}`;
      } else if (authType === 'apikey') {
        headers[apiKeyName] = apiKeyValue;
      }

      customHeaders.forEach(header => {
        if (header.key && header.value) {
          headers[header.key] = header.value;
        }
      });

      const res = await axios.get('http://localhost:3001/api/protected', {
        headers
      });

      setResponse(res);
      setStatus('success');
    } catch (err: any) {
      setError(err.message);
      setResponse(err.response);
      setStatus('error');
    }
  };

  return (
    <section className="test-section">
      <header className="test-section-header">
        <h2 className="test-section-title">Headers & Authentication</h2>
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
            <li><strong>Auth Type Dropdown</strong> → Choose between None, Bearer Token, Basic Auth, or API Key</li>
            <li><strong>Bearer Token</strong> → <code>headers: &#123; Authorization: 'Bearer token' &#125;</code></li>
            <li><strong>Basic Auth</strong> → <code>auth: &#123; username, password &#125;</code> (auto-converts to Base64)</li>
            <li><strong>API Key</strong> → <code>headers: &#123; 'X-API-Key': 'key' &#125;</code> or custom header</li>
            <li><strong>Custom Headers</strong> → Additional headers sent with request</li>
          </ul>
        </div>
      )}

      {showTests && (
        <div className="what-this-tests">
          <h4>✓ WHAT THIS TESTS</h4>
          <ul>
            <li>✅ Bearer token authentication - Authorization header with token</li>
            <li>✅ Basic authentication - Username/password auto-encoded to Base64</li>
            <li>✅ API key authentication - Custom header for API keys</li>
            <li>✅ Custom headers - Arbitrary headers sent with requests</li>
            <li>✅ 401 Unauthorized - Without auth credentials</li>
            <li>✅ 200 OK with auth - Protected endpoints accessible with credentials</li>
          </ul>
        </div>
      )}

      <DisplayCard title="Authentication Configuration">
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Authentication Type:</label>
          <div className="button-group">
            <button
              onClick={() => setAuthType('none')}
              data-testid="auth-none"
              style={{
                background: authType === 'none' ? 'var(--primary-color)' : 'white',
                color: authType === 'none' ? 'white' : 'var(--text-primary)'
              }}
            >
              None
            </button>
            <button
              onClick={() => setAuthType('bearer')}
              data-testid="auth-bearer"
              style={{
                background: authType === 'bearer' ? 'var(--primary-color)' : 'white',
                color: authType === 'bearer' ? 'white' : 'var(--text-primary)'
              }}
            >
              Bearer Token
            </button>
            <button
              onClick={() => setAuthType('basic')}
              data-testid="auth-basic"
              style={{
                background: authType === 'basic' ? 'var(--primary-color)' : 'white',
                color: authType === 'basic' ? 'white' : 'var(--text-primary)'
              }}
            >
              Basic Auth
            </button>
            <button
              onClick={() => setAuthType('apikey')}
              data-testid="auth-apikey"
              style={{
                background: authType === 'apikey' ? 'var(--primary-color)' : 'white',
                color: authType === 'apikey' ? 'white' : 'var(--text-primary)'
              }}
            >
              API Key
            </button>
          </div>
        </div>

        {authType === 'bearer' && (
          <div className="form-row">
            <label>Bearer Token:</label>
            <input
              type="text"
              value={bearerToken}
              onChange={(e) => setBearerToken(e.target.value)}
              placeholder="Enter token"
              data-testid="token-input"
              style={{ maxWidth: '400px' }}
            />
          </div>
        )}

        {authType === 'basic' && (
          <>
            <div className="form-row">
              <label>Username:</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                data-testid="username-input"
              />
            </div>
            <div className="form-row">
              <label>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                data-testid="password-input"
              />
            </div>
          </>
        )}

        {authType === 'apikey' && (
          <>
            <div className="form-row">
              <label>Header Name:</label>
              <input
                type="text"
                value={apiKeyName}
                onChange={(e) => setApiKeyName(e.target.value)}
                placeholder="X-API-Key"
                data-testid="apikey-name"
              />
            </div>
            <div className="form-row">
              <label>API Key Value:</label>
              <input
                type="text"
                value={apiKeyValue}
                onChange={(e) => setApiKeyValue(e.target.value)}
                placeholder="sk-test-1234567890"
                data-testid="apikey-value"
                style={{ maxWidth: '400px' }}
              />
            </div>
          </>
        )}

        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Custom Headers</h4>
          {customHeaders.map((header, index) => (
            <div key={index} className="form-row">
              <input
                type="text"
                value={header.key}
                onChange={(e) => updateCustomHeader(index, 'key', e.target.value)}
                placeholder="Header Name"
                data-testid={`custom-header-key-${index}`}
                style={{ maxWidth: '150px' }}
              />
              <input
                type="text"
                value={header.value}
                onChange={(e) => updateCustomHeader(index, 'value', e.target.value)}
                placeholder="Header Value"
                data-testid={`custom-header-value-${index}`}
                style={{ maxWidth: '200px' }}
              />
              <button onClick={() => removeCustomHeader(index)} data-testid={`remove-header-${index}`}>
                Remove
              </button>
            </div>
          ))}
          <button onClick={addCustomHeader} data-testid="add-custom-header">
            Add Custom Header
          </button>
        </div>

        {authType !== 'none' && (
          <div style={{
            background: 'var(--bg-secondary)',
            padding: '1rem',
            borderRadius: 'var(--border-radius)',
            fontSize: '0.875rem'
          }}>
            <strong>Header Preview:</strong>
            <pre style={{ marginTop: '0.5rem', fontFamily: 'monospace' }}>
              {authType === 'bearer' && `Authorization: Bearer ${bearerToken}`}
              {authType === 'basic' && `Authorization: Basic ${btoa(`${username}:${password}`)}`}
              {authType === 'apikey' && `${apiKeyName}: ${apiKeyValue}`}
            </pre>
          </div>
        )}

        <button onClick={sendAuthenticatedRequest} data-testid="send-auth-request" disabled={status === 'loading'}>
          {status === 'loading' ? 'Sending...' : 'Send Authenticated Request'}
        </button>
      </DisplayCard>

      {(response || error) && (
        <DisplayCard title="Response">
          <div>
            <span className={`status-badge status-${status}`}>
              {status === 'success'
                ? `${response?.status} ${response?.statusText}`
                : response?.status
                  ? `${response?.status} ${response?.statusText}`
                  : 'Error'}
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

          {status === 'error' && response?.status === 401 && (
            <div style={{
              padding: '1rem',
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: 'var(--border-radius)',
              color: '#991b1b'
            }}>
              <strong>Authentication Required:</strong> The protected endpoint requires valid authentication credentials.
            </div>
          )}

          {status === 'success' && (
            <div style={{
              padding: '1rem',
              background: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: 'var(--border-radius)',
              color: '#166534'
            }}>
              <strong>Authentication Successful:</strong> You have access to the protected resource!
            </div>
          )}
        </DisplayCard>
      )}
    </section>
  );
}
