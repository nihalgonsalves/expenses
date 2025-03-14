import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
} from "@radix-ui/react-icons";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { parse as dateFnsParse } from "date-fns";
import Papa from "papaparse";
import { useId, useState } from "react";
import { z } from "zod";

import type { Sheet } from "@nihalgonsalves/expenses-shared/types/sheet";
import type { CreateSheetTransactionInput } from "@nihalgonsalves/expenses-shared/types/transaction";

import { useTRPC } from "../../api/trpc";
import { formatCurrency } from "../../utils/money";
import { dateToISOString } from "../../utils/temporal";
import { noop } from "../../utils/utils";
import { Select, type SelectOption } from "../form/Select";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "../ui/tooltip";

const ImportStep = {
  UPLOAD_FILE: "UPLOAD_FILE",
  CHOOSE_COLUMNS: "CHOOSE_COLUMNS",
} as const;

type ImportStep = (typeof ImportStep)[keyof typeof ImportStep];

const fieldMatchers = {
  amount: /(amount|price|cost|money)/i,
  date: /(date|time)/i,
  category: /(category|type)/i,
  description: /(description|note)/i,
};

const CategoryId = {
  Groceries: "groceries",
  Restaurants: "restaurants",
  Bars: "bars",
  Entertainment: "entertainment",
  Cinema: "cinema",
  Shopping: "shopping",
  Travel: "travel",
  Transportation: "transportation",
  Hobbies: "hobbies",
  Home: "home",
  Rent: "rent",
  Utilities: "utilities",
  Other: "other",
  Transfer: "transfer",
  Income: "income",
} as const;

type CategoryId = (typeof CategoryId)[keyof typeof CategoryId];

const categoryMatchers: [CategoryId, RegExp][] = [
  [CategoryId.Groceries, /(groceries)/i],
  [CategoryId.Restaurants, /(restaurants|eating|dining)/i],
  [CategoryId.Bars, /(drink|bar)/i],
  [CategoryId.Entertainment, /(entertainment)/i],
  [CategoryId.Cinema, /(cinema|theater|theatre)/i],
  [CategoryId.Shopping, /(shopping)/i],
  [CategoryId.Travel, /(travel)/i],
  [
    CategoryId.Transportation,
    /(transport|commute|transit|bicycle|bike|car|fuel|gas)/i,
  ],
  [CategoryId.Hobbies, /(hobby|hobbies)/i],
  [CategoryId.Home, /(home)/i],
  [CategoryId.Rent, /(rent)/i],
  [CategoryId.Utilities, /(utilities|electric|internet|water|power|phone)/i],
  [CategoryId.Income, /(income|salary)/i],
  [CategoryId.Other, /.*/i],
];

const findCategory = (value: string | undefined) =>
  value
    ? (categoryMatchers.find(([, matcher]) => matcher.test(value))?.[0] ??
      CategoryId.Other)
    : CategoryId.Other;

const ZAmountFormat = z.enum([
  "decimal-dot",
  "decimal-comma",
  "decimal-dot-inverse",
  "decimal-comma-inverse",
]);

type AmountFormat = z.infer<typeof ZAmountFormat>;
const amountFormatOptions: SelectOption<typeof ZAmountFormat>[] = [
  {
    value: "decimal-dot",
    label: "Decimal, dot (1,000.50), expenses negative.",
  },
  {
    value: "decimal-dot-inverse",
    label: "Decimal, dot (1,000.50), expenses positive.",
  },
  {
    value: "decimal-comma",
    label: "Decimal, comma (1.000,50), expenses negative.",
  },
  {
    value: "decimal-comma-inverse",
    label: "Decimal, comma (1.000,50), expenses positive.",
  },
];

// Most currencies have 2 decimal places, some have 3.
// Let's allow up to 4 decimal places to be safe.
const MAX_PRECISION = 4;

const parseAmount = (value: string, amountFormat: AmountFormat) => {
  const cleaner =
    amountFormat === "decimal-dot" || amountFormat === "decimal-dot-inverse"
      ? /[^0-9.-]/g
      : /[^0-9,-]/g;
  const valueInt = parseFloat(value.replace(cleaner, ""));

  if (Number.isNaN(valueInt)) {
    throw new Error(`Unable to parse amount ${value}`);
  }

  // unsure if this could actually be a non-string
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-template-expression
  const scale = Math.min(`${value}`.split(".")[1]?.length ?? 0, MAX_PRECISION);

  const amount = Math.round(valueInt * Math.pow(10, scale));
  const normalizedAmount =
    amountFormat === "decimal-dot-inverse" ||
    amountFormat === "decimal-comma-inverse"
      ? -amount
      : amount;

  return { amount: normalizedAmount, scale };
};

