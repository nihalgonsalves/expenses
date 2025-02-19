import { createFileRoute } from "@tanstack/react-router";
import { endOfMonth, startOfMonth } from "date-fns";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

import { useAllUserTransactions } from "../../api/useAllUserTransactions";
import { CategoryStats } from "../../components/CategoryStats";
import { RootLoader } from "../../pages/Root";

const StatsIndexPage = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const result = useAllUserTransactions({
    fromTimestamp: dateRange?.from?.toISOString(),
    toTimestamp: dateRange?.to?.toISOString(),
  });

  return (
    <RootLoader
      result={result}
      title="Stats"
      render={(data) => (
        <CategoryStats
          data={data}
          dateRange={dateRange}
          setDateRange={setDateRange}
        />
      )}
    />
  );
};

export const Route = createFileRoute("/_auth/stats")({
  component: StatsIndexPage,
});
