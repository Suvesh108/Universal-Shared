// AES-256-GCM End-to-End Encryption using Web Crypto API

const E2EE_PREFIX = 'e2ee:';

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = window.atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function getAesKey(secret) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(secret || 'universal-shared-default-key'),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode('universal-shared-salt-v1'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptText(plainText, secret) {
  if (!plainText || typeof window === 'undefined' || !window.crypto?.subtle) {
    return plainText;
  }

  try {
    const key = await getAesKey(secret);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const encoded = enc.encode(plainText);

    const ciphertext = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );

    const ivB64 = arrayBufferToBase64(iv);
    const cipherB64 = arrayBufferToBase64(ciphertext);
    return `${E2EE_PREFIX}${ivB64}:${cipherB64}`;
  } catch (err) {
    console.warn('E2EE encryption fallback to plaintext:', err);
    return plainText;
  }
}

export async function decryptText(cipherText, secret) {
  if (!cipherText || typeof cipherText !== 'string' || !cipherText.startsWith(E2EE_PREFIX)) {
    return cipherText;
  }

  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    return cipherText;
  }

  try {
    const parts = cipherText.substring(E2EE_PREFIX.length).split(':');
    if (parts.length !== 2) return cipherText;

    const [ivB64, cipherB64] = parts;
    const iv = new Uint8Array(base64ToArrayBuffer(ivB64));
    const data = base64ToArrayBuffer(cipherB64);
    const key = await getAesKey(secret);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (err) {
    console.warn('E2EE decryption error (wrong key or corrupted):', err);
    return cipherText;
  }
}

export function isEncrypted(text) {
  return typeof text === 'string' && text.startsWith(E2EE_PREFIX);
}