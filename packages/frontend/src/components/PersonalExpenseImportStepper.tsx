import { Warning } from '@mui/icons-material';
import {
  Alert,
  Button,
  Stack,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { parse as dateFnsParse } from 'date-fns';
import Papa from 'papaparse';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import {
  type CreateSheetExpenseInput,
  type Sheet,
} from '@nihalgonsalves/expenses-backend';

import { trpc } from '../api/trpc';
import { CategoryId } from '../data/categories';
import { formatCurrency } from '../utils/money';
import { dateToISOString } from '../utils/utils';

import { Select } from './Select';

enum ImportStep {
  UPLOAD_FILE,
  CHOOSE_COLUMNS,
}

const fieldMatchers = {
  amount: /(amount|price|cost|money)/i,
  date: /(date|time)/i,
  category: /(category|type)/i,
  description: /(description|note)/i,
};

const categoryMatchers: [CategoryId, RegExp][] = [
  [CategoryId.Groceries, /(groceries)/i],
  [CategoryId.Restauraunts, /(restaurants|eating|dining)/i],
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
  [CategoryId.Other, /.*/i],
];

const findCategory = (value: string | undefined) =>
  value
    ? categoryMatchers.find(([, matcher]) => matcher.test(value))?.[0] ??
      CategoryId.Other
    : CategoryId.Other;

const ZAmountFormat = z.union([
  z.literal('decimal-dot'),
  z.literal('decimal-comma'),
]);

type AmountFormat = z.infer<typeof ZAmountFormat>;
const amountFormatOptions: {
  value: AmountFormat;
  display: string;
}[] = [
  { value: 'decimal-dot', display: 'Decimal, dot (1,000.50)' },
  { value: 'decimal-comma', display: 'Decimal, comma (1.000,50)' },
];

// Most currencies have 2 decimal places, some have 3.
// Let's allow up to 4 decimal places to be safe.
const MAX_PRECISION = 4;

const parseAmount = (value: string, amountFormat: AmountFormat) => {
  const cleaner = amountFormat === 'decimal-dot' ? /[^0-9.]/g : /[^0-9,]/g;
  const valueInt = parseFloat(value.replace(cleaner, ''));

  if (Number.isNaN(valueInt)) {
    throw new Error(`Unable to parse amount ${value}`);
  }

  const scale = Math.min(`${value}`.split('.')[1]?.length ?? 0, MAX_PRECISION);

  const amount = Math.round(Math.abs(valueInt) * Math.pow(10, scale));

  return { amount, scale };
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
      <Stack>
        <span>{value ? formatter(value) : '–'}</span>
        <Typography color="text.secondary" variant="body2">
          {value}
        </Typography>
      </Stack>
    );
  } catch (e) {
    return (
      <Tooltip
        title={`${e instanceof Error ? e.message : 'Unknown Error'} (${value})`}
      >
        <Warning />
      </Tooltip>
    );
  }
};
const unsetFieldOption = { value: '', display: '–' };

