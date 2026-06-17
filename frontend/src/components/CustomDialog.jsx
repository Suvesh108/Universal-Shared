export default function CustomDialog({ open, message, title, type, onResolve }) {
  if (!open) return null;

  return (
    <div className="dialog-overlay" onClick={() => type === 'confirm' ? onResolve(false) : onResolve()}>
      <div 
        className={`dialog-box ${type === 'alert' ? 'type-alert' : ''}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{title || (type === 'confirm' ? 'Confirm' : 'Alert')}</h3>
        <p className="dialog-message">{message}</p>
        <div className="dialog-actions">
          {type === 'confirm' && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onResolve(false)}
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => onResolve(true)}
            autoFocus
          >
            {type === 'confirm' ? 'Confirm' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
}
