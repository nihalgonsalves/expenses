import { Temporal } from '@js-temporal/polyfill';
import Papa from 'papaparse';
import { toast } from 'react-hot-toast';
import { MdCancel, MdCloudDownload } from 'react-icons/md';

import { Button } from './form/Button';

export const ExportTransactionsDropdown = <TData, TOutput>({
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
  const handleRequestDownload = async (type: 'json' | 'csv') => {
    const toastId = `${id}-${type}`;

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
            <>
              <a
                className="btn btn-ghost link text-success-content normal-case"
                href={objectURL}
                download={filename}
                onClick={() => {
                  toast.dismiss(toastId);
                }}
              >
                Click to download .{type} file
              </a>
              <Button
                className="btn-ghost"
                onClick={() => {
                  toast.dismiss(toastId);
                }}
              >
                <MdCancel />
              </Button>
            </>
          );
        },
        error: (e: unknown) =>
          `Download failed: ${e instanceof Error ? e.message : 'Unknown'}`,
      },
      {
        id: toastId,
        success: {
          duration: Infinity,
        },
        error: { duration: 5_000 },
      },
    );
  };

  return (
    <>
      <li>
        <a
          onClick={() => {
            void handleRequestDownload('json');
          }}
        >
          <MdCloudDownload /> Export .json
        </a>
      </li>
      <li>
        <a
          onClick={() => {
            void handleRequestDownload('csv');
          }}
        >
          <MdCloudDownload /> Export .csv
        </a>
      </li>
    </>
  );
};
