import { ScrollArea } from "@radix-ui/react-scroll-area";
import type { VariantProps } from "class-variance-authority";
import { atom, useAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { useMedia } from "react-use";

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
} from "../ui/alert-dialog";
import { Button, type buttonVariants } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";

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
      variant?: VariantProps<typeof buttonVariants>["$variant"];
    }
);

const responsiveDialogOpen = atom(false);

export const useDialog = () => {
  const [isOpen, setOpen] = useAtom(responsiveDialogOpen);

  return {
    isOpen,
    dismiss: useCallback(() => {
      setOpen(false);
    }, [setOpen]),
  };
};

const ResponsiveDialogInner = ({
  trigger,
  title,
  description,
  children,
  ...props
}: ResponsiveDialogProps) => {
  const isDesktop = useMedia("(min-width: 768px)");

  const [open, setOpen] = useState(false);
  const [globalOpen, setGlobalOpen] = useAtom(responsiveDialogOpen);

  const handleSetOpen = useCallback(
    (value: boolean) => {
      setOpen(value);
      setGlobalOpen(value);
    },
    [setOpen, setGlobalOpen],
  );

  // rudimentary global dismiss, see useDialog above
  useEffect(() => {
    if (open && !globalOpen) {
      setOpen(false);
    }
  }, [open, globalOpen, setOpen]);

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
              <AlertDialogAction tabIndex={0} $variant={props.variant} asChild>
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
        <DialogContent className="max-w-5xl">
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
      <DrawerContent className="max-h-dvh">
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="overflow-y-auto px-4">{children}</ScrollArea>
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

// Scope the dialogOpen atom to each instance, but have a global vaulDialogOpen for the themeing
export const ResponsiveDialog = (props: ResponsiveDialogProps) => (
  <ResponsiveDialogInner {...props} />
);
