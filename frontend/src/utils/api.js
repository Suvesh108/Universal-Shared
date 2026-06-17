function headers(token, extra = {}) {
  const h = { ...extra };
  if (token) h['X-Device-Token'] = token;
  return h;
}

async function parseJson(res) {
  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent('auth-failed'));
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export const api = {
  info: () => fetch('/api/info').then(parseJson),

  updateSettings: (settings) =>
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    }).then(parseJson),

  generatePairQr: () => fetch('/api/pair/qr').then(parseJson),

  verifyPair: (body) =>
    fetch('/api/pair/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(parseJson),

  registerDevice: (body) =>
    fetch('/api/devices/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(parseJson),

  listDevices: (token) =>
    fetch('/api/devices', { headers: headers(token) }).then(parseJson),

  updateProfile: (token, { name, type }) =>
    fetch('/api/devices/me', {
      method: 'POST',
      headers: headers(token, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ name, type }),
    }).then(parseJson),

  listHistory: (token, { limit = 50, offset = 0 } = {}) =>
    fetch(`/api/history?limit=${limit}&offset=${offset}`, {
      headers: headers(token),
    }).then(parseJson),

  sendText: (token, content, type) =>
    fetch('/api/clipboard', {
      method: 'POST',
      headers: headers(token, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ content, type }),
    }).then(parseJson),

  uploadFile: (token, file, onProgress) =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const form = new FormData();
      form.append('file', file);

      xhr.open('POST', '/api/upload');
      xhr.setRequestHeader('X-Device-Token', token);

      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
        };
      }

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) resolve(data);
          else reject(new Error(data.error || 'Upload failed'));
        } catch {
          reject(new Error('Upload failed'));
        }
      };
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send(form);
    }),

  deleteItem: (token, id) =>
    fetch(`/api/history/${id}`, {
      method: 'DELETE',
      headers: headers(token),
    }).then(parseJson),

  clearHistory: (token) =>
    fetch('/api/history', {
      method: 'DELETE',
      headers: headers(token),
    }).then(parseJson),

  deleteDevice: (token, id) =>
    fetch(`/api/devices/${id}`, {
      method: 'DELETE',
      headers: headers(token),
    }).then(parseJson),
};

export function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

export function formatTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function isLink(text) {
  return /^https?:\/\//i.test(String(text || '').trim());
}

export function typeIcon(type) {
  const icons = { text: '📝', link: '🔗', image: '🖼️', file: '📄', video: '🎬' };
  return icons[type] || '📋';
}
