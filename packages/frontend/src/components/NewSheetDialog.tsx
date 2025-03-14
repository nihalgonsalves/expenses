import type { ReactNode } from "react";

import { usePreferredCurrencyCode } from "../state/preferences";

import { ResponsiveDialog } from "./form/ResponsiveDialog";
import { CreateGroupForm } from "./group-sheets/CreateGroupForm";
import { CreateSheetForm } from "./personal-sheets/CreateSheetForm";

export const NewPersonalSheetDialog = ({ trigger }: { trigger: ReactNode }) => {
  const [defaultCurrencyCode] = usePreferredCurrencyCode();

  return (
    <ResponsiveDialog title="Create new personal sheet" trigger={trigger}>
      <CreateSheetForm defaultCurrencyCode={defaultCurrencyCode} />
    </ResponsiveDialog>
  );
};

export const NewGroupSheetDialog = ({ trigger }: { trigger: ReactNode }) => {
  const [defaultCurrencyCode] = usePreferredCurrencyCode();

  return (
    <ResponsiveDialog title="Create new group sheet" trigger={trigger}>
      <CreateGroupForm defaultCurrencyCode={defaultCurrencyCode} />
    </ResponsiveDialog>
  );
};
