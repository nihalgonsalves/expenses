"use client";
"use no memo";

import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { EyeOpenIcon } from "@radix-ui/react-icons";
import type { Table } from "@tanstack/react-table";

import { useBreakpoint } from "../../utils/hooks/useBreakpoint";

import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
} from "./dropdown-menu";

type DataTableViewOptionsProps<TData> = {
  table: Table<TData>;
  className?: string;
};

export const DataTableViewOptions = <TData,>({
  table,
  className,
}: DataTableViewOptionsProps<TData>) => {
  const breakpointMedium = useBreakpoint("md");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button $variant="outline" $size="sm" className={className}>
          <EyeOpenIcon className="mr-2 size-4" />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent
          align={breakpointMedium ? "end" : "center"}
          className="w-[150px]"
        >
          <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {table
            .getAllColumns()
            .filter(
              (column) =>
                typeof column.accessorFn !== "undefined" && column.getCanHide(),
            )
            .map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => {
                  column.toggleVisibility(!!value);
                }}
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
};
