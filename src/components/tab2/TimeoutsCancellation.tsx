import { useState, useRef } from 'react';
import { Settings, CheckCircle } from 'lucide-react';
import { DisplayCard } from '../shared/DisplayCard';
import axios from 'axios';

export default function TimeoutsCancellation() {
  const [showSetup, setShowSetup] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [timeout, setTimeout] = useState(5000);
  const [serverDelay, setServerDelay] = useState(1000);
  const [response, setResponse] = useState<any>(null);
  const [status, setStatus] = useState<string>('idle');
  const [error, setError] = useState<string>('');
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [longRequestStatus, setLongRequestStatus] = useState<string>('idle');
  const [progress, setProgress] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const sendWithTimeout = async () => {
    setStatus('loading');
    setError('');
    setResponse(null);
    setElapsedTime(0);

    const startTime = Date.now();

    try {
      const res = await axios.get(`http://localhost:3001/api/slow?delay=${serverDelay}`, {
        timeout: timeout
      });

      const endTime = Date.now();
      setElapsedTime(endTime - startTime);
      setResponse(res);
      setStatus('success');
    } catch (err: any) {
      const endTime = Date.now();
      setElapsedTime(endTime - startTime);
      setError(err.message);
      setStatus('error');
    }
  };

  const startLongRequest = () => {
    setLongRequestStatus('loading');
    setProgress(0);
    setError('');

    abortControllerRef.current = new AbortController();

    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 300);

    axios.get('http://localhost:3001/api/slow?delay=30000', {
      signal: abortControllerRef.current.signal
    })
      .then(() => {
        setLongRequestStatus('success');
        setProgress(100);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      })
      .catch((err) => {
        if (axios.isCancel(err)) {
          setError('Request canceled');
          setLongRequestStatus('canceled');
        } else {
          setError(err.message);
          setLongRequestStatus('error');
        }
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      });
  };

  const cancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }
  };

  return (
    <section className="test-section">
      <header className="test-section-header">
        <h2 className="test-section-title">Timeouts & Cancellation</h2>
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
            <li><strong>Timeout</strong> → <code>axios.get(url, &#123; timeout: 5000 &#125;)</code> - Max wait time in ms</li>
            <li><strong>AbortController</strong> → <code>signal: controller.signal</code> - Cancel in-flight requests</li>
            <li><strong>Cancel Request</strong> → <code>controller.abort()</code> - Stops the request immediately</li>
            <li>Timeout errors have code <code>ECONNABORTED</code> or <code>ETIMEDOUT</code></li>
            <li>Canceled errors have code <code>ERR_CANCELED</code></li>
          </ul>
        </div>
      )}

      {showTests && (
        <div className="what-this-tests">
          <h4>✓ WHAT THIS TESTS</h4>
          <ul>
            <li>✅ Request timeout - Requests fail after specified duration</li>
            <li>✅ Timeout error codes - <code>ECONNABORTED</code> or <code>ETIMEDOUT</code></li>
            <li>✅ AbortController - Modern cancellation API</li>
            <li>✅ Manual cancellation - <code>controller.abort()</code> stops request</li>
            <li>✅ Canceled error code - <code>ERR_CANCELED</code> when aborted</li>
            <li>✅ In-flight cancellation - Can cancel while request is pending</li>
          </ul>
        </div>
      )}

      <DisplayCard title="Timeout Test">
        <div className="form-row">
          <label>Timeout (ms):</label>
          <input
            type="number"
            value={timeout}
            onChange={(e) => setTimeout(Number(e.target.value))}
            min="100"
            max="10000"
            step="100"
            data-testid="timeout-slider"
          />
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {timeout}ms
          </span>
        </div>

        <div className="form-row">
          <label>Server Delay (ms):</label>
          <input
            type="number"
            value={serverDelay}
            onChange={(e) => setServerDelay(Number(e.target.value))}
            min="0"
            max="15000"
            step="100"
            data-testid="delay-slider"
          />
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {serverDelay}ms
          </span>
        </div>

        <div style={{
          padding: '1rem',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--border-radius)',
          fontSize: '0.875rem',
          marginBottom: '1rem'
        }}>
          <strong>Scenario:</strong>{' '}
          {timeout > serverDelay ? (
            <span style={{ color: 'var(--success-color)' }}>
              ✓ Success (Timeout {timeout}ms &gt; Delay {serverDelay}ms)
            </span>
          ) : (
            <span style={{ color: 'var(--error-color)' }}>
              ✗ Timeout (Timeout {timeout}ms &lt; Delay {serverDelay}ms)
            </span>
          )}
        </div>

        <button onClick={sendWithTimeout} data-testid="send-timeout" disabled={status === 'loading'}>
          {status === 'loading' ? 'Sending...' : 'Send with Timeout'}
        </button>

        {(response || error) && (
          <div style={{ marginTop: '1rem' }}>
            <div>
              <span className={`status-badge status-${status}`}>
                {status === 'success' ? 'Success' : 'Timeout/Error'}
              </span>
              <span style={{ marginLeft: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Time elapsed: {elapsedTime}ms
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
              <div style={{
                marginTop: '0.5rem',
                padding: '1rem',
                background: '#f0fdf4',
                border: '1px solid #86efac',
                borderRadius: 'var(--border-radius)',
                color: '#166534'
              }}>
                <strong>Success:</strong> Request completed within timeout period
                <pre style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
                  {JSON.stringify(response.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </DisplayCard>

      <DisplayCard title="Request Cancellation Test">
        <div style={{
          padding: '1rem',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--border-radius)',
          marginBottom: '1rem'
        }}>
          <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            This simulates a long-running request (30 seconds) that you can cancel at any time.
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Uses <code>AbortController</code> to cancel in-flight requests.
          </p>
        </div>

        <div className="button-group">
          <button
            onClick={startLongRequest}
            data-testid="start-long-request"
            disabled={longRequestStatus === 'loading'}
          >
            Start Long Request
          </button>
          <button
            onClick={cancelRequest}
            data-testid="cancel-request"
            disabled={longRequestStatus !== 'loading'}
            style={{
              background: longRequestStatus === 'loading' ? 'var(--error-color)' : 'var(--secondary-color)',
              color: 'white'
            }}
          >
            Cancel Request
          </button>
        </div>

        {longRequestStatus === 'loading' && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{
              background: 'var(--bg-secondary)',
              height: '24px',
              borderRadius: 'var(--border-radius)',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                background: 'var(--primary-color)',
                height: '100%',
                width: `${progress}%`,
                transition: 'width 0.3s ease-in-out'
              }} />
            </div>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', textAlign: 'center' }}>
              Progress: {progress}%
            </p>
          </div>
        )}

        {longRequestStatus === 'canceled' && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#fffbeb',
            border: '1px solid #fcd34d',
            borderRadius: 'var(--border-radius)',
            color: '#92400e'
          }}>
            <strong>Request Canceled:</strong> The request was aborted using <code>controller.abort()</code>
            {error && <div style={{ marginTop: '0.5rem' }}>Error message: {error}</div>}
          </div>
        )}

        {longRequestStatus === 'success' && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: 'var(--border-radius)',
            color: '#166534'
          }}>
            <strong>Request Completed:</strong> The long request finished successfully without being canceled.
          </div>
        )}

        {longRequestStatus === 'error' && error && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: 'var(--border-radius)',
            color: '#991b1b'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}
      </DisplayCard>

      <DisplayCard title="Key Concepts">
        <div style={{ fontSize: '0.875rem' }}>
          <h4 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Timeout vs Cancellation</h4>
          <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
            <li><strong>Timeout:</strong> Automatic failure after specified duration</li>
            <li><strong>Cancellation:</strong> Manual abort using AbortController</li>
            <li><strong>Timeout Error:</strong> <code>ECONNABORTED</code> or <code>ETIMEDOUT</code></li>
            <li><strong>Cancel Error:</strong> <code>ERR_CANCELED</code></li>
          </ul>

          <h4 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Code Example</h4>
          <pre style={{
            background: 'var(--bg-secondary)',
            padding: '1rem',
            borderRadius: 'var(--border-radius)',
            overflow: 'auto',
            fontSize: '0.75rem'
          }}>
{`// Timeout
const res = await axios.get('/api/slow', {
  timeout: 5000  // Fail after 5 seconds
});

// Cancellation
const controller = new AbortController();
axios.get('/api/data', {
  signal: controller.signal
});
controller.abort();  // Cancel immediately`}
          </pre>
        </div>
      </DisplayCard>
    </section>
  );
}
