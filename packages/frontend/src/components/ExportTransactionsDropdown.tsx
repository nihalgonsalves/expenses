import { Temporal } from '@js-temporal/polyfill';
import { CircleBackslashIcon, DownloadIcon } from '@radix-ui/react-icons';
import Papa from 'papaparse';
import { toast } from 'react-hot-toast';

import { Button } from './ui/button';
import { DropdownMenuItem } from './ui/dropdown-menu';

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
              <Button $variant="ghost" asChild>
                <a
                  href={objectURL}
                  download={filename}
                  onClick={() => {
                    toast.dismiss(toastId);
                  }}
                >
                  Click to download .{type} file
                </a>
              </Button>
              <Button
                $variant="outline"
                onClick={() => {
                  toast.dismiss(toastId);
                }}
              >
                <CircleBackslashIcon />
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
      <DropdownMenuItem
        onSelect={() => {
          void handleRequestDownload('json');
        }}
      >
        <DownloadIcon className="mr-2" /> Export .json
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={() => {
          void handleRequestDownload('csv');
        }}
      >
        <DownloadIcon className="mr-2" /> Export .csv
      </DropdownMenuItem>
    </>
  );
};
