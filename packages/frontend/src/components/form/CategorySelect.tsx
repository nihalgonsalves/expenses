import { PlusIcon } from "@radix-ui/react-icons";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { Popover } from "@radix-ui/react-popover";
import { forwardRef, useState } from "react";
import type { ControllerRenderProps } from "react-hook-form";

import { trpc } from "../../api/trpc";
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
import { cn } from "../ui/utils";

export const OTHER_CATEGORY = "other" as const;

type CategorySelectProps = {
  id?: string;
  value: string | undefined;
  onChange: (newCategory: string | undefined) => void;
  className?: string;
  placeholder?: string;
  allowCreate?: boolean;
} & Omit<ControllerRenderProps, "value" | "onChange" | "ref">;

export const CategorySelect = forwardRef<
  HTMLButtonElement,
  CategorySelectProps
>(
  (
    {
      id,
      value,
      onChange,
      onBlur,
      className,
      placeholder = "Select a category",
      allowCreate = true,
      ...controllerProps
    },
    ref,
  ) => {
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");

    const { data: categories } = trpc.transaction.getCategories.useQuery();

    return (
      <Popover open={open} onOpenChange={setOpen}>
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
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
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
              <CommandGroup>
                {value && (
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
                )}
                {allowCreate &&
                  searchValue.length > 2 &&
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
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
);
CategorySelect.displayName = "CategorySelect";
