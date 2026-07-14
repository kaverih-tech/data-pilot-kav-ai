import { useMemo, useState } from "react";
import { Panel } from "./kpi-card";
import { LineViz, fmt } from "./charts";
import { useDataset } from "@/lib/data-store";
import { timeSeries, forecast, linearRegression } from "@/lib/eda";
import { TrendingUp } from "lucide-react";

export function ForecastPanel() {
  const { rows, profile, dateCol, target } = useDataset();
  const [periods, setPeriods] = useState(6);

  const chartData = useMemo(() => {
    if (!profile || !dateCol || !target) return null;
    const series = timeSeries(rows, dateCol, target, "month");
    if (series.length < 3) return null;
    const values = series.map((s) => s.value);
    const preds = forecast(values, periods);

    const combined: Record<string, string | number>[] = series.map((s) => ({
      name: s.name,
      actual: s.value,
    }));

    // continuation
    const [y, m] = series[series.length - 1].name.split("-").map(Number);
    for (let i = 0; i < periods; i++) {
      const d = new Date(y, (m - 1) + i + 1, 1);
      combined.push({
        name: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        forecast: preds[i],
      });
    }
    // bridge last actual → first forecast
    const bridge = combined.find((c) => c.forecast !== undefined);
    if (bridge) bridge.actual = series[series.length - 1].value;

    const total = preds.reduce((a, b) => a + b, 0);
    return { combined, total, preds };
  }, [rows, profile, dateCol, target, periods]);

  const regression = useMemo(() => {
    if (!profile || !target) return null;
    const other = profile.numericCols.find((c) => c !== target);
    if (!other) return null;
    const r = linearRegression(rows, other, target);
    return r ? { xCol: other, ...r } : null;
  }, [rows, profile, target]);

  if (!profile) return null;

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Panel
        className="lg:col-span-2"
        title={`Forecast · ${target ?? "target"}`}
        subtitle={
          dateCol
            ? `Holt-Winters trend on ${dateCol} → ${target}`
            : "No date column detected — forecasting unavailable"
        }
        right={
          <select
            value={periods}
            onChange={(e) => setPeriods(Number(e.target.value))}
            className="rounded-lg border border-border bg-surface px-2 py-1 text-xs"
          >
            {[3, 6, 12, 24].map((p) => (
              <option key={p} value={p}>
                {p} months
              </option>
            ))}
          </select>
        }
      >
        {chartData ? (
          <>
            <LineViz data={chartData.combined} keys={["actual", "forecast"]} />
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-success" />
              Projected next {periods} periods total:{" "}
              <span className="font-semibold text-foreground">{fmt(chartData.total)}</span>
            </div>
          </>
        ) : (
          <div className="py-16 text-center text-sm text-muted-foreground">
            Need a date column and numeric target with at least 3 periods.
          </div>
        )}
      </Panel>

      <Panel title="Regression model" subtitle={regression ? `${regression.xCol} → ${target}` : "Not enough numeric columns"}>
        {regression ? (
          <div className="space-y-3 text-sm">
            <Stat label="R² Score" value={regression.r2.toFixed(3)} good={regression.r2} />
            <Stat label="RMSE" value={fmt(regression.rmse)} />
            <Stat label="MAE" value={fmt(regression.mae)} />
            <Stat label="Samples" value={regression.n.toLocaleString()} />
            <div className="rounded-lg border border-border bg-surface/60 p-3 font-mono text-xs">
              {target} = {regression.slope.toFixed(3)} · {regression.xCol} + {regression.intercept.toFixed(2)}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Regression needs at least two numeric columns.
          </div>
        )}
      </Panel>
    </div>
  );
}

function Stat({ label, value, good }: { label: string; value: string; good?: number }) {
  const color =
    good === undefined
      ? "text-foreground"
      : good > 0.7
        ? "text-success"
        : good > 0.4
          ? "text-warning"
          : "text-destructive";
  return (
    <div className="flex items-center justify-between border-b border-border/50 pb-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`font-mono text-sm font-semibold ${color}`}>{value}</span>
    </div>
  );
}
