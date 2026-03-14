import { usePreferredCurrencyCode } from "../state/preferences";

import { ResponsiveDialog } from "./form/responsive-dialog";
import { CreateGroupForm } from "./group-sheets/create-group-form";
import { CreateSheetForm } from "./personal-sheets/create-sheet-form";
import type { RenderProp } from "./ui/utils";

export const NewPersonalSheetDialog = ({ render }: { render: RenderProp }) => {
  const [defaultCurrencyCode] = usePreferredCurrencyCode();

  return (
    <ResponsiveDialog
      title="Create new personal sheet"
      triggerType="trigger"
      render={render}
    >
      <CreateSheetForm defaultCurrencyCode={defaultCurrencyCode} />
    </ResponsiveDialog>
  );
};

export const NewGroupSheetDialog = ({ render }: { render: RenderProp }) => {
  const [defaultCurrencyCode] = usePreferredCurrencyCode();

  return (
    <ResponsiveDialog
      title="Create new group sheet"
      triggerType="trigger"
      render={render}
    >
      <CreateGroupForm defaultCurrencyCode={defaultCurrencyCode} />
    </ResponsiveDialog>
  );
};
