import { describe, expect, it } from 'vitest';
import { protectToken, revealToken } from '../src/token-storage';

const KEY = '01'.repeat(32);
describe('OAuth token storage', () => {
  it('encrypts with a fresh nonce and restores the token', async () => {
    const stored = await protectToken(KEY, 'ig_token', 'test-only-token');
    expect(stored).not.toContain('test-only-token');
    expect(await protectToken(KEY, 'ig_token', 'test-only-token')).not.toBe(stored);
    expect(await revealToken(KEY, 'ig_token', stored)).toBe('test-only-token');
  });
  it('rejects missing keys, wrong keys and swapped token fields', async () => {
    await expect(protectToken(undefined, 'ig_token', 'test-only')).rejects.toThrow();
    const stored = await protectToken(KEY, 'ig_token', 'test-only');
    await expect(revealToken('02'.repeat(32), 'ig_token', stored)).rejects.toThrow();
    await expect(revealToken(KEY, 'yt_refresh_token', stored)).rejects.toThrow();
    await expect(revealToken(undefined, 'ig_token', stored)).rejects.toThrow();
  });
  it('requires reconnection for legacy tokens after configuring encryption', async () => {
    await expect(revealToken(KEY, 'ig_token', 'legacy-test-only')).rejects.toThrow('reconecte');
  });
});
