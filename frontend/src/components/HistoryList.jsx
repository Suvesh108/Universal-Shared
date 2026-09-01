import { useEffect, useState } from 'react';
import { api, formatTime, formatBytes } from '../utils/api';
import { copyToClipboard } from '../hooks/useClipboard';

function getItemPlatform(item) {
  const t = (item.deviceType || '').toLowerCase();
  const n = (item.deviceName || '').toLowerCase();
  if (
    t === 'android' ||
    t === 'ios' ||
    n.includes('android') ||
    n.includes('phone') ||
    n.includes('pixel') ||
    n.includes('samsung') ||
    n.includes('galaxy') ||
    n.includes('xiaomi') ||
    n.includes('mobile')
  ) {
    return 'android';
  }
  return 'windows';
}

function HistoryItem({ item, currentDeviceId, onCopy, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  const handleCopy = async () => {
    if (item.type === 'text' || item.type === 'link') {
      await copyToClipboard(item.content);
      onCopy?.('Copied to clipboard');
    } else if (item.fileUrl) {
      window.open(item.fileUrl, '_blank');
      onCopy?.('Opened download link');
    }
  };

  const isFile = item.type === 'file' || item.type === 'image' || item.type === 'video';
  const isOwn = item.deviceId === currentDeviceId;
  const platform = getItemPlatform(item);
  const isAndroid = platform === 'android';

  return (
    <div className={`history-row ${isOwn ? 'align-left' : 'align-right'}`}>
      <div className="history-bubble-wrapper">
        <div className="history-bubble">
          <div className="history-bubble-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '1px 6px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: isAndroid ? 'rgba(34, 197, 94, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                  color: isAndroid ? '#4ade80' : '#38bdf8',
                  border: isAndroid ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(56, 189, 248, 0.3)'
                }}
              >
                <span>{isAndroid ? '📱' : '💻'}</span>
                {isAndroid ? 'Android' : 'Windows'}
              </span>
              <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.deviceName}
              </strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
              <span>{formatTime(item.createdAt)}</span>
              {item.size > 0 && <span>({formatBytes(item.size)})</span>}
            </div>
          </div>

          <div className="history-body" onClick={() => setExpanded(!expanded)}>
            {item.type === 'image' && item.fileUrl && (
              <div className="history-preview-container">
                <img src={item.fileUrl} alt={item.fileName} className="history-preview" loading="lazy" />
              </div>
            )}
            {item.type === 'video' && item.fileUrl && (
              <div className="history-preview-container">
                <video src={item.fileUrl} controls className="history-preview" preload="metadata" />
              </div>
            )}
            {(item.type === 'text' || item.type === 'link') && (
              <p className={`history-text ${expanded ? 'expanded' : ''}`}>
                {item.type === 'link' ? (
                  <a href={item.content} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                    {item.content}
                  </a>
                ) : (
                  item.content
                )}
              </p>
            )}
            {isFile && item.fileName && (
              <div className="file-card-box">
                <span className="file-card-icon">
                  {item.type === 'image' ? '🖼️' : item.type === 'video' ? '🎥' : '📁'}
                </span>
                <div className="file-card-details">
                  <div className="file-card-name" title={item.fileName}>{item.fileName}</div>
                  <div className="file-card-size">{formatBytes(item.size)}</div>
                </div>
                {item.fileUrl && (
                  <a href={item.fileUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" onClick={(e) => e.stopPropagation()}>
                    Download
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="history-row-actions">
        <button type="button" className="btn-icon" onClick={handleCopy} title="Copy / Open">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>
        <button type="button" className="btn-icon" onClick={() => onDelete(item.id)} title="Delete">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--danger)' }}>
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function HistoryList({
  token,
  currentDeviceId,
  items,
  loading,
  onRefresh,
  onRemove,
  onClear,
  onToast,
  showAlert,
  showConfirm,
  isEnlarged,
  onToggleResize,
  isModalView = false
}) {
  return (
    <section className={`card history-section ${isModalView ? 'history-modal-view' : ''}`} style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="section-header" style={{ flexWrap: 'wrap', gap: '8px', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.05rem' }}>
            Clipboard History {items.length > 0 && <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 400 }}>({items.length})</span>}
          </h2>
        </div>

        <div className="section-actions" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onRefresh} title="Refresh clipboard history">
            Refresh
          </button>
          {items.length > 0 && (
            <button type="button" className="btn btn-ghost btn-sm danger" onClick={onClear} title="Clear all history">
              Clear All
            </button>
          )}
          {!isModalView && onToggleResize && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onToggleResize}
              title={isEnlarged ? 'Collapse history' : 'Expand history'}
              style={{ marginLeft: '2px' }}
            >
              {isEnlarged ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="4 14 10 14 10 20"/>
                    <polyline points="20 10 14 10 14 4"/>
                    <line x1="14" y1="10" x2="21" y2="3"/>
                    <line x1="10" y1="14" x2="3" y2="21"/>
                  </svg>
                  <span>Collapse</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 3 21 3 21 9"/>
                    <polyline points="9 21 3 21 3 15"/>
                    <line x1="21" y1="3" x2="14" y2="10"/>
                    <line x1="3" y1="21" x2="10" y2="15"/>
                  </svg>
                  <span>Expand</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {loading && items.length === 0 && (
        <div className="empty-state" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Loading…
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <span style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📬</span>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No clipboard items yet. Send text or drop files to sync.
          </p>
        </div>
      )}

      <div className="history-list" style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {items.map((item) => (
          <HistoryItem
            key={item.id}
            item={item}
            currentDeviceId={currentDeviceId}
            onCopy={onToast}
            onDelete={onRemove}
          />
        ))}
      </div>
    </section>
  );
}

export function DeviceList({ token, currentDeviceId, showConfirm, showAlert }) {
  const [devices, setDevices] = useState([]);

  const refresh = () => {
    if (!token) return;
    api.listDevices(token).then((d) => setDevices(d.devices || [])).catch(() => {});
  };

  const handleDelete = async (id) => {
    const confirmed = showConfirm 
      ? await showConfirm('Are you sure you want to unpair this device?', 'Unpair Device')
      : confirm('Are you sure you want to unpair this device?');
    if (!confirmed) return;
    try {
      await api.deleteDevice(token, id);
      refresh();
    } catch (err) {
      if (showAlert) showAlert(err.message, 'Unpair Error');
      else alert(err.message);
    }
  };

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [token]);

  const otherDevices = devices.filter((d) => d.id !== currentDeviceId);

  return (
    <div className="devices-list-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Devices on Network</h4>
        <button type="button" className="btn btn-ghost btn-sm" onClick={refresh}>Refresh</button>
      </div>

      {otherDevices.length === 0 ? (
        <div className="empty-state small" style={{ padding: '1rem', background: 'var(--bg, #18181b)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
          No other paired devices yet.
        </div>
      ) : (
        <ul className="device-list" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {otherDevices.map((d) => {
            const isAndroid = d.type === 'android' || d.type === 'ios' || d.name?.toLowerCase().includes('phone') || d.name?.toLowerCase().includes('pixel') || d.name?.toLowerCase().includes('android');

            return (
              <li key={d.id} className={d.online ? 'online' : ''} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', background: 'var(--bg, #18181b)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    background: isAndroid ? 'rgba(34, 197, 94, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                    border: isAndroid ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(56, 189, 248, 0.3)',
                    flexShrink: 0
                  }}
                >
                  {isAndroid ? '📱' : '💻'}
                </div>

                <div className="device-info" style={{ flex: 1, minWidth: 0 }}>
                  <div className="device-name-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                    <strong style={{ fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.name}
                    </strong>
                    <span
                      className="device-status-badge"
                      style={{
                        fontSize: '0.68rem',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: isAndroid ? 'rgba(34, 197, 94, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                        color: isAndroid ? '#4ade80' : '#38bdf8',
                        fontWeight: '600'
                      }}
                    >
                      {isAndroid ? 'Android' : 'Windows'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {d.online ? '🟢 Connected' : d.stale ? '⚪ Offline' : '🟡 Idle'}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => handleDelete(d.id)}
                  title="Unpair device"
                  style={{ width: '30px', height: '30px', minWidth: '30px', minHeight: '30px', padding: '0.2rem' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--danger)' }}>
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}