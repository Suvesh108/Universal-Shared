import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { api, getServerUrl } from '../utils/api';
import { encryptText, decryptText } from '../utils/crypto';

export function useSocket(token, onClipboardReceive, onPairRequest) {
  const [socketConnected, setSocketConnected] = useState(false);
  const [pollingActive, setPollingActive] = useState(false);
  const socketRef = useRef(null);

  // Normalize callback whether passed as object or individual arguments
  const onReceiveFn = typeof onClipboardReceive === 'function' ? onClipboardReceive : onClipboardReceive?.onReceive;
  const onPairFn = typeof onPairRequest === 'function' ? onPairRequest : onClipboardReceive?.onPairRequest;

  const callbackRef = useRef(onReceiveFn);
  const pairRequestCallbackRef = useRef(onPairFn);
  const knownItemIdsRef = useRef(new Set());
  const initialFetchDoneRef = useRef(false);

  callbackRef.current = onReceiveFn;
  pairRequestCallbackRef.current = onPairFn;

  // 1. Socket connection attempt
  useEffect(() => {
    if (!token) return;

    let socket;
    try {
      const serverUrl = getServerUrl();
      const options = {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 4000,
        timeout: 8000,
      };

      socket = serverUrl ? io(serverUrl, options) : io(options);
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

      socket.on('pair:request', (data) => {
        pairRequestCallbackRef.current?.(data);
      });

      socket.on('clipboard:receive', async (item) => {
        if (item?.id) knownItemIdsRef.current.add(item.id);
        let decContent = item.content;
        if (item?.content && typeof item.content === 'string') {
          decContent = await decryptText(item.content, token);
        }
        callbackRef.current?.({ ...item, content: decContent, isEncrypted: item.content?.startsWith('e2ee:') });
      });

      socket.on('clipboard:new', async (item) => {
        if (item?.id) knownItemIdsRef.current.add(item.id);
        let decContent = item.content;
        if (item?.content && typeof item.content === 'string') {
          decContent = await decryptText(item.content, token);
        }
        callbackRef.current?.({ ...item, content: decContent, isEncrypted: item.content?.startsWith('e2ee:') }, { fromSelf: true });
      });
    } catch (e) {
      setSocketConnected(false);
    }

    const heartbeat = setInterval(() => {
      if (socket?.connected) {
        socket.emit('device:heartbeat', {});
      }
    }, 15000);

    return () => {
      clearInterval(heartbeat);
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  // 2. Continuous Smart Polling Sync (Ensures 100% Real-Time Sync on all networks)
  useEffect(() => {
    if (!token) return;

    let isMounted = true;

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
        // Retry in next interval
      }
    };

    syncKnown();

    const pollInterval = setInterval(async () => {
      if (typeof document !== 'undefined' && document.hidden) {
        return;
      }

      try {
        const res = await api.listHistory(token, { limit: 20 });
        if (!isMounted) return;
        setPollingActive(true);

        if (Array.isArray(res.items)) {
          if (initialFetchDoneRef.current) {
            const newItems = [];
            for (const item of res.items) {
              if (!knownItemIdsRef.current.has(item.id)) {
                knownItemIdsRef.current.add(item.id);
                newItems.push(item);
              }
            }

            for (let i = newItems.length - 1; i >= 0; i--) {
              const item = newItems[i];
              let decContent = item.content;
              if (item?.content && typeof item.content === 'string') {
                decContent = await decryptText(item.content, token);
              }
              callbackRef.current?.(
                { ...item, content: decContent, isEncrypted: item.content?.startsWith('e2ee:') },
                { fromPolling: true }
              );
            }
          } else {
            for (const item of res.items) {
              knownItemIdsRef.current.add(item.id);
            }
            initialFetchDoneRef.current = true;
          }
        }
      } catch (e) {
        // Ignore poll errors
      }
    }, 1500);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [token]);

  // 3. Send text with AES-256 E2EE encryption
  const sendText = useCallback(async (content, type) => {
    const encryptedContent = await encryptText(content, token);

    return new Promise((resolve, reject) => {
      const socket = socketRef.current;
      if (socket?.connected) {
        socket.emit('clipboard:send', { content: encryptedContent, type }, (res) => {
          if (res?.ok) {
            if (res.item?.id) knownItemIdsRef.current.add(res.item.id);
            resolve({ ...res.item, content }); // Return original plaintext locally
          } else {
            reject(new Error(res?.error || 'Send failed'));
          }
        });
      } else {
        api.sendText(token, encryptedContent, type)
          .then((res) => {
            if (res.item?.id) knownItemIdsRef.current.add(res.item.id);
            resolve({ ...res.item, content }); // Return original plaintext locally
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