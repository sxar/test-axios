import { useState } from 'react';
import { Settings, CheckCircle } from 'lucide-react';
import { DisplayCard } from '../shared/DisplayCard';
import axios, { AxiosError } from 'axios';

type ErrorCategory = 'response' | 'request' | 'setup' | 'none';

interface ErrorDetails {
  category: ErrorCategory;
  code?: string;
  statusCode?: number;
  statusText?: string;
  message: string;
  isAxiosError: boolean;
  hasResponse: boolean;
  hasRequest: boolean;
}

export default function ErrorHandling() {
  const [showSetup, setShowSetup] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);
  const [status, setStatus] = useState<string>('idle');
  const [validateStatus, setValidateStatus] = useState(false);

  const categorizeError = (error: any): ErrorDetails => {
    const isAxiosError = axios.isAxiosError(error);
    const hasResponse = !!error.response;
    const hasRequest = !!error.request && !error.response;

    let category: ErrorCategory = 'none';
    if (hasResponse) {
      category = 'response';
    } else if (hasRequest) {
      category = 'request';
    } else if (isAxiosError) {
      category = 'setup';
    }

    return {
      category,
      code: error.code,
      statusCode: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      isAxiosError,
      hasResponse,
      hasRequest
    };
  };

  const sendErrorRequest = async (statusCode: number) => {
    setStatus('loading');
    setErrorDetails(null);

    try {
      const config: any = {
        timeout: 10000
      };

      if (validateStatus) {
        config.validateStatus = (status: number) => {
          return status === statusCode;
        };
      }

      await axios.get(`http://localhost:3001/api/error/${statusCode}`, config);
      setStatus('success');
    } catch (err: any) {
      const details = categorizeError(err);
      setErrorDetails(details);
      setStatus('error');
    }
  };

  const sendNetworkError = async () => {
    setStatus('loading');
    setErrorDetails(null);

    try {
      await axios.get('http://localhost:9999/nonexistent', {
        timeout: 2000
      });
      setStatus('success');
    } catch (err: any) {
      const details = categorizeError(err);
      setErrorDetails(details);
      setStatus('error');
    }
  };

  const sendTimeoutError = async () => {
    setStatus('loading');
    setErrorDetails(null);

    try {
      await axios.get('http://localhost:3001/api/slow?delay=10000', {
        timeout: 500
      });
      setStatus('success');
    } catch (err: any) {
      const details = categorizeError(err);
      setErrorDetails(details);
      setStatus('error');
    }
  };

  const getCategoryColor = (category: ErrorCategory) => {
    switch (category) {
      case 'response':
        return '#ef4444';
      case 'request':
        return '#f59e0b';
      case 'setup':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  };

  const getCategoryDescription = (category: ErrorCategory) => {
    switch (category) {
      case 'response':
        return 'Server responded with error status (has error.response)';
      case 'request':
        return 'Request sent but no response received (has error.request, no error.response)';
      case 'setup':
        return 'Error in request setup/configuration';
      default:
        return 'Unknown error type';
    }
  };

  return (
    <section className="test-section">
      <header className="test-section-header">
        <h2 className="test-section-title">Error Handling</h2>
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
            <li><strong>Error Categories</strong> → Response errors (has error.response), Request errors (has error.request), Setup errors</li>
            <li><strong>Error Codes</strong> → <code>ERR_BAD_REQUEST</code>, <code>ECONNABORTED</code>, <code>ECONNREFUSED</code>, etc.</li>
            <li><strong>Type Checking</strong> → <code>axios.isAxiosError(error)</code> - Type guard for Axios errors</li>
            <li><strong>validateStatus</strong> → <code>validateStatus: (status) =&gt; status === 200</code> - Custom success validation</li>
            <li>All response errors include status code, status text, and response data</li>
          </ul>
        </div>
      )}

      {showTests && (
        <div className="what-this-tests">
          <h4>✓ WHAT THIS TESTS</h4>
          <ul>
            <li>✅ Response errors - Server returned error status (4xx, 5xx)</li>
            <li>✅ Request errors - No response received (network failure, timeout)</li>
            <li>✅ Error categorization - Distinguish between error types</li>
            <li>✅ Error codes - Axios error code identification</li>
            <li>✅ isAxiosError type guard - Check if error is from Axios</li>
            <li>✅ validateStatus - Custom response validation</li>
          </ul>
        </div>
      )}

      <DisplayCard title="Error Simulation">
        <div>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', fontSize: '0.875rem' }}>
            <input
              type="checkbox"
              checked={validateStatus}
              onChange={(e) => setValidateStatus(e.target.checked)}
              data-testid="validate-status-toggle"
              style={{ marginRight: '0.5rem' }}
            />
            <strong>Use validateStatus</strong> - Makes error status codes resolve as successful
          </label>
        </div>

        <div>
          <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>HTTP Error Status Codes</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
            {[400, 401, 403, 404, 422, 500, 502, 503].map(code => (
              <button
                key={code}
                onClick={() => sendErrorRequest(code)}
                data-testid={`error-${code}`}
                disabled={status === 'loading'}
                style={{
                  padding: '0.5rem',
                  fontSize: '0.875rem',
                  background: 'white',
                  border: '2px solid var(--error-color)',
                  color: 'var(--error-color)'
                }}
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Other Error Types</h4>
          <div className="button-group">
            <button
              onClick={sendNetworkError}
              data-testid="network-error"
              disabled={status === 'loading'}
              style={{
                background: 'white',
                border: '2px solid #f59e0b',
                color: '#f59e0b'
              }}
            >
              Network Error
            </button>
            <button
              onClick={sendTimeoutError}
              data-testid="timeout-error"
              disabled={status === 'loading'}
              style={{
                background: 'white',
                border: '2px solid #f59e0b',
                color: '#f59e0b'
              }}
            >
              Timeout Error
            </button>
          </div>
        </div>
      </DisplayCard>

      {errorDetails && (
        <DisplayCard title="Error Analysis">
          <div style={{
            padding: '1rem',
            background: '#fef2f2',
            border: `2px solid ${getCategoryColor(errorDetails.category)}`,
            borderRadius: 'var(--border-radius)',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{
                background: getCategoryColor(errorDetails.category),
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '4px',
                fontSize: '0.875rem',
                fontWeight: 600,
                textTransform: 'uppercase'
              }}>
                {errorDetails.category} Error
              </span>
              {errorDetails.isAxiosError && (
                <span style={{
                  background: '#10b981',
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>
                  isAxiosError: true
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.875rem', color: '#991b1b', margin: '0.5rem 0' }}>
              {getCategoryDescription(errorDetails.category)}
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>Error Message</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{errorDetails.message}</p>
            </div>

            {errorDetails.code && (
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>Error Code</h4>
                <code style={{
                  fontSize: '0.875rem',
                  background: 'var(--bg-secondary)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px'
                }}>
                  {errorDetails.code}
                </code>
              </div>
            )}

            {errorDetails.statusCode && (
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>HTTP Status</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {errorDetails.statusCode} {errorDetails.statusText}
                </p>
              </div>
            )}
          </div>

          <div style={{
            padding: '1rem',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--border-radius)',
            fontSize: '0.875rem'
          }}>
            <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Error Properties</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem', fontFamily: 'monospace' }}>
              <span style={{ fontWeight: 600 }}>error.response:</span>
              <span style={{ color: errorDetails.hasResponse ? 'var(--success-color)' : 'var(--error-color)' }}>
                {errorDetails.hasResponse ? '✓ Present' : '✗ Not present'}
              </span>

              <span style={{ fontWeight: 600 }}>error.request:</span>
              <span style={{ color: errorDetails.hasRequest ? 'var(--success-color)' : 'var(--error-color)' }}>
                {errorDetails.hasRequest ? '✓ Present' : '✗ Not present'}
              </span>

              <span style={{ fontWeight: 600 }}>axios.isAxiosError():</span>
              <span style={{ color: errorDetails.isAxiosError ? 'var(--success-color)' : 'var(--error-color)' }}>
                {errorDetails.isAxiosError ? '✓ true' : '✗ false'}
              </span>
            </div>
          </div>
        </DisplayCard>
      )}

      <DisplayCard title="Axios Error Codes Reference">
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.875rem'
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                <th style={{ textAlign: 'left', padding: '0.5rem', fontWeight: 600 }}>Error Code</th>
                <th style={{ textAlign: 'left', padding: '0.5rem', fontWeight: 600 }}>Description</th>
                <th style={{ textAlign: 'left', padding: '0.5rem', fontWeight: 600 }}>Category</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.5rem' }}><code>ERR_BAD_REQUEST</code></td>
                <td style={{ padding: '0.5rem' }}>Server responded with 4xx status</td>
                <td style={{ padding: '0.5rem' }}>Response</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.5rem' }}><code>ERR_BAD_RESPONSE</code></td>
                <td style={{ padding: '0.5rem' }}>Server responded with 5xx status</td>
                <td style={{ padding: '0.5rem' }}>Response</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.5rem' }}><code>ECONNABORTED</code></td>
                <td style={{ padding: '0.5rem' }}>Request timeout</td>
                <td style={{ padding: '0.5rem' }}>Request</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.5rem' }}><code>ETIMEDOUT</code></td>
                <td style={{ padding: '0.5rem' }}>Connection timeout</td>
                <td style={{ padding: '0.5rem' }}>Request</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.5rem' }}><code>ERR_NETWORK</code></td>
                <td style={{ padding: '0.5rem' }}>Network error</td>
                <td style={{ padding: '0.5rem' }}>Request</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.5rem' }}><code>ECONNREFUSED</code></td>
                <td style={{ padding: '0.5rem' }}>Connection refused by server</td>
                <td style={{ padding: '0.5rem' }}>Request</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.5rem' }}><code>ERR_CANCELED</code></td>
                <td style={{ padding: '0.5rem' }}>Request canceled (abort)</td>
                <td style={{ padding: '0.5rem' }}>Request</td>
              </tr>
              <tr>
                <td style={{ padding: '0.5rem' }}><code>ERR_BAD_OPTION_VALUE</code></td>
                <td style={{ padding: '0.5rem' }}>Invalid config option</td>
                <td style={{ padding: '0.5rem' }}>Setup</td>
              </tr>
            </tbody>
          </table>
        </div>
      </DisplayCard>

      <DisplayCard title="Error Handling Patterns">
        <div style={{ fontSize: '0.875rem' }}>
          <h4 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Error Categorization</h4>
          <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
            <li><strong>Response Error:</strong> Server sent error status (has error.response)</li>
            <li><strong>Request Error:</strong> No response (has error.request, no error.response)</li>
            <li><strong>Setup Error:</strong> Configuration issue (no error.request, no error.response)</li>
          </ul>

          <h4 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Code Example</h4>
          <pre style={{
            background: 'var(--bg-secondary)',
            padding: '1rem',
            borderRadius: 'var(--border-radius)',
            overflow: 'auto',
            fontSize: '0.75rem'
          }}>
{`try {
  const res = await axios.get('/api/data');
} catch (error) {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      // Response error (4xx, 5xx)
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else if (error.request) {
      // Request error (no response)
      console.log('No response received');
    } else {
      // Setup error
      console.log('Setup error:', error.message);
    }
  } else {
    // Non-Axios error
    console.log('Unexpected error:', error);
  }
}`}
          </pre>
        </div>
      </DisplayCard>
    </section>
  );
}
