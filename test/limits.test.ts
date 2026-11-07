/// <reference types="node" />
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { URL as NodeURL } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { allowLogin, allowSend, reserve } from '../src/limits';
import type { Env } from '../src/types';

let db: DatabaseSync;
let env: Env;
const NOW = 1_800_000_000;

beforeEach(() => {
  db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new NodeURL('../migrations/0006_security_limits.sql', import.meta.url), 'utf8'));
  env = {
    ADMIN_PASSWORD: 'test-only-password', SEND_MODE: 'test', TEST_IG_USER_IDS: 'tester-1',
    DB: { prepare(sql: string) {
      return { bind(...args: (string | number)[]) {
        return { async first() { return db.prepare(sql).get(...args) ?? null; } };
      } };
    } },
  } as unknown as Env;
});
afterEach(() => db.close());

describe('shared database limits', () => {
  it('reserves exactly the available slots under concurrent callers', async () => {
    const results = await Promise.all(Array.from({ length: 20 }, () => reserve(env, 'same-bucket', 5, NOW + 60)));
    expect(results.filter(Boolean)).toHaveLength(5);
    expect(db.prepare('SELECT used FROM security_buckets').get()?.used).toBe(5);
  });
  it('limits login attempts per address and fixed 15-minute window without storing raw addresses', async () => {
    for (let i = 0; i < 10; i++) expect(await allowLogin(env, 'test-address', NOW)).toBe(true);
    expect(await allowLogin(env, 'test-address', NOW)).toBe(false);
    expect(await allowLogin(env, 'other-address', NOW)).toBe(true);
    expect(await allowLogin(env, 'test-address', NOW + 900)).toBe(true);
    expect(JSON.stringify(db.prepare('SELECT * FROM security_buckets').all())).not.toContain('test-address');
  });
  it('blocks disabled modes, missing recipients and unauthorized test recipients before reserving', async () => {
    env.SEND_MODE = undefined;
    await expect(allowSend(env, 'tester-1', NOW)).rejects.toThrow('pausados');
    env.SEND_MODE = 'test';
    await expect(allowSend(env, 'other-person', NOW)).rejects.toThrow('fora do piloto');
    await expect(allowSend(env, undefined, NOW)).rejects.toThrow('ausente');
    expect(db.prepare('SELECT COUNT(*) AS n FROM security_buckets').get()?.n).toBe(0);
  });
  it('enforces minute and daily budgets across invocations', async () => {
    for (let i = 0; i < 5; i++) await allowSend(env, 'tester-1', NOW);
    await expect(allowSend(env, 'tester-1', NOW)).rejects.toThrow('por minuto');
    for (let i = 0; i < 14; i++) await allowSend(env, 'tester-1', NOW + 60 * (i + 1));
    await expect(allowSend(env, 'tester-1', NOW + 1000)).rejects.toThrow('diário');
    await expect(allowSend(env, 'tester-1', NOW + 86400)).resolves.toBeUndefined();
  });
});
