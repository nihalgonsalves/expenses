import { describe, it, expect } from 'vitest';

import { joinList } from './utils';

describe('joinList', () => {
  it('returns an empty string for an empty list', () => {
    expect(joinList([])).toBe('');
  });

  it('returns a single item', () => {
    expect(joinList(['Hello'])).toBe('Hello');
  });

  it('returns two items joined by "&"', () => {
    expect(joinList(['Hello', 'World'])).toBe('Hello & World');
  });

  it('returns three or more items joined by ", " and "&"', () => {
    expect(joinList(['Hello', 'World', 'Goodbye'])).toBe(
      'Hello, World & Goodbye',
    );
  });
});
