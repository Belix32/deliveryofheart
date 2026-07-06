export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | null | undefined;
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCsvCell(c.header)).join(",");
  const lines = rows.map((row) =>
    columns
      .map((c) => {
        const raw = c.value(row);
        const str = raw === null || raw === undefined ? "" : String(raw);
        return escapeCsvCell(str);
      })
      .join(",")
  );
  return [header, ...lines].join("\n");
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
