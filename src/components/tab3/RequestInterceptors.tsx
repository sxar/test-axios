import { useState, useEffect } from 'react';
import { Settings, CheckCircle } from 'lucide-react';
import { DisplayCard } from '../shared/DisplayCard';
import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

interface Interceptor {
  id: number;
  name: string;
  enabled: boolean;
  description: string;
}

export default function RequestInterceptors() {
  const [showSetup, setShowSetup] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [interceptors, setInterceptors] = useState<Interceptor[]>([]);
  const [nextId, setNextId] = useState(1);
  const [response, setResponse] = useState<any>(null);
  const [status, setStatus] = useState<string>('idle');
  const [error, setError] = useState<string>('');
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const [interceptorIds, setInterceptorIds] = useState<Map<number, number>>(new Map());

  useEffect(() => {
    return () => {
      interceptorIds.forEach(axiosId => {
        axios.interceptors.request.eject(axiosId);
      });
    };
  }, [interceptorIds]);

  const addInterceptor = (name: string, description: string, handler: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig) => {
    const id = nextId;
    setNextId(id + 1);

    const axiosInterceptorId = axios.interceptors.request.use(
      (config) => {
        const interceptor = interceptors.find(i => i.id === id);
        if (interceptor?.enabled) {
          setExecutionLog(prev => [...prev, `Interceptor ${id} (${name}) executed`]);
          return handler(config);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    setInterceptorIds(prev => new Map(prev).set(id, axiosInterceptorId));
    setInterceptors(prev => [...prev, { id, name, enabled: true, description }]);
  };

  const removeInterceptor = (id: number) => {
    const axiosId = interceptorIds.get(id);
    if (axiosId !== undefined) {
      axios.interceptors.request.eject(axiosId);
      setInterceptorIds(prev => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
    }
    setInterceptors(prev => prev.filter(i => i.id !== id));
  };

  const toggleInterceptor = (id: number) => {
    setInterceptors(prev =>
      prev.map(i => i.id === id ? { ...i, enabled: !i.enabled } : i)
    );
  };

  const addAuthInterceptor = () => {
    addInterceptor(
      'Auth Token',
      'Adds Authorization header with Bearer token',
      (config) => {
        config.headers.Authorization = 'Bearer interceptor-token-123';
        return config;
      }
    );
  };

  const addLoggerInterceptor = () => {
    addInterceptor(
      'Logger',
      'Logs request method and URL',
      (config) => {
        console.log(`[Interceptor] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      }
    );
  };

  const addTimestampInterceptor = () => {
    addInterceptor(
      'Timestamp',
      'Adds timestamp to request headers',
      (config) => {
        config.headers['X-Request-Timestamp'] = Date.now().toString();
        return config;
      }
    );
  };

  const addCustomHeaderInterceptor = () => {
    addInterceptor(
      'Custom Header',
      'Adds X-Custom-Header to all requests',
      (config) => {
        config.headers['X-Custom-Header'] = 'interceptor-value';
        return config;
      }
    );
  };

  const sendTestRequest = async () => {
    setStatus('loading');
    setError('');
    setResponse(null);
    setExecutionLog([]);

    try {
      const res = await axios.get('http://localhost:3001/api/users', {
        params: { limit: 3 }
      });

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
        <h2 className="test-section-title">Request Interceptors</h2>
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
            <li><strong>Add Interceptor</strong> → <code>axios.interceptors.request.use(onFulfilled, onRejected)</code></li>
            <li><strong>Modify Config</strong> → Interceptors can change headers, URL, data, params</li>
            <li><strong>LIFO Order</strong> → Last added interceptor runs FIRST</li>
            <li><strong>Remove Interceptor</strong> → <code>axios.interceptors.request.eject(id)</code></li>
            <li>Each interceptor receives the request config and must return it (modified or not)</li>
          </ul>
        </div>
      )}

      {showTests && (
        <div className="what-this-tests">
          <h4>✓ WHAT THIS TESTS</h4>
          <ul>
            <li>✅ Add request interceptor - Register request modification function</li>
            <li>✅ Modify config - Change headers, URL, data, params</li>
            <li>✅ LIFO execution - Last added runs first</li>
            <li>✅ Multiple interceptors - Chain multiple modifications</li>
            <li>✅ Eject interceptor - Remove by ID</li>
            <li>✅ Enable/disable - Toggle interceptors on/off</li>
            <li>✅ Header injection - Add/modify headers automatically</li>
          </ul>
        </div>
      )}

      <DisplayCard title="Interceptor Templates">
        <div style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>
            Add pre-built interceptors to modify requests before they are sent.
          </p>
        </div>

        <div className="button-group">
          <button onClick={addAuthInterceptor} data-testid="add-auth-interceptor">
            Add Auth Token
          </button>
          <button onClick={addLoggerInterceptor} data-testid="add-logger-interceptor">
            Add Logger
          </button>
          <button onClick={addTimestampInterceptor} data-testid="add-timestamp-interceptor">
            Add Timestamp
          </button>
          <button onClick={addCustomHeaderInterceptor} data-testid="add-custom-interceptor">
            Add Custom Header
          </button>
        </div>
      </DisplayCard>

      <DisplayCard title="Active Interceptors">
        {interceptors.length === 0 ? (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--border-radius)'
          }}>
            No interceptors added yet. Add an interceptor from the templates above.
          </div>
        ) : (
          <div>
            <div style={{
              padding: '1rem',
              background: '#eff6ff',
              border: '1px solid #93c5fd',
              borderRadius: 'var(--border-radius)',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              <strong>Execution Order (LIFO):</strong> Interceptors run in reverse order (last added runs first)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[...interceptors].reverse().map((interceptor, index) => (
                <div
                  key={interceptor.id}
                  style={{
                    padding: '1rem',
                    border: '2px solid var(--border-color)',
                    borderRadius: 'var(--border-radius)',
                    background: interceptor.enabled ? 'white' : 'var(--bg-secondary)',
                    opacity: interceptor.enabled ? 1 : 0.6
                  }}
                  data-testid={`interceptor-${interceptor.id}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{
                          background: 'var(--primary-color)',
                          color: 'white',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          #{interceptors.length - index}
                        </span>
                        <strong>{interceptor.name}</strong>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                        {interceptor.description}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                      <button
                        onClick={() => toggleInterceptor(interceptor.id)}
                        data-testid={`toggle-interceptor-${interceptor.id}`}
                        style={{
                          minWidth: '80px',
                          background: interceptor.enabled ? 'var(--success-color)' : 'var(--secondary-color)',
                          color: 'white'
                        }}
                      >
                        {interceptor.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                      <button
                        onClick={() => removeInterceptor(interceptor.id)}
                        data-testid={`remove-interceptor-${interceptor.id}`}
                        style={{
                          background: 'var(--error-color)',
                          color: 'white'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DisplayCard>

      <DisplayCard title="Test Request">
        <button onClick={sendTestRequest} data-testid="send-test-request" disabled={status === 'loading'}>
          {status === 'loading' ? 'Sending...' : 'Send Test Request'}
        </button>

        {executionLog.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Execution Log:</h4>
            <div style={{
              background: 'var(--bg-secondary)',
              padding: '1rem',
              borderRadius: 'var(--border-radius)',
              fontSize: '0.875rem',
              fontFamily: 'monospace'
            }}>
              {executionLog.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </div>
          </div>
        )}

        {(response || error) && (
          <div style={{ marginTop: '1rem' }}>
            <div>
              <span className={`status-badge status-${status}`}>
                {status === 'success' ? `${response?.status} ${response?.statusText}` : 'Error'}
              </span>
            </div>

            {error && (
              <div style={{
                marginTop: '0.5rem',
                padding: '1rem',
                background: '#fef2f2',
                border: '1px solid #fca5a5',
                borderRadius: 'var(--border-radius)',
                color: '#991b1b'
              }}>
                <strong>Error:</strong> {error}
              </div>
            )}

            {response && (
              <>
                <div style={{ marginTop: '1rem' }}>
                  <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
                    Request Headers (Modified by Interceptors):
                  </h4>
                  <pre style={{
                    background: 'var(--bg-secondary)',
                    padding: '1rem',
                    borderRadius: 'var(--border-radius)',
                    overflow: 'auto',
                    fontSize: '0.75rem'
                  }}>
                    {JSON.stringify(response.config.headers, null, 2)}
                  </pre>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Response Data:</h4>
                  <pre style={{
                    background: 'var(--bg-secondary)',
                    padding: '1rem',
                    borderRadius: 'var(--border-radius)',
                    overflow: 'auto',
                    maxHeight: '200px',
                    fontSize: '0.75rem'
                  }}>
                    {JSON.stringify(response.data, null, 2)}
                  </pre>
                </div>
              </>
            )}
          </div>
        )}
      </DisplayCard>

      <DisplayCard title="Key Concepts">
        <div style={{ fontSize: '0.875rem' }}>
          <h4 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>How Request Interceptors Work</h4>
          <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
            <li><strong>LIFO Order:</strong> Last In, First Out - newest interceptor runs first</li>
            <li><strong>Config Modification:</strong> Can change headers, URL, data, params</li>
            <li><strong>Must Return Config:</strong> Always return the config object</li>
            <li><strong>Async Support:</strong> Interceptors can be async functions</li>
          </ul>

          <h4 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Code Example</h4>
          <pre style={{
            background: 'var(--bg-secondary)',
            padding: '1rem',
            borderRadius: 'var(--border-radius)',
            overflow: 'auto',
            fontSize: '0.75rem'
          }}>
{`// Add interceptor
const id = axios.interceptors.request.use(
  (config) => {
    config.headers.Authorization = 'Bearer token';
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Remove interceptor
axios.interceptors.request.eject(id);`}
          </pre>
        </div>
      </DisplayCard>
    </section>
  );
}
