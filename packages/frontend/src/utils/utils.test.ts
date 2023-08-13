// @vitest-environment happy-dom

import { Temporal } from '@js-temporal/polyfill';
import { describe, it, expect } from 'vitest';

import {
  durationMilliseconds,
  formatDateRelative,
  formatDateTimeRelative,
  shortDateFormatter,
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

    [{ hours: -1 }, 'in 1 hr.'],
    [{ days: -1 }, 'in 1 day'],
  ])('returns the correct relative time', (duration, expected) => {
    expect(
      formatDateTimeRelative(
        Temporal.Now.zonedDateTimeISO().subtract(duration).toString(),
      ),
    ).toBe(expected);
  });
});

describe('formatDateRelative', () => {
  it('returns a formatted date for durations >= 2 days ago', () => {
    const date = Temporal.Now.zonedDateTimeISO().subtract({ days: 2 });

    expect(formatDateRelative(date.toString())).toBe(
      shortDateFormatter.format(date.epochMilliseconds),
    );
  });

  it.each<[Temporal.DurationLike, string]>([
    [{ days: 1, hours: 6 }, 'Yesterday'],
    [{ seconds: 0 }, 'Today'],
    [{ days: -1 }, 'Tomorrow'],
  ])('returns the correct relative date', (duration, expected) => {
    expect(
      formatDateRelative(
        Temporal.Now.zonedDateTimeISO().subtract(duration).toString(),
      ),
    ).toBe(expected);
  });
});
