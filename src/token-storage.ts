const PREFIX = 'enc:v1:';
const enc = new TextEncoder();

async function keyFrom(secret: string | undefined): Promise<CryptoKey> {
  if (!secret || !/^[a-f0-9]{64}$/i.test(secret)) throw new Error('Configure TOKEN_ENCRYPTION_KEY com 64 caracteres hexadecimais antes de conectar uma plataforma');
  const bytes = Uint8Array.from(secret.match(/../g)!, (v) => parseInt(v, 16));
  return crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function protectToken(secret: string | undefined, name: string, value: string): Promise<string> {
  const key = await keyFrom(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: enc.encode(name) }, key, enc.encode(value)));
  return PREFIX + btoa(String.fromCharCode(...iv, ...encrypted));
}

export async function revealToken(secret: string | undefined, name: string, value: string): Promise<string> {
  // Legacy installations must reconnect with the encryption secret configured.
  if (!value.startsWith(PREFIX)) {
    if (secret) throw new Error('Token antigo sem proteção: reconecte a plataforma');
    return value;
  }
  try {
    const key = await keyFrom(secret);
    const bytes = Uint8Array.from(atob(value.slice(PREFIX.length)), (v) => v.charCodeAt(0));
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12), additionalData: enc.encode(name) }, key, bytes.slice(12));
    return new TextDecoder().decode(plain);
  } catch {
    throw new Error('Não foi possível abrir o token protegido; confira a chave ou reconecte a plataforma');
  }
}

export const isOAuthToken = (name: string) => ['ig_token', 'yt_access_token', 'yt_refresh_token'].includes(name);
