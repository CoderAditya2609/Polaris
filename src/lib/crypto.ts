export const KDF_ITERATIONS = 600_000;
export const SALT_BYTES = 16;
export const IV_BYTES = 12;
export const CHECK_VALUE = 'polaris-unlock-check-v1';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export interface Sealed {
  iv: Uint8Array<ArrayBuffer>;
  data: ArrayBuffer;
}

export function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(length);
  const chunk = 65_536;
  for (let offset = 0; offset < length; offset += chunk) {
    crypto.getRandomValues(bytes.subarray(offset, Math.min(offset + chunk, length)));
  }
  return bytes;
}

export async function deriveKey(
  passphrase: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number = KDF_ITERATIONS,
): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptBytes(key: CryptoKey, bytes: BufferSource): Promise<Sealed> {
  const iv = randomBytes(IV_BYTES);
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes);
  return { iv, data };
}

export async function decryptBytes(
  key: CryptoKey,
  iv: Uint8Array<ArrayBuffer>,
  data: BufferSource,
): Promise<Uint8Array<ArrayBuffer>> {
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return new Uint8Array(plain);
}

export async function encryptJSON(key: CryptoKey, value: unknown): Promise<Sealed> {
  return encryptBytes(key, encoder.encode(JSON.stringify(value)));
}

export async function decryptJSON<T>(
  key: CryptoKey,
  iv: Uint8Array<ArrayBuffer>,
  data: BufferSource,
): Promise<T> {
  const plain = await decryptBytes(key, iv, data);
  return JSON.parse(decoder.decode(plain)) as T;
}

export function toB64(input: ArrayBuffer | Uint8Array<ArrayBufferLike>): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function fromB64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
