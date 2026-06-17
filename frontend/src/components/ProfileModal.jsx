import { useState, useEffect } from 'react';

export default function ProfileModal({ open, onClose, device, updateProfile, logout, showAlert, onToast }) {
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('unknown');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (device && open) {
      setEditName(device.name);
      setEditType(device.type);
    }
  }, [device, open]);

  if (!open || !device) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ name: editName, type: editType });
      onToast?.('Profile updated!');
      onClose();
    } catch (err) {
      if (showAlert) showAlert(err.message, 'Update Error');
      else alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getDeviceIconEmoji = (type) => {
    return {
      android: '📱',
      ios: '📱',
      windows: '🖥️',
      mac: '💻',
    }[type] || '🔌';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Device Profile</h2>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Close modal">×</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: '2rem' }}>{getDeviceIconEmoji(device.type)}</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{device.name}</h3>
            <p className="muted" style={{ margin: '0.15rem 0 0', fontSize: '0.75rem' }}>Active Local Node</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
              <option value="windows">Windows PC</option>
              <option value="mac">Mac</option>
              <option value="android">Android Phone</option>
              <option value="ios">iPhone</option>
              <option value="unknown">Other</option>
            </select>
          </label>

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
      </div>
    </div>
  );
}
