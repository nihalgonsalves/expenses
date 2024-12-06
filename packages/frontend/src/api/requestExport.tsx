import { CircleBackslashIcon } from "@radix-ui/react-icons";
import Papa from "papaparse";
import toast from "react-hot-toast";

import { Button } from "../components/ui/button";

export const requestExport = async <TData,>(
  sheetId: string,
  sheetName: string,
  type: "json" | "csv",
  fetch: () => Promise<TData[]>,
  mapItem: (data: TData) => Record<string, unknown>,
) => {
  const toastId = `${sheetId}-${type}`;

  await toast.promise(
    fetch(),
    {
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
          .toLowerCase()}-${Temporal.Now.instant().epochSeconds}.${type}`;

        return (
          <>
            <Button type="button" $variant="ghost" asChild>
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
              type="button"
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
        `Download failed: ${e instanceof Error ? e.message : "Unknown"}`,
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
