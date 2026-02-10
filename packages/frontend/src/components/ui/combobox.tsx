import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { CheckIcon, XIcon } from "lucide-react";
import type { ComponentProps, Ref, RefObject } from "react";

import { Button } from "./button";
import { Input } from "./input";
import { Separator } from "./separator";
import { cn } from "./utils";

const Combobox = ComboboxPrimitive.Root;

const ComboboxInput = (
  props: ComboboxPrimitive.Input.Props & {
    ref?: Ref<HTMLInputElement> | undefined;
  },
) => (
  <ComboboxPrimitive.Input
    data-slot="combobox-input"
    render={<Input />}
    {...props}
  />
);

const ComboboxTrigger = (props: ComboboxPrimitive.Trigger.Props) => (
  <ComboboxPrimitive.Trigger
    data-slot="combobox-trigger"
    render={<Button variant="ghost" />}
    {...props}
  />
);

const ComboboxIcon = (props: ComponentProps<typeof ComboboxPrimitive.Icon>) => (
  <ComboboxPrimitive.Icon data-slot="combobox-icon" {...props} />
);

const ComboboxClear = ({
  children,
  className,
  ...props
}: ComboboxPrimitive.Clear.Props) => (
  <ComboboxPrimitive.Clear
    className={cn(
      "flex h-9 w-6 items-center justify-center rounded bg-transparent p-0",
      className,
    )}
    aria-label="Clear selection"
    data-slot="combobox-clear"
    {...props}
  >
    {children ?? <XIcon className="size-3" />}
  </ComboboxPrimitive.Clear>
);

const ComboboxValue = (props: ComboboxPrimitive.Value.Props) => (
  <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />
);

const ComboboxChips = ({
  className,
  ...props
}: ComboboxPrimitive.Chips.Props & {
  ref?: RefObject<HTMLDivElement | null>;
}) => (
  <ComboboxPrimitive.Chips
    data-slot="combobox-chips"
    className={cn(
      "flex min-h-9 flex-wrap items-start gap-1 rounded-md border px-1.5 py-1.5 transition-[color,box-shadow]",
      "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
      className,
    )}
    {...props}
  />
);

const ComboboxChip = ({
  className,
  ...props
}: ComboboxPrimitive.Chip.Props) => (
  <ComboboxPrimitive.Chip
    data-slot="combobox-chip"
    className={cn(
      "bg-muted flex cursor-default items-center gap-1 rounded-md px-1 ps-2 pe-0 text-xs outline-none",
      className,
    )}
    {...props}
  />
);

const ComboboxChipRemove = ({
  className,
  children,
  ...props
}: ComboboxPrimitive.ChipRemove.Props) => (
  <ComboboxPrimitive.ChipRemove
    data-slot="combobox-chip-remove"
    className={cn(
      "hover:bg-accent-foreground/10 rounded-md p-1 text-inherit",
      className,
    )}
    aria-label="Remove"
    {...props}
  >
    {children ?? <XIcon className="size-3.5" />}
  </ComboboxPrimitive.ChipRemove>
);

const ComboboxPopup = ({
  className,
  ...props
}: ComboboxPrimitive.Popup.Props) => (
  <ComboboxPrimitive.Popup
    data-slot="combobox-popup"
    className={cn(
      "bg-popover outline-border max-h-[min(var(--available-height),23rem)] w-(--anchor-width) max-w-(--available-width) origin-(--transform-origin) scroll-pt-2 scroll-pb-2 overflow-y-auto overscroll-contain rounded-md py-2 shadow-md outline-1 transition-[transform,scale,opacity] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[side=none]:data-[ending-style]:transition-none data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[side=none]:data-[starting-style]:scale-100 data-[side=none]:data-[starting-style]:opacity-100 data-[side=none]:data-[starting-style]:transition-none dark:shadow-none",
      className,
    )}
    {...props}
  />
);

const ComboboxPortal = ComboboxPrimitive.Portal;

