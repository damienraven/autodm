import { describe, expect, it } from 'vitest';
import { createSession, SESSION_SECONDS, validSession } from '../src/session';

const NOW = 1_800_000_000;
const PASSWORD = 'test-only-password';

describe('admin session expiry', () => {
  it('accepts a new session and rejects it at the deadline', async () => {
    const session = await createSession(PASSWORD, NOW);
    expect(await validSession(PASSWORD, session, NOW)).toBe(true);
    expect(await validSession(PASSWORD, session, NOW + SESSION_SECONDS - 1)).toBe(true);
    expect(await validSession(PASSWORD, session, NOW + SESSION_SECONDS)).toBe(false);
  });
  it('rejects tampering, password changes and legacy cookies', async () => {
    const session = await createSession(PASSWORD, NOW);
    expect(await validSession('changed', session, NOW)).toBe(false);
    expect(await validSession(PASSWORD, session.replace(/^\d+/, String(NOW + 1)), NOW)).toBe(false);
    expect(await validSession(PASSWORD, 'a'.repeat(64), NOW)).toBe(false);
    expect(await validSession('', session, NOW)).toBe(false);
  });
  it('issues different sessions and rejects deadlines outside the lifetime', async () => {
    const session = await createSession(PASSWORD, NOW);
    expect(await createSession(PASSWORD, NOW)).not.toBe(session);
    expect(await validSession(PASSWORD, session, NOW - 1)).toBe(false);
  });
});
