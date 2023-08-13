import { Temporal } from '@js-temporal/polyfill';
import type { TransactionSchedule } from '@prisma/client';
import { Frequency, RRule } from 'rrule';

import {
  ZRecurrenceFrequency,
  type RecurrenceFrequency,
} from '@nihalgonsalves/expenses-shared/types/transaction';

export const frequencyToRRuleEnum: Record<RecurrenceFrequency, Frequency> = {
  WEEKLY: Frequency.WEEKLY,
  MONTHLY: Frequency.MONTHLY,
};

export const getFloatingRRuleDate = (isoString: string) =>
  new Date(
    Temporal.PlainDateTime.from(isoString).toZonedDateTime(
      'UTC',
    ).epochMilliseconds,
  );

const floatingDateToZonedDateTime = (floatingDate: Date, tzId: string) =>
  Temporal.Instant.fromEpochMilliseconds(floatingDate.valueOf())
    // pretend the date is UTC,
    .toZonedDateTimeISO('UTC')
    // ... truncate the timezone
    .toPlainDateTime()
    // and replace it with the local timezone
    .toZonedDateTime(tzId);

export const getRRuleInstancesTzAware = (
  transactionSchedule: Pick<
    TransactionSchedule,
    'tzId' | 'rruleFreq' | 'rruleDtstart'
  >,
  now = Temporal.Now.zonedDateTimeISO(),
) => {
  // we pretend that all the instances are in UTC, and then convert them to the local timezone
  // later for DST support, since the rrule library doesn't have true timezone support

  const rrule = new RRule({
    freq: frequencyToRRuleEnum[
      ZRecurrenceFrequency.parse(transactionSchedule.rruleFreq)
    ],
    dtstart: transactionSchedule.rruleDtstart,
  });

  const tzAwarePastInstances: Temporal.ZonedDateTime[] = [];
  let nextOccurrenceAt: Temporal.ZonedDateTime | undefined;

  rrule.all((date) => {
    const instance = floatingDateToZonedDateTime(
      date,
      transactionSchedule.tzId,
    );

    if (Temporal.ZonedDateTime.compare(instance, now) === -1) {
      tzAwarePastInstances.push(instance);
      return true;
    } else {
      nextOccurrenceAt = instance;
      return false;
    }
  });

  // should not be possible, as that is the condition for the rrule.all iterator to stop
  if (nextOccurrenceAt == null) {
    throw new Error(
      'Error calculating rrule: unexpected nextOccurrenceAt null',
    );
  }

  return { tzAwarePastInstances, nextOccurrenceAt };
};
