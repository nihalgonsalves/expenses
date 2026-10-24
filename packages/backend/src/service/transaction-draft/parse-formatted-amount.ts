import {
  CURRENCY_CODES,
  getCurrency,
} from "@nihalgonsalves/expenses-shared/money";

export type ParsedAmount = {
  amount: number;
  scale: number;
  /** `null` if the currency could not be determined, e.g. "kr" or no symbol at all */
  currencyCode: string | null;
};

const getCurrencySymbol = (
  locale: string,
  currency: string,
  currencyDisplay: "symbol" | "narrowSymbol",
) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay,
  })
    .formatToParts(1)
    .find(({ type }) => type === "currency")?.value;

// en-GB symbols are unambiguous ("US$", "CA$", "JP¥", "£"), and match what
// Wallet shows for foreign transactions. en-US and narrow symbols cover the
// rest ("zł", "₹"). Where a symbol is shared ("$", "¥", "kr") prefer the
// currency with that en-GB symbol, or give up (`null`) if there is none: a bare
// "$" could be USD, CAD, AUD, etc.
const buildCurrencySymbols = () => {
  const candidates = new Map<string, Set<string>>();
  const preferred = new Map<string, string>();

  for (const currencyCode of CURRENCY_CODES) {
    const enGB = getCurrencySymbol("en-GB", currencyCode, "symbol");
    if (enGB !== undefined) preferred.set(enGB, currencyCode);

    for (const symbol of [
      enGB,
      getCurrencySymbol("en-US", currencyCode, "symbol"),
      getCurrencySymbol("en", currencyCode, "narrowSymbol"),
    ]) {
      if (symbol === undefined || symbol === currencyCode) continue;
      candidates.set(
        symbol,
        (candidates.get(symbol) ?? new Set()).add(currencyCode),
      );
    }
  }

  return [...candidates]
    .map(([symbol, codes]): [string, string | null] => [
      symbol,
      preferred.get(symbol) ??
        (codes.size === 1 ? ([...codes][0] ?? null) : null),
    ])
    .toSorted(([a], [b]) => b.length - a.length);
};

// The symbol can be a prefix or suffix, and the decimal separator can be either
// "." or ",". Sorted longest first so that "US$" wins over "$".
const CURRENCY_SYMBOLS = buildCurrencySymbols();

const extractCurrency = (input: string) => {
  // not \b, so that "CHF12.50" and "12.50CHF" match too
  const isoMatch = /(?<![A-Za-z])[A-Z]{3}(?![A-Za-z])/.exec(input);
  if (isoMatch && CURRENCY_CODES.includes(isoMatch[0])) {
    return {
      currencyCode: isoMatch[0],
      rest: input.replace(isoMatch[0], ""),
    };
  }

  for (const [symbol, currencyCode] of CURRENCY_SYMBOLS) {
    if (input.includes(symbol)) {
      return { currencyCode, rest: input.replace(symbol, "") };
    }
  }

  return { currencyCode: null, rest: input };
};

/**
 * @returns the decimal separator, `null` if there is none, or `"ambiguous"` if
 * it can't be determined
 */
const getDecimalSeparator = (
  digits: string,
  currencyCode: string | null,
): "." | "," | null | "ambiguous" => {
  const lastDot = digits.lastIndexOf(".");
  const lastComma = digits.lastIndexOf(",");

  if (lastDot === -1 && lastComma === -1) return null;

  // both present: whichever comes last is the decimal separator (1,234.56 / 1.234,56)
  if (lastDot !== -1 && lastComma !== -1) {
    return lastDot > lastComma ? "." : ",";
  }

  const separator = lastDot === -1 ? "," : ".";

  // repeated: only valid as a grouping separator (1.234.567)
  if (digits.indexOf(separator) !== digits.lastIndexOf(separator)) return null;

  // a single separator followed by exactly three digits ("1.234") is usually a
  // grouping separator, except for "0.123", or in currencies with three
  // decimals where it could be either
  const separatorIndex = digits.indexOf(separator);
  if (digits.length - separatorIndex - 1 === 3) {
    if (digits.startsWith("0")) return separator;

    const exponent =
      currencyCode === null ? undefined : getCurrency(currencyCode).exponent;
    return exponent === 3 ? "ambiguous" : null;
  }

  return separator;
};

// 1,234,567 or 1.234.567 or the Indian 12,34,567: a single kind of grouping
// separator, always ending in a group of three, and no leading zero
const isValidGrouping = (integerPart: string) =>
  /^\d+$/.test(integerPart) ||
  /^[1-9]\d{0,2}(,\d{2,3})*,\d{3}$/.test(integerPart) ||
  /^[1-9]\d{0,2}(\.\d{2,3})*\.\d{3}$/.test(integerPart);

/**
 * Parses a localised, formatted currency amount such as "42,69 €", "€42.69",
 * "US$1,234.56" or "1.234,56 CHF" into an integer amount and scale.
 *
 * Returns `null` if the input is not a recognisable amount.
 */
export const parseFormattedAmount = (input: string): ParsedAmount | null => {
  const normalized = input
    // NBSP, narrow NBSP, thin space (fr-FR, de-CH etc.)
    .replaceAll(/[   ]/g, " ")
    // unicode minus
    .replaceAll("−", "-")
    .trim();

  const { currencyCode, rest } = extractCurrency(normalized);

  const match = /^([-+]?)\s*([\d.,' ’]+)$/.exec(rest.trim());
  if (!match) return null;

  const [, sign = "", rawDigits = ""] = match;
  const digits = rawDigits.replaceAll(/[ '’]/g, "");

  if (!/^\d/.test(digits) || !/\d$/.test(digits)) return null;

  const decimalSeparator = getDecimalSeparator(digits, currencyCode);
  if (decimalSeparator === "ambiguous") return null;

  const decimalIndex =
    decimalSeparator === null ? -1 : digits.lastIndexOf(decimalSeparator);

  const integerPart =
    decimalIndex === -1 ? digits : digits.slice(0, decimalIndex);
  const fractionPart =
    decimalIndex === -1 ? "" : digits.slice(decimalIndex + 1);

  if (!isValidGrouping(integerPart) || !/^\d*$/.test(fractionPart)) {
    return null;
  }

  const integerDigits = integerPart.replaceAll(/[.,]/g, "");
  const amount = Number(
    `${sign === "-" ? "-" : ""}${integerDigits}${fractionPart}`,
  );
  if (!Number.isSafeInteger(amount)) return null;

  return {
    amount: amount === 0 ? 0 : amount,
    scale: fractionPart.length,
    currencyCode,
  };
};
