import Papa from "papaparse";
import { toast } from "sonner";

import { Button } from "../components/ui/button";

export const requestExport = async <TData,>(
  sheetId: string,
  sheetName: string,
  type: "json" | "csv",
  fetch: () => Promise<TData[]>,
  mapItem: (data: TData) => Record<string, unknown>,
) => {
  const toastId = `${sheetId}-${type}`;

  const promise = fetch();

  toast.promise(promise, {
    loading: "Preparing download...",
    success: (data: TData[]) => {
      const mapped = data.map((item) => mapItem(item));

      const blob =
        type === "json"
          ? new Blob([JSON.stringify(mapped, null, 2)], {
              type: "application/json",
            })
          : new Blob([Papa.unparse(mapped)], { type: "text/csv" });

      const objectURL = URL.createObjectURL(blob);

      const filename = `${sheetId}-${sheetName
        .replace(/[^\w]/g, "_")
        .toLowerCase()}-${Temporal.Now.instant().epochMilliseconds}.${type}`;

      return {
        message: (
          <Button type="button" $variant="outline" asChild>
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
        ),
        closeButton: true,
        duration: Infinity,
      };
    },
    error: (e: unknown) => ({
      message: `Download failed: ${e instanceof Error ? e.message : "Unknown"}`,
      duration: 5_000,
    }),
    id: toastId,
  });

  await promise;
};
