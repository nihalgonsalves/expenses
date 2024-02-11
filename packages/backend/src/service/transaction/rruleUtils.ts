import type { TransactionSchedule } from "@prisma/client";
import { Frequency, RRule } from "rrule";

import {
  ZRecurrenceFrequency,
  type RecurrenceFrequency,
} from "@nihalgonsalves/expenses-shared/types/transaction";

const frequencyToRRuleEnum: Record<RecurrenceFrequency, Frequency> = {
  WEEKLY: Frequency.WEEKLY,
  MONTHLY: Frequency.MONTHLY,
};

const floatingDateToZonedDateTime = (floatingDate: Date, tzId: string) =>
  Temporal.Instant.fromEpochMilliseconds(floatingDate.valueOf())
    // pretend the date is UTC
    .toZonedDateTimeISO("UTC")
    // truncate the timezone
    .toPlainDateTime()
    // and replace it with the local timezone
    .toZonedDateTime(tzId);

const zonedDateTimeToFloatingDate = (zonedDateTime: Temporal.ZonedDateTime) =>
  new Date(
    zonedDateTime
      // truncate the timezone
      .toPlainDateTime()
      // replace it with UTC
      .toZonedDateTime("UTC")
      .toInstant().epochMilliseconds,
  );

const zonedDateTimeFromDate = (date: Date, tzId: string) =>
  Temporal.Instant.fromEpochMilliseconds(date.valueOf()).toZonedDateTimeISO(
    tzId,
  );

export const getRRuleInstancesTzAware = (
  transactionSchedule: Pick<
    TransactionSchedule,
    "nextOccurrenceTzId" | "nextOccurrenceAt" | "rruleFreq"
  >,
  now = Temporal.Now.zonedDateTimeISO(),
) => {
  // we pretend that all the instances are in UTC, and then convert them to the local timezone
  // later for DST support, since the rrule library doesn't have true timezone support

  const rrule = new RRule({
    freq: frequencyToRRuleEnum[
      ZRecurrenceFrequency.parse(transactionSchedule.rruleFreq)
    ],
    dtstart: zonedDateTimeToFloatingDate(
      zonedDateTimeFromDate(
        transactionSchedule.nextOccurrenceAt,
        transactionSchedule.nextOccurrenceTzId,
      ),
    ),
  });

  const tzAwarePastInstances: Temporal.ZonedDateTime[] = [];
  let nextOccurrenceAt: Temporal.ZonedDateTime | undefined;

  rrule.all((date) => {
    const instance = floatingDateToZonedDateTime(
      date,
      transactionSchedule.nextOccurrenceTzId,
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
      "Error calculating rrule: unexpected nextOccurrenceAt null",
    );
  }

  return { tzAwarePastInstances, nextOccurrenceAt };
};