const ComboboxPositioner = ({
  className,
  ...props
}: ComboboxPrimitive.Positioner.Props) => (
  <ComboboxPrimitive.Positioner
    data-slot="combobox-positioner"
    className={cn("z-50 outline-none", className)}
    {...props}
  />
);

const ComboboxArrow = (props: ComboboxPrimitive.Arrow.Props) => (
  <ComboboxPrimitive.Arrow data-slot="combobox-arrow" {...props} />
);

const ComboboxStatus = ({
  className,
  ...props
}: ComboboxPrimitive.Status.Props) => (
  <ComboboxPrimitive.Status
    data-slot="combobox-status"
    className={cn(
      "text-muted-foreground px-4.5 py-2 text-sm empty:m-0 empty:p-0",
      className,
    )}
    {...props}
  />
);

const ComboboxEmpty = ({
  className,
  ...props
}: ComboboxPrimitive.Empty.Props) => (
  <ComboboxPrimitive.Empty
    data-slot="combobox-empty"
    className={cn(
      "text-muted-foreground flex items-center justify-center text-sm not-empty:p-2 not-empty:pt-4",
      className,
    )}
    {...props}
  />
);

const ComboboxList = (props: ComboboxPrimitive.List.Props) => (
  <ComboboxPrimitive.List data-slot="combobox-list" {...props} />
);

const ComboboxRow = (props: ComboboxPrimitive.Row.Props) => (
  <ComboboxPrimitive.Row data-slot="combobox-row" {...props} />
);

const ComboboxItem = ({
  className,
  ...props
}: ComboboxPrimitive.Item.Props) => (
  <ComboboxPrimitive.Item
    data-slot="combobox-item"
    className={cn(
      "data-[highlighted]:text-accent-foreground data-[highlighted]:before:bg-accent grid cursor-default grid-cols-[0.95rem_1fr] items-center gap-2 py-2 pr-8 pl-4 text-sm leading-4 outline-none select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-2 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:-z-1 data-[highlighted]:before:rounded-sm",
      className,
    )}
    {...props}
  />
);

const ComboboxItemIndicator = ({
  className,
  children,
  ...props
}: ComboboxPrimitive.ItemIndicator.Props) => (
  <ComboboxPrimitive.ItemIndicator
    data-slot="combobox-item-indicator"
    className={cn("col-start-1", className)}
    {...props}
  >
    {children ?? <CheckIcon className="size-4" />}
  </ComboboxPrimitive.ItemIndicator>
);

const ComboboxSeparator = (props: ComboboxPrimitive.Separator.Props) => (
  <ComboboxPrimitive.Separator
    data-slot="combobox-separator"
    render={<Separator />}
    {...props}
  />
);

const ComboboxGroup = ({
  className,
  ...props
}: ComboboxPrimitive.Group.Props) => (
  <ComboboxPrimitive.Group
    data-slot="combobox-group"
    className={cn("mb-3 last:mb-0", className)}
    {...props}
  />
);

const ComboboxGroupLabel = ({
  className,
  ...props
}: ComboboxPrimitive.GroupLabel.Props) => (
  <ComboboxPrimitive.GroupLabel
    data-slot="combobox-group-label"
    className={cn(
      "bg-background text-muted-foreground sticky top-0 z-1 py-2 pl-4 text-sm",
      className,
    )}
    {...props}
  />
);

const ComboboxCollection = (props: ComboboxPrimitive.Collection.Props) => (
  <ComboboxPrimitive.Collection data-slot="combobox-collection" {...props} />
);

export {
  Combobox,
  ComboboxArrow,
  ComboboxChip,
  ComboboxChipRemove,
  ComboboxChips,
  ComboboxClear,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxIcon,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
  ComboboxPopup,
  ComboboxPortal,
  ComboboxPositioner,
  ComboboxRow,
  ComboboxSeparator,
  ComboboxStatus,
  ComboboxTrigger,
  ComboboxValue,
};
