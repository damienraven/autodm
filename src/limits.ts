import type { Env } from './types';
import { hmacSha256Hex } from './util';

/** Atomic reservation shared by all Worker invocations. Failed requests still consume budget. */
export async function reserve(env: Env, id: string, limit: number, expires: number): Promise<boolean> {
  const row = await env.DB.prepare(
    `INSERT INTO security_buckets (id, used, expires_at) VALUES (?, 1, ?)
     ON CONFLICT(id) DO UPDATE SET used = used + 1 WHERE used < ? RETURNING used`,
  ).bind(id, expires, limit).first();
  return row !== null;
}

export async function allowLogin(env: Env, ip: string, now = Math.floor(Date.now() / 1000)): Promise<boolean> {
  const period = Math.floor(now / 900);
  const hash = await hmacSha256Hex(env.ADMIN_PASSWORD, `login:${ip}`);
  return reserve(env, `login:${period}:${hash}`, 10, (period + 1) * 900);
}

export async function allowSend(env: Env, userId: string | undefined, now = Math.floor(Date.now() / 1000)): Promise<void> {
  if (env.SEND_MODE !== 'test' && env.SEND_MODE !== 'public') throw new Error('Envios pausados globalmente');
  if (!userId) throw new Error('Destinatário ausente: envio bloqueado');
  if (env.SEND_MODE === 'test' && !(env.TEST_IG_USER_IDS ?? '').split(',').map((s) => s.trim()).filter(Boolean).includes(userId)) {
    throw new Error('Destinatário fora do piloto autorizado');
  }
  // Conservative installation limits; raising them requires a reviewed code change.
  const day = Math.floor(now / 86400);
  if (!await reserve(env, `ig-send-day:${day}`, 20, (day + 1) * 86400)) throw new Error('Limite diário de envios atingido');
  const minute = Math.floor(now / 60);
  if (!await reserve(env, `ig-send-minute:${minute}`, 5, (minute + 1) * 60)) throw new Error('Limite de envios por minuto atingido');
}
