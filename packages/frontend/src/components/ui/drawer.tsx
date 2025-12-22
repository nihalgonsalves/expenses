"use client";

import type { ComponentProps } from "react";
import { Drawer as DrawerPrimitive } from "vaul-base";

import { cn, twx } from "./utils";

const Drawer = ({
  shouldScaleBackground = false,
  ...props
}: ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    {...props}
  />
);
Drawer.displayName = "Drawer";

const DrawerTrigger = DrawerPrimitive.Trigger;

const DrawerPortal = DrawerPrimitive.Portal;

const DrawerClose = DrawerPrimitive.Close;

const DrawerOverlay = twx(
  DrawerPrimitive.Overlay,
)`fixed inset-0 z-50 bg-black/80`;
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

const DrawerContent = ({
  ref,
  className,
  children,
  ...props
}: ComponentProps<typeof DrawerPrimitive.Content>) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        "bg-background fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border",
        className,
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      {...props}
    >
      <div className="bg-muted mx-auto mt-4 h-2 w-[100px] rounded-full" />
      {children}
    </DrawerPrimitive.Content>
  </DrawerPortal>
);

const DrawerHeader = twx.div`grid gap-1.5 p-4 text-center sm:text-left`;
DrawerHeader.displayName = "DrawerHeader";

const DrawerFooter = twx.div`mt-auto flex flex-col gap-2 p-4`;
DrawerFooter.displayName = "DrawerFooter";

const DrawerTitle = twx(
  DrawerPrimitive.Title,
)`text-lg font-semibold leading-none tracking-tight`;
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

const DrawerDescription = twx(
  DrawerPrimitive.Description,
)`text-sm text-muted-foreground`;
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
