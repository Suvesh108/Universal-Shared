import { useState } from 'react';
import { api } from '../utils/api';

export default function PairApprovalModal({ request, onResolved }) {
  const [approving, setApproving] = useState(false);
  const [declining, setDeclining] = useState(false);

  if (!request) return null;

  const isPhone = request.type === 'phone' || request.type === 'android' || request.name?.toLowerCase().includes('phone');

  const handleApprove = async () => {
    setApproving(true);
    try {
      await api.approvePair(request.requestId || request.id);
      onResolved?.(true, request);
    } catch (err) {
      console.warn('Approval failed:', err);
    } finally {
      setApproving(false);
    }
  };

  const handleDecline = async () => {
    setDeclining(true);
    try {
      await api.declinePair(request.requestId || request.id);
      onResolved?.(false, request);
    } catch (err) {
      console.warn('Decline failed:', err);
    } finally {
      setDeclining(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '420px',
          border: '2px solid rgba(99, 102, 241, 0.6)',
          boxShadow: '0 20px 40px -10px rgba(99, 102, 241, 0.4)'
        }}
      >
        <div className="modal-header" style={{ marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.4rem' }}>🔐</span>
            <h2 style={{ margin: 0, fontSize: '1.15rem' }}>New Device Connection Request</h2>
          </div>
        </div>

        <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          A nearby device is attempting to pair with this computer:
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'var(--bg-elevated, #18181b)',
            padding: '14px',
            borderRadius: '12px',
            border: '1px solid var(--border, #27272a)',
            marginBottom: '1rem'
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}
          >
            {isPhone ? '📱' : '💻'}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text)' }}>
              {request.name || 'Unknown Device'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', marginTop: '2px' }}>
              <span>Type: {request.type || 'android'}</span>
              {request.code && <span>PIN: <strong>{request.code}</strong></span>}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <button
            type="button"
            className="btn btn-ghost danger"
            onClick={handleDecline}
            disabled={declining || approving}
            style={{ flex: 1 }}
          >
            {declining ? 'Declining...' : 'Decline'}
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleApprove}
            disabled={declining || approving}
            style={{
              flex: 1.5,
              background: '#10b981',
              borderColor: '#10b981',
              fontWeight: '600'
            }}
          >
            {approving ? 'Connecting...' : 'Approve & Connect'}
          </button>
        </div>
      </div>
    </div>
  );
}