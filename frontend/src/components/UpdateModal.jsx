import { useState, useEffect } from 'react';
import { downloadAndInstallUpdate } from '../utils/updater';
import { apiUrl, isCapacitor } from '../utils/api';

export default function UpdateModal({ open, onClose, updateInfo }) {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setDownloading(false);
      setProgress(0);
      setDownloaded(false);
      setError(null);
    }
  }, [open]);

  if (!open || !updateInfo) return null;

  const handleStartUpdate = async () => {
    setDownloading(true);
    setError(null);
    try {
      const res = await downloadAndInstallUpdate(updateInfo, (p) => {
        setProgress(p);
      });
      if (res?.ready) {
        setDownloaded(true);
      }
    } catch (err) {
      setError(err.message || 'Update failed to download');
      setDownloading(false);
    }
  };

  const handleApplyRestart = async () => {
    if (window.electronAPI?.applyUpdate) {
      window.electronAPI.applyUpdate();
      return;
    }

    // Android / Standalone Native Mode
    try {
      const res = await fetch(apiUrl('/api/system/install-update'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).then((r) => r.json());

      if (res?.needsPermission) {
        setError('Please enable "Install unknown apps" for Universal Shared, then tap Install & Restart again.');
        return;
      }
      if (res?.error) {
        setError(res.error);
        return;
      }
      onClose();
    } catch (e) {
      console.warn('Install trigger error:', e);
      setError(e.message || 'Failed to trigger package installer');
    }
  };

  return (
    <div className="modal-overlay" onClick={downloading ? undefined : onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.4rem' }}>✨</span>
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Update Available</h2>
          </div>
          {!downloading && (
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close modal">×</button>
          )}
        </div>

        <div style={{ padding: '0.5rem 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated, #18181b)', padding: '10px 14px', borderRadius: '10px', marginBottom: '12px', border: '1px solid var(--border, #27272a)' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #a1a1aa)' }}>Current Version</div>
              <strong style={{ fontSize: '0.95rem' }}>{updateInfo.currentVersion}</strong>
            </div>
            <div style={{ fontSize: '1.1rem', color: 'var(--primary, #6366f1)' }}>➔</div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #a1a1aa)' }}>New Version</div>
              <strong style={{ fontSize: '0.95rem', color: '#10b981' }}>{updateInfo.latestVersion}</strong>
            </div>
          </div>

          {updateInfo.releaseNotes && (
            <div style={{ maxHeight: '140px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-muted, #ccc)', marginBottom: '14px', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
              {updateInfo.releaseNotes}
            </div>
          )}

          {downloading && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                <span>{downloaded ? 'Download Complete!' : 'Downloading update internally...'}</span>
                <strong>{progress}%</strong>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--border, #333)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${progress}%`,
                    height: '100%',
                    background: downloaded ? '#10b981' : 'linear-gradient(90deg, #6366f1, #3b82f6)',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>
          )}

          {error && (
            <p className="error-msg" style={{ margin: '0 0 12px 0', fontSize: '0.8rem' }}>{error}</p>
          )}

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
            {!downloading && !downloaded && (
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Later
              </button>
            )}

            {!downloaded ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleStartUpdate}
                disabled={downloading}
              >
                {downloading ? `Downloading (${progress}%)` : 'Update Internally'}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: '#10b981', borderColor: '#10b981' }}
                onClick={handleApplyRestart}
              >
                {isCapacitor() ? 'Install & Restart' : 'Restart & Apply'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}