"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import type { ComponentProps } from "react";

import { cn, twx } from "./utils";

const Tabs = TabsPrimitive.Root;

const TabsList = twx(
  TabsPrimitive.List,
)`inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground`;
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = twx(
  TabsPrimitive.Trigger,
)`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm`;
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = ({
  ref,
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Content>) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "ring-offset-background focus-visible:ring-ring mt-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden",
      className,
    )}
    {...props}
  />
);

export { Tabs, TabsList, TabsTrigger, TabsContent };