export const PersonalExpenseImportStepper = ({
  personalSheet,
}: {
  personalSheet: Sheet;
}) => {
  const navigate = useNavigate();

  const utils = trpc.useContext();
  const { mutateAsync: batchCreatePersonalSheetExpenses, error: createError } =
    trpc.expense.batchCreatePersonalSheetExpenses.useMutation();

  const [headers, setHeaders] = useState<string[]>();
  const [data, setData] = useState<Record<string, string>[]>();
  const [csvError, setCsvError] = useState('');

  const [amountField, setAmountField] = useState<string>();
  const [amountFormat, setAmountFormat] = useState<AmountFormat>('decimal-dot');
  const amountParser = useCallback(
    (value: string) => parseAmount(value, amountFormat),
    [amountFormat],
  );

  const [dateField, setDateField] = useState<string>();
  const [dateFormat, setDateFormat] = useState('yyyy-MM-dd');
  const dateParser = useCallback(
    (value: string) => dateFnsParse(value, dateFormat, new Date()),
    [dateFormat],
  );

  const [categoryField, setCategoryField] = useState<string>();
  const [descriptionField, setDescriptionField] = useState<string>();

  const [activeStep, setActiveStep] = useState(ImportStep.UPLOAD_FILE);

  const validRows = useMemo(
    () =>
      data && amountField
        ? data.flatMap((row): CreateSheetExpenseInput | [] => {
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
                throw new Error('Missing amount');
              }

              return {
                money: {
                  ...amountParser(amountValue),
                  currencyCode: personalSheet.currencyCode,
                },
                spentAt: dateToISOString(
                  dateValue ? dateParser(dateValue) : new Date(),
                ),
                category: findCategory(categoryValue),
                description: descriptionValue ?? '',
              };
            } catch {
              return [];
            }
          })
        : [],
    [
      data,
      personalSheet.currencyCode,
      amountField,
      amountParser,
      dateField,
      dateParser,
      categoryField,
      descriptionField,
    ],
  );

  const handleCreate = async () => {
    if (validRows.length === 0) {
      return;
    }

    await batchCreatePersonalSheetExpenses({
      personalSheetId: personalSheet.id,
      expenses: validRows,
    });

    await utils.expense.getPersonalSheetExpenses.invalidate({
      personalSheetId: personalSheet.id,
    });

    navigate(`/sheets/${personalSheet.id}`);
  };

  const fieldOptions = useMemo(
    () => [
      unsetFieldOption,
      ...(headers?.map((header) => ({ value: header, display: header })) ?? []),
    ],
    [headers],
  );

  const columns: GridColDef<Record<string, string>>[] = useMemo(
    () =>
      [
        {
          field: 'amount',
          headerName: 'Amount',
          flex: 1,
          renderCell: ({ row }) =>
            amountField ? (
              <SafeDisplay
                value={row[amountField]}
                formatter={(v) =>
                  formatCurrency({
                    ...amountParser(v),
                    currencyCode: personalSheet.currencyCode,
                  })
                }
              />
            ) : (
              '–'
            ),
        },
        {
          field: 'date',
          headerName: 'Date',
          flex: 2,
          renderCell: ({ row }) =>
            dateField ? (
              <SafeDisplay
                value={row[dateField]}
                formatter={(v) => dateToISOString(dateParser(v))}
              />
            ) : (
              '– set to today –'
            ),
        },
        {
          field: 'category',
          headerName: 'Category',
          flex: 1,
          renderCell: ({ row }) =>
            categoryField ? (
              <SafeDisplay
                value={row[categoryField]}
                formatter={findCategory}
              />
            ) : (
              '– set to other –'
            ),
        },
        {
          field: descriptionField ?? 'description',
          headerName: 'Description',
          flex: 1,
          renderCell: ({ row }) =>
            descriptionField ? row[descriptionField] : '–',
        },
      ] satisfies GridColDef<Record<string, string>>[],
    [
      personalSheet.currencyCode,
      amountField,
      amountParser,
      dateField,
      dateParser,
      categoryField,
      descriptionField,
    ],
  );

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> =
    useCallback((e) => {
      const file = e.target.files?.[0];
      if (!file) {
        return;
      }

      Papa.parse(file, {
        header: true,
        transformHeader: (header) => header.toLowerCase().trim(),
        complete: ({ data: papaData, errors, meta }) => {
          if (errors.length > 0) {
            setCsvError(errors[0]?.message ?? 'Unknown error');
            return;
          }

          const zodResult = z.array(z.record(z.string())).safeParse(papaData);

          if (!zodResult.success) {
            setCsvError(zodResult.error.message);
            return;
          }

          setAmountField(
            meta.fields?.find((field) => field.match(fieldMatchers.amount)),
          );
          setDateField(
            meta.fields?.find((field) => field.match(fieldMatchers.date)),
          );
          setCategoryField(
            meta.fields?.find((field) => field.match(fieldMatchers.category)),
          );
          setDescriptionField(
            meta.fields?.find((field) =>
              field.match(fieldMatchers.description),
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
    }, []);

  return (
    <Stepper activeStep={activeStep} orientation="vertical">
      <Step key={ImportStep.UPLOAD_FILE}>
        <StepLabel>Upload File</StepLabel>
        <StepContent>
          <Stack gap={2}>
            {csvError && <Alert severity="warning">{csvError}</Alert>}

            <Typography variant="body2" color="text.primary">
              Select a CSV file to import expenses from
            </Typography>
            <Button variant="contained" component="label">
              Choose file
              <input type="file" onChange={handleFileChange} hidden />
            </Button>
          </Stack>
        </StepContent>
      </Step>
      <Step key={ImportStep.CHOOSE_COLUMNS}>
        <StepLabel>Choose columns</StepLabel>
        <StepContent>
          <Stack gap={2}>
            <Typography variant="body2" color="text.primary">
              Map columns to expense fields
            </Typography>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                alignItems: 'center',
              }}
            >
              <Select
                label="Amount field"
                options={fieldOptions}
                value={amountField}
                setValue={setAmountField}
                schema={z.string()}
                small
              />
              <Select
                label="Amount format"
                options={amountFormatOptions}
                value={amountFormat}
                setValue={setAmountFormat}
                schema={ZAmountFormat}
                small
              />

              <Select
                label="Date field"
                options={fieldOptions}
                value={dateField}
                setValue={setDateField}
                schema={z.string()}
                small
              />
              <TextField
                label="Date format"
                size="small"
                value={dateFormat}
                onChange={(e) => {
                  setDateFormat(e.target.value);
                }}
              />

              <Select
                label="Category field"
                options={fieldOptions}
                value={categoryField}
                setValue={setCategoryField}
                schema={z.string()}
                small
              />
              <span />

              <Select
                label="Description field"
                options={fieldOptions}
                value={descriptionField}
                setValue={setDescriptionField}
                schema={z.string()}
                small
              />
              <span />
            </div>
            {data && (
              <DataGrid
                rows={data}
                columns={columns}
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 5 },
                  },
                }}
                pageSizeOptions={[5, 10, 100]}
                disableRowSelectionOnClick
                disableColumnFilter
                disableColumnMenu
                disableColumnSelector
              />
            )}

            <Stack gap={1}>
              {createError && (
                <Alert severity="error">{createError.message}</Alert>
              )}
              <Button
                onClick={() => {
                  setActiveStep(ImportStep.UPLOAD_FILE);
                }}
              >
                Back
              </Button>
              <Button
                variant="contained"
                disabled={!amountField}
                onClick={handleCreate}
              >
                Import all valid rows ({validRows.length} of {data?.length})
              </Button>
            </Stack>
          </Stack>
        </StepContent>
      </Step>
    </Stepper>
  );
};
