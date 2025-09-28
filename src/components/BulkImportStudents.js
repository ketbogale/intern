import React, { useState, useMemo } from 'react';
import './EmailChangeVerification.css';

// CSV columns supported
// Required: id, name
// Optional: department, photoUrl
const REQUIRED_HEADERS = ['id', 'name'];
const OPTIONAL_HEADERS = ['department', 'photoUrl'];

function simpleParseCSV(text) {
  // Basic CSV parser for comma-separated values without quoted commas.
  // Assumes headers in first row.
  // Lines with only whitespace are ignored.
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw || raw.trim() === '') continue;
    const cols = raw.split(',').map(c => c.trim());
    rows.push(cols);
  }
  return { headers, rows };
}

function validateAndNormalize(headers, rows) {
  const lowerHeaders = headers.map(h => h.toLowerCase());
  const headerSet = new Set(lowerHeaders);
  const errors = [];

  for (const req of REQUIRED_HEADERS) {
    if (!headerSet.has(req)) {
      errors.push(`Missing required column: ${req}`);
    }
  }
  if (errors.length) return { records: [], errors };

  const indexOf = (name) => lowerHeaders.indexOf(name);

  const records = [];
  const perRowErrors = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const get = (key) => {
      const idx = indexOf(key);
      if (idx === -1) return '';
      return (row[idx] ?? '').trim();
    };

    const id = get('id');
    const name = get('name');
    const department = get('department');
    const photoUrl = get('photourl');

    if (!id || !name) {
      perRowErrors.push({ line: i + 2, error: 'Missing id or name' });
      continue;
    }

    records.push({ id, name, department, photoUrl });
  }

  return { records, errors: perRowErrors };
}

const BulkImportStudents = () => {
  const [file, setFile] = useState(null);
  const [parseResult, setParseResult] = useState(null); // { headers, rows, records, errors }
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ sent: 0, total: 0, added: 0, skipped: 0, errors: 0 });
  const [message, setMessage] = useState('');

  const sampleTemplate = useMemo(() => {
    return [
      [...REQUIRED_HEADERS, ...OPTIONAL_HEADERS].join(','),
      'S12345,John Doe,Computer Science,https://example.com/john.jpg',
      'S67890,Jane Smith,Mathematics,'
    ].join('\n');
  }, []);

  const handleDownloadTemplate = () => {
    const blob = new Blob([sampleTemplate], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async (e) => {
    const f = e.target.files && e.target.files[0];
    setMessage('');
    setParseResult(null);
    setFile(f || null);

    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.csv')) {
      setMessage('Please select a .csv file.');
      return;
    }

    try {
      const text = await f.text();
      const { headers, rows } = simpleParseCSV(text);
      const validation = validateAndNormalize(headers, rows);
      setParseResult({ headers, rows, ...validation });
    } catch (err) {
      setMessage('Failed to parse CSV: ' + (err.message || String(err)));
    }
  };

  const handleUpload = async () => {
    if (!parseResult || !parseResult.records || parseResult.records.length === 0) {
      setMessage('No valid records to upload.');
      return;
    }

    setUploading(true);
    setMessage('');

    const batchSize = 500; // reasonable default for 10k scale
    const total = parseResult.records.length;
    let sent = 0;
    let totalAdded = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    try {
      while (sent < total) {
        const batch = parseResult.records.slice(sent, sent + batchSize);
        const res = await fetch('/api/students/add-multiple', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ students: batch }),
          credentials: 'include'
        });
        const data = await res.json();
        if (!res.ok) {
          totalErrors += batch.length;
        } else {
          totalAdded += data.summary?.added || 0;
          totalSkipped += data.summary?.skipped || 0;
          totalErrors += data.summary?.errors || 0;
        }
        sent += batch.length;
        setUploadProgress({ sent: Math.min(sent, total), total, added: totalAdded, skipped: totalSkipped, errors: totalErrors });
      }

      setMessage(`✅ Import finished. Added: ${totalAdded}, Skipped: ${totalSkipped}, Errors: ${totalErrors}.`);
    } catch (err) {
      setMessage('❌ Upload failed: ' + (err.message || String(err)));
    } finally {
      setUploading(false);
    }
  };

  const handleBackToDashboard = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div className="email-verification-container">
      <div className="email-verification-card" style={{ maxWidth: '900px', width: '95%' }}>
        <div className="email-verification-header">
          <h1>Bulk Import Students</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: 8 }}>
            Upload a CSV file to add many students at once. Required columns: <strong>id</strong>, <strong>name</strong>.
            Optional: <strong>department</strong>, <strong>photoUrl</strong>.
          </p>
        </div>

        <div className="email-verification-content">
          {message && (
            <div className={`result-section ${message.startsWith('✅') ? 'success' : message.startsWith('❌') ? 'error' : ''}`}>
              <div className="result-message">
                <p>{message}</p>
              </div>
            </div>
          )}

          <div className="form-section">
            <div className="form-group">
              <label>CSV File</label>
              <input type="file" accept=".csv" onChange={handleFileChange} />
            </div>

            <div className="form-actions" style={{ gap: 12 }}>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                style={{
                  padding: '12px 18px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: 10,
                  fontWeight: 600, cursor: 'pointer'
                }}
              >
                Download CSV Template
              </button>

              <button
                type="button"
                onClick={handleBackToDashboard}
                style={{
                  padding: '12px 18px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: 10,
                  fontWeight: 600, cursor: 'pointer'
                }}
              >
                Back to Dashboard
              </button>

              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading || !parseResult || (parseResult.records || []).length === 0}
                style={{
                  padding: '12px 18px', backgroundColor: uploading ? '#d1d5db' : '#10b981', color: 'white', border: 'none', borderRadius: 10,
                  fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer'
                }}
              >
                {uploading ? 'Uploading...' : 'Start Import'}
              </button>
            </div>
          </div>

          {parseResult && (
            <div className="form-section" style={{ marginTop: 20 }}>
              <h3 style={{ marginBottom: 10 }}>Preview</h3>
              <div style={{ color: '#6b7280', fontSize: 14, marginBottom: 10 }}>
                Parsed rows: <strong>{parseResult.rows.length}</strong> | Valid records: <strong>{(parseResult.records || []).length}</strong> | Errors: <strong>{(parseResult.errors || []).length}</strong>
              </div>

              {(parseResult.errors || []).length > 0 && (
                <div className="result-section error" style={{ maxHeight: 180, overflow: 'auto' }}>
                  <div className="result-message">
                    <p>Top errors (first 10):</p>
                    <ul style={{ margin: 0 }}>
                      {parseResult.errors.slice(0, 10).map((e, idx) => (
                        <li key={idx}>Line {e.line}: {e.error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {(parseResult.records || []).length > 0 && (
                <div style={{ maxHeight: 300, overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc' }}>
                        {['id','name','department','photoUrl'].map(h => (
                          <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parseResult.records.slice(0, 20).map((rec, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>{rec.id}</td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>{rec.name}</td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>{rec.department || ''}</td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>{rec.photoUrl || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {uploading && (
                <div style={{ marginTop: 12, color: '#374151' }}>
                  Uploading: {uploadProgress.sent}/{uploadProgress.total} | Added: {uploadProgress.added} | Skipped: {uploadProgress.skipped} | Errors: {uploadProgress.errors}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkImportStudents;
