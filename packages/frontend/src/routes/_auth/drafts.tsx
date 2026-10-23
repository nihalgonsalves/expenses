import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { transactionDraftQueries } from "../../api/transaction-draft.functions";
import { RootLoader } from "../../pages/root";

export const Route = createFileRoute("/_auth/drafts")({
  component: RouteComponent,
});

function RouteComponent() {
  const result = useQuery(transactionDraftQueries.drafts.queryOptions());

  // TODO: MVP only, replace with a form to pick a sheet and category
  return (
    <RootLoader
      result={result}
      title="Drafts"
      render={(drafts) => (
        <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-xs">
          {JSON.stringify(drafts, null, 2)}
        </pre>
      )}
    />
  );
}
