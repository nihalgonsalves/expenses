import { ScrollArea } from "@radix-ui/react-scroll-area";
import type { VariantProps } from "class-variance-authority";
import { atom, useAtom } from "jotai";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";

import { useBreakpoint } from "../../utils/hooks/useBreakpoint";
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
  trigger: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
} & (
  | { alert?: undefined }
  | {
      alert: true;
      confirmLabel: ReactNode;
      onConfirm: (e: MouseEvent<HTMLButtonElement>) => Promise<void> | void;
      isLoading: boolean;
      variant?: VariantProps<typeof buttonVariants>["$variant"];
    }
);

const responsiveDialogOpen = atom(false);

export const useDialog = () => {
  const [isOpen, setOpen] = useAtom(responsiveDialogOpen);

  return {
    isOpen,
    dismiss: () => {
      setOpen(false);
    },
  };
};

const ResponsiveDialogInner = ({
  trigger,
  title,
  description,
  children,
  ...props
}: ResponsiveDialogProps) => {
  const isDesktop = useBreakpoint("md");

  const [open, setOpen] = useState(false);
  const [globalOpen, setGlobalOpen] = useAtom(responsiveDialogOpen);

  const handleSetOpen = (value: boolean) => {
    setOpen(value);
    setGlobalOpen(value);
  };

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
        <DialogContent className="max-h-[100dvh] max-w-[min(100dvw,var(--container-5xl))] overflow-auto">
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
          {props.alert ? (
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
          ) : null}
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
