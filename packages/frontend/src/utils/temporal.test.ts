// @vitest-environment happy-dom

import { describe, it, expect } from "vitest";

import {
  CURRENT_TIMEZONE,
  durationMilliseconds,
  formatDateRelative,
  formatDateTimeRelative,
  intervalGreaterThan,
  shortDateFormatter,
  shortDateTimeFormatter,
} from "./temporal";

describe("durationMilliseconds", () => {
  it("returns total milliseconds", () => {
    expect(durationMilliseconds({ hours: 1 })).toBe(36_000_00);
  });
});

describe("formatDateTimeRelative", () => {
  it("returns a formatted date for durations >= 7 days ago", () => {
    const date = Temporal.Now.zonedDateTimeISO().subtract({ days: 7 });

    expect(formatDateTimeRelative(date.toString())).toBe(
      shortDateTimeFormatter.format(date.epochMilliseconds),
    );
  });

  it.each<[Temporal.DurationLike, string]>([
    [{ days: 5, hours: 6 }, "5 days ago"],
    [{ minutes: 30, seconds: 59 }, "30 min. ago"],
    [{ minutes: 1 }, "1 min. ago"],
    [{ seconds: 35 }, "just now"],

    [{ milliseconds: 100 }, "just now"],

    [{ hours: -1 }, "in 1 hr."],
    [{ days: -1 }, "in 1 day"],
  ])("returns the correct relative time", (duration, expected) => {
    expect(
      formatDateTimeRelative(
        Temporal.Now.zonedDateTimeISO().subtract(duration).toString(),
      ),
    ).toBe(expected);
  });
});

describe("formatDateRelative", () => {
  it("returns a formatted date for durations >= 2 days ago", () => {
    const date = Temporal.Now.zonedDateTimeISO().subtract({ days: 2 });

    expect(formatDateRelative(date.toString())).toBe(
      shortDateFormatter.format(date.epochMilliseconds),
    );
  });

  it.each<[Temporal.DurationLike, string]>([
    [{ days: 1 }, "Yesterday"],
    [{ seconds: 0 }, "Today"],
    [{ days: -1 }, "Tomorrow"],
  ])("returns the correct relative date", (duration, expected) => {
    expect(
      formatDateRelative(
        Temporal.Now.zonedDateTimeISO(CURRENT_TIMEZONE)
          .subtract(duration)
          .toString(),
      ),
    ).toBe(expected);
  });
});

describe("intervalGreaterThan", () => {
  it("returns true if the interval is greater than the duration", () => {
    const a = Temporal.Now.instant();
    const b = a.subtract({ minutes: 1 });

    expect(intervalGreaterThan(a, b, { seconds: 30 })).toBe(true);
    expect(intervalGreaterThan(a, b, { days: 1 })).toBe(false);
  });
});
