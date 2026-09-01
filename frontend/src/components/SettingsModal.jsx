import { useState, useEffect } from 'react';
import { api, getServerUrl, setServerUrl } from '../utils/api';
import { DeviceList } from './HistoryList';

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
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'devices' | 'appearance'
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('unknown');
  const [wifiIp, setWifiIp] = useState(localStorage.getItem('custom_host_ip') || '');
  const [serverUrlVal, setServerUrlVal] = useState(getServerUrl() || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (device && open) {
      setEditName(device.name);
      setEditType(device.type);
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
    }
  }, [device, open, serverInfo]);

  if (!open || !device) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
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

      onToast?.('Settings saved!');
      onClose();
    } catch (err) {
      if (showAlert) showAlert(err.message, 'Save Error');
      else alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const isAndroid = device.type === 'android' || device.type === 'ios' || device.name?.toLowerCase().includes('phone') || device.name?.toLowerCase().includes('android');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '540px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem' }}>⚙️</span>
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Settings</h2>
          </div>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Close modal">×</button>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            padding: '4px',
            background: 'var(--bg-elevated, #18181b)',
            borderRadius: '10px',
            border: '1px solid var(--border, #27272a)',
            margin: '1rem 0'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'profile' ? 'var(--primary, #6366f1)' : 'transparent',
              color: activeTab === 'profile' ? '#fff' : 'var(--text-muted)',
              fontWeight: activeTab === 'profile' ? '600' : '400',
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span>👤</span>
            Device Profile
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('devices')}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'devices' ? 'var(--primary, #6366f1)' : 'transparent',
              color: activeTab === 'devices' ? '#fff' : 'var(--text-muted)',
              fontWeight: activeTab === 'devices' ? '600' : '400',
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span>🌐</span>
            Devices on Network
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'appearance' ? 'var(--primary, #6366f1)' : 'transparent',
              color: activeTab === 'appearance' ? '#fff' : 'var(--text-muted)',
              fontWeight: activeTab === 'appearance' ? '600' : '400',
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span>🎨</span>
            Theme
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
          {/* TAB 1: DEVICE PROFILE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '10px 12px', background: 'var(--bg, #18181b)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '2rem' }}>{isAndroid ? '📱' : '💻'}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>{device.name}</h3>
                  <p className="muted" style={{ margin: '0.15rem 0 0', fontSize: '0.75rem' }}>Active Local Node • {isAndroid ? 'Android' : 'Windows'}</p>
                </div>
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', fontWeight: '600' }}>
                Device Name
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={64}
                  required
                  style={{
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text)',
                    fontSize: '0.95rem',
                    outline: 'none',
                    width: '100%'
                  }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', fontWeight: '600' }}>
                Device Type
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  style={{
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text)',
                    fontSize: '0.95rem',
                    outline: 'none',
                    width: '100%',
                    cursor: 'pointer'
                  }}
                >
                  <option value="windows">💻 Windows PC</option>
                  <option value="android">📱 Android Phone</option>
                  <option value="mac">🍏 Mac</option>
                  <option value="ios">🍎 iPhone / iPad</option>
                  <option value="unknown">🔌 Other Device</option>
                </select>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', fontWeight: '600' }}>
                Server Address (URL or IP)
                <input
                  type="text"
                  value={serverUrlVal}
                  onChange={(e) => setServerUrlVal(e.target.value)}
                  placeholder="e.g., http://192.168.1.10:3000"
                  style={{
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text)',
                    fontSize: '0.95rem',
                    outline: 'none',
                    width: '100%',
                    fontFamily: 'ui-monospace, monospace'
                  }}
                />
              </label>
              <p style={{ margin: '-0.5rem 0 0', fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                Set custom server endpoint for mobile APK or leave blank to connect to same host.
              </p>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', fontWeight: '600' }}>
                Wi-Fi IP Address (Host Override)
                <input
                  type="text"
                  value={wifiIp}
                  onChange={(e) => setWifiIp(e.target.value)}
                  placeholder="e.g., 192.168.0.130"
                  style={{
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text)',
                    fontSize: '0.95rem',
                    outline: 'none',
                    width: '100%',
                    fontFamily: 'ui-monospace, monospace'
                  }}
                />
              </label>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg, #18181b)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>App Version</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Universal Shared v0.1.7</div>
                </div>
                {onCheckUpdate && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '4px 10px', height: 'auto' }}
                    onClick={() => {
                      onClose();
                      onCheckUpdate();
                    }}
                  >
                    Check for Updates
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-ghost danger"
                  style={{ minHeight: '38px', padding: '0.5rem 1rem' }}
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                >
                  Unpair Device
                </button>
                
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ marginLeft: 'auto', minHeight: '38px' }}
                  onClick={onClose}
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ minHeight: '38px' }}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: DEVICES ON NETWORK */}
          {activeTab === 'devices' && (
            <div>
              <DeviceList
                token={device.token}
                currentDeviceId={device.id}
                showConfirm={showConfirm}
                showAlert={showAlert}
              />
            </div>
          )}

          {/* TAB 3: THEME / APPEARANCE */}
          {activeTab === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>Interface Theme</div>
              <p style={{ margin: '-0.5rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Choose your preferred theme mode for Universal Shared.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div
                  onClick={() => {
                    if (isDark) onThemeToggle?.();
                  }}
                  style={{
                    padding: '1.25rem 1rem',
                    borderRadius: '12px',
                    border: !isDark ? '2px solid var(--primary, #6366f1)' : '1px solid var(--border)',
                    background: '#f8fafc',
                    color: '#0f172a',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: !isDark ? '0 0 0 2px rgba(99, 102, 241, 0.2)' : 'none'
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>☀️</div>
                  <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Light Mode</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                    {!isDark ? '✓ Active' : 'Select Light'}
                  </div>
                </div>

                <div
                  onClick={() => {
                    if (!isDark) onThemeToggle?.();
                  }}
                  style={{
                    padding: '1.25rem 1rem',
                    borderRadius: '12px',
                    border: isDark ? '2px solid var(--primary, #6366f1)' : '1px solid var(--border)',
                    background: '#09090b',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: isDark ? '0 0 0 2px rgba(99, 102, 241, 0.2)' : 'none'
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌙</div>
                  <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Dark Mode</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                    {isDark ? '✓ Active' : 'Select Dark'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}