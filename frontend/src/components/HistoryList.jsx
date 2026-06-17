import { useEffect, useState } from 'react';
import { api, formatTime, formatBytes } from '../utils/api';
import { copyToClipboard } from '../hooks/useClipboard';

function getTypeIcon(type) {
  switch (type) {
    case 'text':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      );
    case 'link':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
      );
    case 'image':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      );
    case 'video':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="23 7 16 12 23 17 23 7"/>
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
        </svg>
      );
    default:
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      );
  }
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

  return (
    <div className={`history-row ${isOwn ? 'align-left' : 'align-right'}`}>
      <div className="history-bubble-wrapper">
        <div className="history-bubble">
          <div className="history-bubble-header">
            <strong>{item.deviceName}</strong>
            <span>{formatTime(item.createdAt)}</span>
            {item.size > 0 && <span>({formatBytes(item.size)})</span>}
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

export default function HistoryList({ token, currentDeviceId, items, loading, onRefresh, onRemove, onClear, onToast, showAlert, showConfirm, isEnlarged, onToggleResize }) {
  return (
    <section className="card history-section">
      <div className="section-header">
        <h2>Clipboard History</h2>
        <div className="section-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onRefresh}>
            Refresh
          </button>
          {items.length > 0 && (
            <button type="button" className="btn btn-ghost btn-sm danger" onClick={onClear}>
              Clear History
            </button>
          )}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onToggleResize}
            title={isEnlarged ? "Collapse clipboard history" : "Expand clipboard history"}
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
        </div>
      </div>

      {loading && items.length === 0 && <div className="empty-state">Loading…</div>}

      {!loading && items.length === 0 && (
        <div className="empty-state">
          <span>📬</span>
          <p>No clipboard items yet. Send something from any paired device.</p>
        </div>
      )}

      <div className="history-list">
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
    api.listDevices(token).then((d) => setDevices(d.devices)).catch(() => {});
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

  const getDeviceIconSvg = (type) => {
    switch (type) {
      case 'windows':
      case 'mac':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        );
      case 'android':
      case 'ios':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
            <line x1="12" y1="18" x2="12.01" y2="18"/>
          </svg>
        );
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
            <line x1="6" y1="6" x2="6.01" y2="6"/>
            <line x1="6" y1="18" x2="6.01" y2="18"/>
          </svg>
        );
    }
  };

  const otherDevices = devices.filter((d) => d.id !== currentDeviceId);

  return (
    <section className="card devices-section">
      <div className="section-header">
        <h2>Devices on Network</h2>
        <button type="button" className="btn btn-ghost btn-sm" onClick={refresh}>Refresh</button>
      </div>

      {otherDevices.length === 0 ? (
        <div className="empty-state small">No other paired devices yet.</div>
      ) : (
        <ul className="device-list">
          {otherDevices.map((d) => (
            <li key={d.id} className={d.online ? 'online' : ''}>
              <span className="device-icon" style={{ opacity: d.online ? 1 : 0.5 }}>
                {getDeviceIconSvg(d.type)}
              </span>
              <div className="device-info">
                <div className="device-name-row">
                  <strong>{d.name}</strong>
                  <span className="device-status-badge">
                    {d.online ? 'Active' : d.stale ? 'Offline' : 'Idle'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => handleDelete(d.id)}
                title="Unpair device"
                style={{ width: '32px', height: '32px', minWidth: '32px', minHeight: '32px', padding: '0.25rem' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--danger)' }}>
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
