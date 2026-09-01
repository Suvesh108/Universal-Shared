import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import QrScannerModal from './QrScannerModal';

export default function PairingModal({ open, onClose, onPairWithCode }) {
  const [qr, setQr] = useState(null);
  const [code, setCode] = useState('');
  const [pairUrl, setPairUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setCopied(false);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    api.generatePairQr(origin)
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

  const handleScanned = ({ code: scannedCode, serverUrl }) => {
    if (onPairWithCode && scannedCode) {
      onPairWithCode(scannedCode, serverUrl);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.3rem' }}>🔗</span>
            <h2 style={{ margin: 0 }}>Pair a Device</h2>
          </div>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Close modal">×</button>
        </div>

        <p className="modal-desc">
          Scan this QR code with your phone or point your camera at another device to link them.
        </p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowScanner(true)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <span>📷</span>
            <strong>Scan Another QR</strong>
          </button>
        </div>

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
              Open this link on your phone, tablet, or secondary computer to start syncing immediately.
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

        <p className="modal-footnote">
          🔒 End-to-End Encrypted via AES-256-GCM. Transfers never leave your local network.
        </p>
      </div>

      <QrScannerModal
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onScanned={handleScanned}
      />
    </div>
  );
}