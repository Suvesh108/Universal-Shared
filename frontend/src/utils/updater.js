import { api, apiUrl, isCapacitor } from './api';

export const CURRENT_VERSION = 'v0.1.2';
export const REPO_OWNER = 'Suvesh108';
export const REPO_NAME = 'Universal-Shared';

export function isElectron() {
  return typeof window !== 'undefined' && window.process && window.process.type === 'renderer';
}

function compareVersions(v1, v2) {
  const clean1 = v1.replace(/^v/, '').split('.').map(Number);
  const clean2 = v2.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < Math.max(clean1.length, clean2.length); i++) {
    const num1 = clean1[i] || 0;
    const num2 = clean2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

export async function checkForUpdate() {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const latestVersion = data.tag_name || data.name;
    
    if (latestVersion && compareVersions(latestVersion, CURRENT_VERSION) > 0) {
      // Find matching asset
      let targetAsset = null;
      if (isCapacitor()) {
        targetAsset = data.assets?.find(a => a.name.endsWith('.apk'));
      } else if (isElectron() || navigator.userAgent.includes('Windows')) {
        targetAsset = data.assets?.find(a => a.name.includes('setup') && a.name.endsWith('.exe'))
          || data.assets?.find(a => a.name.endsWith('.exe'));
      }

      return {
        available: true,
        currentVersion: CURRENT_VERSION,
        latestVersion,
        releaseName: data.name || latestVersion,
        releaseNotes: data.body || '',
        publishedAt: data.published_at,
        asset: targetAsset,
        downloadUrl: targetAsset ? targetAsset.browser_download_url : data.html_url
      };
    }
    return { available: false, currentVersion: CURRENT_VERSION };
  } catch (err) {
    console.warn('Update check failed:', err);
    return null;
  }
}

export async function downloadAndInstallUpdate(updateInfo, onProgress) {
  if (!updateInfo?.downloadUrl) throw new Error('No download URL available');

  // 1. Android Native Updater
  if (isCapacitor()) {
    return new Promise((resolve, reject) => {
      fetch(apiUrl('/api/system/download-update'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: updateInfo.downloadUrl })
      })
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          // Poll download progress
          const checkTimer = setInterval(async () => {
            try {
              const progRes = await fetch(apiUrl('/api/system/update-progress')).then(r => r.json());
              if (progRes.progress !== undefined) {
                onProgress?.(progRes.progress);
              }
              if (progRes.ready) {
                clearInterval(checkTimer);
                resolve({ ready: true, platform: 'android' });
              } else if (progRes.error) {
                clearInterval(checkTimer);
                reject(new Error(progRes.error));
              }
            } catch (e) {
              clearInterval(checkTimer);
              reject(e);
            }
          }, 800);
        } else {
          reject(new Error(data.error || 'Failed to start download'));
        }
      })
      .catch(reject);
    });
  }

  // 2. Electron Windows Updater
  if (window.electronAPI && window.electronAPI.downloadUpdate) {
    return new Promise((resolve, reject) => {
      window.electronAPI.onUpdateProgress((prog) => {
        onProgress?.(prog);
      });
      window.electronAPI.downloadUpdate(updateInfo.downloadUrl)
        .then(() => resolve({ ready: true, platform: 'electron' }))
        .catch(reject);
    });
  }

  // 3. Fallback to direct link
  window.open(updateInfo.downloadUrl, '_blank');
  return { ready: false, platform: 'web' };
}
