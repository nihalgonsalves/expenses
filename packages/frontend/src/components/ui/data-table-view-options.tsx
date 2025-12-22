"use client";
"use no memo";

import type { Table } from "@tanstack/react-table";
import { EyeIcon } from "lucide-react";

import { useBreakpoint } from "../../utils/hooks/useBreakpoint";

import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
      <DropdownMenuTrigger
        render={
          <Button $variant="outline" $size="sm" className={className}>
            <EyeIcon className="mr-2 size-4" />
            View
          </Button>
        }
      />
      <DropdownMenuPortal>
        <DropdownMenuContent
          align={breakpointMedium ? "end" : "center"}
          className="w-[150px]"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter(
                (column) =>
                  typeof column.accessorFn !== "undefined" &&
                  column.getCanHide(),
              )
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => {
                    column.toggleVisibility(value);
                  }}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
};
