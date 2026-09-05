import { useQuery } from "@tanstack/react-query";
import {
  ClientOnly,
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";

import { useAllUserTransactions } from "../../api/use-all-user-transactions";
import { userApi } from "../../api/user.functions";
import { CategoryStats } from "../../components/category-stats";
import { RootLoader } from "../../pages/root";
import {
  getDateRangeFromSearch,
  getDateRangeSearch,
  ZDateRangeSearch,
} from "../../utils/date-range-search";

export const Route = createFileRoute("/_auth/stats")({
  // TODO: date hydration mismatch
  component: () => (
    <ClientOnly>
      <RouteComponent />
    </ClientOnly>
  ),
  validateSearch: ZDateRangeSearch,
});

function RouteComponent() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/stats" });
  const dateRange = getDateRangeFromSearch(search);
  const setDateRange = (nextDateRange: typeof dateRange | undefined) => {
    if (!nextDateRange?.from || !nextDateRange.to) return;
    void navigate({ search: getDateRangeSearch(nextDateRange) });
  };

  const result = useAllUserTransactions({
    fromTimestamp: dateRange.from?.toISOString(),
    toTimestamp: dateRange.to?.toISOString(),
  });
  const { data: categoryGroups = [] } = useQuery(
    userApi.categoryGroups.queryOptions(),
  );

  return (
    <RootLoader
      result={result}
      title="Stats"
      render={(data) => (
        <CategoryStats
          data={data}
          categoryGroups={categoryGroups}
          dateRange={dateRange}
          setDateRange={setDateRange}
        />
      )}
    />
  );
}
