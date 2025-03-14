import type { VariantProps } from "class-variance-authority";
import { type MouseEvent, useState } from "react";

import type { buttonVariants } from "../ui/button";

import { ResponsiveDialog } from "./ResponsiveDialog";

export const ConfirmDialog = ({
  description,
  confirmLabel,
  onConfirm: onConfirmProp,
  trigger,
  variant,
}: {
  description: React.ReactNode;
  confirmLabel: React.ReactNode;
  onConfirm: () => Promise<void> | void;
  trigger: React.ReactNode;
  variant?: VariantProps<typeof buttonVariants>["$variant"];
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const onConfirm = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onConfirmProp();
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <ResponsiveDialog
      trigger={trigger}
      title="Confirm"
      description={description}
      alert
      confirmLabel={confirmLabel}
      onConfirm={onConfirm}
      isLoading={isLoading}
      variant={variant}
    />
  );
};
