import HistoryList from './HistoryList';

export default function HistoryModal({
  open,
  onClose,
  token,
  currentDeviceId,
  items,
  loading,
  onRefresh,
  onRemove,
  onClear,
  onToast,
  showAlert,
  showConfirm
}) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
      <div
        className="history-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '620px',
          height: '88vh',
          background: 'var(--bg-card, #121214)',
          border: '1px solid var(--border, rgba(255,255,255,0.1))',
          borderRadius: '16px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-elevated)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem' }}>📋</span>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700' }}>
              Clipboard History {items.length > 0 && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>({items.length})</span>}
            </h2>
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

        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
          <HistoryList
            token={token}
            currentDeviceId={currentDeviceId}
            items={items}
            loading={loading}
            onRefresh={onRefresh}
            onRemove={onRemove}
            onClear={onClear}
            onToast={onToast}
            showAlert={showAlert}
            showConfirm={showConfirm}
            isModalView={true}
          />
        </div>
      </div>
    </div>
  );
}