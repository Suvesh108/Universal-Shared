import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { api } from '../utils/api';

export function useSocket(token, onClipboardReceive) {
  const [socketConnected, setSocketConnected] = useState(false);
  const [pollingActive, setPollingActive] = useState(false);
  const socketRef = useRef(null);
  const callbackRef = useRef(onClipboardReceive);
  const knownItemIdsRef = useRef(new Set());
  const initialFetchDoneRef = useRef(false);
  callbackRef.current = onClipboardReceive;

  // 1. Socket connection attempt
  useEffect(() => {
    if (!token) return;

    let socket;
    try {
      socket = io({
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        timeout: 5000,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        setSocketConnected(true);
        socket.emit('device:register', { token }, () => {});
      });

      socket.on('disconnect', () => {
        setSocketConnected(false);
      });

      socket.on('connect_error', () => {
        setSocketConnected(false);
      });

      socket.on('clipboard:receive', (item) => {
        if (item?.id) knownItemIdsRef.current.add(item.id);
        callbackRef.current?.(item);
      });

      socket.on('clipboard:new', (item) => {
        if (item?.id) knownItemIdsRef.current.add(item.id);
        callbackRef.current?.(item, { fromSelf: true });
      });
    } catch (e) {
      setSocketConnected(false);
    }

    const heartbeat = setInterval(() => {
      if (socket?.connected) {
        socket.emit('device:heartbeat', {});
      }
    }, 30000);

    return () => {
      clearInterval(heartbeat);
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  // 2. Smart Polling fallback (active when socket is not connected or in serverless environments)
  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    // Fast initial sync of known IDs
    const syncKnown = async () => {
      try {
        const res = await api.listHistory(token, { limit: 50 });
        if (!isMounted) return;
        if (Array.isArray(res.items)) {
          for (const item of res.items) {
            knownItemIdsRef.current.add(item.id);
          }
        }
        initialFetchDoneRef.current = true;
        setPollingActive(true);
      } catch (e) {
        // Retry later
      }
    };

    syncKnown();

    const pollInterval = setInterval(async () => {
      // If socket is actively connected, no need to poll
      if (socketRef.current?.connected) {
        return;
      }

      // Don't poll aggressively if the tab is hidden to save resources
      if (typeof document !== 'undefined' && document.hidden) {
        return;
      }

      try {
        const res = await api.listHistory(token, { limit: 15 });
        if (!isMounted) return;
        setPollingActive(true);

        if (Array.isArray(res.items)) {
          // If this is after initial sync, check for any new items not yet seen
          if (initialFetchDoneRef.current) {
            const newItems = [];
            for (const item of res.items) {
              if (!knownItemIdsRef.current.has(item.id)) {
                knownItemIdsRef.current.add(item.id);
                newItems.push(item);
              }
            }

            // Trigger callbacks in chronological order (oldest to newest among new arrivals)
            for (let i = newItems.length - 1; i >= 0; i--) {
              callbackRef.current?.(newItems[i]);
            }
          } else {
            for (const item of res.items) {
              knownItemIdsRef.current.add(item.id);
            }
            initialFetchDoneRef.current = true;
          }
        }
      } catch (e) {
        // Ignore background poll errors
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [token]);

  // 3. Send text with automatic fallback to REST API
  const sendText = useCallback((content, type) => {
    return new Promise((resolve, reject) => {
      const socket = socketRef.current;
      if (socket?.connected) {
        socket.emit('clipboard:send', { content, type }, (res) => {
          if (res?.ok) {
            if (res.item?.id) knownItemIdsRef.current.add(res.item.id);
            resolve(res.item);
          } else {
            reject(new Error(res?.error || 'Send failed'));
          }
        });
      } else {
        // Fallback to HTTP REST endpoint seamlessly
        api.sendText(token, content, type)
          .then((res) => {
            if (res.item?.id) knownItemIdsRef.current.add(res.item.id);
            resolve(res.item);
          })
          .catch(reject);
      }
    });
  }, [token]);

  return {
    connected: socketConnected || pollingActive,
    isSocket: socketConnected,
    sendText,
  };
}
