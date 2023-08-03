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
    const url = new URL('/latest', this.baseUrl);
    url.searchParams.set('from', baseCurrency);
    url.searchParams.set('to', targetCurrency);

    const ZSchema = z.object({
      amount: z.number(),
      base: z.literal(baseCurrency),
      date: z.string(),
      rates: z.object({ [targetCurrency]: z.number() }),
    });

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

    const parseResult = ZSchema.safeParse(fetchResult.response);

    if (!parseResult.success) {
      throw new FrankfurterServiceError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error parsing rates',
      });
    }

    // shouldn't be required because the schema checks for the existence
    // of the specific value, but since it's typed as `string` this possibly
    // returns undefined
    return z.number().parse(parseResult.data.rates[targetCurrency]);
  }
}
