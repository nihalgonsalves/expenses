import { TRPCError } from '@trpc/server';
import { z } from 'zod';

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
      message: error instanceof Error ? error.message : 'Unknown',
      status: undefined,
    };
  }
};

const ZRateSchema = z.object({
  amount: z.number(),
  base: z.string(),
  date: z.string(),
  rates: z.record(z.number()),
});

export class FrankfurterService {
  constructor(private baseUrl: string) {}

  async getCurrencies() {
    const url = new URL('/currencies', this.baseUrl);

    const fetchResult = await safeFetchJson(url);

    if (!fetchResult.ok) {
      throw new FrankfurterServiceError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Error fetching currencies. (${fetchResult.message})`,
        cause: fetchResult.message,
      });
    }

    const parseResult = z.record(z.string()).safeParse(fetchResult.response);

    if (!parseResult.success) {
      throw new FrankfurterServiceError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error parsing currencies',
      });
    }

    return parseResult.data;
  }

  async getConversionRate(baseCurrency: string, targetCurrency: string) {
    const rates = await this.getRates(baseCurrency, targetCurrency);

    // this is only called for currencies returned by getCurrencies,
    // safe to assert and not safe parse
    return z.number().parse(rates[targetCurrency]);
  }

  private async getRates(baseCurrency: string, targetCurrency?: string) {
    const url = new URL('/latest', this.baseUrl);
    url.searchParams.set('from', baseCurrency);
    if (targetCurrency) {
      url.searchParams.set('to', targetCurrency);
    }

    const fetchResult = await safeFetchJson(url);

    if (!fetchResult.ok) {
      if (fetchResult.status === 404) {
        throw new FrankfurterServiceError({
          code: 'NOT_FOUND',
          message: `Rates for ${baseCurrency} not found`,
        });
      }

      throw new FrankfurterServiceError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error fetching rates',
      });
    }

    const parseResult = ZRateSchema.safeParse(fetchResult.response);

    if (!parseResult.success) {
      throw new FrankfurterServiceError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error parsing rates',
      });
    }

    return parseResult.data.rates;
  }
}
