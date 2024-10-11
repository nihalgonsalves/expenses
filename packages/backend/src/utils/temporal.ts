type NaiveDurationLike = Omit<
  Temporal.DurationLike,
  "years" | "months" | "weeks"
>;

export const durationSeconds = (duration: NaiveDurationLike) =>
  Temporal.Duration.from(duration).round("seconds").total("seconds");