const SafeDisplay = ({
  value,
  formatter,
}: {
  value: string | undefined;
  formatter: (value: string) => string;
}) => {
  try {
    return (
      <div className="flex flex-col">
        <span>{value ? formatter(value) : "–"}</span>
        <span className="text-gray-500">{value}</span>
      </div>
    );
  } catch (e) {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <ExclamationTriangleIcon />
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{`${
              e instanceof Error ? e.message : "Unknown Error"
            } (${value})`}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
};
const unsetFieldOption = { value: undefined, label: "–" };

const DataPreview = ({
  data,
  amountField,
  amountParser,
  dateField,
  dateParser,
  categoryField,
  descriptionField,
  currencyCode,
}: {
  data: Record<string, string>[];
  amountField: string | undefined;
  amountParser: (value: string) => { amount: number; scale: number };
  dateField: string | undefined;
  dateParser: (value: string) => Date;
  categoryField: string | undefined;
  descriptionField: string | undefined;
  currencyCode: string;
}) => {
  const [page, setPage] = useState(0);
  const maxPage = Math.floor(data.length / 10);

  const rows = data.slice(page * 10, (page + 1) * 10);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row["id"]}>
              <TableCell className="tabular-nums">
                {amountField ? (
                  <SafeDisplay
                    value={row[amountField]}
                    formatter={(v) =>
                      formatCurrency({
                        ...amountParser(v),
                        currencyCode,
                      })
                    }
                  />
                ) : (
                  "–"
                )}
              </TableCell>
              <TableCell>
                {dateField ? (
                  <SafeDisplay
                    value={row[dateField]}
                    formatter={(v) => dateToISOString(dateParser(v))}
                  />
                ) : (
                  "– set to today –"
                )}
              </TableCell>
              <TableCell>
                {categoryField ? (
                  <SafeDisplay
                    value={row[categoryField]}
                    formatter={findCategory}
                  />
                ) : (
                  "– set to other –"
                )}
              </TableCell>
              <TableCell>
                {descriptionField ? row[descriptionField] : "–"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="bg-muted flex flex-row place-items-center justify-between">
        <Button
          $variant="ghost"
          disabled={page === 0}
          onClick={() => {
            setPage((prev) => prev - 1);
          }}
        >
          <ArrowLeftIcon />
        </Button>
        <div className="text-muted-foreground text-sm">
          Page {page + 1} of {maxPage + 1}
        </div>
        <Button
          $variant="ghost"
          disabled={page === maxPage}
          onClick={() => {
            setPage((prev) => prev + 1);
          }}
        >
          <ArrowRightIcon />
        </Button>
      </div>
    </>
  );
};

