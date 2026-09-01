import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import QrScannerModal from './QrScannerModal';

export default function PairingModal({ open, onClose, onPairWithCode, serverInfo }) {
  const [qr, setQr] = useState(null);
  const [code, setCode] = useState('');
  const [pairUrl, setPairUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // Connection mode: 'wifi' | 'hotspot' | 'bluetooth'
  const [connectionMode, setConnectionMode] = useState('wifi');
  const [selectedInterface, setSelectedInterface] = useState('');
  const [addresses, setAddresses] = useState([]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setCopied(false);

    api.info()
      .then((info) => {
        const addrs = info.addresses || [];
        setAddresses(addrs);
        const defaultIp = addrs[0]?.address || '';
        setSelectedInterface(defaultIp);
        return loadQr(defaultIp);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [open]);

  const loadQr = (ifaceIp) => {
    setLoading(true);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return api.generatePairQr(origin, ifaceIp)
      .then((data) => {
        setQr(data.qr);
        setCode(data.code);
        setPairUrl(data.pairUrl || data.url);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  const handleInterfaceChange = (ip) => {
    setSelectedInterface(ip);
    loadQr(ip);
  };

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
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.3rem' }}>🔗</span>
            <h2 style={{ margin: 0 }}>Pair a Device</h2>
          </div>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Close modal">×</button>
        </div>

        {/* Quick QR Scanner & Action Header */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowScanner(true)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <span>📷</span>
            <strong>Scan Another Device QR</strong>
          </button>
        </div>

        {/* Connection Type Selector Tabs */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Connection Mode
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', background: 'var(--bg-elevated, #18181b)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border, #27272a)' }}>
            <button
              type="button"
              onClick={() => {
                setConnectionMode('wifi');
                const wifiAddr = addresses.find((a) => a.type === 'wifi' || a.address.startsWith('192.168.')) || addresses[0];
                if (wifiAddr) handleInterfaceChange(wifiAddr.address);
              }}
              style={{
                padding: '8px 4px',
                borderRadius: '8px',
                border: 'none',
                background: connectionMode === 'wifi' ? 'var(--primary, #6366f1)' : 'transparent',
                color: connectionMode === 'wifi' ? '#fff' : 'var(--text-muted)',
                fontWeight: connectionMode === 'wifi' ? '600' : '400',
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>📡</span>
              Wi-Fi LAN
            </button>

            <button
              type="button"
              onClick={() => {
                setConnectionMode('hotspot');
                const hotspotAddr = addresses.find((a) => a.type === 'hotspot' || a.address.startsWith('192.168.137.') || a.address.startsWith('192.168.43.')) || addresses[0];
                if (hotspotAddr) handleInterfaceChange(hotspotAddr.address);
              }}
              style={{
                padding: '8px 4px',
                borderRadius: '8px',
                border: 'none',
                background: connectionMode === 'hotspot' ? 'var(--primary, #6366f1)' : 'transparent',
                color: connectionMode === 'hotspot' ? '#fff' : 'var(--text-muted)',
                fontWeight: connectionMode === 'hotspot' ? '600' : '400',
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>📲</span>
              Hotspot
            </button>

            <button
              type="button"
              onClick={() => setConnectionMode('bluetooth')}
              style={{
                padding: '8px 4px',
                borderRadius: '8px',
                border: 'none',
                background: connectionMode === 'bluetooth' ? 'var(--primary, #6366f1)' : 'transparent',
                color: connectionMode === 'bluetooth' ? '#fff' : 'var(--text-muted)',
                fontWeight: connectionMode === 'bluetooth' ? '600' : '400',
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>🔷</span>
              Bluetooth
            </button>
          </div>
        </div>

        {/* Network Interface Dropdown (for Wi-Fi / Hotspot) */}
        {connectionMode !== 'bluetooth' && addresses.length > 1 && (
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Network IP Interface:
            </label>
            <select
              value={selectedInterface}
              onChange={(e) => handleInterfaceChange(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                background: 'var(--bg-elevated, #18181b)',
                border: '1px solid var(--border, #27272a)',
                color: 'var(--text)',
                fontSize: '0.85rem'
              }}
            >
              {addresses.map((a) => (
                <option key={a.address} value={a.address}>
                  {a.name} — {a.address} {a.type !== 'other' ? `(${a.type.toUpperCase()})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Bluetooth Guidance View */}
        {connectionMode === 'bluetooth' ? (
          <div style={{ background: 'var(--bg-elevated, #18181b)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border, #27272a)', marginBottom: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🔷</div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1rem' }}>Bluetooth Sharing Mode</h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Enable Bluetooth on both your PC and phone. Use <strong>Bluetooth Tethering / PAN</strong> or scan the QR code to sync over Bluetooth Low Energy.
            </p>
            <div style={{ fontSize: '0.78rem', background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              Tip: For fastest speed with large files, Wi-Fi LAN or Hotspot is recommended.
            </div>
          </div>
        ) : null}

        {loading && <div className="spinner">Generating pairing key...</div>}
        {error && <p className="error-msg">{error}</p>}

        {qr && connectionMode !== 'bluetooth' && (
          <div className="qr-section">
            <div className="qr-image-container">
              <img src={qr} alt="Pairing QR code" className="qr-image" />
            </div>
            
            <div className="pair-code">
              <span className="label">Pairing Pin Code</span>
              <strong>{code}</strong>
            </div>
            
            <div className="pair-url">
              <span className="label">Host IP & Connection URL</span>
              <code>{pairUrl}</code>
            </div>

            <p className="ip-help-text" style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              {connectionMode === 'hotspot'
                ? 'Connect your phone to this hotspot Wi-Fi, then scan the QR code.'
                : 'Ensure your phone is on the same Wi-Fi router, then point the in-app camera at this QR.'}
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
          🔒 End-to-End Encrypted via AES-256-GCM. Host will be prompted for approval before connection.
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