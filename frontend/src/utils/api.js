const SERVER_URL_KEY = 'uc_server_url';

export function isCapacitor() {
  if (typeof window === 'undefined') return false;
  return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) ||
    window.location.protocol === 'capacitor:' ||
    (window.location.hostname === 'localhost' && window.location.port === '');
}

export function getServerUrl() {
  if (typeof window === 'undefined') return '';
  const custom = localStorage.getItem(SERVER_URL_KEY);
  if (custom) return custom.replace(/\/+$/, '');
  if (isCapacitor()) {
    return 'http://127.0.0.1:3847';
  }
  return '';
}

export function setServerUrl(url) {
  if (!url) {
    localStorage.removeItem(SERVER_URL_KEY);
  } else {
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'http://' + cleanUrl;
    }
    cleanUrl = cleanUrl.replace(/\/+$/, '');
    localStorage.setItem(SERVER_URL_KEY, cleanUrl);
  }
}

export function apiUrl(path) {
  const base = getServerUrl();
  return base ? `${base}${path}` : path;
}

export function nativeApiUrl(path) {
  if (isCapacitor()) {
    return `http://127.0.0.1:3847${path}`;
  }
  return apiUrl(path);
}

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
  info: () => fetch(apiUrl('/api/info')).then(parseJson),

  updateSettings: (settings) =>
    fetch(apiUrl('/api/settings'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    }).then(parseJson),

  generatePairQr: (origin, interfaceIp) => {
    const params = new URLSearchParams();
    if (origin && !origin.includes('127.0.0.1') && !origin.includes('localhost')) {
      params.set('origin', origin);
    }
    if (interfaceIp) {
      params.set('interfaceIp', interfaceIp);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetch(apiUrl(`/api/pair/qr${query}`)).then(parseJson);
  },

  requestPair: (body) =>
    fetch(apiUrl('/api/pair/request'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(parseJson),

  checkPairStatus: (requestId) =>
    fetch(apiUrl(`/api/pair/status/${requestId}`)).then(parseJson),

  approvePair: (requestId) =>
    fetch(apiUrl('/api/pair/approve'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId }),
    }).then(parseJson),

  declinePair: (requestId) =>
    fetch(apiUrl('/api/pair/decline'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId }),
    }).then(parseJson),

  verifyPair: (body) =>
    fetch(apiUrl('/api/pair/verify'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(parseJson),

  registerDevice: (body) =>
    fetch(apiUrl('/api/devices/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(parseJson),

  listDevices: (token) =>
    fetch(apiUrl('/api/devices'), { headers: headers(token) }).then(parseJson),

  updateProfile: (token, { name, type }) =>
    fetch(apiUrl('/api/devices/me'), {
      method: 'POST',
      headers: headers(token, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ name, type }),
    }).then(parseJson),

  listHistory: (token, { limit = 50, offset = 0 } = {}) =>
    fetch(apiUrl(`/api/history?limit=${limit}&offset=${offset}`), {
      headers: headers(token),
    }).then(parseJson),

  sendText: (token, content, type, targetDeviceId = null) =>
    fetch(apiUrl('/api/clipboard'), {
      method: 'POST',
      headers: headers(token, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ content, type, targetDeviceId }),
    }).then(parseJson),

  uploadFile: (token, file, onProgress, targetDeviceId = null) =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const form = new FormData();
      form.append('file', file);
      if (targetDeviceId) form.append('targetDeviceId', targetDeviceId);

      xhr.open('POST', apiUrl('/api/upload'));
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
    fetch(apiUrl(`/api/history/${id}`), {
      method: 'DELETE',
      headers: headers(token),
    }).then(parseJson),

  clearHistory: (token) =>
    fetch(apiUrl('/api/history'), {
      method: 'DELETE',
      headers: headers(token),
    }).then(parseJson),

  deleteDevice: (token, id) =>
    fetch(apiUrl(`/api/devices/${id}`), {
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
