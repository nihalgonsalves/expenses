import { describe, expect, it } from "vitest";
import { unparseCsv } from "./csv";

const cell = (value: string) =>
  unparseCsv([{ value }], ["value"]).split("\r\n")[1];

describe("unparseCsv", () => {
  it.each([
    ["=1+1", `"'=1+1"`],
    [
      '=HYPERLINK("https://evil.example","x")',
      `"'=HYPERLINK(""https://evil.example"",""x"")"`,
    ],
    ["+cmd|' /C calc'!A0", `"'+cmd|' /C calc'!A0"`],
    ["-2+3", `"'-2+3"`],
    ["@SUM(A1)", `"'@SUM(A1)"`],
    ["\t=1", `"'\t=1"`],
  ])("escapes formula-like cell %j", (value, expected) => {
    expect(cell(value)).toBe(expected);
  });

  it.each(["-12.50", "+3", "12.50", "0", "Lunch", "a=b", ""])(
    "leaves %j as-is",
    (value) => {
      expect(cell(value)).toBe(value);
    },
  );
});
