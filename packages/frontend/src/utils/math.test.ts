import { describe, expect, it } from "vitest";

import { allocateByCount, largestRemainderRound, sumToPrecision } from "./math";

describe("largestRemainderRounder", () => {
  it("rounds numbers to the nearest value with 2 decimals", () => {
    expect(largestRemainderRound([33.33, 33.33, 33.33], 100)).toEqual([
      33.34, 33.33, 33.33,
    ]);
  });

  it("rounds numbers to the nearest integer", () => {
    expect(largestRemainderRound([33.33, 33.33, 33.33], 100, 0)).toEqual([
      34, 33, 33,
    ]);
  });
});

describe("allocate", () => {
  it.each([
    [3, 100, [33.34, 33.33, 33.33]],
    [4, 100, [25, 25, 25, 25]],
    [5, 100, [20, 20, 20, 20, 20]],
    [6, 100, [16.67, 16.67, 16.67, 16.67, 16.66, 16.66]],
    [7, 100, [14.29, 14.29, 14.29, 14.29, 14.28, 14.28, 14.28]],
    [8, 100, [12.5, 12.5, 12.5, 12.5, 12.5, 12.5, 12.5, 12.5]],
    [9, 100, [11.12, 11.11, 11.11, 11.11, 11.11, 11.11, 11.11, 11.11, 11.11]],
    [10, 100, [10, 10, 10, 10, 10, 10, 10, 10, 10, 10]],
  ])("allocates numbers for count %d evenly", (count, total, result) => {
    expect(allocateByCount(count, total)).toEqual(result);

    // summing to a precision because adding the values of the `9` case results in 99.9999...
    expect(sumToPrecision(result)).toBe(total);
  });

  it.each(Array.from({ length: 50 }, (_, i) => [i + 1, 100]))(
    "allocates numbers for count %d correctly",
    (count, total) => {
      const result = allocateByCount(count, total);

      expect(sumToPrecision(result)).toBe(total);
    },
  );
});
