import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";

import { setupMockServer } from "../../../test/msw.ts";

import { FrankfurterService } from "./frankfurter-service.ts";

const mockServer = setupMockServer();

describe("FrankfurterService", () => {
  it("fetches v2 currencies", async () => {
    mockServer.use(
      http.get("https://example.com/v2/currencies", () =>
        HttpResponse.json([
          { iso_code: "EUR", name: "Euro" },
          { iso_code: "USD", name: "United States Dollar" },
        ]),
      ),
    );

    const service = new FrankfurterService("https://example.com/");

    await expect(service.getCurrencies()).resolves.toEqual([
      { iso_code: "EUR" },
      { iso_code: "USD" },
    ]);
  });

  it("fetches a v2 historical conversion rate", async () => {
    mockServer.use(
      http.get("https://example.com/v2/rate/USD/GBP", ({ request }) => {
        expect(new URL(request.url).searchParams.get("date")).toBe(
          "1990-01-02",
        );
        return HttpResponse.json({
          date: "1990-01-02",
          base: "USD",
          quote: "GBP",
          rate: 0.6115,
        });
      }),
    );

    const service = new FrankfurterService("https://example.com/");

    await expect(
      service.getConversionRate(
        "USD",
        "GBP",
        Temporal.PlainDate.from("1990-01-02"),
      ),
    ).resolves.toBe(0.6115);
  });

  it("rejects an invalid v2 rate response", async () => {
    mockServer.use(
      http.get("https://example.com/v2/rate/USD/GBP", () =>
        HttpResponse.json({ rates: { GBP: 0.6115 } }),
      ),
    );

    const service = new FrankfurterService("https://example.com/");

    await expect(
      service.getConversionRate(
        "USD",
        "GBP",
        Temporal.PlainDate.from("1990-01-02"),
      ),
    ).rejects.toMatchObject({ message: "Error parsing rates" });
  });
});
