"use client";

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";

import { collapse } from "../../utils/motion";

const Collapsible = CollapsiblePrimitive.Root;

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;

const CollapsibleContent = ({
  ref,
  children,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) => (
  <AnimatePresence initial={false}>
    <CollapsiblePrimitive.CollapsibleContent ref={ref} {...props} asChild>
      <motion.div {...collapse}>{children}</motion.div>
    </CollapsiblePrimitive.CollapsibleContent>
  </AnimatePresence>
);

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
