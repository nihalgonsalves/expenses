"use client";

import type { DialogProps } from "@radix-ui/react-dialog";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { Command as CommandPrimitive } from "cmdk";
import * as React from "react";

import { Dialog, DialogContent } from "./dialog";
import { ScrollArea } from "./scroll-area";
import { cn, twx } from "./utils";

const Command = twx(
  CommandPrimitive,
)`flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground`;
Command.displayName = CommandPrimitive.displayName;

type CommandDialogProps = DialogProps;

const CommandDialog = ({ children, ...props }: CommandDialogProps) => (
  <Dialog {...props}>
    <DialogContent className="overflow-hidden p-0">
      <Command className="[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
        {children}
      </Command>
    </DialogContent>
  </Dialog>
);

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div
    className="flex items-center border-b px-3"
    // eslint-disable-next-line react/no-unknown-property
    cmdk-input-wrapper=""
  >
    <MagnifyingGlassIcon className="mr-2 size-4 shrink-0 opacity-50" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "placeholder:text-muted-foreground [aria-disabled=true]:cursor-not-allowed [aria-disabled=true]:opacity-50 flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none",
        className,
      )}
      {...props}
    />
  </div>
));

CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, children, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("overflow-x-hidden", className)}
    {...props}
  >
    <ScrollArea viewportClassName="max-h-72">{children}</ScrollArea>
  </CommandPrimitive.List>
));

CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = twx(CommandPrimitive.Empty)`py-6 text-center text-sm`;
CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = twx(
  CommandPrimitive.Group,
)`overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground`;
CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandSeparator = twx(CommandPrimitive.Separator)`-mx-1 h-px bg-border`;
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

const CommandItem = twx(
  CommandPrimitive.Item,
)`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50`;
CommandItem.displayName = CommandPrimitive.Item.displayName;

const CommandShortcut = twx.span`ml-auto text-xs tracking-widest text-muted-foreground`;
CommandShortcut.displayName = "CommandShortcut";

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
