import { useState, useEffect } from 'react';
import { api, getServerUrl, setServerUrl } from '../utils/api';

export default function SettingsModal({
  open,
  onClose,
  device,
  updateProfile,
  logout,
  showAlert,
  showConfirm,
  onToast,
  serverInfo,
  onCheckUpdate,
  isDark,
  onThemeToggle
}) {
  const [activeSection, setActiveSection] = useState('general'); // 'general' | 'devices' | 'appearance' | 'network' | 'about'
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('windows');
  const [wifiIp, setWifiIp] = useState(localStorage.getItem('custom_host_ip') || '');
  const [serverUrlVal, setServerUrlVal] = useState(getServerUrl() || '');
  const [saving, setSaving] = useState(false);
  const [devices, setDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);

  useEffect(() => {
    if (device && open) {
      setEditName(device.name || '');
      setEditType(device.type || 'windows');
      setServerUrlVal(getServerUrl() || '');

      if (serverInfo && serverInfo.hostIpOverride) {
        setWifiIp(serverInfo.hostIpOverride);
      } else {
        const saved = localStorage.getItem('custom_host_ip');
        if (saved) {
          setWifiIp(saved);
        } else if (serverInfo && serverInfo.primaryUrl) {
          try {
            const urlObj = new URL(serverInfo.primaryUrl);
            if (urlObj.hostname !== 'localhost' && urlObj.hostname !== '127.0.0.1' && !urlObj.hostname.startsWith('172.')) {
              setWifiIp(urlObj.hostname);
            } else {
              setWifiIp('');
            }
          } catch (e) {
            setWifiIp('');
          }
        } else {
          setWifiIp('');
        }
      }

      fetchDevices();
    }
  }, [device, open, serverInfo]);

  const fetchDevices = () => {
    if (!device?.token) return;
    setLoadingDevices(true);
    api.listDevices(device.token)
      .then((d) => setDevices(d.devices || []))
      .catch(() => {})
      .finally(() => setLoadingDevices(false));
  };

  if (!open || !device) return null;

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ name: editName, type: editType });

      setServerUrl(serverUrlVal);

      const trimmedIp = wifiIp.trim();
      if (trimmedIp) {
        localStorage.setItem('custom_host_ip', trimmedIp);
      } else {
        localStorage.removeItem('custom_host_ip');
      }
      await api.updateSettings({ hostIp: trimmedIp }).catch(() => {});

      onToast?.('Settings saved successfully!');
    } catch (err) {
      if (showAlert) showAlert(err.message, 'Save Error');
      else alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDevice = async (id) => {
    const confirmed = showConfirm 
      ? await showConfirm('Are you sure you want to unpair this device?', 'Unpair Device')
      : confirm('Are you sure you want to unpair this device?');
    if (!confirmed) return;
    try {
      await api.deleteDevice(device.token, id);
      fetchDevices();
      onToast?.('Device unpaired.');
    } catch (err) {
      if (showAlert) showAlert(err.message, 'Unpair Error');
      else alert(err.message);
    }
  };

  const isAndroid = editType === 'android' || editName?.toLowerCase().includes('phone') || editName?.toLowerCase().includes('android');
  const isLinux = editType === 'linux' || editName?.toLowerCase().includes('linux');

  const getPlatformIcon = (type, name = '') => {
    if (type === 'android' || name.toLowerCase().includes('phone') || name.toLowerCase().includes('android')) return '📱';
    if (type === 'linux' || name.toLowerCase().includes('linux')) return '🐧';
    return '💻';
  };

  const getPlatformLabel = (type, name = '') => {
    if (type === 'android' || name.toLowerCase().includes('phone') || name.toLowerCase().includes('android')) return 'Android';
    if (type === 'linux' || name.toLowerCase().includes('linux')) return 'Linux';
    return 'Windows';
  };

  const otherDevices = devices.filter((d) => d.id !== device.id);

  const sections = [
    { id: 'general', label: '👤 Device Profile', desc: 'Name & platform settings' },
    { id: 'devices', label: `🌐 Connected Devices (${otherDevices.length})`, desc: 'Manage paired cluster nodes' },
    { id: 'appearance', label: '🎨 Theme & Appearance', desc: 'Dark / Light mode selection' },
    { id: 'network', label: '📡 Connection & Endpoints', desc: 'Server URL & Wi-Fi IP override' },
    { id: 'about', label: 'ℹ️ About Universal Shared', desc: 'Version v0.2.1 and updates' }
  ];

  return (
    <div className="modal-overlay" onClick={onClose} style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
      <div
        className="settings-card-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '640px',
          maxHeight: '85vh',
          background: 'var(--bg-card, #121214)',
          border: '1px solid var(--border, rgba(255,255,255,0.1))',
          borderRadius: '16px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.2rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-elevated)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'var(--accent-bg, rgba(99,102,241,0.15))',
                color: 'var(--accent, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.15rem'
              }}
            >
              ⚙️
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', letterSpacing: '-0.02em' }}>Settings</h2>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Universal Shared v0.2.1</div>
            </div>
          </div>

          <button
            type="button"
            className="btn-close"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '4px 8px',
              borderRadius: '6px'
            }}
          >
            ×
          </button>
        </div>

        {/* Dropdown Section Selector (Zero Horizontal Scroll!) */}
        <div
          style={{
            padding: '12px 1.5rem',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg, #09090b)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            Section:
          </label>
          <div style={{ position: 'relative', flex: 1 }}>
            <select
              value={activeSection}
              onChange={(e) => setActiveSection(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 2.2rem 0.6rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg-elevated)',
                color: 'var(--text)',
                fontSize: '0.9rem',
                fontWeight: '600',
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none'
              }}
            >
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <span
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                fontSize: '0.8rem',
                color: 'var(--text-muted)'
              }}
            >
              ▼
            </span>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {/* SECTION 1: DEVICE PROFILE */}
          {activeSection === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Profile Card Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem 1.25rem',
                  background: 'var(--bg-elevated)',
                  borderRadius: '12px',
                  border: '1px solid var(--border)'
                }}
              >
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '14px',
                    background: isAndroid ? 'rgba(34, 197, 94, 0.15)' : isLinux ? 'rgba(234, 179, 8, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                    border: isAndroid ? '1px solid rgba(34, 197, 94, 0.3)' : isLinux ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid rgba(56, 189, 248, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem'
                  }}
                >
                  {getPlatformIcon(editType, editName)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{editName || device.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                    Active Local Cluster Node • {getPlatformLabel(editType, editName)}
                  </div>
                </div>
              </div>

              {/* Form Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '6px' }}>
                    Device Display Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={64}
                    placeholder="e.g., Workstation PC, Suvesh Android, Linux Server"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg, #09090b)',
                      color: 'var(--text)',
                      fontSize: '0.92rem',
                      outline: 'none'
                    }}
                  />
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Visible to other devices when pairing and sending clipboard items.
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '6px' }}>
                    Device Platform Type
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {[
                      { type: 'windows', label: 'Windows PC', icon: '💻' },
                      { type: 'android', label: 'Android Phone', icon: '📱' },
                      { type: 'linux', label: 'Linux PC', icon: '🐧' }
                    ].map((t) => {
                      const selected = editType === t.type;
                      return (
                        <div
                          key={t.type}
                          onClick={() => setEditType(t.type)}
                          style={{
                            padding: '12px 10px',
                            borderRadius: '10px',
                            border: selected ? '2px solid var(--accent, #6366f1)' : '1px solid var(--border)',
                            background: selected ? 'var(--accent-bg, rgba(99,102,241,0.15))' : 'var(--bg-elevated)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.15s ease',
                            textAlign: 'center'
                          }}
                        >
                          <span style={{ fontSize: '1.6rem' }}>{t.icon}</span>
                          <span style={{ fontSize: '0.82rem', fontWeight: selected ? '700' : '500' }}>{t.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  className="btn btn-ghost danger"
                  style={{ fontSize: '0.82rem' }}
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                >
                  Unpair / Reset Device
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  style={{ minWidth: '120px' }}
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          )}

          {/* SECTION 2: CONNECTED DEVICES */}
          {activeSection === 'devices' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Paired Devices on Network</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Devices connected in your local peer cluster.
                  </div>
                </div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={fetchDevices} disabled={loadingDevices}>
                  {loadingDevices ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>

              {otherDevices.length === 0 ? (
                <div
                  style={{
                    padding: '2rem 1rem',
                    textAlign: 'center',
                    background: 'var(--bg-elevated)',
                    borderRadius: '12px',
                    border: '1px dashed var(--border)'
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📡</div>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>No Other Devices Paired</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Click "Pair Device" in the top header to connect your phone, PC, or Linux machine.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {otherDevices.map((d) => {
                    const devIcon = getPlatformIcon(d.type, d.name);
                    const devLabel = getPlatformLabel(d.type, d.name);

                    return (
                      <div
                        key={d.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          background: 'var(--bg-elevated)',
                          borderRadius: '10px',
                          border: '1px solid var(--border)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '8px',
                              background: 'var(--accent-bg, rgba(99,102,241,0.12))',
                              border: '1px solid var(--border)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.25rem'
                            }}
                          >
                            {devIcon}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{d.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{devLabel}</span>
                              <span>•</span>
                              <span style={{ color: d.online ? '#10b981' : '#a1a1aa' }}>
                                {d.online ? '🟢 Online' : d.stale ? '⚪ Offline' : '🟡 Idle'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn btn-ghost btn-sm danger"
                          onClick={() => handleDeleteDevice(d.id)}
                          title="Disconnect device"
                          style={{ fontSize: '0.78rem' }}
                        >
                          Unpair
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SECTION 3: THEME & APPEARANCE */}
          {activeSection === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Theme Mode</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Choose your visual interface appearance.
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div
                  onClick={() => {
                    if (isDark) onThemeToggle?.();
                  }}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '12px',
                    border: !isDark ? '2px solid var(--accent, #6366f1)' : '1px solid var(--border)',
                    background: '#f8fafc',
                    color: '#0f172a',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: !isDark ? '0 0 0 3px rgba(99, 102, 241, 0.25)' : 'none'
                  }}
                >
                  <div style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>☀️</div>
                  <div style={{ fontWeight: '700', fontSize: '1rem' }}>Light Mode</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                    {!isDark ? '✓ Active Theme' : 'Tap to Activate'}
                  </div>
                </div>

                <div
                  onClick={() => {
                    if (!isDark) onThemeToggle?.();
                  }}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '12px',
                    border: isDark ? '2px solid var(--accent, #6366f1)' : '1px solid var(--border)',
                    background: '#09090b',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: isDark ? '0 0 0 3px rgba(99, 102, 241, 0.25)' : 'none'
                  }}
                >
                  <div style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>🌙</div>
                  <div style={{ fontWeight: '700', fontSize: '1rem' }}>Dark Mode</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                    {isDark ? '✓ Active Theme' : 'Tap to Activate'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: NETWORK & CONNECTION */}
          {activeSection === 'network' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Network Endpoint Configuration</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Configure local cluster listening IP and remote server URLs.
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '6px' }}>
                  Server Address (URL or IP)
                </label>
                <input
                  type="text"
                  value={serverUrlVal}
                  onChange={(e) => setServerUrlVal(e.target.value)}
                  placeholder="e.g., http://192.168.1.10:3000"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg, #09090b)',
                    color: 'var(--text)',
                    fontSize: '0.92rem',
                    outline: 'none',
                    fontFamily: 'ui-monospace, monospace'
                  }}
                />
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Target server endpoint used by the mobile APK or Linux client to sync.
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '6px' }}>
                  Wi-Fi IP Address (Host Override)
                </label>
                <input
                  type="text"
                  value={wifiIp}
                  onChange={(e) => setWifiIp(e.target.value)}
                  placeholder="e.g., 192.168.0.130"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg, #09090b)',
                    color: 'var(--text)',
                    fontSize: '0.92rem',
                    outline: 'none',
                    fontFamily: 'ui-monospace, monospace'
                  }}
                />
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Overrides QR code IP generation if virtual adapters conflict.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Connection Settings'}
                </button>
              </div>
            </div>
          )}

          {/* SECTION 5: ABOUT & UPDATES */}
          {activeSection === 'about' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1.25rem',
                  background: 'var(--bg-elevated)',
                  borderRadius: '12px',
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{ fontSize: '2.5rem' }}>📦</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Universal Shared</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Version <strong>v0.2.1</strong> (Latest)
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px' }}>
                    🔒 AES-256-GCM End-to-End Encrypted
                  </div>
                </div>
              </div>

              {onCheckUpdate && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    onClose();
                    onCheckUpdate();
                  }}
                  style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <span>🔄</span>
                  <span>Check for App Updates</span>
                </button>
              )}

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Universal Shared is a zero-configuration local network synchronization utility for Windows, Android, and Linux.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}