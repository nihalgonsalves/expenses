// @vitest-environment happy-dom

import { Temporal } from '@js-temporal/polyfill';
import { describe, it, expect } from 'vitest';

import { formatDateTimeRelative, joinList, shortDateTime } from './utils';

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

describe('formatDateTimeRelative', () => {
  it('returns a formatted date for durations >= 7 days ago', () => {
    const date = Temporal.Now.zonedDateTimeISO().subtract({ days: 7 });

    expect(formatDateTimeRelative(date.toString())).toBe(
      shortDateTime.format(date.epochMilliseconds),
    );
  });

  it.each<[Temporal.DurationLike, string]>([
    [{ days: 5, hours: 6 }, '5 days ago'],
    [{ minutes: 30, seconds: 59 }, '30 min. ago'],
    [{ minutes: 1 }, '1 min. ago'],
    [{ seconds: 35 }, '35 sec. ago'],
    // should be `ago` but not really worth handling
    [Temporal.Duration.from({ milliseconds: 100 }), 'in 0 sec.'],
  ])('returns the correct relative time', (duration, expected) => {
    expect(
      formatDateTimeRelative(
        Temporal.Now.zonedDateTimeISO().subtract(duration).toString(),
      ),
    ).toBe(expected);
  });
});
