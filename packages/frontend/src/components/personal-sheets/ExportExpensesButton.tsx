import { Temporal } from '@js-temporal/polyfill';
import Papa from 'papaparse';
import { toast } from 'react-hot-toast';
import { MdCloudDownload } from 'react-icons/md';

import type { Sheet } from '@nihalgonsalves/expenses-backend';

import { trpc } from '../../api/trpc';
import { moneyToString } from '../../utils/money';

const TOAST_ID = 'download-toast';

export const ExportExpensesButtonGroup = ({
  personalSheet,
}: {
  personalSheet: Pick<Sheet, 'id' | 'name'>;
}) => {
  const { refetch } = trpc.expense.getPersonalSheetExpenses.useQuery(
    {
      personalSheetId: personalSheet.id,
    },
    { enabled: false },
  );

  const handleRequestDownload = async (type: 'json' | 'csv') => {
    await toast.promise(
      refetch({ throwOnError: true }),
      {
        loading: 'Preparing download...',
        success: ({ data }) => {
          if (!data) throw new Error();

          const flat = data.expenses.map(
            ({ id, category, description, spentAt, money }) => ({
              id,
              category,
              description,
              spent_at: spentAt,
              currency_code: money.currencyCode,
              amount_decimal: moneyToString(money),
              money_amount: money.amount,
              money_scale: money.scale,
            }),
          );

          const blob =
            type === 'json'
              ? new Blob([JSON.stringify(flat, null, 2)], {
                  type: 'application/json',
                })
              : new Blob([Papa.unparse(flat)], { type: 'text/csv' });

          const objectURL = URL.createObjectURL(blob);

          const filename = `${personalSheet.id}-${personalSheet.name
            .replace(/[^\w]/g, '_')
            .toLowerCase()}-${Temporal.Now.instant().epochSeconds}.${type}`;

          return (
            <a
              className="btn btn-ghost text-success-content normal-case"
              href={objectURL}
              download={filename}
              onClick={() => {
                toast.dismiss(TOAST_ID);
              }}
            >
              Click to download .{type} file
            </a>
          );
        },
        error: (e: unknown) =>
          `Download failed: ${e instanceof Error ? e.message : 'Unknown'}`,
      },
      {
        id: TOAST_ID,
        success: {
          duration: Infinity,
        },
        error: { duration: 5_000 },
      },
    );
  };

  return (
    <div className="join join-vertical md:join-horizontal">
      <button
        type="button"
        className="btn btn-primary btn-outline join-item flex-grow"
        onClick={() => {
          void handleRequestDownload('json');
        }}
      >
        <MdCloudDownload /> Export Expenses (.json)
      </button>
      <button
        type="button"
        className="btn btn-primary btn-outline join-item flex-grow"
        onClick={() => {
          void handleRequestDownload('csv');
        }}
      >
        <MdCloudDownload /> Export Expenses (.csv)
      </button>
    </div>
  );
};
