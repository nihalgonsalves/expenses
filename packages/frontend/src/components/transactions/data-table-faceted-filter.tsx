import { Subscribe, type Column, type RowData } from "@tanstack/react-table";
import { CheckIcon, PlusCircleIcon } from "lucide-react";
import type { ReactNode } from "react";

import { useBreakpoint } from "../../utils/hooks/use-breakpoint";
import { Badge } from "../ui/badge";
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
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Separator } from "../ui/separator";
import { cn } from "../ui/utils";
import type { TransactionTableFeatures } from "./table-features";

type DataTableFacetedFilterProps<TData extends RowData, TValue> = {
  column?: Column<TransactionTableFeatures, TData, TValue>;
  title?: string;
  options: {
    label: string;
    value: string;
    icon?: ReactNode;
  }[];
};

export const DataTableFacetedFilter = <TData extends RowData, TValue>({
  column,
  title,
  options,
}: DataTableFacetedFilterProps<TData, TValue>) => {
  const breakpointLg = useBreakpoint("lg");

  if (!column) {
    return null;
  }

  return (
    <Subscribe source={column.table.atoms.columnFilters}>
      {(columnFilters) => {
        const facets = column.getFacetedUniqueValues();
        const filterValue = columnFilters.find(
          (filter) => filter.id === column.id,
        )?.value;
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion
        const selectedValues = new Set(filterValue as string[]);

        return (
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 justify-start border-dashed lg:justify-center"
                >
                  <PlusCircleIcon className="mr-2 size-4" />
                  {title}
                  {selectedValues.size > 0 && (
                    <>
                      <Separator orientation="vertical" className="mx-2 h-4" />
                      <Badge
                        variant="secondary"
                        className="rounded-sm px-1 font-normal lg:hidden"
                      >
                        {selectedValues.size}
                      </Badge>
                      <div className="hidden space-x-1 lg:flex">
                        {selectedValues.size > 2 ? (
                          <Badge
                            variant="secondary"
                            className="rounded-sm px-1 font-normal"
                          >
                            {selectedValues.size} selected
                          </Badge>
                        ) : (
                          options
                            .filter((option) =>
                              selectedValues.has(option.value),
                            )
                            .map((option) => (
                              <Badge
                                variant="secondary"
                                key={option.value}
                                className="rounded-sm px-1 font-normal"
                              >
                                {option.label}
                              </Badge>
                            ))
                        )}
                      </div>
                    </>
                  )}
                </Button>
              }
            />
            <PopoverContent
              className="w-[200px] p-0"
              align={breakpointLg ? "start" : "center"}
            >
              <Command>
                <CommandInput placeholder={title} />
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup>
                    {options.map((option) => {
                      const isSelected = selectedValues.has(option.value);
                      return (
                        <CommandItem
                          key={option.value}
                          onSelect={() => {
                            if (isSelected) {
                              selectedValues.delete(option.value);
                            } else {
                              selectedValues.add(option.value);
                            }
                            const filterValues = Array.from(selectedValues);
                            column.setFilterValue(
                              filterValues.length ? filterValues : undefined,
                            );
                          }}
                        >
                          <div
                            className={cn(
                              "border-primary mr-2 flex size-4 items-center justify-center rounded-sm border",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "opacity-50 [&_svg]:invisible",
                            )}
                          >
                            <CheckIcon className={cn("size-4")} />
                          </div>
                          {option.icon}
                          <span>{option.label}</span>
                          {facets.get(option.value) != null && (
                            <span className="ml-auto flex size-4 items-center justify-center font-mono text-xs">
                              {facets.get(option.value)}
                            </span>
                          )}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                  {selectedValues.size > 0 && (
                    <>
                      <CommandSeparator />
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => {
                            column.setFilterValue(undefined);
                          }}
                          className="justify-center text-center"
                        >
                          Clear filters
                        </CommandItem>
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        );
      }}
    </Subscribe>
  );
};
