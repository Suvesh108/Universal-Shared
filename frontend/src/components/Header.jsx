import { useState, useEffect } from 'react';
import { api, getServerUrl, setServerUrl } from '../utils/api';
import { loadDeviceName } from '../utils/storage';
import AppLogo from './AppLogo';
import QrScannerModal from './QrScannerModal';

export default function Header({ device, connected, serverInfo, onPairClick, onThemeToggle, isDark, onProfileClick }) {
  const isAndroid = device?.type === 'android' || device?.type === 'ios' || device?.name?.toLowerCase()?.includes('phone') || device?.name?.toLowerCase()?.includes('android');

  return (
    <header className="header">
      <div className="header-brand">
        <div className="header-icon" style={{ padding: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
          <AppLogo size={36} />
        </div>
        <div>
          <h1>Universal Shared</h1>
          <div className="header-sub" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span className={`status-dot ${connected ? 'online' : 'offline'}`} />
            <span>{connected ? 'Connected' : 'Offline'}</span>
            <span
              className="e2ee-badge"
              title="AES-256-GCM End-to-End Encrypted Local Sharing"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '0.7rem',
                color: '#10b981',
                background: 'rgba(16,185,129,0.12)',
                padding: '1px 6px',
                borderRadius: '4px',
                border: '1px solid rgba(16,185,129,0.25)',
                fontWeight: '600'
              }}
            >
              🔒 E2EE
            </span>
            {(serverInfo?.primaryUrl || getServerUrl() || (typeof window !== 'undefined' && window.location.origin)) && (
              <span className="server-url">{serverInfo?.primaryUrl || getServerUrl() || window.location.origin}</span>
            )}
          </div>
        </div>
      </div>
      <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button type="button" className="btn btn-secondary" onClick={onPairClick}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '2px' }}>
            <path d="M15 3h6v6M10 14L21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          </svg>
          <span className="btn-text">Pair Device</span>
        </button>

        <button
          type="button"
          className="btn btn-icon"
          onClick={onProfileClick}
          title="Settings (Profile, Devices & Theme)"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
    </header>
  );
}

export function SetupScreen({ onRegister, onPair, initialCode, loading, waitingApproval, error }) {
  const [name, setName] = useState(loadDeviceName() || '');
  const [code, setCode] = useState(initialCode || '');
  const [mode, setMode] = useState(initialCode ? 'pair' : 'register');
  const [serverInfo, setServerInfo] = useState(null);
  const [customServer, setCustomServer] = useState(getServerUrl());
  const [showServerInput, setShowServerInput] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    api.info().then(setServerInfo).catch(() => {});
  }, []);

  const handleSaveServer = () => {
    setServerUrl(customServer);
    setShowServerInput(false);
    api.info().then(setServerInfo).catch(() => {});
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (mode === 'pair') onPair(code, name);
    else onRegister(name);
  };

  const handleQrScanned = ({ serverUrl, code: scannedCode }) => {
    if (serverUrl) {
      setServerUrl(serverUrl);
      setCustomServer(serverUrl);
    }
    if (scannedCode) {
      setCode(scannedCode);
      setMode('pair');
      // Instant pairing
      setTimeout(() => {
        onPair(scannedCode, name);
      }, 100);
    }
  };

  return (
    <div className="setup-screen">
      <div className="setup-card">
        <div className="setup-hero">
          <div className="setup-icon" style={{ padding: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
            <AppLogo size={68} style={{ boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)' }} />
          </div>
          <h1>Universal Shared</h1>
          <p>Instant clipboard & file sharing across all your devices. Fast, private, and seamless.</p>
        </div>

        {/* Quick QR Scan Action Button */}
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowScanner(true)}
          style={{
            width: '100%',
            marginBottom: '1rem',
            padding: '10px 16px',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>📷</span>
          <strong>Scan QR Code on PC</strong>
        </button>

        <div className="setup-server">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span className="label" style={{ margin: 0 }}>Server Connection</span>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: '2px 8px', fontSize: '0.75rem', height: 'auto' }}
              onClick={() => setShowServerInput(!showServerInput)}
            >
              {showServerInput ? 'Cancel' : 'Change Server IP'}
            </button>
          </div>

          {showServerInput ? (
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <input
                type="text"
                value={customServer}
                onChange={(e) => setCustomServer(e.target.value)}
                placeholder="e.g. http://192.168.1.10:3847"
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color, #333)',
                  background: 'var(--bg-input, #222)',
                  color: 'inherit',
                  fontSize: '0.85rem'
                }}
              />
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '6px 12px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                onClick={handleSaveServer}
              >
                Save
              </button>
            </div>
          ) : (
            <code>{getServerUrl() || serverInfo?.primaryUrl || (typeof window !== 'undefined' ? window.location.origin : '')}</code>
          )}
        </div>

        <div className="mode-tabs">
          <button
            type="button"
            className={mode === 'register' ? 'active' : ''}
            onClick={() => setMode('register')}
          >
            This device
          </button>
          <button
            type="button"
            className={mode === 'pair' ? 'active' : ''}
            onClick={() => setMode('pair')}
          >
            Join with code
          </button>
        </div>

        <form onSubmit={handleSubmit} className="setup-form">
          <label>
            Device name
            <input
              type="text"
              placeholder="e.g. Windows PC, Pixel Phone"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={64}
              required
            />
          </label>

          {mode === 'pair' && (
            <label>
              Pairing code
              <input
                type="text"
                placeholder="ABC123"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={8}
                required
                autoFocus={!!initialCode}
              />
            </label>
          )}

          {error && <p className="error-msg">{error}</p>}

          {waitingApproval && (
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', padding: '10px', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '12px', textAlign: 'center', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
              ⏳ <strong>Waiting for Host Approval...</strong>
              <div style={{ fontSize: '0.75rem', marginTop: '2px', color: 'var(--text-muted)' }}>
                Please tap <strong>"Approve & Connect"</strong> on your computer screen.
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {waitingApproval ? 'Waiting for approval…' : loading ? 'Connecting…' : mode === 'pair' ? 'Pair device' : 'Start on this device'}
          </button>
        </form>

        <p className="setup-hint">
          On your Windows PC, open this app and tap <strong>Pair device</strong> to show a QR code for your phone.
        </p>
      </div>

      <QrScannerModal
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onScanned={handleQrScanned}
      />
    </div>
  );
}