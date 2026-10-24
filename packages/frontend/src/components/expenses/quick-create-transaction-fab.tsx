import { PlusIcon } from "lucide-react";

import { FloatingActionButton } from "../floating-action-button";

import { ChooseSheetDialog } from "./choose-sheet-dialog";

export const QuickCreateTransactionFAB = () => (
  <ChooseSheetDialog
    render={
      <FloatingActionButton label="Add Transaction" icon={<PlusIcon />} />
    }
    nativeButton={false}
  />
);
