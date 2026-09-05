import { endOfMonth, startOfMonth } from "date-fns";
import type { DateRange } from "react-day-picker";
import { z } from "zod";

export const ZDateRangeSearch = z.object({
  fromTimestamp: z.iso.datetime().optional(),
  toTimestamp: z.iso.datetime().optional(),
});

export const getDateRangeFromSearch = (
  search: z.infer<typeof ZDateRangeSearch>,
): DateRange => ({
  from: search.fromTimestamp
    ? new Date(search.fromTimestamp)
    : startOfMonth(new Date()),
  to: search.toTimestamp
    ? new Date(search.toTimestamp)
    : endOfMonth(new Date()),
});

export const getDateRangeSearch = (dateRange: DateRange) => ({
  fromTimestamp: dateRange.from?.toISOString(),
  toTimestamp: dateRange.to?.toISOString(),
});
