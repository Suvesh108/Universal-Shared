import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

export function useSocket(token, onClipboardReceive) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const callbackRef = useRef(onClipboardReceive);
  callbackRef.current = onClipboardReceive;

  useEffect(() => {
    if (!token) return;

    const socket = io({ transports: ['websocket', 'polling'], autoConnect: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('device:register', { token }, () => {});
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('clipboard:receive', (item) => {
      callbackRef.current?.(item);
    });

    socket.on('clipboard:new', (item) => {
      callbackRef.current?.(item, { fromSelf: true });
    });

    const heartbeat = setInterval(() => {
      if (socket.connected) socket.emit('device:heartbeat', {});
    }, 30000);

    return () => {
      clearInterval(heartbeat);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  const sendText = useCallback((content, type) => {
    return new Promise((resolve, reject) => {
      const socket = socketRef.current;
      if (!socket?.connected) {
        reject(new Error('Not connected'));
        return;
      }
      socket.emit('clipboard:send', { content, type }, (res) => {
        if (res?.ok) resolve(res.item);
        else reject(new Error(res?.error || 'Send failed'));
      });
    });
  }, []);

  return { connected, sendText };
}
