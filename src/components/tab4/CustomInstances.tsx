import { useState } from 'react';
import { Settings, CheckCircle } from 'lucide-react';
import { DisplayCard } from '../shared/DisplayCard';
import axios, { AxiosInstance } from 'axios';

export default function CustomInstances() {
  const [showSetup, setShowSetup] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [instanceType, setInstanceType] = useState<'default' | 'custom1' | 'custom2'>('default');
  const [response, setResponse] = useState<any>(null);
  const [status, setStatus] = useState<string>('idle');
  const [baseURL, setBaseURL] = useState('http://localhost:3001');
  const [timeout, setTimeout] = useState(5000);
  const [customHeader, setCustomHeader] = useState('my-app-v1');

  const apiClient: AxiosInstance = axios.create({
    baseURL: 'http://localhost:3001',
    timeout: 10000,
    headers: {
      'X-Custom-Header': 'api-client',
      'X-API-Version': 'v1'
    }
  });

  const authClient: AxiosInstance = axios.create({
    baseURL: 'http://localhost:3001',
    timeout: 5000,
    headers: {
      'Authorization': 'Bearer demo-token-12345',
      'X-Client-Type': 'auth-client'
    }
  });

  const sendRequest = async () => {
    setStatus('loading');
    setResponse(null);

    try {
      let res;

      if (instanceType === 'default') {
        res = await axios.get('http://localhost:3001/api/users');
      } else if (instanceType === 'custom1') {
        res = await apiClient.get('/api/users');
      } else {
        res = await authClient.get('/api/protected');
      }

      setResponse({
        data: res.data,
        headers: res.headers,
        status: res.status,
        config: {
          baseURL: res.config.baseURL,
          timeout: res.config.timeout,
          headers: res.config.headers
        }
      });
      setStatus('success');
    } catch (err: any) {
      setResponse({
        error: err.message,
        code: err.code
      });
      setStatus('error');
    }
  };

  const setGlobalDefaults = () => {
    axios.defaults.baseURL = baseURL;
    axios.defaults.timeout = timeout;
    axios.defaults.headers.common['X-Custom-Header'] = customHeader;

    alert('Global defaults updated! All future axios requests will use these settings.');
  };

  return (
    <section className="test-section">
      <header className="test-section-header">
        <h2 className="test-section-title">Custom Instances & Defaults</h2>
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
            <li><strong>Custom Instance</strong> → <code>const instance = axios.create(&#123; baseURL, timeout, headers &#125;)</code></li>
            <li><strong>Instance Methods</strong> → Use <code>instance.get()</code>, <code>instance.post()</code>, etc.</li>
            <li><strong>Global Defaults</strong> → <code>axios.defaults.baseURL = '...'</code></li>
            <li><strong>Common Headers</strong> → <code>axios.defaults.headers.common['Header'] = 'value'</code></li>
            <li>Each instance has its own isolated configuration</li>
          </ul>
        </div>
      )}

      {showTests && (
        <div className="what-this-tests">
          <h4>✓ WHAT THIS TESTS</h4>
          <ul>
            <li>✅ Default axios instance - Standard axios without configuration</li>
            <li>✅ Custom instances - Create configured axios instances</li>
            <li>✅ Instance isolation - Each instance maintains separate config</li>
            <li>✅ Global defaults - Set default config for all axios requests</li>
            <li>✅ Common headers - Add headers to all requests</li>
          </ul>
        </div>
      )}

      <DisplayCard title="Instance Selection">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label style={{
            padding: '1rem',
            border: '2px solid var(--border-color)',
            borderRadius: 'var(--border-radius)',
            cursor: 'pointer',
            background: instanceType === 'default' ? '#f0f9ff' : 'white',
            borderColor: instanceType === 'default' ? 'var(--primary-color)' : 'var(--border-color)'
          }}>
            <input
              type="radio"
              name="instance"
              value="default"
              checked={instanceType === 'default'}
              onChange={(e) => setInstanceType(e.target.value as any)}
              data-testid="instance-default"
              style={{ marginRight: '0.5rem' }}
            />
            <strong>Default Axios</strong>
            <div style={{ fontSize: '0.875rem', marginTop: '0.25rem', color: 'var(--text-secondary)', marginLeft: '1.5rem' }}>
              Standard axios import - No custom configuration
            </div>
          </label>

          <label style={{
            padding: '1rem',
            border: '2px solid var(--border-color)',
            borderRadius: 'var(--border-radius)',
            cursor: 'pointer',
            background: instanceType === 'custom1' ? '#f0f9ff' : 'white',
            borderColor: instanceType === 'custom1' ? 'var(--primary-color)' : 'var(--border-color)'
          }}>
            <input
              type="radio"
              name="instance"
              value="custom1"
              checked={instanceType === 'custom1'}
              onChange={(e) => setInstanceType(e.target.value as any)}
              data-testid="instance-custom1"
              style={{ marginRight: '0.5rem' }}
            />
            <strong>API Client Instance</strong>
            <div style={{ fontSize: '0.875rem', marginTop: '0.25rem', color: 'var(--text-secondary)', marginLeft: '1.5rem' }}>
              baseURL: http://localhost:3001 • timeout: 10s • Custom headers
            </div>
          </label>

          <label style={{
            padding: '1rem',
            border: '2px solid var(--border-color)',
            borderRadius: 'var(--border-radius)',
            cursor: 'pointer',
            background: instanceType === 'custom2' ? '#f0f9ff' : 'white',
            borderColor: instanceType === 'custom2' ? 'var(--primary-color)' : 'var(--border-color)'
          }}>
            <input
              type="radio"
              name="instance"
              value="custom2"
              checked={instanceType === 'custom2'}
              onChange={(e) => setInstanceType(e.target.value as any)}
              data-testid="instance-custom2"
              style={{ marginRight: '0.5rem' }}
            />
            <strong>Auth Client Instance</strong>
            <div style={{ fontSize: '0.875rem', marginTop: '0.25rem', color: 'var(--text-secondary)', marginLeft: '1.5rem' }}>
              baseURL: http://localhost:3001 • timeout: 5s • Authorization header
            </div>
          </label>
        </div>

        <div className="button-group" style={{ marginTop: '1rem' }}>
          <button
            onClick={sendRequest}
            data-testid="send-request"
            disabled={status === 'loading'}
            style={{
              background: 'var(--primary-color)',
              color: 'white'
            }}
          >
            Send Request
          </button>
        </div>
      </DisplayCard>

      {response && (
        <DisplayCard title="Response">
          <div style={{
            padding: '1rem',
            background: status === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `2px solid ${status === 'success' ? 'var(--success-color)' : 'var(--error-color)'}`,
            borderRadius: 'var(--border-radius)',
            marginBottom: '1rem'
          }}>
            <span style={{
              background: status === 'success' ? 'var(--success-color)' : 'var(--error-color)',
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontWeight: 600
            }}>
              {status === 'success' ? `✓ ${response.status}` : '✗ Error'}
            </span>
          </div>

          {status === 'success' && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Instance Configuration</h4>
                <div style={{
                  background: 'var(--bg-secondary)',
                  padding: '1rem',
                  borderRadius: 'var(--border-radius)',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace'
                }}>
                  <div><strong>Base URL:</strong> {response.config.baseURL || 'Not set'}</div>
                  <div><strong>Timeout:</strong> {response.config.timeout || 'Default'}ms</div>
                  <div style={{ marginTop: '0.5rem' }}><strong>Custom Headers:</strong></div>
                  <div style={{ marginLeft: '1rem' }}>
                    {Object.entries(response.config.headers).filter(([key]) =>
                      key.toLowerCase().startsWith('x-')
                    ).map(([key, value]: [string, any]) => (
                      <div key={key}>{key}: {value}</div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Response Data</h4>
                <pre style={{
                  background: 'var(--bg-secondary)',
                  padding: '1rem',
                  borderRadius: 'var(--border-radius)',
                  overflow: 'auto',
                  fontSize: '0.75rem',
                  maxHeight: '300px'
                }}>
                  {JSON.stringify(response.data, null, 2)}
                </pre>
              </div>
            </>
          )}

          {status === 'error' && (
            <div style={{ fontSize: '0.875rem', color: 'var(--error-color)' }}>
              <div><strong>Error:</strong> {response.error}</div>
              {response.code && <div><strong>Code:</strong> {response.code}</div>}
            </div>
          )}
        </DisplayCard>
      )}

      <DisplayCard title="Set Global Defaults">
        <p style={{ fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
          Configure default settings that apply to all axios requests (affects the default axios instance only)
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
              Base URL
            </label>
            <input
              type="text"
              value={baseURL}
              onChange={(e) => setBaseURL(e.target.value)}
              data-testid="base-url-input"
              placeholder="http://localhost:3001"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '2px solid var(--border-color)',
                borderRadius: 'var(--border-radius)',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
              Timeout (ms)
            </label>
            <input
              type="number"
              value={timeout}
              onChange={(e) => setTimeout(Number(e.target.value))}
              data-testid="timeout-input"
              placeholder="5000"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '2px solid var(--border-color)',
                borderRadius: 'var(--border-radius)',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
              Custom Header Value
            </label>
            <input
              type="text"
              value={customHeader}
              onChange={(e) => setCustomHeader(e.target.value)}
              data-testid="custom-header-input"
              placeholder="my-app-v1"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '2px solid var(--border-color)',
                borderRadius: 'var(--border-radius)',
                fontSize: '0.875rem'
              }}
            />
          </div>
        </div>

        <button
          onClick={setGlobalDefaults}
          data-testid="set-defaults"
          style={{
            background: 'var(--success-color)',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: 'var(--border-radius)',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Set Global Defaults
        </button>
      </DisplayCard>

      <DisplayCard title="Code Examples">
        <div style={{ fontSize: '0.875rem' }}>
          <h4 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Create Custom Instance</h4>
          <pre style={{
            background: 'var(--bg-secondary)',
            padding: '1rem',
            borderRadius: 'var(--border-radius)',
            overflow: 'auto',
            fontSize: '0.75rem',
            marginBottom: '1rem'
          }}>
{`// Create API client with custom config
const apiClient = axios.create({
  baseURL: 'http://localhost:3001',
  timeout: 10000,
  headers: {
    'X-Custom-Header': 'api-client',
    'X-API-Version': 'v1'
  }
});

// Use the custom instance
const response = await apiClient.get('/api/users');`}
          </pre>

          <h4 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Set Global Defaults</h4>
          <pre style={{
            background: 'var(--bg-secondary)',
            padding: '1rem',
            borderRadius: 'var(--border-radius)',
            overflow: 'auto',
            fontSize: '0.75rem'
          }}>
{`// Set defaults for all axios requests
axios.defaults.baseURL = 'http://localhost:3001';
axios.defaults.timeout = 5000;
axios.defaults.headers.common['X-Custom-Header'] = 'my-app';

// These settings apply to all future requests
const response = await axios.get('/api/users');`}
          </pre>
        </div>
      </DisplayCard>

      <DisplayCard title="When to Use">
        <div style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
          <h4 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Custom Instances</h4>
          <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
            <li>Multiple API backends with different base URLs</li>
            <li>Different authentication schemes for different endpoints</li>
            <li>Separate timeout/retry policies per service</li>
            <li>Isolated interceptors for different API domains</li>
          </ul>

          <h4 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Global Defaults</h4>
          <ul style={{ marginLeft: '1.5rem' }}>
            <li>Single API backend used throughout the app</li>
            <li>Common headers needed on all requests</li>
            <li>Consistent timeout policy across all requests</li>
            <li>Simple applications with uniform API configuration</li>
          </ul>
        </div>
      </DisplayCard>
    </section>
  );
}
