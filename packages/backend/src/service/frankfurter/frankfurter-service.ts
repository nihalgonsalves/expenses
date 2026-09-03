import { TRPCError } from "@trpc/server";
import { z } from "zod";

class FrankfurterServiceError extends TRPCError {}

const safeFetchJson = async (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<
  | { ok: false; message: string; status: number | undefined }
  | { ok: true; response: unknown }
> => {
  try {
    const response = await fetch(input, init);

    if (response.ok) {
      return { ok: true, response: await response.json() };
    }

    return {
      ok: false,
      message: response.statusText,
      status: response.status,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unknown",
      status: undefined,
    };
  }
};

const ZCurrenciesSchema = z.array(
  z.object({
    iso_code: z.string(),
  }),
);

const ZRateSchema = z.object({
  rate: z.number(),
});

export class FrankfurterService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getCurrencies() {
    const url = new URL("/v2/currencies", this.baseUrl);

    const fetchResult = await safeFetchJson(url);

    if (!fetchResult.ok) {
      throw new FrankfurterServiceError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Error fetching currencies. (${fetchResult.message})`,
        cause: fetchResult.message,
      });
    }

    const parseResult = ZCurrenciesSchema.safeParse(fetchResult.response);

    if (!parseResult.success) {
      throw new FrankfurterServiceError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error parsing currencies",
      });
    }

    return parseResult.data;
  }

  async getConversionRate(
    baseCurrency: string,
    targetCurrency: string,
    date: Temporal.PlainDate,
  ) {
    const url = new URL(
      `/v2/rate/${encodeURIComponent(baseCurrency)}/${encodeURIComponent(targetCurrency)}`,
      this.baseUrl,
    );
    url.searchParams.set("date", date.toString());

    const fetchResult = await safeFetchJson(url);

    if (!fetchResult.ok) {
      if (fetchResult.status === 404) {
        throw new FrankfurterServiceError({
          code: "NOT_FOUND",
          message: `Rates for ${baseCurrency} not found`,
        });
      }

      throw new FrankfurterServiceError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error fetching rates",
      });
    }

    const parseResult = ZRateSchema.safeParse(fetchResult.response);

    if (!parseResult.success) {
      throw new FrankfurterServiceError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error parsing rates",
      });
    }

    return parseResult.data.rate;
  }
}
