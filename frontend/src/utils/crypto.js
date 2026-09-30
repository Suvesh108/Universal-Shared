// AES-256-GCM End-to-End Encryption using Web Crypto API

const E2EE_PREFIX = 'e2ee:';
const SHARED_CLUSTER_KEY = 'universal-shared-cluster-vault-key-v1';

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

const keyCache = new Map();

async function getAesKey(secretKey) {
  const effectiveKey = secretKey || SHARED_CLUSTER_KEY;
  if (keyCache.has(effectiveKey)) {
    return keyCache.get(effectiveKey);
  }

  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(effectiveKey),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const derivedKey = await window.crypto.subtle.deriveKey(
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

  keyCache.set(effectiveKey, derivedKey);
  return derivedKey;
}

export async function encryptText(plainText, secret) {
  if (!plainText || typeof window === 'undefined' || !window.crypto?.subtle) {
    return plainText;
  }

  try {
    const key = await getAesKey(secret || SHARED_CLUSTER_KEY);
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
    console.warn('E2EE encryption fallback:', err);
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

  const parts = cipherText.substring(E2EE_PREFIX.length).split(':');
  if (parts.length !== 2) return cipherText;

  const [ivB64, cipherB64] = parts;
  let iv, data;
  try {
    iv = new Uint8Array(base64ToArrayBuffer(ivB64));
    data = base64ToArrayBuffer(cipherB64);
  } catch (e) {
    return cipherText;
  }

  // Try candidate keys in order: Shared Cluster Key -> Custom Secret -> Default Key
  const candidateKeys = [
    SHARED_CLUSTER_KEY,
    secret,
    'universal-shared-default-key',
  ].filter(Boolean);

  for (const candidate of candidateKeys) {
    try {
      const key = await getAesKey(candidate);
      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );
      const dec = new TextDecoder();
      return dec.decode(decrypted);
    } catch (err) {
      // Continue to next candidate
    }
  }

  console.warn('E2EE could not decrypt payload with candidate keys.');
  return cipherText;
}

export function isEncrypted(text) {
  return typeof text === 'string' && text.startsWith(E2EE_PREFIX);
}