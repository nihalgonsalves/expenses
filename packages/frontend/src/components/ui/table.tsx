import * as React from "react";

import { cn, twx } from "./utils";

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
));
Table.displayName = "Table";

const TableHeader = twx.thead`[&_tr]:border-b`;
TableHeader.displayName = "TableHeader";

const TableBody = twx.tbody`[&_tr:last-child]:border-0`;
TableBody.displayName = "TableBody";

const TableFooter = twx.tfoot`border-t bg-muted/50 font-medium [&>tr]:last:border-b-0`;
TableFooter.displayName = "TableFooter";

const TableRow = twx.tr`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted`;
TableRow.displayName = "TableRow";

const TableHead = twx.th`h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]`;
TableHead.displayName = "TableHead";

const TableCell = twx.td`p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]`;
TableCell.displayName = "TableCell";

const TableCaption = twx.caption`mt-4 text-sm text-muted-foreground`;
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
