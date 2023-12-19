import { parse as dateFnsParse } from 'date-fns';
import Papa from 'papaparse';
import { useCallback, useMemo, useState } from 'react';
import { MdWarning } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import type { Sheet } from '@nihalgonsalves/expenses-shared/types/sheet';
import type { CreateSheetTransactionInput } from '@nihalgonsalves/expenses-shared/types/transaction';

import { trpc } from '../../api/trpc';
import { CategoryId } from '../../data/categories';
import { formatCurrency } from '../../utils/money';
import { dateToISOString } from '../../utils/utils';
import { Button } from '../form/Button';
import { Select, type SelectOption } from '../form/Select';
import { TextField } from '../form/TextField';

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
    ? categoryMatchers.find(([, matcher]) => matcher.test(value))?.[0] ??
      CategoryId.Other
    : CategoryId.Other;

const ZAmountFormat = z.enum([
  'decimal-dot',
  'decimal-comma',
  'decimal-dot-inverse',
  'decimal-comma-inverse',
]);

type AmountFormat = z.infer<typeof ZAmountFormat>;
const amountFormatOptions: SelectOption<typeof ZAmountFormat>[] = [
  {
    value: 'decimal-dot',
    label: 'Decimal, dot (1,000.50), expenses negative.',
  },
  {
    value: 'decimal-dot-inverse',
    label: 'Decimal, dot (1,000.50), expenses positive.',
  },
  {
    value: 'decimal-comma',
    label: 'Decimal, comma (1.000,50), expenses negative.',
  },
  {
    value: 'decimal-comma-inverse',
    label: 'Decimal, comma (1.000,50), expenses positive.',
  },
];

// Most currencies have 2 decimal places, some have 3.
// Let's allow up to 4 decimal places to be safe.
const MAX_PRECISION = 4;

const parseAmount = (value: string, amountFormat: AmountFormat) => {
  const cleaner =
    amountFormat === 'decimal-dot' || amountFormat === 'decimal-dot-inverse'
      ? /[^0-9.-]/g
      : /[^0-9,-]/g;
  const valueInt = parseFloat(value.replace(cleaner, ''));

  if (Number.isNaN(valueInt)) {
    throw new Error(`Unable to parse amount ${value}`);
  }

  // unsure if this could actuall be a non-string
  // eslint-disable-next-line @typescript-eslint/no-useless-template-literals
  const scale = Math.min(`${value}`.split('.')[1]?.length ?? 0, MAX_PRECISION);

  const amount = Math.round(valueInt * Math.pow(10, scale));
  const normalizedAmount =
    amountFormat === 'decimal-dot-inverse' ||
    amountFormat === 'decimal-comma-inverse'
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
        <span>{value ? formatter(value) : '–'}</span>
        <span className="text-gray-500">{value}</span>
      </div>
    );
  } catch (e) {
    return (
      <div
        className="tooltip"
        data-tip={`${
          e instanceof Error ? e.message : 'Unknown Error'
        } (${value})`}
      >
        <Button className="btn-circle btn-ghost">
          <MdWarning />
        </Button>
      </div>
    );
  }
};
const unsetFieldOption = { value: '', label: '–' };

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

  const rows = useMemo(
    () => data.slice(page * 10, (page + 1) * 10),
    [data, page],
  );

  return (
    <>
      <table className="table">
        <thead>
          <tr>
            <th>Amount</th>
            <th>Date</th>
            <th>Category</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row['id']}>
              <td>
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
                  '–'
                )}
              </td>
              <td>
                {dateField ? (
                  <SafeDisplay
                    value={row[dateField]}
                    formatter={(v) => dateToISOString(dateParser(v))}
                  />
                ) : (
                  '– set to today –'
                )}
              </td>
              <td>
                {categoryField ? (
                  <SafeDisplay
                    value={row[categoryField]}
                    formatter={findCategory}
                  />
                ) : (
                  '– set to other –'
                )}
              </td>
              <td>{descriptionField ? row[descriptionField] : '–'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="join">
        <Button
          className="join-item"
          disabled={page === 0}
          onClick={() => {
            setPage((prev) => prev - 1);
          }}
        >
          «
        </Button>
        <Button className="join-item flex-grow">
          Page {page + 1} of {maxPage + 1}
        </Button>
        <Button
          className="join-item"
          disabled={page === maxPage}
          onClick={() => {
            setPage((prev) => prev + 1);
          }}
        >
          »
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

  const utils = trpc.useUtils();
  const { mutateAsync: batchCreatePersonalSheetTransactions } =
    trpc.transaction.batchCreatePersonalSheetTransactions.useMutation();

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
                throw new Error('Missing amount');
              }

              const { amount, scale } = amountParser(amountValue);

              return {
                type: amount < 0 ? 'EXPENSE' : 'INCOME',
                money: {
                  amount: Math.abs(amount),
                  scale,
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

    await batchCreatePersonalSheetTransactions({
      personalSheetId: personalSheet.id,
      transactions: validRows,
    });

    await utils.transaction.getPersonalSheetTransactions.invalidate({
      personalSheetId: personalSheet.id,
    });

    navigate(`/sheets/${personalSheet.id}`);
  };

  const fieldOptions = useMemo(
    () => [
      unsetFieldOption,
      ...(headers?.map((header) => ({ value: header, label: header })) ?? []),
    ],
    [headers],
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
            meta.fields?.find((field) => fieldMatchers.amount.exec(field)),
          );
          setDateField(
            meta.fields?.find((field) => fieldMatchers.date.exec(field)),
          );
          setCategoryField(
            meta.fields?.find((field) => fieldMatchers.category.exec(field)),
          );
          setDescriptionField(
            meta.fields?.find((field) => fieldMatchers.description.exec(field)),
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
    <div>
      {activeStep === ImportStep.UPLOAD_FILE && (
        <div className="flex flex-col gap-4">
          <h2 className="semibold text-xl">Upload File</h2>
          {csvError && <div className="alert alert-warning">{csvError}</div>}
          Select a CSV file to import transactions from
          <label className="btn btn-primary">
            Choose file
            <input type="file" onChange={handleFileChange} hidden />
          </label>
        </div>
      )}
      {activeStep === ImportStep.CHOOSE_COLUMNS && (
        <div className="flex flex-col gap-4">
          <h2 className="semibold text-xl">Choose Columns</h2>
          Map columns to transaction fields
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
              labelAlt={
                <a
                  className="link"
                  href="https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Help
                </a>
              }
              value={dateFormat}
              setValue={setDateFormat}
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
          )}
          <div className="join join-vertical md:join-horizontal">
            <Button
              className="btn-outline join-item flex-grow"
              onClick={() => {
                setActiveStep(ImportStep.UPLOAD_FILE);
              }}
            >
              Back
            </Button>
            <Button
              className="btn-primary join-item flex-grow"
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
