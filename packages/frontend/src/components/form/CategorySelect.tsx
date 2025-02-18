import { PlusIcon } from "@radix-ui/react-icons";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { Popover } from "@radix-ui/react-popover";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { ControllerRenderProps } from "react-hook-form";

import { useTRPC } from "../../api/trpc";
import { CategoryIcon } from "../CategoryAvatar";
import { Button } from "../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "../ui/command";
import { PopoverContent, PopoverTrigger } from "../ui/popover";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "../ui/utils";

export const OTHER_CATEGORY = "other";

type CategorySelectProps = {
  id?: string;
  value: string | undefined;
  onChange: (newCategory: string | undefined) => void;
  className?: string;
  placeholder?: string;
} & Pick<React.ComponentProps<typeof Button>, "ref"> &
  Omit<ControllerRenderProps, "value" | "onChange" | "ref">;

export const CategorySelect = ({
  ref,
  id,
  value,
  onChange,
  onBlur,
  className,
  placeholder = "Select a category",
  ...controllerProps
}: CategorySelectProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const { trpc } = useTRPC();
  const { data: categories } = useQuery(
    trpc.transaction.getCategories.queryOptions(),
  );

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          {...controllerProps}
          id={id}
          ref={ref}
          $variant="outline"
          role="combobox"
          className={cn("min-w-48 justify-between", className)}
        >
          {value ?? placeholder}
          <CaretSortIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput
            inputMode="search"
            placeholder="Search"
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            {/* Only displayed when allowCreate=false, as otherwise there's always a CommandItem */}
            <CommandEmpty>No category found</CommandEmpty>

            <ScrollArea viewportClassName="max-h-64">
              <CommandGroup className="h-full overflow-y-auto">
                {value ? (
                  <>
                    <CommandItem
                      className="opacity-80"
                      value="unset"
                      onSelect={() => {
                        onChange(undefined);
                        setOpen(false);
                        onBlur();
                      }}
                    >
                      Clear Selection
                    </CommandItem>
                    <CommandSeparator />
                  </>
                ) : null}

                {categories?.map((category) => (
                  <CommandItem
                    key={category.id}
                    value={category.id}
                    onSelect={() => {
                      onChange(category.id);
                      setOpen(false);
                    }}
                  >
                    <div className="mr-2">
                      <CategoryIcon category={category.id} />
                    </div>
                    {category.id}
                  </CommandItem>
                ))}

                {searchValue.length > 0 &&
                  !categories?.some((c) => c.id === searchValue) && (
                    <CommandItem
                      value={searchValue}
                      onSelect={() => {
                        onChange(searchValue);
                        setOpen(false);
                        onBlur();
                      }}
                    >
                      <PlusIcon className="mr-2 size-4" />
                      Create {`'${searchValue}'`}
                    </CommandItem>
                  )}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
