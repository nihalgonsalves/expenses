import { Subscribe, type Column, type RowData } from "@tanstack/react-table";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsUpDownIcon,
  EyeOffIcon,
} from "lucide-react";
import type { ComponentProps } from "react";

import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { cn } from "./utils";
import type { TransactionTableFeatures } from "../transactions/table-features";

type DataTableColumnHeaderProps<TData extends RowData, TValue> = {
  column: Column<TransactionTableFeatures, TData, TValue>;
  title: string;
} & ComponentProps<"div">;

export const DataTableColumnHeader = <TData extends RowData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) => {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              className="data-[state=open]:bg-accent -ml-3 h-8"
            >
              <span>{title}</span>
              <Subscribe
                source={column.table.atoms.sorting}
                selector={(sorting) =>
                  sorting.find((sort) => sort.id === column.id)
                }
              >
                {(sorting) =>
                  sorting?.desc === true ? (
                    <ArrowDownIcon className="ml-2 h-4 w-4" />
                  ) : sorting ? (
                    <ArrowUpIcon className="ml-2 h-4 w-4" />
                  ) : (
                    <ChevronsUpDownIcon className="ml-2 h-4 w-4" />
                  )
                }
              </Subscribe>
            </Button>
          }
        />
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onClick={() => {
              column.toggleSorting(false);
            }}
          >
            <ArrowUpIcon className="text-muted-foreground/70 mr-2 size-3.5" />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              column.toggleSorting(true);
            }}
          >
            <ArrowDownIcon className="text-muted-foreground/70 mr-2 size-3.5" />
            Desc
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              column.toggleVisibility(false);
            }}
          >
            <EyeOffIcon className="text-muted-foreground/70 mr-2 size-3.5" />
            Hide
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
