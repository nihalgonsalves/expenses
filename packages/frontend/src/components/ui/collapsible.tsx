'use client';

import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';
import React from 'react';

import { collapse } from '../../utils/framer';

const Collapsible = CollapsiblePrimitive.Root;

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;

const CollapsibleContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.CollapsibleContent>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleContent>
>(({ children, ...props }, ref) => (
  <AnimatePresence initial={false}>
    <CollapsiblePrimitive.CollapsibleContent ref={ref} {...props} asChild>
      <motion.div {...collapse}>{children}</motion.div>
    </CollapsiblePrimitive.CollapsibleContent>
  </AnimatePresence>
));
CollapsibleContent.displayName =
  CollapsiblePrimitive.CollapsibleContent.displayName;

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
