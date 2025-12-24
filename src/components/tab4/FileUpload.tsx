import { useState, useRef } from 'react';
import { Settings, CheckCircle, Upload, X } from 'lucide-react';
import { DisplayCard } from '../shared/DisplayCard';
import axios from 'axios';

interface UploadedFile {
  name: string;
  size: number;
  type: string;
}

export default function FileUpload() {
  const [showSetup, setShowSetup] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>('idle');
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [multipleMode, setMultipleMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multipleFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadProgress(0);
      setUploadStatus('idle');
      setUploadedFile(null);
    }
  };

  const handleMultipleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
      setUploadProgress(0);
      setUploadStatus('idle');
      setUploadedFiles([]);
    }
  };

  const uploadSingleFile = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      const res = await axios.post('http://localhost:3001/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        }
      });

      setUploadedFile(res.data.file);
      setUploadStatus('success');
    } catch (err: any) {
      setUploadStatus('error');
      console.error('Upload error:', err);
    }
  };

  const uploadMultipleFiles = async () => {
    if (selectedFiles.length === 0) return;

    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('files', file);
    });

    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      const res = await axios.post('http://localhost:3001/api/upload/multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        }
      });

      setUploadedFiles(res.data.files);
      setUploadStatus('success');
    } catch (err: any) {
      setUploadStatus('error');
      console.error('Upload error:', err);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setSelectedFiles([]);
    setUploadProgress(0);
    setUploadStatus('idle');
    setUploadedFile(null);
    setUploadedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (multipleFileInputRef.current) multipleFileInputRef.current.value = '';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <section className="test-section">
      <header className="test-section-header">
        <h2 className="test-section-title">File Upload</h2>
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
            <li><strong>File Input</strong> → Select files using &lt;input type="file"&gt;</li>
            <li><strong>FormData</strong> → <code>const formData = new FormData(); formData.append('file', file)</code></li>
            <li><strong>Content-Type</strong> → <code>headers: &#123; 'Content-Type': 'multipart/form-data' &#125;</code></li>
            <li><strong>Progress Tracking</strong> → <code>onUploadProgress: (progressEvent) =&gt; &#123; ... &#125;</code></li>
            <li><strong>Multiple Files</strong> → Use <code>multiple</code> attribute and append each file to FormData</li>
          </ul>
        </div>
      )}

      {showTests && (
        <div className="what-this-tests">
          <h4>✓ WHAT THIS TESTS</h4>
          <ul>
            <li>✅ Single file upload - Upload one file at a time</li>
            <li>✅ Multiple file upload - Upload multiple files simultaneously</li>
            <li>✅ FormData API - Create multipart/form-data requests</li>
            <li>✅ Upload progress tracking - Monitor upload progress in real-time</li>
            <li>✅ File metadata - Display file name, size, and type</li>
          </ul>
        </div>
      )}

      <DisplayCard title="Upload Mode">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <button
            onClick={() => { setMultipleMode(false); clearSelection(); }}
            data-testid="single-mode"
            className={!multipleMode ? 'active' : ''}
            style={{
              padding: '0.5rem 1rem',
              background: !multipleMode ? 'var(--primary-color)' : 'white',
              color: !multipleMode ? 'white' : 'var(--primary-color)',
              border: '2px solid var(--primary-color)'
            }}
          >
            Single File
          </button>
          <button
            onClick={() => { setMultipleMode(true); clearSelection(); }}
            data-testid="multiple-mode"
            className={multipleMode ? 'active' : ''}
            style={{
              padding: '0.5rem 1rem',
              background: multipleMode ? 'var(--primary-color)' : 'white',
              color: multipleMode ? 'white' : 'var(--primary-color)',
              border: '2px solid var(--primary-color)'
            }}
          >
            Multiple Files
          </button>
        </div>
      </DisplayCard>

      {!multipleMode ? (
        <DisplayCard title="Single File Upload">
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: 'var(--primary-color)',
              color: 'white',
              borderRadius: 'var(--border-radius)',
              cursor: 'pointer',
              fontWeight: 500
            }}>
              <Upload size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Choose File
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                data-testid="file-input"
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {selectedFile && (
            <div style={{
              padding: '1rem',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--border-radius)',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{selectedFile.name}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Unknown type'}
                  </div>
                </div>
                <button
                  onClick={clearSelection}
                  data-testid="clear-file"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    color: 'var(--error-color)'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {uploadStatus === 'uploading' && (
                <div style={{ marginTop: '1rem' }}>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: '#e5e7eb',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${uploadProgress}%`,
                      height: '100%',
                      background: 'var(--success-color)',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <div style={{
                    marginTop: '0.5rem',
                    fontSize: '0.875rem',
                    textAlign: 'center',
                    fontWeight: 600
                  }}>
                    {uploadProgress}%
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="button-group">
            <button
              onClick={uploadSingleFile}
              data-testid="upload-single"
              disabled={!selectedFile || uploadStatus === 'uploading'}
              style={{
                background: 'var(--success-color)',
                color: 'white'
              }}
            >
              <Upload size={16} style={{ marginRight: '0.5rem' }} />
              Upload File
            </button>
          </div>

          {uploadStatus === 'success' && uploadedFile && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: '#f0fdf4',
              border: '2px solid var(--success-color)',
              borderRadius: 'var(--border-radius)'
            }}>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--success-color)', fontWeight: 600 }}>
                ✓ Upload Successful
              </h4>
              <div style={{ fontSize: '0.875rem' }}>
                <div><strong>File:</strong> {uploadedFile.name}</div>
                <div><strong>Size:</strong> {formatFileSize(uploadedFile.size)}</div>
                <div><strong>Type:</strong> {uploadedFile.type}</div>
              </div>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: '#fef2f2',
              border: '2px solid var(--error-color)',
              borderRadius: 'var(--border-radius)',
              color: 'var(--error-color)'
            }}>
              ✗ Upload failed. Please try again.
            </div>
          )}
        </DisplayCard>
      ) : (
        <DisplayCard title="Multiple File Upload">
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: 'var(--primary-color)',
              color: 'white',
              borderRadius: 'var(--border-radius)',
              cursor: 'pointer',
              fontWeight: 500
            }}>
              <Upload size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Choose Files
              <input
                ref={multipleFileInputRef}
                type="file"
                multiple
                onChange={handleMultipleFileSelect}
                data-testid="multiple-file-input"
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {selectedFiles.length > 0 && (
            <div style={{
              padding: '1rem',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--border-radius)',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ fontWeight: 600 }}>{selectedFiles.length} file(s) selected</div>
                <button
                  onClick={clearSelection}
                  data-testid="clear-files"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    color: 'var(--error-color)'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {selectedFiles.map((file, index) => (
                <div key={index} style={{
                  padding: '0.75rem',
                  background: 'white',
                  borderRadius: '4px',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{file.name}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                  </div>
                </div>
              ))}

              {uploadStatus === 'uploading' && (
                <div style={{ marginTop: '1rem' }}>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: '#e5e7eb',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${uploadProgress}%`,
                      height: '100%',
                      background: 'var(--success-color)',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <div style={{
                    marginTop: '0.5rem',
                    fontSize: '0.875rem',
                    textAlign: 'center',
                    fontWeight: 600
                  }}>
                    {uploadProgress}%
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="button-group">
            <button
              onClick={uploadMultipleFiles}
              data-testid="upload-multiple"
              disabled={selectedFiles.length === 0 || uploadStatus === 'uploading'}
              style={{
                background: 'var(--success-color)',
                color: 'white'
              }}
            >
              <Upload size={16} style={{ marginRight: '0.5rem' }} />
              Upload {selectedFiles.length} File(s)
            </button>
          </div>

          {uploadStatus === 'success' && uploadedFiles.length > 0 && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: '#f0fdf4',
              border: '2px solid var(--success-color)',
              borderRadius: 'var(--border-radius)'
            }}>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--success-color)', fontWeight: 600 }}>
                ✓ {uploadedFiles.length} File(s) Uploaded Successfully
              </h4>
              <div style={{ fontSize: '0.875rem' }}>
                {uploadedFiles.map((file, index) => (
                  <div key={index} style={{ marginBottom: '0.5rem' }}>
                    <strong>{file.name}</strong> - {formatFileSize(file.size)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: '#fef2f2',
              border: '2px solid var(--error-color)',
              borderRadius: 'var(--border-radius)',
              color: 'var(--error-color)'
            }}>
              ✗ Upload failed. Please try again.
            </div>
          )}
        </DisplayCard>
      )}

      <DisplayCard title="Code Example">
        <pre style={{
          background: 'var(--bg-secondary)',
          padding: '1rem',
          borderRadius: 'var(--border-radius)',
          overflow: 'auto',
          fontSize: '0.75rem'
        }}>
{`// Single file upload
const formData = new FormData();
formData.append('file', file);

const response = await axios.post('/api/upload', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  },
  onUploadProgress: (progressEvent) => {
    const progress = (progressEvent.loaded / progressEvent.total) * 100;
    console.log(\`Upload Progress: \${progress}%\`);
  }
});

// Multiple file upload
const formData = new FormData();
files.forEach(file => {
  formData.append('files', file);
});

await axios.post('/api/upload/multiple', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  onUploadProgress: (progressEvent) => { /* ... */ }
});`}
        </pre>
      </DisplayCard>
    </section>
  );
}
