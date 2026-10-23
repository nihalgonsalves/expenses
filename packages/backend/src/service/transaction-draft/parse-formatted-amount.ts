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

// en-US symbols are unambiguous ("$", "CA$", "A$"), en-GB adds "US$", "JP¥",
// and narrow symbols cover the rest ("zł", "kr"). Where a narrow symbol is
// shared ("$", "¥", "kr") prefer the currency with that en-US symbol, or give up
// (`null`) if there is none.
const buildCurrencySymbols = () => {
  const candidates = new Map<string, Set<string>>();
  const preferred = new Map<string, string>();

  for (const currencyCode of CURRENCY_CODES) {
    const enUS = getCurrencySymbol("en-US", currencyCode, "symbol");
    if (enUS !== undefined) preferred.set(enUS, currencyCode);

    for (const symbol of [
      enUS,
      getCurrencySymbol("en-GB", currencyCode, "symbol"),
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

// Wallet formats amounts according to where the payment was processed, not the
// device locale, so the symbol can be a prefix or suffix and the decimal
// separator can be either "." or ",". Sorted longest first so that "US$" wins
// over "$".
const CURRENCY_SYMBOLS = buildCurrencySymbols();

const extractCurrency = (input: string) => {
  const isoMatch = /\b[A-Z]{3}\b/.exec(input);
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

const getDecimalSeparator = (
  digits: string,
  currencyCode: string | null,
): "." | "," | null => {
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

  // a single separator followed by exactly three digits is ambiguous ("1.234"),
  // resolve it as a grouping separator unless the currency has three decimals
  const fractionDigits = digits.length - digits.lastIndexOf(separator) - 1;
  if (fractionDigits === 3) {
    const exponent =
      currencyCode === null ? undefined : getCurrency(currencyCode).exponent;
    return exponent === 3 ? separator : null;
  }

  return separator;
};

// 1,234,567 or 1.234.567 or the Indian 12,34,567: a single kind of grouping
// separator, always ending in a group of three
const isValidGrouping = (integerPart: string) =>
  /^\d+$/.test(integerPart) ||
  /^\d{1,3}(,\d{2,3})*,\d{3}$/.test(integerPart) ||
  /^\d{1,3}(\.\d{2,3})*\.\d{3}$/.test(integerPart);

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
