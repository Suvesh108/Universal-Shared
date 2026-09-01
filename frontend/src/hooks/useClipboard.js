import { useCallback, useEffect, useState } from 'react';
import { api } from '../utils/api';
import { decryptText, encryptText } from '../utils/crypto';

export function useClipboardHistory(token) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.listHistory(token, { limit: 100 });
      const decryptedItems = await Promise.all(
        (data.items || []).map(async (it) => {
          if (it.content && typeof it.content === 'string') {
            const dec = await decryptText(it.content, token);
            return { ...it, content: dec, isEncrypted: it.content.startsWith('e2ee:') };
          }
          return it;
        })
      );
      setItems(decryptedItems);
      setTotal(data.total);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const prepend = useCallback(async (item) => {
    let processed = item;
    if (item?.content && typeof item.content === 'string') {
      const dec = await decryptText(item.content, token);
      processed = { ...item, content: dec, isEncrypted: item.content.startsWith('e2ee:') };
    }

    setItems((prev) => {
      if (prev.some((i) => i.id === processed.id)) return prev;
      return [processed, ...prev].slice(0, 100);
    });
    setTotal((t) => t + 1);
  }, [token]);

  const remove = useCallback(async (id) => {
    if (!token) return;
    await api.deleteItem(token, id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    setTotal((t) => Math.max(0, t - 1));
  }, [token]);

  const clearAll = useCallback(async () => {
    if (!token) return;
    await api.clearHistory(token);
    setItems([]);
    setTotal(0);
  }, [token]);

  return { items, total, loading, refresh, prepend, remove, clearAll };
}

export async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(ta);
  return ok;
}

export async function readFromClipboard() {
  if (navigator.clipboard?.readText) {
    return navigator.clipboard.readText();
  }
  throw new Error('Clipboard read not supported — paste manually');
}