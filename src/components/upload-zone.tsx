import { useCallback, useState } from "react";
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import { parseFile } from "@/lib/parse-file";
import { profileDataset } from "@/lib/eda";
import { useDataset } from "@/lib/data-store";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export function UploadZone({ compact = false }: { compact?: boolean }) {
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const setDataset = useDataset((s) => s.setDataset);
  const navigate = useNavigate();

  const handleFile = useCallback(
    async (file: File) => {
      setLoading(true);
      try {
        const rows = await parseFile(file);
        if (!rows.length) throw new Error("The file appears empty.");
        const profile = profileDataset(rows);
        setDataset(file.name, rows, profile);
        toast.success(`Analyzed ${rows.length.toLocaleString()} rows`);
        navigate({ to: "/analyze" });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to parse file");
      } finally {
        setLoading(false);
      }
    },
    [setDataset, navigate],
  );

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) void handleFile(f);
      }}
      className={`glass group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-10 text-center transition-all hover:border-primary/50 hover:glow ${
        dragOver ? "border-primary/70 glow" : ""
      } ${compact ? "p-6" : "p-14"}`}
    >
      <input
        type="file"
        accept=".csv,.tsv,.txt,.xlsx,.xls"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
      </div>
      <div className="text-lg font-semibold">
        {loading ? "Analyzing your dataset…" : "Drop a CSV or Excel file"}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">
        We auto-detect types, clean data, and generate dashboards.
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <FileSpreadsheet className="h-3.5 w-3.5" />
        .csv .xlsx .xls — up to a few million cells
      </div>
    </label>
  );
}
