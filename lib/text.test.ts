import { describe, expect, it } from 'vitest';
import { countCharacters } from '@/lib/text';

describe('countCharacters', () => {
  it.each([
    ['안녕하세요', 5],
    ['abc 123', 7],
    ['가 나', 3],
    ['가\n나', 3],
    ['가\t나', 3],
    ['   ', 3],
    ['', 0],
    ['👍', 1],
    ['👍🏽', 1],
    ['👨‍👩‍👧', 1],
    ['가\r\n나', 3],
  ])('counts %j as %i characters including whitespace', (text, total) => {
    expect(countCharacters(text).total).toBe(total);
  });

  it.each([
    ['가 나', 2],
    ['가\n나', 2],
    ['가\t나', 2],
    ['가　나', 2],
    ['   ', 0],
    ['abc 123', 6],
    ['안녕하세요', 5],
    ['👨‍👩‍👧', 1],
    ['가\r\n나', 2],
    ['', 0],
  ])('counts %j as %i characters excluding whitespace', (text, nonSpace) => {
    expect(countCharacters(text).nonSpace).toBe(nonSpace);
  });
});
