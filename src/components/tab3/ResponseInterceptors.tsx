import { useState, useEffect } from 'react';
import { Settings, CheckCircle } from 'lucide-react';
import { DisplayCard } from '../shared/DisplayCard';
import axios, { AxiosResponse } from 'axios';

interface Interceptor {
  id: number;
  name: string;
  enabled: boolean;
  description: string;
}

export default function ResponseInterceptors() {
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
        axios.interceptors.response.eject(axiosId);
      });
    };
  }, [interceptorIds]);

  const addInterceptor = (
    name: string,
    description: string,
    successHandler: (response: AxiosResponse) => AxiosResponse,
    errorHandler?: (error: any) => any
  ) => {
    const id = nextId;
    setNextId(id + 1);

    const axiosInterceptorId = axios.interceptors.response.use(
      (response) => {
        const interceptor = interceptors.find(i => i.id === id);
        if (interceptor?.enabled) {
          setExecutionLog(prev => [...prev, `Interceptor ${id} (${name}) executed`]);
          return successHandler(response);
        }
        return response;
      },
      (error) => {
        const interceptor = interceptors.find(i => i.id === id);
        if (interceptor?.enabled && errorHandler) {
          setExecutionLog(prev => [...prev, `Interceptor ${id} (${name}) caught error`]);
          return errorHandler(error);
        }
        return Promise.reject(error);
      }
    );

    setInterceptorIds(prev => new Map(prev).set(id, axiosInterceptorId));
    setInterceptors(prev => [...prev, { id, name, enabled: true, description }]);
  };

  const removeInterceptor = (id: number) => {
    const axiosId = interceptorIds.get(id);
    if (axiosId !== undefined) {
      axios.interceptors.response.eject(axiosId);
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

  const addDataExtractorInterceptor = () => {
    addInterceptor(
      'Data Extractor',
      'Extracts nested data from response',
      (response) => {
        if (response.data && typeof response.data === 'object' && 'data' in response.data) {
          response.data = response.data.data;
        }
        return response;
      }
    );
  };

  const addLoggerInterceptor = () => {
    addInterceptor(
      'Logger',
      'Logs response status and data size',
      (response) => {
        const size = JSON.stringify(response.data).length;
        console.log(`[Interceptor] Response ${response.status} (${size} bytes)`);
        return response;
      }
    );
  };

  const addTimestampInterceptor = () => {
    addInterceptor(
      'Timestamp',
      'Adds timestamp to response data',
      (response) => {
        if (response.data && typeof response.data === 'object') {
          response.data._responseTime = Date.now();
        }
        return response;
      }
    );
  };

  const addErrorHandlerInterceptor = () => {
    addInterceptor(
      'Error Handler',
      'Adds user-friendly error messages',
      (response) => response,
      (error) => {
        if (error.response) {
          const status = error.response.status;
          if (status === 400) {
            error.userMessage = 'Invalid request. Please check your input.';
          } else if (status === 401) {
            error.userMessage = 'Please log in to continue.';
          } else if (status === 403) {
            error.userMessage = 'Access denied.';
          } else if (status === 404) {
            error.userMessage = 'Resource not found.';
          } else if (status >= 500) {
            error.userMessage = 'Server error. Please try again later.';
          }
        }
        return Promise.reject(error);
      }
    );
  };

  const sendTestRequest = async () => {
    setStatus('loading');
    setError('');
    setResponse(null);
    setExecutionLog([]);

    try {
      const res = await axios.get('http://localhost:3001/api/wrapped');
      setResponse(res);
      setStatus('success');
    } catch (err: any) {
      setError(err.userMessage || err.message);
      setResponse(err.response);
      setStatus('error');
    }
  };

  const sendErrorRequest = async () => {
    setStatus('loading');
    setError('');
    setResponse(null);
    setExecutionLog([]);

    try {
      const res = await axios.get('http://localhost:3001/api/error/404');
      setResponse(res);
      setStatus('success');
    } catch (err: any) {
      setError(err.userMessage || err.message);
      setResponse(err.response);
      setStatus('error');
    }
  };

  return (
    <section className="test-section">
      <header className="test-section-header">
        <h2 className="test-section-title">Response Interceptors</h2>
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
            <li><strong>Add Interceptor</strong> → <code>axios.interceptors.response.use(onFulfilled, onRejected)</code></li>
            <li><strong>Transform Response</strong> → Modify response data before returning to caller</li>
            <li><strong>FIFO Order</strong> → First added interceptor runs FIRST (opposite of request)</li>
            <li><strong>Error Handling</strong> → Second parameter catches errors</li>
            <li>Success handler receives response, error handler receives error</li>
          </ul>
        </div>
      )}

      {showTests && (
        <div className="what-this-tests">
          <h4>✓ WHAT THIS TESTS</h4>
          <ul>
            <li>✅ Add response interceptor - Register response transformation function</li>
            <li>✅ Transform response data - Modify response.data before returning</li>
            <li>✅ FIFO execution - First added runs first</li>
            <li>✅ Error interceptors - Catch and handle errors</li>
            <li>✅ Response logging - Log all responses</li>
            <li>✅ Error transformation - Customize error messages</li>
          </ul>
        </div>
      )}

      <DisplayCard title="Interceptor Templates">
        <div style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>
            Add pre-built interceptors to transform responses after they are received.
          </p>
        </div>

        <div className="button-group">
          <button onClick={addDataExtractorInterceptor} data-testid="add-extractor-interceptor">
            Add Data Extractor
          </button>
          <button onClick={addLoggerInterceptor} data-testid="add-logger-interceptor">
            Add Logger
          </button>
          <button onClick={addTimestampInterceptor} data-testid="add-timestamp-interceptor">
            Add Timestamp
          </button>
          <button onClick={addErrorHandlerInterceptor} data-testid="add-error-interceptor">
            Add Error Handler
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
              background: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: 'var(--border-radius)',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              <strong>Execution Order (FIFO):</strong> Interceptors run in forward order (first added runs first)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {interceptors.map((interceptor, index) => (
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
                          background: 'var(--success-color)',
                          color: 'white',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          #{index + 1}
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

      <DisplayCard title="Test Requests">
        <div className="button-group">
          <button onClick={sendTestRequest} data-testid="send-test-request" disabled={status === 'loading'}>
            {status === 'loading' ? 'Sending...' : 'Send Success Request'}
          </button>
          <button onClick={sendErrorRequest} data-testid="send-error-request" disabled={status === 'loading'}>
            {status === 'loading' ? 'Sending...' : 'Send Error Request'}
          </button>
        </div>

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
                {status === 'success'
                  ? `${response?.status} ${response?.statusText}`
                  : response?.status
                    ? `${response?.status} ${response?.statusText}`
                    : 'Error'}
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
              <div style={{ marginTop: '1rem' }}>
                <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
                  Response Data (Modified by Interceptors):
                </h4>
                <pre style={{
                  background: 'var(--bg-secondary)',
                  padding: '1rem',
                  borderRadius: 'var(--border-radius)',
                  overflow: 'auto',
                  maxHeight: '300px',
                  fontSize: '0.75rem'
                }}>
                  {JSON.stringify(response.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </DisplayCard>

      <DisplayCard title="Key Concepts">
        <div style={{ fontSize: '0.875rem' }}>
          <h4 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>How Response Interceptors Work</h4>
          <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
            <li><strong>FIFO Order:</strong> First In, First Out - oldest interceptor runs first</li>
            <li><strong>Response Transformation:</strong> Can modify response.data</li>
            <li><strong>Error Handling:</strong> Second parameter catches errors</li>
            <li><strong>Two Handlers:</strong> Success handler and error handler</li>
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
const id = axios.interceptors.response.use(
  (response) => {
    // Transform response data
    response.data = response.data.data;
    return response;
  },
  (error) => {
    // Handle error
    console.error('Request failed:', error);
    return Promise.reject(error);
  }
);

// Remove interceptor
axios.interceptors.response.eject(id);`}
          </pre>
        </div>
      </DisplayCard>
    </section>
  );
}
