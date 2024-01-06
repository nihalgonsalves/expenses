import type { VariantProps } from 'class-variance-authority';
import { useCallback, useState } from 'react';
import { useMedia } from 'react-use';

import { syncMetaThemeColor } from '../../state/theme';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '../ui/drawer';

type ResponsiveDialogProps = {
  trigger: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
} & (
  | { alert?: undefined }
  | {
      alert: true;
      confirmLabel: React.ReactNode;
      onConfirm: (
        e: React.MouseEvent<HTMLButtonElement>,
      ) => Promise<void> | void;
      isLoading: boolean;
      variant?: VariantProps<typeof buttonVariants>['$variant'];
    }
);
export const ResponsiveDialog = ({
  trigger,
  title,
  description,
  children,
  ...props
}: ResponsiveDialogProps) => {
  const [open, setOpen] = useState(false);
  const isDesktop = useMedia('(min-width: 768px)');

  const handleSetOpen = useCallback((value: boolean) => {
    setOpen(value);
    syncMetaThemeColor(value);
  }, []);

  if (isDesktop) {
    if (props.alert) {
      return (
        <AlertDialog open={open} onOpenChange={handleSetOpen}>
          <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm</AlertDialogTitle>
              <AlertDialogDescription>{description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction $variant={props.variant} asChild>
                <Button
                  onClick={async (e) => {
                    await props.onConfirm(e);
                    handleSetOpen(false);
                  }}
                  isLoading={props.isLoading}
                >
                  {props.confirmLabel}
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }

    return (
      <Dialog open={open} onOpenChange={handleSetOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={handleSetOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <div className="px-4">{children}</div>
        <DrawerFooter>
          {props.alert && (
            <Button
              $variant={props.variant}
              isLoading={props.isLoading}
              onClick={async (e) => {
                await props.onConfirm(e);
                handleSetOpen(false);
              }}
            >
              {props.confirmLabel}
            </Button>
          )}
          <DrawerClose asChild>
            <Button $variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
