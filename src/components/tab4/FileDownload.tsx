import { useState } from 'react';
import { Settings, CheckCircle, Download } from 'lucide-react';
import { DisplayCard } from '../shared/DisplayCard';
import axios from 'axios';

export default function FileDownload() {
  const [showSetup, setShowSetup] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState<string>('idle');
  const [selectedFile, setSelectedFile] = useState('sample.pdf');
  const [responseType, setResponseType] = useState<'blob' | 'arraybuffer'>('blob');

  const availableFiles = [
    { name: 'sample.pdf', description: 'PDF Document (500KB)' },
    { name: 'image.jpg', description: 'JPEG Image (250KB)' },
    { name: 'data.json', description: 'JSON Data (10KB)' },
    { name: 'document.txt', description: 'Text File (5KB)' }
  ];

  const downloadFile = async () => {
    setDownloadStatus('downloading');
    setDownloadProgress(0);

    try {
      const res = await axios.get(`http://localhost:3001/api/download/${selectedFile}`, {
        responseType: responseType,
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setDownloadProgress(progress);
          }
        }
      });

      let blob: Blob;
      if (responseType === 'blob') {
        blob = res.data;
      } else {
        blob = new Blob([res.data]);
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = selectedFile;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setDownloadStatus('success');
      setTimeout(() => {
        setDownloadStatus('idle');
        setDownloadProgress(0);
      }, 2000);
    } catch (err: any) {
      setDownloadStatus('error');
      console.error('Download error:', err);
    }
  };

  return (
    <section className="test-section">
      <header className="test-section-header">
        <h2 className="test-section-title">File Download</h2>
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
            <li><strong>Response Type</strong> → <code>responseType: 'blob'</code> or <code>'arraybuffer'</code></li>
            <li><strong>Progress Tracking</strong> → <code>onDownloadProgress: (progressEvent) =&gt; &#123; ... &#125;</code></li>
            <li><strong>Blob URL</strong> → <code>window.URL.createObjectURL(blob)</code> - Creates downloadable URL</li>
            <li><strong>Programmatic Download</strong> → Create &lt;a&gt; element with download attribute and click it</li>
            <li><strong>Cleanup</strong> → <code>window.URL.revokeObjectURL(url)</code> - Free memory after download</li>
          </ul>
        </div>
      )}

      {showTests && (
        <div className="what-this-tests">
          <h4>✓ WHAT THIS TESTS</h4>
          <ul>
            <li>✅ File download - Download files programmatically</li>
            <li>✅ Download progress tracking - Monitor download progress in real-time</li>
            <li>✅ Response types - Use blob or arraybuffer for binary data</li>
            <li>✅ Blob URL creation - Convert response to downloadable URL</li>
            <li>✅ Multiple file types - Download PDFs, images, JSON, text files</li>
          </ul>
        </div>
      )}

      <DisplayCard title="File Selection">
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Select File to Download
          </label>
          <select
            value={selectedFile}
            onChange={(e) => setSelectedFile(e.target.value)}
            data-testid="file-select"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid var(--border-color)',
              borderRadius: 'var(--border-radius)',
              fontSize: '0.875rem'
            }}
          >
            {availableFiles.map(file => (
              <option key={file.name} value={file.name}>
                {file.name} - {file.description}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Response Type
          </label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                name="responseType"
                value="blob"
                checked={responseType === 'blob'}
                onChange={(e) => setResponseType(e.target.value as 'blob')}
                data-testid="response-type-blob"
                style={{ marginRight: '0.5rem' }}
              />
              <span>Blob</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                name="responseType"
                value="arraybuffer"
                checked={responseType === 'arraybuffer'}
                onChange={(e) => setResponseType(e.target.value as 'arraybuffer')}
                data-testid="response-type-arraybuffer"
                style={{ marginRight: '0.5rem' }}
              />
              <span>ArrayBuffer</span>
            </label>
          </div>
        </div>
      </DisplayCard>

      <DisplayCard title="Download">
        <div className="button-group">
          <button
            onClick={downloadFile}
            data-testid="download-button"
            disabled={downloadStatus === 'downloading'}
            style={{
              background: 'var(--primary-color)',
              color: 'white'
            }}
          >
            <Download size={16} style={{ marginRight: '0.5rem' }} />
            Download {selectedFile}
          </button>
        </div>

        {downloadStatus === 'downloading' && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{
              width: '100%',
              height: '8px',
              background: '#e5e7eb',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '0.5rem'
            }}>
              <div style={{
                width: `${downloadProgress}%`,
                height: '100%',
                background: 'var(--primary-color)',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <div style={{
              fontSize: '0.875rem',
              textAlign: 'center',
              fontWeight: 600,
              color: 'var(--primary-color)'
            }}>
              Downloading... {downloadProgress}%
            </div>
          </div>
        )}

        {downloadStatus === 'success' && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#f0fdf4',
            border: '2px solid var(--success-color)',
            borderRadius: 'var(--border-radius)',
            color: 'var(--success-color)',
            fontWeight: 600
          }}>
            ✓ Download completed successfully!
          </div>
        )}

        {downloadStatus === 'error' && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#fef2f2',
            border: '2px solid var(--error-color)',
            borderRadius: 'var(--border-radius)',
            color: 'var(--error-color)',
            fontWeight: 600
          }}>
            ✗ Download failed. Please try again.
          </div>
        )}
      </DisplayCard>

      <DisplayCard title="How It Works">
        <div style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
          <h4 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Download Process</h4>
          <ol style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
            <li>Request file with <code>responseType: 'blob'</code> or <code>'arraybuffer'</code></li>
            <li>Track download progress using <code>onDownloadProgress</code></li>
            <li>Convert response to Blob if necessary</li>
            <li>Create object URL using <code>window.URL.createObjectURL(blob)</code></li>
            <li>Create temporary &lt;a&gt; element with download attribute</li>
            <li>Programmatically click the link to trigger download</li>
            <li>Clean up by removing link and revoking object URL</li>
          </ol>

          <h4 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Key Differences</h4>
          <ul style={{ marginLeft: '1.5rem' }}>
            <li><strong>Blob:</strong> Recommended for downloads, browser-native binary format</li>
            <li><strong>ArrayBuffer:</strong> Raw binary data, requires conversion to Blob for download</li>
          </ul>
        </div>
      </DisplayCard>

      <DisplayCard title="Code Example">
        <pre style={{
          background: 'var(--bg-secondary)',
          padding: '1rem',
          borderRadius: 'var(--border-radius)',
          overflow: 'auto',
          fontSize: '0.75rem'
        }}>
{`// Download file with progress tracking
const response = await axios.get('/api/download/file.pdf', {
  responseType: 'blob',
  onDownloadProgress: (progressEvent) => {
    const progress = (progressEvent.loaded / progressEvent.total) * 100;
    console.log(\`Download Progress: \${progress}%\`);
  }
});

// Create downloadable URL and trigger download
const blob = response.data;
const url = window.URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'file.pdf';
document.body.appendChild(link);
link.click();

// Cleanup
document.body.removeChild(link);
window.URL.revokeObjectURL(url);`}
        </pre>
      </DisplayCard>
    </section>
  );
}
