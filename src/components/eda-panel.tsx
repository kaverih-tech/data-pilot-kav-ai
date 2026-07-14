import { useMemo } from "react";
import { Panel } from "./kpi-card";
import { Heatmap } from "./charts";
import { useDataset } from "@/lib/data-store";
import { correlationMatrix } from "@/lib/eda";
import { AlertTriangle, CheckCircle2, Database, Copy } from "lucide-react";

export function EdaPanel() {
  const { rows, profile } = useDataset();
  const corr = useMemo(
    () => (profile ? correlationMatrix(rows, profile.numericCols) : null),
    [rows, profile],
  );
  if (!profile) return null;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Data Quality" subtitle="Composite score">
          <div className="flex items-baseline gap-2">
            <div className="font-display text-5xl">{profile.qualityScore}</div>
            <div className="text-sm text-muted-foreground">/ 100</div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${profile.qualityScore}%`,
                background: "var(--gradient-primary)",
              }}
            />
          </div>
          <div className="mt-4 space-y-2 text-xs">
            <Row icon={<Database className="h-3.5 w-3.5" />} label="Rows × Cols" value={`${profile.rows.toLocaleString()} × ${profile.cols}`} />
            <Row
              icon={<AlertTriangle className="h-3.5 w-3.5 text-warning" />}
              label="Missing cells"
              value={profile.missingTotal.toLocaleString()}
            />
            <Row
              icon={<Copy className="h-3.5 w-3.5 text-warning" />}
              label="Duplicate rows"
              value={profile.duplicateRows.toLocaleString()}
            />
            <Row
              icon={<CheckCircle2 className="h-3.5 w-3.5 text-success" />}
              label="Detected domain"
              value={profile.domain}
            />
          </div>
        </Panel>

        <Panel
          className="lg:col-span-2"
          title="Correlation Matrix"
          subtitle="Pearson coefficients across numeric columns"
        >
          {corr && corr.cols.length >= 2 ? (
            <Heatmap cols={corr.cols} matrix={corr.matrix} />
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Need at least two numeric columns.
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Column Profiles" subtitle="Automatic type inference & statistics">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left">Column</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-right">Missing</th>
                <th className="px-3 py-2 text-right">Unique</th>
                <th className="px-3 py-2 text-right">Mean / Top</th>
                <th className="px-3 py-2 text-right">Range</th>
                <th className="px-3 py-2 text-right">Outliers</th>
              </tr>
            </thead>
            <tbody>
              {profile.columns.map((c) => (
                <tr key={c.name} className="border-b border-border/40">
                  <td className="px-3 py-2 font-medium">{c.name}</td>
                  <td className="px-3 py-2">
                    <span
                      className="rounded-md px-2 py-0.5 text-[10px] uppercase"
                      style={{
                        background: "color-mix(in oklab, var(--chart-1) 15%, transparent)",
                        color: "var(--chart-1)",
                      }}
                    >
                      {c.kind}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{c.missing}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{c.unique}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs">
                    {c.kind === "number"
                      ? c.mean?.toFixed(2)
                      : c.kind === "date"
                        ? c.minDate?.slice(0, 10)
                        : c.top?.[0]?.value ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs">
                    {c.kind === "number"
                      ? `${c.min} → ${c.max}`
                      : c.kind === "date"
                        ? `${c.minDate?.slice(0, 10)} → ${c.maxDate?.slice(0, 10)}`
                        : "—"}
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">
                    {c.kind === "number" ? c.outliers ?? 0 : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <div className="flex items-center gap-1.5">
        {icon}
        {label}
      </div>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
