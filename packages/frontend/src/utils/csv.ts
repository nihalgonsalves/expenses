import Papa from "papaparse";

export const unparseCsv = (
  data: Record<string, unknown>[],
  columns?: readonly string[],
) =>
  Papa.unparse(data, {
    columns: columns ? [...columns] : undefined,
    escapeFormulae: /^(?![+-]?\d+(?:\.\d+)?$)[=+\-@\t\r]/,
  });
