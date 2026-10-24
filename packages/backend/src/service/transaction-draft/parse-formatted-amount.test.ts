import { describe, expect, it } from "vitest";

import { parseFormattedAmount } from "./parse-formatted-amount.ts";

describe("parseFormattedAmount", () => {
  it.each([
    // Germany (as received by an en-GB device)
    ["42,69 €", 4269, 2, "EUR"],
    ["42,69 €", 4269, 2, "EUR"],
    ["1.234,56 €", 123456, 2, "EUR"],
    ["1.234.567,89 €", 123456789, 2, "EUR"],
    ["5 €", 5, 0, "EUR"],
    // UK / US / Ireland
    ["£12.50", 1250, 2, "GBP"],
    ["£1,234.56", 123456, 2, "GBP"],
    ["US$42.00", 4200, 2, "USD"],
    ["€42.69", 4269, 2, "EUR"],
    // France: narrow NBSP grouping
    ["1 234,56 €", 123456, 2, "EUR"],
    // Switzerland
    ["CHF 12.50", 1250, 2, "CHF"],
    ["CHF 1’234.50", 123450, 2, "CHF"],
    ["12,50 CHF", 1250, 2, "CHF"],
    // ISO code instead of symbol
    ["EUR 42,69", 4269, 2, "EUR"],
    ["42.69 USD", 4269, 2, "USD"],
    // zero-decimal and three-decimal currencies
    ["JP¥1,200", 1200, 0, "JPY"],
    ["₹12,34,567.50", 123456750, 2, "INR"],
    ["KWD 1,234.500", 1234500, 3, "KWD"],
    ["KWD 0.250", 250, 3, "KWD"],
    ["0.123", 123, 3, null],
    ["0,50 €", 50, 2, "EUR"],
    // ISO code without a space
    ["CHF12.50", 1250, 2, "CHF"],
    ["42.69EUR", 4269, 2, "EUR"],
    // other prefixed dollars
    ["A$10.00", 1000, 2, "AUD"],
    ["CA$10.00", 1000, 2, "CAD"],
    ["R$ 10,00", 1000, 2, "BRL"],
    ["NZ$10.00", 1000, 2, "NZD"],
    ["HK$10.00", 1000, 2, "HKD"],
    ["CN¥12.00", 1200, 2, "CNY"],
    ["₩12,000", 12000, 0, "KRW"],
    ["12,50 zł", 1250, 2, "PLN"],
    // ambiguous or missing currency
    ["45,00 kr", 4500, 2, null],
    ["$42.00", 4200, 2, null],
    ["¥1,200", 1200, 0, null],
    ["42.69", 4269, 2, null],
    ["1,234", 1234, 0, null],
    // refunds
    ["-€5.00", -500, 2, "EUR"],
    ["−5,00 €", -500, 2, "EUR"],
    ["€-5.00", -500, 2, "EUR"],
  ])("parses %j", (input, amount, scale, currencyCode) => {
    expect(parseFormattedAmount(input)).toStrictEqual({
      amount,
      scale,
      currencyCode,
    });
  });

  it.each([
    "",
    "€",
    "abc",
    "42,69 € extra",
    "1.2.3,4.5",
    "1,234,56",
    ",50 €",
    // could be 1.234 or 1234 dinars
    "KWD 1.234",
    "KWD 1,234",
    "0,123,456",
  ])("rejects %j", (input) => {
    expect(parseFormattedAmount(input)).toBeNull();
  });
});
