import { describe, expect, it } from 'vitest';
import { formatCharCount } from '@/lib/format';

describe('formatCharCount', () => {
  it.each([
    [{ total: 0, nonSpace: 0 }, '공백 포함 0자 · 공백 제외 0자'],
    [{ total: 999, nonSpace: 998 }, '공백 포함 999자 · 공백 제외 998자'],
    [{ total: 1000, nonSpace: 1000 }, '공백 포함 1,000자 · 공백 제외 1,000자'],
    [{ total: 12345, nonSpace: 10000 }, '공백 포함 12,345자 · 공백 제외 10,000자'],
  ])('formats %o as %j', (count, expected) => {
    expect(formatCharCount(count)).toBe(expected);
  });
});
