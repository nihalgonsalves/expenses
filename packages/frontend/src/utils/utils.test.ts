// @vitest-environment happy-dom

import { Temporal } from '@js-temporal/polyfill';
import { describe, it, expect } from 'vitest';

import {
  durationMilliseconds,
  formatDateTimeRelative,
  shortDateTimeFormatter,
} from './utils';

describe('durationMilliseconds', () => {
  it('returns total milliseconds', () => {
    expect(durationMilliseconds({ hours: 1 })).toBe(36_000_00);
  });
});

describe('formatDateTimeRelative', () => {
  it('returns a formatted date for durations >= 7 days ago', () => {
    const date = Temporal.Now.zonedDateTimeISO().subtract({ days: 7 });

    expect(formatDateTimeRelative(date.toString())).toBe(
      shortDateTimeFormatter.format(date.epochMilliseconds),
    );
  });

  it.each<[Temporal.DurationLike, string]>([
    [{ days: 5, hours: 6 }, '5 days ago'],
    [{ minutes: 30, seconds: 59 }, '30 min. ago'],
    [{ minutes: 1 }, '1 min. ago'],
    [{ seconds: 35 }, 'just now'],
    [{ milliseconds: 100 }, 'just now'],
  ])('returns the correct relative time', (duration, expected) => {
    expect(
      formatDateTimeRelative(
        Temporal.Now.zonedDateTimeISO().subtract(duration).toString(),
      ),
    ).toBe(expected);
  });
});
