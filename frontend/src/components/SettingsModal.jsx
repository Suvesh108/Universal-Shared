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
  // State for accordion sections: default 'profile' open, or allow toggling any
  const [openSection, setOpenSection] = useState('profile');
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

  const toggleSection = (secId) => {
    setOpenSection((prev) => (prev === secId ? null : secId));
  };

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

  return (
    <div className="modal-overlay" onClick={onClose} style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
      <div
        className="settings-card-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '640px',
          maxHeight: '88vh',
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
            padding: '1.1rem 1.5rem',
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
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Universal Shared v0.2.2</div>
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

        {/* Stacked Expandable / Collapsible Sections Container */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          {/* SECTION 1: DEVICE PROFILE */}
          <div
            style={{
              borderRadius: '12px',
              border: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              overflow: 'hidden',
              transition: 'all 0.2s ease'
            }}
          >
            <div
              onClick={() => toggleSection('profile')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                cursor: 'pointer',
                userSelect: 'none',
                background: openSection === 'profile' ? 'var(--accent-bg, rgba(99,102,241,0.1))' : 'transparent'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.3rem' }}>{getPlatformIcon(editType, editName)}</span>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Device Profile</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {editName || device.name} • {getPlatformLabel(editType, editName)}
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', transform: openSection === 'profile' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                ▼
              </span>
            </div>

            {openSection === 'profile' && (
              <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg, #09090b)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>
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
                      background: 'var(--bg-elevated)',
                      color: 'var(--text)',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>
                    Device Platform Type
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
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
                            padding: '10px 8px',
                            borderRadius: '8px',
                            border: selected ? '2px solid var(--accent, #6366f1)' : '1px solid var(--border)',
                            background: selected ? 'var(--accent-bg, rgba(99,102,241,0.15))' : 'var(--bg-elevated)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease',
                            textAlign: 'center'
                          }}
                        >
                          <span style={{ fontSize: '1.4rem' }}>{t.icon}</span>
                          <span style={{ fontSize: '0.78rem', fontWeight: selected ? '700' : '500' }}>{t.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                  <button
                    type="button"
                    className="btn btn-ghost danger btn-sm"
                    onClick={() => {
                      logout();
                      onClose();
                    }}
                  >
                    Unpair Device
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleSaveProfile}
                    disabled={saving}
                    style={{ minWidth: '110px' }}
                  >
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: CONNECTED DEVICES */}
          <div
            style={{
              borderRadius: '12px',
              border: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              overflow: 'hidden',
              transition: 'all 0.2s ease'
            }}
          >
            <div
              onClick={() => toggleSection('devices')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                cursor: 'pointer',
                userSelect: 'none',
                background: openSection === 'devices' ? 'var(--accent-bg, rgba(99,102,241,0.1))' : 'transparent'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.3rem' }}>🌐</span>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>
                    Connected Devices on Network ({otherDevices.length})
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Active local cluster peers
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', transform: openSection === 'devices' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                ▼
              </span>
            </div>

            {openSection === 'devices' && (
              <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg, #09090b)' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={fetchDevices} disabled={loadingDevices}>
                    {loadingDevices ? 'Refreshing...' : 'Refresh Devices'}
                  </button>
                </div>

                {otherDevices.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    📡 No other devices paired yet. Click "Pair Device" in the header to connect.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {otherDevices.map((d) => (
                      <div
                        key={d.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: 'var(--bg-elevated)',
                          borderRadius: '8px',
                          border: '1px solid var(--border)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.2rem' }}>{getPlatformIcon(d.type, d.name)}</span>
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{d.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {getPlatformLabel(d.type, d.name)} • <span style={{ color: d.online ? '#10b981' : '#a1a1aa' }}>{d.online ? '🟢 Online' : '⚪ Offline'}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn btn-ghost btn-sm danger"
                          onClick={() => handleDeleteDevice(d.id)}
                          style={{ fontSize: '0.75rem' }}
                        >
                          Unpair
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 3: THEME & APPEARANCE */}
          <div
            style={{
              borderRadius: '12px',
              border: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              overflow: 'hidden',
              transition: 'all 0.2s ease'
            }}
          >
            <div
              onClick={() => toggleSection('theme')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                cursor: 'pointer',
                userSelect: 'none',
                background: openSection === 'theme' ? 'var(--accent-bg, rgba(99,102,241,0.1))' : 'transparent'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.3rem' }}>🎨</span>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Theme & Appearance</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {isDark ? '🌙 Dark Mode Active' : '☀️ Light Mode Active'}
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', transform: openSection === 'theme' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                ▼
              </span>
            </div>

            {openSection === 'theme' && (
              <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'var(--bg, #09090b)' }}>
                <div
                  onClick={() => {
                    if (isDark) onThemeToggle?.();
                  }}
                  style={{
                    padding: '1rem',
                    borderRadius: '10px',
                    border: !isDark ? '2px solid var(--accent, #6366f1)' : '1px solid var(--border)',
                    background: '#f8fafc',
                    color: '#0f172a',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>☀️</div>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>Light Mode</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{!isDark ? '✓ Active' : 'Switch'}</div>
                </div>

                <div
                  onClick={() => {
                    if (!isDark) onThemeToggle?.();
                  }}
                  style={{
                    padding: '1rem',
                    borderRadius: '10px',
                    border: isDark ? '2px solid var(--accent, #6366f1)' : '1px solid var(--border)',
                    background: '#09090b',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>🌙</div>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>Dark Mode</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{isDark ? '✓ Active' : 'Switch'}</div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: NETWORK & CONNECTION */}
          <div
            style={{
              borderRadius: '12px',
              border: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              overflow: 'hidden',
              transition: 'all 0.2s ease'
            }}
          >
            <div
              onClick={() => toggleSection('network')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                cursor: 'pointer',
                userSelect: 'none',
                background: openSection === 'network' ? 'var(--accent-bg, rgba(99,102,241,0.1))' : 'transparent'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.3rem' }}>📡</span>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Network & Connection</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Server URL & Wi-Fi Host IP
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', transform: openSection === 'network' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                ▼
              </span>
            </div>

            {openSection === 'network' && (
              <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg, #09090b)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>
                    Server Address (URL or IP)
                  </label>
                  <input
                    type="text"
                    value={serverUrlVal}
                    onChange={(e) => setServerUrlVal(e.target.value)}
                    placeholder="e.g., http://192.168.1.10:3000"
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-elevated)',
                      color: 'var(--text)',
                      fontSize: '0.85rem',
                      fontFamily: 'ui-monospace, monospace'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>
                    Wi-Fi IP Address (Host Override)
                  </label>
                  <input
                    type="text"
                    value={wifiIp}
                    onChange={(e) => setWifiIp(e.target.value)}
                    placeholder="e.g., 192.168.0.130"
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-elevated)',
                      color: 'var(--text)',
                      fontSize: '0.85rem',
                      fontFamily: 'ui-monospace, monospace'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '6px' }}>
                  <button type="button" className="btn btn-primary btn-sm" onClick={handleSaveProfile} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Connection'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 5: ABOUT & UPDATES */}
          <div
            style={{
              borderRadius: '12px',
              border: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              overflow: 'hidden',
              transition: 'all 0.2s ease'
            }}
          >
            <div
              onClick={() => toggleSection('about')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                cursor: 'pointer',
                userSelect: 'none',
                background: openSection === 'about' ? 'var(--accent-bg, rgba(99,102,241,0.1))' : 'transparent'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.3rem' }}>ℹ️</span>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>About Universal Shared</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Version v0.2.2 • AES-256 E2EE
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', transform: openSection === 'about' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                ▼
              </span>
            </div>

            {openSection === 'about' && (
              <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg, #09090b)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  Universal Shared is a zero-configuration local network synchronization utility for Windows, Android, and Linux.
                </div>

                {onCheckUpdate && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      onClose();
                      onCheckUpdate();
                    }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <span>🔄</span>
                    <span>Check for App Updates</span>
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}