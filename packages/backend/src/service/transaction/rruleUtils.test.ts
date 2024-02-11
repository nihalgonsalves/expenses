import { describe, expect, it } from "vitest";

import { getRRuleInstancesTzAware } from "./rruleUtils";

describe("getRRuleInstancesTzAware", () => {
  it("correctly calculates instances across DST boundaries", () => {
    expect(
      getRRuleInstancesTzAware(
        {
          rruleFreq: "MONTHLY",
          nextOccurrenceAt: new Date(
            Temporal.ZonedDateTime.from(
              "2023-01-01T00:00:00+01:00[Europe/Berlin]",
            ).toInstant().epochMilliseconds,
          ),
          nextOccurrenceTzId: "Europe/Berlin",
        },
        Temporal.ZonedDateTime.from("2024-01-01T00:00:00+01:00[Europe/Berlin]"),
      ),
    ).toMatchInlineSnapshot(`
      {
        "nextOccurrenceAt": "2024-01-01T00:00:00+01:00[Europe/Berlin]",
        "tzAwarePastInstances": [
          "2023-01-01T00:00:00+01:00[Europe/Berlin]",
          "2023-02-01T00:00:00+01:00[Europe/Berlin]",
          "2023-03-01T00:00:00+01:00[Europe/Berlin]",
          "2023-04-01T00:00:00+02:00[Europe/Berlin]",
          "2023-05-01T00:00:00+02:00[Europe/Berlin]",
          "2023-06-01T00:00:00+02:00[Europe/Berlin]",
          "2023-07-01T00:00:00+02:00[Europe/Berlin]",
          "2023-08-01T00:00:00+02:00[Europe/Berlin]",
          "2023-09-01T00:00:00+02:00[Europe/Berlin]",
          "2023-10-01T00:00:00+02:00[Europe/Berlin]",
          "2023-11-01T00:00:00+01:00[Europe/Berlin]",
          "2023-12-01T00:00:00+01:00[Europe/Berlin]",
        ],
      }
    `);
  });
});