export const PersonalTransactionsImporter = ({
  personalSheet,
}: {
  personalSheet: Sheet;
}) => {
  const navigate = useNavigate();

  const { trpc, invalidate } = useTRPC();
  const { mutateAsync: batchCreatePersonalSheetTransactions } = useMutation(
    trpc.transaction.batchCreatePersonalSheetTransactions.mutationOptions(),
  );

  const [headers, setHeaders] = useState<string[]>();
  const [data, setData] = useState<Record<string, string>[]>();
  const [csvError, setCsvError] = useState("");

  const [amountField, setAmountField] = useState<string>();
  const [amountFormat, setAmountFormat] = useState<AmountFormat>("decimal-dot");
  const amountParser = (value: string) => parseAmount(value, amountFormat);

  const [dateField, setDateField] = useState<string>();
  const [dateFormat, setDateFormat] = useState("yyyy-MM-dd");
  const dateParser = (value: string) =>
    dateFnsParse(value, dateFormat, new Date());

  const [categoryField, setCategoryField] = useState<string>();
  const [descriptionField, setDescriptionField] = useState<string>();

  const [activeStep, setActiveStep] = useState<ImportStep>(
    ImportStep.UPLOAD_FILE,
  );

  const fileId = useId();

  const validRows =
    data && amountField
      ? data.flatMap((row): CreateSheetTransactionInput | [] => {
          try {
            const amountValue = row[amountField];
            const dateValue = dateField ? row[dateField] : undefined;
            const categoryValue = categoryField
              ? row[categoryField]
              : undefined;
            const descriptionValue = descriptionField
              ? row[descriptionField]
              : undefined;

            if (!amountValue) {
              throw new Error("Missing amount");
            }

            const { amount, scale } = amountParser(amountValue);

            return {
              type: amount < 0 ? "EXPENSE" : "INCOME",
              money: {
                amount: Math.abs(amount),
                scale,
                currencyCode: personalSheet.currencyCode,
              },
              spentAt: dateToISOString(
                dateValue ? dateParser(dateValue) : new Date(),
              ),
              category: findCategory(categoryValue),
              description: descriptionValue ?? "",
            };
          } catch {
            return [];
          }
        })
      : [];

  const handleCreate = async () => {
    if (validRows.length === 0) {
      return;
    }

    await batchCreatePersonalSheetTransactions({
      personalSheetId: personalSheet.id,
      transactions: validRows,
    });

    await invalidate(
      trpc.transaction.getPersonalSheetTransactions.queryKey({
        personalSheetId: personalSheet.id,
      }),
    );

    await navigate({
      to: "/sheets/$sheetId",
      params: { sheetId: personalSheet.id },
    });
  };

  const fieldOptions = [
    unsetFieldOption,
    ...(headers?.map((header) => ({ value: header, label: header })) ?? []),
  ];

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    Papa.parse(file, {
      header: true,
      transformHeader: (header) => header.toLowerCase().trim(),
      complete: ({ data: papaData, errors, meta }) => {
        if (errors.length > 0) {
          setCsvError(errors[0]?.message ?? "Unknown error");
          return;
        }

        const zodResult = z.array(z.record(z.string())).safeParse(papaData);

        if (!zodResult.success) {
          setCsvError(zodResult.error.message);
          return;
        }

        setAmountField(
          meta.fields?.find(
            (field) => fieldMatchers.amount.exec(field) != null,
          ),
        );
        setDateField(
          meta.fields?.find((field) => fieldMatchers.date.exec(field) != null),
        );
        setCategoryField(
          meta.fields?.find(
            (field) => fieldMatchers.category.exec(field) != null,
          ),
        );
        setDescriptionField(
          meta.fields?.find(
            (field) => fieldMatchers.description.exec(field) != null,
          ),
        );

        setHeaders(meta.fields);
        setData(
          zodResult.data.map((row, i) => ({
            // needed for muix data grid
            id: i.toFixed(0),
            ...row,
          })),
        );
        setActiveStep(ImportStep.CHOOSE_COLUMNS);
      },
    });
  };

  return (
    <div>
      {activeStep === ImportStep.UPLOAD_FILE && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Upload File</h2>
          {csvError ? (
            <Alert $variant="destructive">
              <AlertTitle>CSV Error</AlertTitle>
              <AlertDescription>{csvError}</AlertDescription>
            </Alert>
          ) : null}
          <Label htmlFor={fileId}>
            Select a CSV file to import transactions from
          </Label>
          <Input id={fileId} type="file" onChange={handleFileChange} />
        </div>
      )}
      {activeStep === ImportStep.CHOOSE_COLUMNS && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Choose Columns</h2>
          Map columns to transaction fields
          <div className="grid grid-cols-1 items-center gap-[1rem] md:grid-cols-2">
            <Label className="flex flex-col gap-2">
              Amount
              <Select
                name="amount-field"
                onBlur={noop}
                placeholder="Amount field"
                options={fieldOptions}
                value={amountField}
                onChange={setAmountField}
                schema={z.string()}
              />
            </Label>
            <Label className="flex flex-col gap-2">
              Amount format
              <Select
                name="amount-format"
                onBlur={noop}
                placeholder="Amount format"
                options={amountFormatOptions}
                value={amountFormat}
                onChange={setAmountFormat}
                schema={ZAmountFormat}
              />
            </Label>

            <Label className="flex flex-col gap-2">
              Date field
              <Select
                name="date-field"
                onBlur={noop}
                placeholder="Date field"
                options={fieldOptions}
                value={dateField}
                onChange={setDateField}
                schema={z.string()}
              />
            </Label>

            <Label className="flex flex-col gap-2">
              <span className="flex justify-between">
                <span>Date format</span>
                <span>
                  (
                  <a
                    href="https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table"
                    target="_blank"
                    className="underline hover:no-underline"
                    rel="noopener noreferrer"
                  >
                    Help
                  </a>
                  )
                </span>
              </span>
              <Input
                value={dateFormat}
                onChange={(e) => {
                  setDateFormat(e.target.value);
                }}
              />
            </Label>

            <Label className="flex flex-col gap-2">
              Category field
              <Select
                name="category-field"
                onBlur={noop}
                placeholder="Category field"
                options={fieldOptions}
                value={categoryField}
                onChange={setCategoryField}
                schema={z.string()}
              />
            </Label>

            <span />

            <Label className="flex flex-col gap-2">
              Description field
              <Select
                name="description-field"
                onBlur={noop}
                placeholder="Description field"
                options={fieldOptions}
                value={descriptionField}
                onChange={setDescriptionField}
                schema={z.string()}
              />
            </Label>

            <span />
          </div>
          {data ? (
            <DataPreview
              data={data}
              amountField={amountField}
              amountParser={amountParser}
              dateField={dateField}
              dateParser={dateParser}
              categoryField={categoryField}
              descriptionField={descriptionField}
              currencyCode={personalSheet.currencyCode}
            />
          ) : null}
          <div className="flex gap-4">
            <Button
              className="grow"
              $variant="outline"
              onClick={() => {
                setActiveStep(ImportStep.UPLOAD_FILE);
              }}
            >
              Back
            </Button>
            <Button
              className="grow"
              disabled={!amountField}
              onClick={handleCreate}
            >
              Import all valid rows ({validRows.length} of {data?.length})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
