import { usePreferredCurrencyCode } from "../state/preferences";

import { ResponsiveDialog } from "./form/ResponsiveDialog";
import { CreateGroupForm } from "./group-sheets/CreateGroupForm";
import { CreateSheetForm } from "./personal-sheets/CreateSheetForm";
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
