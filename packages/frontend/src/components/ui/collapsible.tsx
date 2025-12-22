"use client";

import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";
import { AnimatePresence, motion } from "motion/react";

import { collapse } from "#/utils/motion";

const Collapsible = ({ ...props }: CollapsiblePrimitive.Root.Props) => (
  <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
);

const CollapsibleTrigger = ({
  ...props
}: CollapsiblePrimitive.Trigger.Props) => (
  <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props} />
);

const CollapsibleContent = ({ ...props }: CollapsiblePrimitive.Panel.Props) => (
  <AnimatePresence initial={false}>
    <CollapsiblePrimitive.Panel
      key="collapsible-content"
      data-slot="collapsible-content"
      {...props}
      render={<motion.div {...collapse} />}
    />
  </AnimatePresence>
);

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
