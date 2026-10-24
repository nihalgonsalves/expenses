import { useQuery } from "@tanstack/react-query";
import { CheckIcon, ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { useState } from "react";

import type { GroupSheetByIdResponse } from "@nihalgonsalves/expenses-shared/types/sheet";
import type { TransactionType } from "@nihalgonsalves/expenses-shared/types/transaction";
import type { TransactionDraft } from "@nihalgonsalves/expenses-shared/types/transaction-draft";
import type { User } from "@nihalgonsalves/expenses-shared/types/user";

import { sheetQueries } from "../../api/sheet.functions";
import { useCurrentUser } from "../../api/user.functions";
import { ResponsiveDialog } from "../form/responsive-dialog";
import { ToggleButtonGroup } from "../form/toggle-button-group";
import type { RenderProp } from "../ui/utils";

import { getDraftTransactionType } from "../transaction-drafts/draft-default-values";

import { SettlementForm } from "./settlement-form";
import { TransactionForm } from "./transaction-form";

const TYPE_OPTIONS = [
  {
    value: "EXPENSE",
    label: (
      <>
        <ArrowUpIcon className="mr-2 size-4" />
        Expense
      </>
    ),
  },
  {
    value: "INCOME",
    label: (
      <>
        <ArrowDownIcon className="mr-2 size-4" />
        Income
      </>
    ),
  },
  {
    value: "TRANSFER",
    label: (
      <>
        <CheckIcon className="mr-2 size-4" />
        Settlement
      </>
    ),
  },
] as const;

const CreateGroupSheetTransactionForm = ({
  groupSheet,
  me,
  draft,
}: {
  groupSheet: GroupSheetByIdResponse;
  me: User;
  draft: TransactionDraft | undefined;
}) => {
  const [type, setType] = useState<TransactionType>(() =>
    getDraftTransactionType(draft),
  );

  return (
    <div className="flex flex-col gap-4">
      <ToggleButtonGroup
        className={
          draft ? "grid w-full grid-cols-2" : "grid w-full grid-cols-3"
        }
        value={type}
        setValue={setType}
        // settlements don't have a description or date to fill from a draft
        options={
          draft
            ? TYPE_OPTIONS.filter(({ value }) => value !== "TRANSFER")
            : TYPE_OPTIONS
        }
      />
      {type === "TRANSFER" ? (
        <SettlementForm groupSheet={groupSheet} me={me} />
      ) : (
        <TransactionForm
          type={type}
          groupSheet={groupSheet}
          me={me}
          draft={draft}
        />
      )}
    </div>
  );
};

export const CreateGroupSheetTransactionDialog = ({
  sheetId,
  render,
  draft,
}: {
  sheetId: string;
  render: RenderProp;
  draft?: TransactionDraft | undefined;
}) => {
  const { data: groupSheet } = useQuery(
    sheetQueries.groupSheetById.queryOptions(sheetId),
  );

  const me = useCurrentUser();

  return (
    <ResponsiveDialog
      triggerType="trigger"
      render={render}
      title="Add Transaction"
    >
      {groupSheet && me ? (
        <CreateGroupSheetTransactionForm
          groupSheet={groupSheet}
          me={me}
          draft={draft}
        />
      ) : null}
    </ResponsiveDialog>
  );
};
