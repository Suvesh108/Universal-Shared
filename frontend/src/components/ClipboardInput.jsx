import { useState, useRef } from 'react';
import { api, isLink } from '../utils/api';
import { readFromClipboard } from '../hooks/useClipboard';

export default function ClipboardInput({ token, onSent, sendText, showAlert }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [currentFileName, setCurrentFileName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const sendContent = async (content) => {
    if (!content?.trim()) return;
    setSending(true);
    try {
      const type = isLink(content) ? 'link' : 'text';
      if (sendText) {
        const item = await sendText(content.trim(), type);
        onSent?.(item);
      } else {
        const { item } = await api.sendText(token, content.trim(), type);
        onSent?.(item);
      }
      setText('');
    } catch (err) {
      showAlert?.(err.message, 'Send Error');
    } finally {
      setSending(false);
    }
  };

  const handlePaste = async () => {
    try {
      const content = await readFromClipboard();
      if (content) await sendContent(content);
    } catch (err) {
      showAlert?.(err.message, 'Paste Error');
    }
  };

  const uploadFiles = async (files) => {
    if (!files?.length) return;
    for (const file of files) {
      setUploadProgress(0);
      setCurrentFileName(file.name);
      try {
        const { item } = await api.uploadFile(token, file, setUploadProgress);
        onSent?.(item);
      } catch (err) {
        showAlert?.(`${file.name}: ${err.message}`, 'Upload Error');
      }
    }
    setUploadProgress(null);
    setCurrentFileName('');
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    uploadFiles(Array.from(e.dataTransfer.files));
  };

  return (
    <section className="card input-section">
      <h2>Send to Clipboard</h2>

      <div
        className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <textarea
          className="clipboard-textarea"
          placeholder="Type or paste text, links… Drop files, images, or videos here"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
        />
        {uploadProgress !== null && (
          <div className="upload-progress">
            <div className="upload-progress-info">
              <div className="upload-progress-text">
                <span style={{ fontWeight: '500', fontSize: '0.85rem' }}>Uploading {currentFileName}...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="upload-track">
                <div className="upload-bar" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          </div>
        )}
        <div className="drop-hint">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
          </svg>
          Drag & drop files, images, or videos to broadcast
        </div>
      </div>

      <div className="input-actions">
        <div className="input-actions-left">
          <button type="button" className="btn btn-secondary" onClick={handlePaste}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
            </svg>
            Paste & send
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => fileRef.current?.click()}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
            Upload file
          </button>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!text.trim() || sending}
          onClick={() => sendContent(text)}
        >
          {sending ? (
            'Sending…'
          ) : (
            <>
              Send
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </>
          )}
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        hidden
        multiple
        onChange={(e) => uploadFiles(Array.from(e.target.files || []))}
      />
    </section>
  );
}
