import { beforeAll, describe, expect, it } from 'vitest';
import {
  CHECK_VALUE,
  decryptBytes,
  decryptJSON,
  deriveKey,
  encryptBytes,
  encryptJSON,
  fromB64,
  randomBytes,
  toB64,
} from '../lib/crypto';

const PASSPHRASE = 'a quiet sky over the mountains';
const salt = new Uint8Array(16).fill(7);
let key: CryptoKey;

beforeAll(async () => {
  key = await deriveKey(PASSPHRASE, salt, 1000);
});

describe('key derivation', () => {
  it('produces a non-extractable AES-GCM key', async () => {
    expect(key.algorithm.name).toBe('AES-GCM');
    expect(key.extractable).toBe(false);
    expect(key.usages).toContain('encrypt');
    expect(key.usages).toContain('decrypt');
    await expect(crypto.subtle.exportKey('raw', key)).rejects.toBeTruthy();
  });
});

describe('AES-GCM records', () => {
  it('round-trips a JSON payload', async () => {
    const sealed = await encryptJSON(key, { value: CHECK_VALUE, mood: 'good' });
    const opened = await decryptJSON<{ value: string; mood: string }>(
      key,
      sealed.iv,
      sealed.data,
    );
    expect(opened).toEqual({ value: CHECK_VALUE, mood: 'good' });
  });

  it('uses a fresh 12-byte IV for every record', async () => {
    const first = await encryptJSON(key, { a: 1 });
    const second = await encryptJSON(key, { a: 1 });
    expect(first.iv).toHaveLength(12);
    expect(second.iv).toHaveLength(12);
    expect(toB64(first.iv)).not.toBe(toB64(second.iv));
    expect(toB64(first.data)).not.toBe(toB64(second.data));
  });

  it('rejects the wrong passphrase', async () => {
    const sealed = await encryptJSON(key, { value: CHECK_VALUE });
    const wrongKey = await deriveKey('not the passphrase', salt, 1000);
    await expect(decryptJSON(wrongKey, sealed.iv, sealed.data)).rejects.toBeTruthy();
  });

  it('round-trips binary photo data', async () => {
    const bytes = randomBytes(50_000);
    const sealed = await encryptBytes(key, bytes);
    const opened = await decryptBytes(key, sealed.iv, sealed.data);
    expect(opened).toHaveLength(bytes.length);
    expect(toB64(opened)).toBe(toB64(bytes));
  });
});

describe('base64 helpers', () => {
  it('round-trips large buffers in chunks', () => {
    const bytes = randomBytes(120_000);
    const encoded = toB64(bytes);
    const decoded = fromB64(encoded);
    expect(decoded).toHaveLength(bytes.length);
    expect(toB64(decoded)).toBe(encoded);
  });

  it('handles empty buffers', () => {
    expect(toB64(new Uint8Array())).toBe('');
    expect(fromB64('')).toHaveLength(0);
  });
});
