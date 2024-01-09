"use client";

import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import type { VariantProps } from "class-variance-authority";
import * as React from "react";
import type { TwcComponentProps } from "react-twc";

import { buttonVariants } from "../ui/button";

import { cn, twx } from "./utils";

const AlertDialog = AlertDialogPrimitive.Root;

const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

const AlertDialogPortal = AlertDialogPrimitive.Portal;

const AlertDialogOverlay = twx(
  AlertDialogPrimitive.Overlay,
)`fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0`;
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 sm:rounded-lg",
        className,
      )}
      {...props}
    />
  </AlertDialogPortal>
));
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

const AlertDialogHeader = twx.div`flex flex-col space-y-2 text-center sm:text-left`;
AlertDialogHeader.displayName = "AlertDialogHeader";

const AlertDialogFooter = twx.div`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2`;
AlertDialogFooter.displayName = "AlertDialogFooter";

const AlertDialogTitle = twx(AlertDialogPrimitive.Title)`text-lg font-semibold`;
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

const AlertDialogDescription = twx(
  AlertDialogPrimitive.Description,
)`text-sm text-muted-foreground`;
AlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName;

type AlertDialogActionProps = TwcComponentProps<
  typeof AlertDialogPrimitive.Action
> &
  VariantProps<typeof buttonVariants>;

const AlertDialogAction = twx(
  AlertDialogPrimitive.Action,
)<AlertDialogActionProps>(({ $variant }) => cn(buttonVariants({ $variant })));
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;

type AlertDialogCancelProps = TwcComponentProps<
  typeof AlertDialogPrimitive.Cancel
> &
  VariantProps<typeof buttonVariants>;

const AlertDialogCancel = twx(
  AlertDialogPrimitive.Cancel,
)<AlertDialogCancelProps>(({ $variant = "outline" }) =>
  cn(buttonVariants({ $variant }), "mt-2 sm:mt-0"),
);
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
