import {
  ClientOnly,
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";

import { useAllUserTransactions } from "../../api/use-all-user-transactions";
import { QuickCreateTransactionFAB } from "../../components/expenses/quick-create-transaction-fab";
import { columns } from "../../components/transactions/columns";
import {
  DataTable,
  ZTransactionFilters,
} from "../../components/transactions/data-table";
import { RootLoader } from "../../pages/root";
import {
  getDateRangeFromSearch,
  getDateRangeSearch,
  ZDateRangeSearch,
} from "../../utils/date-range-search";

export const Route = createFileRoute("/_auth/")({
  // TODO: date hydration mismatch
  component: () => (
    <ClientOnly>
      <RouteComponent />
    </ClientOnly>
  ),
  validateSearch: ZTransactionFilters.extend(ZDateRangeSearch.shape),
});

function RouteComponent() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const dateRange = getDateRangeFromSearch(search);
  const setDateRange = (nextDateRange: typeof dateRange | undefined) => {
    if (!nextDateRange?.from || !nextDateRange.to) return;
    void navigate({
      search: (previous) => ({
        ...previous,
        ...getDateRangeSearch(nextDateRange),
      }),
    });
  };

  const result = useAllUserTransactions({
    fromTimestamp: dateRange.from?.toISOString(),
    toTimestamp: dateRange.to?.toISOString(),
  });

  return (
    <RootLoader
      result={result}
      title="Transactions"
      additionalChildren={<QuickCreateTransactionFAB />}
      render={(data) => (
        <DataTable
          columns={columns}
          data={data}
          dateRange={dateRange}
          setDateRange={setDateRange}
        />
      )}
    />
  );
}
