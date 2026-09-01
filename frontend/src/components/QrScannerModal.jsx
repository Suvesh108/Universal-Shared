import { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';

export default function QrScannerModal({ open, onClose, onScanned }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameId = useRef(null);
  const streamRef = useRef(null);

  const [hasCamera, setHasCamera] = useState(true);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) or 'user' (front)
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!open) {
      stopCamera();
      return;
    }

    setScanned(false);
    setError(null);
    startCamera();

    return () => {
      stopCamera();
    };
  }, [open, facingMode]);

  const startCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCamera(false);
        setError('Camera API is not supported on this device/browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play().catch(() => {});
        startScanningLoop();
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setHasCamera(false);
      setError('Could not access camera. Please grant camera permissions.');
    }
  };

  const stopCamera = () => {
    if (animFrameId.current) {
      cancelAnimationFrame(animFrameId.current);
      animFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startScanningLoop = () => {
    const scan = () => {
      if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
        animFrameId.current = requestAnimationFrame(scan);
        return;
      }

      const video = videoRef.current;
      let canvas = canvasRef.current;
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvasRef.current = canvas;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });

      if (code && code.data && !scanned) {
        setScanned(true);
        if (navigator.vibrate) navigator.vibrate(80);

        handleQrData(code.data);
        return;
      }

      animFrameId.current = requestAnimationFrame(scan);
    };

    animFrameId.current = requestAnimationFrame(scan);
  };

  const handleQrData = (rawData) => {
    let resultServerUrl = null;
    let resultPairCode = null;

    try {
      // 1. JSON payload format
      if (rawData.startsWith('{')) {
        const parsed = JSON.parse(rawData);
        resultServerUrl = parsed.serverUrl || parsed.url || null;
        resultPairCode = parsed.code || parsed.pair || null;
      } else if (rawData.includes('?pair=')) {
        // 2. URL format: http://192.168.1.5:3847?pair=A3B9Z1
        const urlObj = new URL(rawData);
        resultPairCode = urlObj.searchParams.get('pair');
        resultServerUrl = urlObj.origin;
      } else if (/^[A-Z0-9]{6}$/i.test(rawData.trim())) {
        // 3. Raw 6-char pairing code
        resultPairCode = rawData.trim().toUpperCase();
      } else {
        resultPairCode = rawData.trim();
      }

      stopCamera();
      onScanned({
        serverUrl: resultServerUrl,
        code: resultPairCode,
        raw: rawData
      });
      onClose();
    } catch (e) {
      console.warn('QR parse error:', e);
      stopCamera();
      onScanned({ code: rawData.trim(), raw: rawData });
      onClose();
    }
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '460px',
          padding: '1.25rem',
          background: '#09090b',
          border: '1px solid #27272a'
        }}
      >
        <div className="modal-header" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.3rem' }}>📷</span>
            <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Scan QR Code on PC</h2>
          </div>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', background: '#000', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {hasCamera ? (
            <>
              <video
                ref={videoRef}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                playsInline
                muted
                autoPlay
              />

              {/* Viewfinder Target Rectangle */}
              <div
                style={{
                  position: 'absolute',
                  width: '68%',
                  height: '68%',
                  border: '2px solid rgba(99, 102, 241, 0.9)',
                  borderRadius: '16px',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
                  pointerEvents: 'none'
                }}
              >
                {/* Viewfinder Corner Accents */}
                <div style={{ position: 'absolute', top: -2, left: -2, width: 22, height: 22, borderTop: '4px solid #6366f1', borderLeft: '4px solid #6366f1', borderTopLeftRadius: '14px' }} />
                <div style={{ position: 'absolute', top: -2, right: -2, width: 22, height: 22, borderTop: '4px solid #6366f1', borderRight: '4px solid #6366f1', borderTopRightRadius: '14px' }} />
                <div style={{ position: 'absolute', bottom: -2, left: -2, width: 22, height: 22, borderBottom: '4px solid #6366f1', borderLeft: '4px solid #6366f1', borderBottomLeftRadius: '14px' }} />
                <div style={{ position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderBottom: '4px solid #6366f1', borderRight: '4px solid #6366f1', borderBottomRightRadius: '14px' }} />

                {/* Animated Laser Scanning Line */}
                <div
                  style={{
                    position: 'absolute',
                    top: '10%',
                    left: '5%',
                    width: '90%',
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, #38bdf8, #6366f1, #38bdf8, transparent)',
                    boxShadow: '0 0 12px #6366f1',
                    animation: 'scanLaser 2s infinite ease-in-out'
                  }}
                />
              </div>
            </>
          ) : (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#a1a1aa' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🚫</div>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>{error || 'Camera unavailable'}</p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={toggleCamera}
            style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            🔄 Flip Camera
          </button>

          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            style={{ fontSize: '0.85rem' }}
          >
            Enter Code Manually
          </button>
        </div>

        <style>{`
          @keyframes scanLaser {
            0% { top: 10%; opacity: 0.8; }
            50% { top: 88%; opacity: 1; }
            100% { top: 10%; opacity: 0.8; }
          }
        `}</style>
      </div>
    </div>
  );
}