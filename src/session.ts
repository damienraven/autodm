import { hmacSha256Hex, randomToken, safeEqual } from './util';

export const SESSION_SECONDS = 2 * 60 * 60;

export async function createSession(password: string, now = Math.floor(Date.now() / 1000)): Promise<string> {
  const payload = `${now + SESSION_SECONDS}.${randomToken()}`;
  return `${payload}.${await hmacSha256Hex(password, `autodm-session-v2:${payload}`)}`;
}

export async function validSession(password: string, value: string, now = Math.floor(Date.now() / 1000)): Promise<boolean> {
  if (!password || !/^\d{10}\.[a-f0-9]{32}\.[a-f0-9]{64}$/.test(value)) return false;
  const [deadline, nonce, signature] = value.split('.');
  const expires = Number(deadline);
  if (expires <= now || expires > now + SESSION_SECONDS) return false;
  return safeEqual(signature, await hmacSha256Hex(password, `autodm-session-v2:${deadline}.${nonce}`));
}
