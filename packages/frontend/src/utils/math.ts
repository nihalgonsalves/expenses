// NOTE: these could probably do with more sound floating-point math (see tests),
// but they're only used to redistribute percentages. actual money math is handled
// by dinero.js's allocate implementation

/**
 * e.g. largestRemainderRound([33.33, 33.33, 33.33], 100) => [33.34, 33.33, 33.33]
 */
export const largestRemainderRound = (
  sourceNumbers: number[],
  sourceDesiredTotal: number,
  precision = 2,
) => {
  const numbers = sourceNumbers.map((number) => number * 10 ** precision);
  const desiredTotal = sourceDesiredTotal * 10 ** precision;

  const upperSum = numbers.reduce((a, b) => a + b);

  const sortedArray = numbers
    .map((number, index) => {
      const value = (number / upperSum) * desiredTotal;
      return {
        floor: Math.floor(value),
        remainder: Math.round((value - Math.floor(value)) * 10000) / 10000,
        index,
      };
    })
    .toSorted((a, b) => b.remainder - a.remainder);

  const lowerSum = sortedArray.reduce((a, b) => a + b.floor, 0);

  for (let i = 0; i < desiredTotal - lowerSum; i++) {
    const item = sortedArray[i];
    if (!item) {
      throw new Error("Invalid state");
    }

    item.floor++;
  }

  return sortedArray.map((e) => e.floor / 10 ** precision);
};

/**
 * e.g. allocate(3, 100) => [33.34, 33.33, 33.33]
 */
export const allocateByCount = (count: number, total: number) => {
  if (count === 0) {
    return [];
  }

  const numbers = Array.from({ length: count }, () => total / count);

  return largestRemainderRound(numbers, total);
};

export const sumToPrecision = (numbers: number[], precision = 2) =>
  numbers.reduce((a, b) => a + b * 10 ** precision, 0) / 10 ** precision;
