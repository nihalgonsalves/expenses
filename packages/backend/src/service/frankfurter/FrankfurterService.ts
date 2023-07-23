import { TRPCError } from '@trpc/server';
import { z } from 'zod';

class FrankfurterServiceError extends TRPCError {}

export class FrankfurterService {
  constructor(private baseUrl: string) {}

  async getCurrencies() {
    const url = new URL('/currencies', this.baseUrl);

    const response = await fetch(url);

    const data: unknown = await response.json();

    if (!response.ok) {
      throw new FrankfurterServiceError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error fetching currencies',
      });
    }

    const result = z.record(z.string()).safeParse(data);

    if (!result.success) {
      throw new FrankfurterServiceError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error parsing currencies',
      });
    }

    return result.data;
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

    const response = await fetch(url);

    const data: unknown = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
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

    const result = ZSchema.safeParse(data);

    if (!result.success) {
      throw new FrankfurterServiceError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error parsing rates',
      });
    }

    // shouldn't be required because the schema checks for the existence
    // of the specific value, but since it's typed as `string` this possibly
    // returns undefined
    return z.number().parse(result.data.rates[targetCurrency]);
  }
}
