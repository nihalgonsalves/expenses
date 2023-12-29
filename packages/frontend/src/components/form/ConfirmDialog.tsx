import type { VariantProps } from 'class-variance-authority';
import { type MouseEvent, useCallback, useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import { Button, type buttonVariants } from '../ui/button';

export const ConfirmDialog = ({
  description,
  confirmLabel,
  onConfirm,
  trigger,
  variant,
}: {
  description: React.ReactNode;
  confirmLabel: React.ReactNode;
  onConfirm: () => Promise<void> | void;
  trigger: React.ReactNode;
  variant?: VariantProps<typeof buttonVariants>['variant'];
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirmed = useCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setIsLoading(true);

      try {
        await onConfirm();
        setIsOpen(false);
      } catch {
        setIsLoading(false);
      }
    },
    [onConfirm],
  );

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmed} asChild>
            <Button variant={variant} isLoading={isLoading}>
              {confirmLabel}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
