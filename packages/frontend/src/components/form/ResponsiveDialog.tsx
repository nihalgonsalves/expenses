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
import type { RenderProp } from "../ui/utils";

type DialogControls = {
  triggerType: "controlled";
  open: boolean;
  handleSetOpen: (value: boolean) => void;
};

type DialogTrigger = {
  triggerType: "trigger";
  render: RenderProp;
  nativeButton?: boolean;
};

export type DialogControlsOrRender = DialogControls | DialogTrigger;

export type ResponsiveDialogProps = {
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
) &
  DialogControlsOrRender;

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

export const useDialogControls = (): DialogControls => {
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

  return { triggerType: "controlled", open, handleSetOpen };
};

export const ResponsiveDialog = ({
  title,
  description,
  children,
  ...props
}: ResponsiveDialogProps & DialogControlsOrRender) => {
  const uncontrolledControls = useDialogControls();

  const { open, handleSetOpen } =
    props.triggerType === "controlled"
      ? {
          open: props.open,
          handleSetOpen: props.handleSetOpen,
        }
      : {
          open: uncontrolledControls.open,
          handleSetOpen: uncontrolledControls.handleSetOpen,
        };

  const isDesktop = useBreakpoint("md");

  if (isDesktop) {
    if (props.alert) {
      return (
        <AlertDialog open={open} onOpenChange={handleSetOpen}>
          {props.triggerType === "trigger" && (
            <AlertDialogTrigger
              render={props.render}
              nativeButton={props.nativeButton ?? true}
            />
          )}
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
        {props.triggerType === "trigger" && (
          <DialogTrigger
            render={props.render}
            nativeButton={props.nativeButton ?? true}
          />
        )}
        <DialogContent className="max-h-dvh max-w-[min(100dvw,var(--container-5xl))] overflow-auto">
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
      {props.triggerType === "trigger" && (
        <DrawerTrigger render={props.render} />
      )}
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
          {/*
            TODO: vaul-base doesn't seem to respect the render prop for DrawerClose
            <DrawerClose render={<Button $variant="outline">Cancel</Button>} />
          */}
          <DrawerClose>Cancel</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
