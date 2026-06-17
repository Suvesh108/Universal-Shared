const DEVICE_KEY = 'uc_device';
const THEME_KEY = 'uc_theme';
const NAME_KEY = 'uc_device_name';

export function loadDevice() {
  try {
    const raw = localStorage.getItem(DEVICE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveDevice(device) {
  localStorage.setItem(DEVICE_KEY, JSON.stringify(device));
}

export function clearDevice() {
  localStorage.removeItem(DEVICE_KEY);
}

export function loadTheme() {
  return localStorage.getItem(THEME_KEY) || 'dark';
}

export function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
  document.documentElement.setAttribute('data-theme', theme);
}

export function loadDeviceName() {
  return localStorage.getItem(NAME_KEY) || '';
}

export function saveDeviceName(name) {
  localStorage.setItem(NAME_KEY, name);
}

export function detectDeviceType() {
  const ua = navigator.userAgent.toLowerCase();
  if (/android/i.test(ua)) return 'android';
  if (/iphone|ipad/i.test(ua)) return 'ios';
  if (/windows/i.test(ua)) return 'windows';
  if (/macintosh/i.test(ua)) return 'mac';
  return 'unknown';
}

export function defaultDeviceName() {
  const type = detectDeviceType();
  const labels = {
    android: 'Android Phone',
    ios: 'iPhone',
    windows: 'Windows PC',
    mac: 'Mac',
    unknown: 'Device',
  };
  return labels[type] || 'Device';
}
