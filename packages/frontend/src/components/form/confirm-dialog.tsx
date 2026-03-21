import type { VariantProps } from "class-variance-authority";
import { type MouseEvent, type ReactNode, useState } from "react";

import type { buttonVariants } from "../ui/button";

import {
  ResponsiveDialog,
  type DialogControlsOrRender,
} from "./responsive-dialog";
import { haptics } from "bzzz";

export const ConfirmDialog = ({
  description,
  confirmLabel,
  onConfirm: onConfirmProp,
  variant,
  ...props
}: {
  description: ReactNode;
  confirmLabel: ReactNode;
  onConfirm: () => Promise<void> | void;
  variant?: VariantProps<typeof buttonVariants>["variant"];
} & DialogControlsOrRender) => {
  const [isLoading, setIsLoading] = useState(false);

  const onConfirm = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onConfirmProp();
      haptics.success();
    } catch {
      haptics.error();
      setIsLoading(false);
    }
  };

  return (
    <ResponsiveDialog
      title="Confirm"
      description={description}
      alert
      confirmLabel={confirmLabel}
      onConfirm={onConfirm}
      isLoading={isLoading}
      variant={variant}
      {...props}
    />
  );
};
