import { Temporal } from '@js-temporal/polyfill';

import { getUserLanguage } from './utils';

export const CURRENT_TIMEZONE =
  Intl.DateTimeFormat().resolvedOptions().timeZone;

export const durationMilliseconds = (duration: Temporal.DurationLike) =>
  Temporal.Duration.from(duration).total('milliseconds');

export const dateTimeLocalToZonedISOString = (val: string) =>
  Temporal.PlainDateTime.from(val).toZonedDateTime(CURRENT_TIMEZONE).toString();

export const dateToISOString = (date: Date) =>
  Temporal.Instant.fromEpochMilliseconds(date.valueOf())
    .toZonedDateTimeISO(CURRENT_TIMEZONE)
    .toString();

export const isoToTemporalZonedDateTime = (iso: string) =>
  Temporal.Instant.from(iso).toZonedDateTimeISO(CURRENT_TIMEZONE);

export const nowForDateTimeInput = () =>
  Temporal.Now.plainDateTimeISO().round('minutes').toString();

export const shortDateFormatter = new Intl.DateTimeFormat(getUserLanguage(), {
  dateStyle: 'short',
});

export const shortDateTimeFormatter = new Intl.DateTimeFormat(
  getUserLanguage(),
  {
    dateStyle: 'short',
    timeStyle: 'short',
  },
);

export const intervalGreaterThan = (
  a: Temporal.Instant,
  b: Temporal.Instant,
  duration: Temporal.DurationLike,
) => {
  const interval = a.since(b);

  return (
    interval.abs().total('seconds') >
    Temporal.Duration.from(duration).total('seconds')
  );
};

export const formatDateRelative = (
  instantOrISO8601: string | Temporal.Instant,
) => {
  const instant = Temporal.Instant.from(instantOrISO8601);

  const date = instant.toZonedDateTimeISO(CURRENT_TIMEZONE).toPlainDate();

  const today = Temporal.Now.plainDateISO(CURRENT_TIMEZONE);

  const { days: daysSinceToday } = today.since(date);

  switch (daysSinceToday) {
    case 1:
      return 'Yesterday';
    case 0:
      return 'Today';
    case -1:
      return 'Tomorrow';
    default:
      return shortDateFormatter.format(instant.epochMilliseconds);
  }
};

const shortRelativeFormatter = new Intl.RelativeTimeFormat(getUserLanguage(), {
  style: 'short',
});

export const formatDateTimeRelative = (
  instantOrISO8601: string | Temporal.Instant,
  dayThreshold = 7,
) => {
  const instant = Temporal.Instant.from(instantOrISO8601);

  const relativeToNow = instant.since(Temporal.Now.instant());

  const durationRounded = relativeToNow.round({
    smallestUnit: 'second',
    largestUnit: 'day',
  });

  const { days, hours, minutes } = durationRounded.abs();

  if (days >= dayThreshold) {
    return shortDateTimeFormatter.format(instant.epochMilliseconds);
  }

  if (days >= 1) {
    return shortRelativeFormatter.format(durationRounded.days, 'day');
  }

  if (hours >= 1) {
    return shortRelativeFormatter.format(durationRounded.hours, 'hours');
  }

  if (minutes >= 1) {
    return shortRelativeFormatter.format(durationRounded.minutes, 'minutes');
  }

  return 'just now';
};

export const groupBySpentAt = <T>(
  items: T[],
  getSpentAt: (item: T) => string,
) => {
  const groupedByDate = new Map<number, T[]>();

  // TODO: proposal-array-grouping (TypeScript 5.3?)
  for (const item of items) {
    const date = isoToTemporalZonedDateTime(getSpentAt(item)).round({
      smallestUnit: 'day',
      roundingMode: 'trunc',
    }).epochMilliseconds;

    const existing = groupedByDate.get(date);

    if (existing) {
      existing.push(item);
    } else {
      groupedByDate.set(date, [item]);
    }
  }

  return groupedByDate;
};
