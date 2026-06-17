import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { loadDeviceName } from '../utils/storage';

export default function Header({ connected, serverInfo, onPairClick, onThemeToggle, isDark, onProfileClick }) {
  return (
    <header className="header">
      <div className="header-brand">
        <div className="header-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" fill="currentColor"/>
            <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <h1>Universal Clipboard</h1>
          <div className="header-sub">
            <span className={`status-dot ${connected ? 'online' : 'offline'}`} />
            <span>{connected ? 'Connected' : 'Offline'}</span>
            {serverInfo?.primaryUrl && (
              <span className="server-url">{serverInfo.primaryUrl}</span>
            )}
          </div>
        </div>
      </div>
      <div className="header-actions">
        <button type="button" className="btn btn-icon" onClick={onProfileClick} title="Device Profile">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>
        <button type="button" className="btn btn-icon" onClick={onThemeToggle} title="Toggle theme">
          {isDark ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          )}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onPairClick}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '2px' }}>
            <path d="M15 3h6v6M10 14L21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          </svg>
          <span className="btn-text">Pair device</span>
        </button>
      </div>
    </header>
  );
}

export function SetupScreen({ onRegister, onPair, initialCode, loading, error }) {
  const [name, setName] = useState(loadDeviceName() || '');
  const [code, setCode] = useState(initialCode || '');
  const [mode, setMode] = useState(initialCode ? 'pair' : 'register');
  const [serverInfo, setServerInfo] = useState(null);

  useEffect(() => {
    api.info().then(setServerInfo).catch(() => {});
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'pair') onPair(code, name);
    else onRegister(name);
  };

  return (
    <div className="setup-screen">
      <div className="setup-card">
        <div className="setup-hero">
          <div className="setup-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--accent)' }}>
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" fill="currentColor"/>
              <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1>Universal Clipboard</h1>
          <p>Self-hosted clipboard sync over your local Wi-Fi. No cloud. No internet required.</p>
        </div>

        {serverInfo && (
          <div className="setup-server">
            <span className="label">Server Local URL</span>
            <code>{serverInfo.primaryUrl}</code>
          </div>
        )}

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

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Connecting…' : mode === 'pair' ? 'Pair device' : 'Start on this device'}
          </button>
        </form>

        <p className="setup-hint">
          On your Windows PC, open this app and tap <strong>Pair device</strong> to show a QR code for your phone.
        </p>
      </div>
    </div>
  );
}
