import Papa from "papaparse";
import * as XLSX from "xlsx";

export async function parseFile(file: File): Promise<Record<string, unknown>[]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv") || name.endsWith(".tsv") || name.endsWith(".txt")) {
    const text = await file.text();
    const res = Papa.parse<Record<string, unknown>>(text, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: "greedy",
    });
    return (res.data ?? []).filter((r) => r && Object.keys(r).length > 0);
  }
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array", cellDates: true });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
  }
  throw new Error("Unsupported file type. Please upload a CSV, XLS, or XLSX file.");
}
