import { Temporal } from '@js-temporal/polyfill';
import Papa from 'papaparse';
import { toast } from 'react-hot-toast';
import { MdCloudDownload } from 'react-icons/md';

import { useNavigatorOnLine } from '../state/useNavigatorOnLine';

import { Button } from './form/Button';
const TOAST_ID = 'download-toast';

export const ExportExpensesButtonGroup = <TData, TOutput>({
  id,
  name,
  fetch,
  mapItem,
}: {
  id: string;
  name: string;
  fetch: () => Promise<TData[]>;
  mapItem: (data: TData) => TOutput;
}) => {
  const onLine = useNavigatorOnLine();

  const handleRequestDownload = async (type: 'json' | 'csv') => {
    await toast.promise(
      fetch(),
      {
        loading: 'Preparing download...',
        success: (data) => {
          const mapped = data.map((item) => mapItem(item));

          const blob =
            type === 'json'
              ? new Blob([JSON.stringify(mapped, null, 2)], {
                  type: 'application/json',
                })
              : new Blob([Papa.unparse(mapped)], { type: 'text/csv' });

          const objectURL = URL.createObjectURL(blob);

          const filename = `${id}-${name
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
      <Button
        className="btn-primary btn-outline join-item flex-grow"
        onClick={() => {
          void handleRequestDownload('json');
        }}
        disabled={!onLine}
      >
        <MdCloudDownload /> Export Expenses (.json)
      </Button>
      <Button
        className="btn-primary btn-outline join-item flex-grow"
        onClick={() => {
          void handleRequestDownload('csv');
        }}
        disabled={!onLine}
      >
        <MdCloudDownload /> Export Expenses (.csv)
      </Button>
    </div>
  );
};
