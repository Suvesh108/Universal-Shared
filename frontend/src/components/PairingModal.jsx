import { useState, useEffect } from 'react';
import { api } from '../utils/api';

export default function PairingModal({ open, onClose }) {
  const [qr, setQr] = useState(null);
  const [code, setCode] = useState('');
  const [pairUrl, setPairUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setCopied(false);
    api.generatePairQr()
      .then((data) => {
        setQr(data.qr);
        setCode(data.code);
        setPairUrl(data.pairUrl);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [open]);

  const handleCopy = () => {
    if (!pairUrl) return;
    navigator.clipboard?.writeText(pairUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Pair a New Device</h2>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Close modal">×</button>
        </div>

        <p className="modal-desc">
          Scan this QR code with your Android/iOS phone (on the same Wi-Fi) or copy the URL below to pair instantly.
        </p>

        {loading && <div className="spinner">Generating pairing key...</div>}
        {error && <p className="error-msg">{error}</p>}

        {qr && (
          <div className="qr-section">
            <div className="qr-image-container">
              <img src={qr} alt="Pairing QR code" className="qr-image" />
            </div>
            
            <div className="pair-code">
              <span className="label">Pairing Pin Code</span>
              <strong>{code}</strong>
            </div>
            
            <div className="pair-url">
              <span className="label">Pairing Connection URL</span>
              <code>{pairUrl}</code>
            </div>

            <p className="ip-help-text" style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              If your phone cannot connect, make sure it is on the same Wi-Fi. You can verify or change the <strong>Wi-Fi IP Address</strong> under your <strong>Device Profile</strong> (top-right navbar profile).
            </p>
            
            <button
              type="button"
              className="btn btn-secondary btn-sm btn-block"
              onClick={handleCopy}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '1.25rem' }}
            >
              {copied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Link Copied!
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  Copy URL
                </>
              )}
            </button>
          </div>
        )}

        <p className="modal-footnote">Code expires in 10 minutes. All clipboard transfers stay completely private on your local network.</p>
      </div>
    </div>
  );
}
