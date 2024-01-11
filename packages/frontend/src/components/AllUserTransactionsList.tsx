import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import { CalendarIcon, MixerHorizontalIcon } from "@radix-ui/react-icons";
import { motion, AnimatePresence } from "framer-motion";
import { Fragment, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";

import { sumMoney, type Money } from "@nihalgonsalves/expenses-shared/money";
import type { Sheet } from "@nihalgonsalves/expenses-shared/types/sheet";
import type { TransactionListItem } from "@nihalgonsalves/expenses-shared/types/transaction";

import type { AllConvertedUserTransactions } from "../api/useAllUserTransactions";
import { usePreferredCurrencyCode } from "../state/preferences";
import { fadeInOut } from "../utils/framer";
import { formatCurrency } from "../utils/money";
import {
  formatDateTimeRelative,
  groupBySpentAt,
  shortDateFormatter,
} from "../utils/temporal";
import { getTransactionDescription, noop } from "../utils/utils";

import { CategoryAvatar } from "./CategoryAvatar";
import { CurrencySpan } from "./CurrencySpan";
import { CategorySelect } from "./form/CategorySelect";
import { SheetSelect } from "./form/SheetSelect";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";

const MotionTableRow = motion(TableRow);

const TransactionRow = ({
  transaction,
  sheet,
}: {
  transaction: TransactionListItem & { convertedMoney: Money | undefined };
  sheet: Sheet;
}) => {
  const money = formatCurrency(transaction.money, {
    signDisplay: transaction.type === "TRANSFER" ? "never" : "always",
  });
  const convertedMoney = transaction.convertedMoney
    ? formatCurrency(transaction.convertedMoney, {
        signDisplay: transaction.type === "TRANSFER" ? "never" : "always",
      })
    : undefined;

  const description = getTransactionDescription(transaction);
  const dateTime = formatDateTimeRelative(transaction.spentAt);

  return (
    <MotionTableRow key={transaction.id} {...fadeInOut}>
      <TableCell>
        <div className="flex items-center gap-4">
          <CategoryAvatar category={transaction.category} />
        </div>
      </TableCell>

      <TableCell className="hidden sm:table-cell">
        <strong>{description}</strong>
      </TableCell>
      <TableCell className="hidden sm:table-cell">{dateTime}</TableCell>

      <TableCell className="sm:hidden">
        <strong>{description}</strong>
        <br />
        <em>{dateTime}</em>
        <br />
        {sheet.name}
      </TableCell>

      <TableCell className="text-right tabular-nums">
        {convertedMoney == undefined || convertedMoney === money ? (
          <span>{money}</span>
        ) : (
          <>
            {convertedMoney}
            <br />
            <span className="text-gray-300">{money}</span>
          </>
        )}
      </TableCell>
      <TableCell className="hidden sm:table-cell">{sheet.name}</TableCell>
    </MotionTableRow>
  );
};

const MotionTable = motion(Table);
const MotionTableHeader = motion(TableHeader);

export const AllUserTransactionsList = ({
  data,
  dateRange,
  setDateRange,
  category,
  setCategory,
  sheetId,
  setSheetId,
}: {
  data: AllConvertedUserTransactions;
  dateRange: DateRange | undefined;
  setDateRange: (dateRange: DateRange | undefined) => void;
  category: string | undefined;
  setCategory: (category: string | undefined) => void;
  sheetId: string | undefined;
  setSheetId: (sheetId: string | undefined) => void;
}) => {
  const [preferredCurrencyCode] = usePreferredCurrencyCode();

  const [selectedView, setSelectedView] = useState<"EXPENSES" | "INCOME">(
    "EXPENSES",
  );

  const totalSpent = sumMoney(
    data.expenses
      .map(({ transaction }) => transaction.convertedMoney)
      .filter((x): x is NonNullable<typeof x> => x != null),
    preferredCurrencyCode,
  );

  const totalEarned = sumMoney(
    data.earnings
      .map(({ transaction }) => transaction.convertedMoney)
      .filter((x): x is NonNullable<typeof x> => x != null),
    preferredCurrencyCode,
  );

  const groupedByDate = useMemo(
    () =>
      groupBySpentAt(
        selectedView === "EXPENSES" ? data.expenses : data.earnings,
        ({ transaction }) => transaction.spentAt,
      ),
    [selectedView, data.expenses, data.earnings],
  );

  return (
    <>
      <div className="flex flex-col gap-4 p-2 lg:mb-2">
        <Collapsible defaultOpen className="flex flex-col gap-2 lg:flex-row">
          <CollapsibleContent className="flex flex-col gap-2 lg:flex-row">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  $variant="outline"
                  className="bg-card justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {dateRange?.from && dateRange.to ? (
                    <>
                      {shortDateFormatter.format(dateRange.from)} -{" "}
                      {shortDateFormatter.format(dateRange.to)}
                    </>
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                />
              </PopoverContent>
            </Popover>

            <SheetSelect
              name="sheet"
              className="bg-card w-full lg:w-48"
              placeholder="All sheets"
              onBlur={noop}
              value={sheetId}
              onChange={setSheetId}
            />

            <CategorySelect
              name="category"
              onBlur={noop}
              value={category}
              onChange={setCategory}
              placeholder="All categories"
              className="bg-card lg:max-w-48"
              allowCreate={false}
            />
          </CollapsibleContent>

          <div className="hidden grow lg:block">&nbsp;</div>

          <Tabs value={selectedView} className="flex gap-2">
            <TabsList className="grid w-full grid-cols-2 lg:w-auto">
              <TabsTrigger
                value="EXPENSES"
                onClick={() => {
                  setSelectedView("EXPENSES");
                }}
              >
                Expenses (<CurrencySpan money={totalSpent} />)
              </TabsTrigger>
              <TabsTrigger
                value="INCOME"
                onClick={() => {
                  setSelectedView("INCOME");
                }}
              >
                Income (<CurrencySpan money={totalEarned} />)
              </TabsTrigger>
            </TabsList>

            <CollapsibleTrigger className="md:hidden" asChild>
              <Button $size="icon" $variant="outline">
                <MixerHorizontalIcon />
              </Button>
            </CollapsibleTrigger>
          </Tabs>
        </Collapsible>
      </div>

      {data.expenses.length === 0 && (
        <Alert>
          <AlertDescription>No transactions found</AlertDescription>
        </Alert>
      )}

      <AnimatePresence mode="popLayout" initial={false}>
        <MotionTable key={selectedView} className="p-4" {...fadeInOut}>
          <AnimatePresence mode="popLayout" initial={false}>
            {[...groupedByDate.keys()].map((date) => (
              <Fragment key={date}>
                <MotionTableHeader {...fadeInOut}>
                  <TableRow>
                    <TableHead>Category</TableHead>

                    <TableHead className="hidden sm:table-cell">
                      Description
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Date ({shortDateFormatter.format(date)})
                    </TableHead>

                    <TableHead className="sm:hidden">
                      Details ({shortDateFormatter.format(date)})
                    </TableHead>

                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Sheet
                    </TableHead>
                  </TableRow>
                </MotionTableHeader>
                <TableBody>
                  {groupedByDate
                    .get(date)
                    ?.map(({ transaction, sheet }) => (
                      <TransactionRow
                        key={transaction.id}
                        transaction={transaction}
                        sheet={sheet}
                      />
                    ))}
                </TableBody>
              </Fragment>
            ))}
          </AnimatePresence>
        </MotionTable>
      </AnimatePresence>
    </>
  );
};
