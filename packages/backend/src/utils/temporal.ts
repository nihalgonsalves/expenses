type NaiveDurationLike = Omit<
  Temporal.DurationLikeObject,
  "years" | "months" | "weeks"
>;

export const durationSeconds = (duration: NaiveDurationLike) =>
  Temporal.Duration.from(duration).round("seconds").total("seconds");
