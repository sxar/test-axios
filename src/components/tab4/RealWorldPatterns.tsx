import { useState, useRef } from 'react';
import { Settings, CheckCircle, RefreshCw, Search } from 'lucide-react';
import { DisplayCard } from '../shared/DisplayCard';
import axios from 'axios';

export default function RealWorldPatterns() {
  const [showSetup, setShowSetup] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [activePattern, setActivePattern] = useState<'retry' | 'pagination' | 'concurrent' | 'debounce'>('retry');

  const [retryAttempt, setRetryAttempt] = useState(0);
  const [retryStatus, setRetryStatus] = useState<string>('idle');
  const [retryData, setRetryData] = useState<any>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);
  const [paginationData, setPaginationData] = useState<any>(null);
  const [paginationStatus, setPaginationStatus] = useState<string>('idle');

  const [concurrentResults, setConcurrentResults] = useState<any[]>([]);
  const [concurrentStatus, setConcurrentStatus] = useState<string>('idle');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchStatus, setSearchStatus] = useState<string>('idle');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const retryWithBackoff = async (maxRetries = 3) => {
    setRetryStatus('loading');
    setRetryAttempt(0);
    setRetryData(null);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        setRetryAttempt(attempt + 1);

        const res = await axios.get('http://localhost:3001/api/flaky');

        setRetryData({
          success: true,
          attempt: attempt + 1,
          data: res.data
        });
        setRetryStatus('success');
        return;
      } catch (err: any) {
        if (attempt === maxRetries) {
          setRetryData({
            success: false,
            attempt: attempt + 1,
            error: err.message
          });
          setRetryStatus('error');
        } else {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  };

  const isLastPage = paginationData !== null && currentPage >= paginationData.totalPages;

  const fetchPage = async (page: number) => {
    setPaginationStatus('loading');

    try {
      const res = await axios.get('http://localhost:3001/api/users', {
        params: {
          page,
          limit: pageSize
        }
      });

      setPaginationData(res.data);
      setCurrentPage(page);
      setPaginationStatus('success');
    } catch (err: any) {
      setPaginationStatus('error');
    }
  };

  const fetchConcurrent = async () => {
    setConcurrentStatus('loading');
    setConcurrentResults([]);

    try {
      const [users, posts, comments, stats] = await Promise.all([
        axios.get('http://localhost:3001/api/users'),
        axios.get('http://localhost:3001/api/posts'),
        axios.get('http://localhost:3001/api/comments'),
        axios.get('http://localhost:3001/api/stats')
      ]);

      setConcurrentResults([
        { name: 'Users', count: users.data.data?.length || 0 },
        { name: 'Posts', count: posts.data.length || 0 },
        { name: 'Comments', count: comments.data.length || 0 },
        { name: 'Stats', count: Object.keys(stats.data).length || 0 }
      ]);
      setConcurrentStatus('success');
    } catch (err: any) {
      setConcurrentStatus('error');
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!value.trim()) {
      setSearchResults(null);
      setSearchStatus('idle');
      return;
    }

    setSearchStatus('debouncing');

    debounceTimerRef.current = setTimeout(async () => {
      setSearchStatus('loading');

      try {
        const res = await axios.get('http://localhost:3001/api/users', {
          params: {
            search: value
          }
        });

        setSearchResults(res.data);
        setSearchStatus('success');
      } catch (err: any) {
        setSearchStatus('error');
      }
    }, 500);
  };

  return (
    <section className="test-section">
      <header className="test-section-header">
        <h2 className="test-section-title">Real-World Patterns</h2>
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
            <li><strong>Retry with Backoff</strong> → Exponential delay: 1s, 2s, 4s, 8s</li>
            <li><strong>Pagination</strong> → <code>params: &#123; page, limit &#125;</code></li>
            <li><strong>Concurrent Requests</strong> → <code>Promise.all([req1, req2, req3])</code></li>
            <li><strong>Debounced Search</strong> → <code>setTimeout(() =&gt; axios.get(...), delay)</code></li>
            <li>These patterns are essential for production applications</li>
          </ul>
        </div>
      )}

      {showTests && (
        <div className="what-this-tests">
          <h4>✓ WHAT THIS TESTS</h4>
          <ul>
            <li>✅ Retry logic - Automatically retry failed requests with exponential backoff</li>
            <li>✅ Pagination - Load data in chunks with page navigation</li>
            <li>✅ Concurrent requests - Execute multiple requests simultaneously</li>
            <li>✅ Debounced search - Delay API calls until user stops typing</li>
          </ul>
        </div>
      )}

      <DisplayCard title="Pattern Selection">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
          <button
            onClick={() => setActivePattern('retry')}
            data-testid="pattern-retry"
            style={{
              padding: '0.75rem',
              background: activePattern === 'retry' ? 'var(--primary-color)' : 'white',
              color: activePattern === 'retry' ? 'white' : 'var(--primary-color)',
              border: '2px solid var(--primary-color)',
              borderRadius: 'var(--border-radius)',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Retry Logic
          </button>
          <button
            onClick={() => setActivePattern('pagination')}
            data-testid="pattern-pagination"
            style={{
              padding: '0.75rem',
              background: activePattern === 'pagination' ? 'var(--primary-color)' : 'white',
              color: activePattern === 'pagination' ? 'white' : 'var(--primary-color)',
              border: '2px solid var(--primary-color)',
              borderRadius: 'var(--border-radius)',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Pagination
          </button>
          <button
            onClick={() => setActivePattern('concurrent')}
            data-testid="pattern-concurrent"
            style={{
              padding: '0.75rem',
              background: activePattern === 'concurrent' ? 'var(--primary-color)' : 'white',
              color: activePattern === 'concurrent' ? 'white' : 'var(--primary-color)',
              border: '2px solid var(--primary-color)',
              borderRadius: 'var(--border-radius)',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Concurrent
          </button>
          <button
            onClick={() => setActivePattern('debounce')}
            data-testid="pattern-debounce"
            style={{
              padding: '0.75rem',
              background: activePattern === 'debounce' ? 'var(--primary-color)' : 'white',
              color: activePattern === 'debounce' ? 'white' : 'var(--primary-color)',
              border: '2px solid var(--primary-color)',
              borderRadius: 'var(--border-radius)',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Debounced Search
          </button>
        </div>
      </DisplayCard>

      {activePattern === 'retry' && (
        <>
          <DisplayCard title="Retry with Exponential Backoff">
            <p style={{ fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              Automatically retry failed requests with increasing delays (1s, 2s, 4s). The /api/flaky endpoint randomly fails to simulate unreliable networks.
            </p>

            <button
              onClick={() => retryWithBackoff(3)}
              data-testid="retry-button"
              disabled={retryStatus === 'loading'}
              style={{
                background: 'var(--primary-color)',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: 'var(--border-radius)',
                border: 'none',
                cursor: retryStatus === 'loading' ? 'not-allowed' : 'pointer',
                fontWeight: 500,
                opacity: retryStatus === 'loading' ? 0.6 : 1
              }}
            >
              <RefreshCw size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
              {retryStatus === 'loading' ? `Retrying... (Attempt ${retryAttempt}/4)` : 'Test Retry Logic'}
            </button>

            {retryData && (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                background: retryData.success ? '#f0fdf4' : '#fef2f2',
                border: `2px solid ${retryData.success ? 'var(--success-color)' : 'var(--error-color)'}`,
                borderRadius: 'var(--border-radius)'
              }}>
                <h4 style={{ marginBottom: '0.5rem', fontWeight: 600, color: retryData.success ? 'var(--success-color)' : 'var(--error-color)' }}>
                  {retryData.success ? '✓ Success!' : '✗ Failed'}
                </h4>
                <div style={{ fontSize: '0.875rem' }}>
                  <div><strong>Attempts:</strong> {retryData.attempt}</div>
                  {retryData.success ? (
                    <div><strong>Message:</strong> {retryData.data.message}</div>
                  ) : (
                    <div><strong>Error:</strong> {retryData.error}</div>
                  )}
                </div>
              </div>
            )}
          </DisplayCard>

          <DisplayCard title="Code Example">
            <pre style={{
              background: 'var(--bg-secondary)',
              padding: '1rem',
              borderRadius: 'var(--border-radius)',
              overflow: 'auto',
              fontSize: '0.75rem'
            }}>
{`async function retryWithBackoff(maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await axios.get('/api/data');
      return res.data; // Success!
    } catch (err) {
      if (attempt === maxRetries) {
        throw err; // Final attempt failed
      }
      // Exponential backoff: 1s, 2s, 4s, 8s
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}`}
            </pre>
          </DisplayCard>
        </>
      )}

      {activePattern === 'pagination' && (
        <>
          <DisplayCard title="Paginated Data Loading">
            <p style={{ fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              Load data in pages to improve performance and user experience. Navigate through pages using previous/next buttons.
            </p>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
              <button
                onClick={() => fetchPage(currentPage - 1)}
                data-testid="prev-page"
                disabled={currentPage === 1 || paginationStatus === 'loading'}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--border-radius)',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.4 : 1
                }}
              >
                Previous
              </button>

              <span style={{ fontWeight: 600 }}>Page {currentPage}</span>

              <button
                onClick={() => fetchPage(currentPage + 1)}
                data-testid="next-page"
                disabled={isLastPage || paginationStatus === 'loading'}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--border-radius)',
                  cursor: isLastPage ? 'not-allowed' : 'pointer',
                  opacity: isLastPage ? 0.4 : 1
                }}
              >
                Next
              </button>

              <button
                onClick={() => fetchPage(1)}
                data-testid="load-first-page"
                style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--success-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--border-radius)',
                  cursor: 'pointer'
                }}
              >
                Load First Page
              </button>
            </div>

            {paginationData && (
              <div style={{
                padding: '1rem',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--border-radius)'
              }}>
                <div style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
                  <strong>Showing:</strong> {paginationData.total} users •
                  Page {paginationData.page} of {paginationData.totalPages}
                </div>
                <div style={{ fontSize: '0.875rem' }}>
                  {paginationData.data.map((user: any, index: number) => (
                    <div key={index} style={{
                      padding: '0.5rem',
                      background: 'white',
                      borderRadius: '4px',
                      marginBottom: '0.5rem'
                    }}>
                      {user.name} - {user.email}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DisplayCard>

          <DisplayCard title="Code Example">
            <pre style={{
              background: 'var(--bg-secondary)',
              padding: '1rem',
              borderRadius: 'var(--border-radius)',
              overflow: 'auto',
              fontSize: '0.75rem'
            }}>
{`// Fetch paginated data
const response = await axios.get('/api/users', {
  params: {
    page: 1,
    limit: 10
  }
});

// Response structure
{
  data: [...], // Current page items
  total: 50,
  totalPages: 5,
  page: 1,
  limit: 10
}`}
            </pre>
          </DisplayCard>
        </>
      )}

      {activePattern === 'concurrent' && (
        <>
          <DisplayCard title="Concurrent Requests">
            <p style={{ fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              Execute multiple independent requests simultaneously using Promise.all() for better performance.
            </p>

            <button
              onClick={fetchConcurrent}
              data-testid="fetch-concurrent"
              disabled={concurrentStatus === 'loading'}
              style={{
                background: 'var(--primary-color)',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: 'var(--border-radius)',
                border: 'none',
                cursor: concurrentStatus === 'loading' ? 'not-allowed' : 'pointer',
                fontWeight: 500,
                opacity: concurrentStatus === 'loading' ? 0.6 : 1
              }}
            >
              {concurrentStatus === 'loading' ? 'Loading...' : 'Fetch All Data'}
            </button>

            {concurrentResults.length > 0 && (
              <div style={{
                marginTop: '1rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '1rem'
              }}>
                {concurrentResults.map((result, index) => (
                  <div key={index} style={{
                    padding: '1rem',
                    background: '#f0f9ff',
                    border: '2px solid var(--primary-color)',
                    borderRadius: 'var(--border-radius)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                      {result.count}
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: '0.25rem' }}>
                      {result.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DisplayCard>

          <DisplayCard title="Code Example">
            <pre style={{
              background: 'var(--bg-secondary)',
              padding: '1rem',
              borderRadius: 'var(--border-radius)',
              overflow: 'auto',
              fontSize: '0.75rem'
            }}>
{`// Execute multiple requests concurrently
const [users, posts, comments, stats] = await Promise.all([
  axios.get('/api/users'),
  axios.get('/api/posts'),
  axios.get('/api/comments'),
  axios.get('/api/stats')
]);

// All requests execute in parallel
// Returns when all complete (or first fails)`}
            </pre>
          </DisplayCard>
        </>
      )}

      {activePattern === 'debounce' && (
        <>
          <DisplayCard title="Debounced Search">
            <p style={{ fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              Delay API calls until user stops typing (500ms delay). Prevents excessive requests while typing.
            </p>

            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <Search size={20} style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)'
              }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                data-testid="search-input"
                placeholder="Search users by name..."
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 3rem',
                  border: '2px solid var(--border-color)',
                  borderRadius: 'var(--border-radius)',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            {searchStatus === 'debouncing' && (
              <div style={{
                padding: '1rem',
                background: '#fef3c7',
                border: '2px solid #f59e0b',
                borderRadius: 'var(--border-radius)',
                color: '#92400e',
                fontSize: '0.875rem'
              }}>
                ⏱ Waiting for you to finish typing...
              </div>
            )}

            {searchStatus === 'loading' && (
              <div style={{
                padding: '1rem',
                background: '#f0f9ff',
                border: '2px solid var(--primary-color)',
                borderRadius: 'var(--border-radius)',
                color: 'var(--primary-color)',
                fontSize: '0.875rem'
              }}>
                🔍 Searching...
              </div>
            )}

            {searchStatus === 'success' && searchResults && (
              <div style={{
                padding: '1rem',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--border-radius)'
              }}>
                <div style={{ marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>
                  Found {searchResults.pagination?.total || 0} results
                </div>
                {searchResults.data?.slice(0, 5).map((user: any, index: number) => (
                  <div key={index} style={{
                    padding: '0.5rem',
                    background: 'white',
                    borderRadius: '4px',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem'
                  }}>
                    <strong>{user.name}</strong> - {user.email}
                  </div>
                ))}
              </div>
            )}
          </DisplayCard>

          <DisplayCard title="Code Example">
            <pre style={{
              background: 'var(--bg-secondary)',
              padding: '1rem',
              borderRadius: 'var(--border-radius)',
              overflow: 'auto',
              fontSize: '0.75rem'
            }}>
{`// Debounced search implementation
let debounceTimer;

function handleSearch(query) {
  // Clear previous timer
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  // Set new timer
  debounceTimer = setTimeout(async () => {
    const results = await axios.get('/api/search', {
      params: { q: query }
    });
    // Update UI with results
  }, 500); // 500ms delay
}`}
            </pre>
          </DisplayCard>
        </>
      )}
    </section>
  );
}
