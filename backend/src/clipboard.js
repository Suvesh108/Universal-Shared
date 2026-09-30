const URL_REGEX = /^https?:\/\//i;

export function detectType({ content, mimeType, fileName }) {
  if (mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'file';
  }

  if (fileName) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return 'image';
    if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) return 'video';
    if (fileName) return 'file';
  }

  if (typeof content === 'string' && URL_REGEX.test(content.trim())) return 'link';
  return 'text';
}

export function serializeItem(item, baseUrl) {
  const isFilePayload = !!item.filePath || item.type === 'file' || item.type === 'image' || item.type === 'video';
  const payload = {
    id: item.id,
    deviceId: item.deviceId,
    deviceName: item.deviceName,
    type: item.type,
    content: isFilePayload ? null : item.content,
    fileName: item.fileName,
    mimeType: item.mimeType,
    size: item.size,
    targetDeviceId: item.targetDeviceId || null,
    createdAt: item.createdAt,
  };

  if (item.filePath || isFilePayload) {
    payload.fileUrl = `${baseUrl}/api/files/${item.id}`;
  }

  return payload;
}

export function detectDeviceType(userAgent = '') {
  const ua = userAgent.toLowerCase();
  if (/android/i.test(ua)) return 'android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/windows/i.test(ua)) return 'windows';
  if (/macintosh|mac os/i.test(ua)) return 'mac';
  if (/linux/i.test(ua)) return 'linux';
  return 'unknown';
}
