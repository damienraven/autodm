import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { retryOne } from '../src/instagram';
import type { Env } from '../src/types';

const NOW = 1_800_000_000;
const kinds = ['dm', 'reply', 'link', 'followup'] as const;
type Kind = typeof kinds[number];

function fixture(kind: Kind, expiresAt: number) {
  const pending = {
    id: 7, kind, rule_id: 1, recipient: JSON.stringify({ comment_id: 'comment-test' }),
    message: JSON.stringify(kind === 'reply' ? 'Resposta de teste' : { text: 'Mensagem de teste' }),
    user_id: 'user-test', username: 'teste', ref: 'comment-test', expires_at: expiresAt,
  };
  const settings: Record<string, string> = {
    ig_token: 'fake-token-for-tests', welcome_active: '1', welcome_text: 'Olá!',
    welcome_link: 'https://example.com/guia', welcome_button: 'Abrir',
  };
  const rule = {
    id: 1, dm_text: 'Guia', link_text: 'Seu guia', link_url: 'https://example.com/guia',
    link_button_label: 'Abrir', require_follow: 0, active: 1,
    media_ids: '[]', keywords: '[]', public_replies: '[]',
  };
  const writes: { sql: string; values: unknown[] }[] = [];
  const db = {
    prepare(sql: string) {
      let values: unknown[] = [];
      const stmt = {
        bind(...args: unknown[]) { values = args; return stmt; },
        async first() {
          if (sql.startsWith('SELECT * FROM pending_sends')) return pending;
          if (sql.startsWith('SELECT value FROM settings')) {
            const value = settings[String(values[0])];
            return value === undefined ? null : { value };
          }
          if (sql.startsWith('SELECT * FROM rules')) return rule;
          throw new Error(`Unexpected test query: ${sql}`);
        },
        async run() { writes.push({ sql, values }); return { meta: { changes: 1 } }; },
      };
      return stmt;
    },
  };
  const env = { DB: db } as unknown as Env;
  const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => Response.json({
    id: 'sent-test', name: 'Teste', username: 'teste', is_user_follow_business: true,
  }));
  vi.stubGlobal('fetch', fetchMock);
  const expiredEvent = () => writes.find((w) => w.sql.includes('INSERT INTO events') && w.values[2] === 'gave_up');
  const deletes = () => writes.filter((w) => w.sql.startsWith('DELETE FROM pending_sends'));
  return { env, pending, settings, rule, fetchMock, writes, expiredEvent, deletes };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW * 1000);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe.each(kinds)('pending %s expiry', (kind) => {
  it.each([NOW - 1, NOW, 0])('discards deadline %s without any network calls', async (deadline) => {
    const f = fixture(kind, deadline);
    await retryOne(f.env, f.pending.id);
    expect(f.fetchMock).not.toHaveBeenCalled();
    expect(f.deletes()).toHaveLength(1);
    expect(f.deletes()[0].values).toEqual([f.pending.id]);
    expect(f.expiredEvent()?.values[6]).toBe('prazo de envio expirado');
  });

  it('still sends an unexpired entry', async () => {
    const f = fixture(kind, NOW + 60);
    await retryOne(f.env, f.pending.id);
    expect(f.fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1);
    expect(f.deletes()).toHaveLength(1);
    expect(f.expiredEvent()).toBeUndefined();
  });
});

describe.each(['link', 'followup'] as const)('delayed %s expiry', (kind) => {
  it.each([true, false])('does not send after a slow follow lookup (following=%s)', async (follows) => {
    const f = fixture(kind, NOW + 1);
    f.fetchMock.mockImplementation(async () => {
      vi.setSystemTime((NOW + 2) * 1000);
      return Response.json({ is_user_follow_business: follows, username: 'teste' });
    });
    await retryOne(f.env, f.pending.id);
    expect(f.fetchMock).toHaveBeenCalledTimes(1);
    expect(f.fetchMock.mock.calls[0][1]?.method).toBe('GET');
    expect(f.deletes()).toHaveLength(1);
    expect(f.expiredEvent()).toBeDefined();
  });

  it('does not send after a slow dynamic offer lookup', async () => {
    const f = fixture(kind, NOW + 1);
    f.rule.link_url = '{oferta_ebook}';
    f.settings.welcome_link = '{oferta_ebook}';
    f.env.EBOOK_OFFER_URL = 'https://example.com/offer';
    f.env.EBOOK_OFFER_TOKEN = 'fake-offer-token-for-tests';
    f.fetchMock.mockImplementation(async (url) => {
      if (url === f.env.EBOOK_OFFER_URL) {
        vi.setSystemTime((NOW + 2) * 1000);
        return Response.json({ url: 'https://example.com/guia' });
      }
      return Response.json({ is_user_follow_business: true, username: 'teste' });
    });
    await retryOne(f.env, f.pending.id);
    expect(f.fetchMock).toHaveBeenCalledTimes(2);
    expect(f.fetchMock.mock.calls.some(([url]) => new URL(url).pathname.endsWith('/messages'))).toBe(false);
    expect(f.deletes()).toHaveLength(1);
    expect(f.expiredEvent()).toBeDefined();
  });
});
