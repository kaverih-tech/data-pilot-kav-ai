import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  BarChart3,
  Sparkles,
  LineChart as LineIcon,
  MessageSquare,
  Database,
  Download,
  ArrowLeft,
  DollarSign,
  Users,
  TrendingUp,
  Activity,
} from "lucide-react";
import { useDataset } from "@/lib/data-store";
import { groupSum, timeSeries } from "@/lib/eda";
import { KpiCard, Panel } from "@/components/kpi-card";
import { BarViz, AreaViz, DonutViz, fmt } from "@/components/charts";
import { UploadZone } from "@/components/upload-zone";
import { EdaPanel } from "@/components/eda-panel";
import { ForecastPanel } from "@/components/forecast-panel";
import { InsightsPanel } from "@/components/insights-panel";
import { ChatPanel } from "@/components/chat-panel";

export const Route = createFileRoute("/analyze")({
  head: () => ({
    meta: [
      { title: "Analyze · Lumen" },
      { name: "description", content: "Interactive AI dashboard for your dataset." },
    ],
  }),
  component: Analyze,
});

type Tab = "dashboard" | "eda" | "forecast" | "insights" | "chat";

function Analyze() {
  const navigate = useNavigate();
  const { fileName, rows, profile, target, dateCol, categoryCol, setTarget, setDateCol, setCategoryCol } =
    useDataset();
  const [tab, setTab] = useState<Tab>("dashboard");

  useEffect(() => {
    if (!profile) navigate({ to: "/" });
  }, [profile, navigate]);

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24">
        <UploadZone />
      </div>
    );
  }

  const numericTotal = useMemo(() => {
    if (!target) return 0;
    return rows.reduce((s, r) => {
      const v = Number(r[target]);
      return s + (isFinite(v) ? v : 0);
    }, 0);
  }, [rows, target]);

  const avgVal = useMemo(() => (target ? numericTotal / Math.max(rows.length, 1) : 0), [numericTotal, rows.length, target]);

  const topByCategory = useMemo(
    () => (categoryCol && target ? groupSum(rows, categoryCol, target, 8) : []),
    [rows, categoryCol, target],
  );

  const timeData = useMemo(
    () => (dateCol && target ? timeSeries(rows, dateCol, target, "month") : []),
    [rows, dateCol, target],
  );

  const growth = useMemo(() => {
    if (timeData.length < 2) return null;
    const last = timeData[timeData.length - 1].value;
    const prev = timeData[timeData.length - 2].value;
    if (!prev) return null;
    return ((last - prev) / prev) * 100;
  }, [timeData]);

  const secondCat = useMemo(() => {
    const other = profile.categoricalCols.find((c) => c !== categoryCol);
    if (!other || !target) return [];
    return groupSum(rows, other, target, 6);
  }, [profile.categoricalCols, categoryCol, target, rows]);
  const secondCatName = profile.categoricalCols.find((c) => c !== categoryCol);

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, (fileName ?? "dataset") + ".xlsx");
  };

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-6">
      {/* Header */}
      <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="font-display text-lg tracking-tight">
              {fileName ?? "Untitled dataset"}
            </div>
            <div className="text-xs text-muted-foreground">
              {profile.rows.toLocaleString()} rows · {profile.cols} cols · {profile.domain}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SelectPill label="Target" value={target} options={profile.numericCols} onChange={setTarget} />
          <SelectPill label="Date" value={dateCol} options={profile.dateCols} onChange={setDateCol} />
          <SelectPill label="Group" value={categoryCol} options={profile.categoricalCols} onChange={setCategoryCol} />
          <button
            onClick={exportExcel}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-sm transition hover:text-primary"
          >
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-5 flex flex-wrap gap-1 rounded-xl bg-surface/50 p-1">
        {(
          [
            ["dashboard", "Dashboard", BarChart3],
            ["eda", "EDA", Database],
            ["forecast", "Forecast & ML", LineIcon],
            ["insights", "AI Insights", Sparkles],
            ["chat", "Chat", MessageSquare],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm transition ${
              tab === id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      <div className="mt-5 animate-[fade-in_0.3s_ease-out]">
        {tab === "dashboard" && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                label={`Total ${target ?? ""}`}
                value={fmt(numericTotal)}
                hint={target ? `sum of ${target}` : ""}
                icon={<DollarSign className="h-4 w-4" />}
              />
              <KpiCard
                label="Records"
                value={fmt(profile.rows)}
                hint={`${profile.cols} columns`}
                icon={<Users className="h-4 w-4" />}
                accent="accent"
              />
              <KpiCard
                label={`Avg ${target ?? ""}`}
                value={fmt(avgVal)}
                hint="per record"
                icon={<Activity className="h-4 w-4" />}
                accent="success"
              />
              <KpiCard
                label="Period growth"
                value={growth === null ? "—" : `${growth.toFixed(1)}%`}
                hint={growth === null ? "no time series" : "vs previous period"}
                icon={<TrendingUp className="h-4 w-4" />}
                accent={growth === null ? "primary" : growth >= 0 ? "success" : "destructive"}
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <Panel
                className="lg:col-span-2"
                title={target && dateCol ? `${target} over time` : "Time trend"}
                subtitle={target && dateCol ? `${dateCol} · monthly` : "Add a date column"}
              >
                {timeData.length > 0 ? (
                  <AreaViz data={timeData.map((t) => ({ name: t.name, value: t.value }))} />
                ) : (
                  <EmptyChart msg="No date column detected." />
                )}
              </Panel>
              <Panel title={secondCatName ? `Share by ${secondCatName}` : "Distribution"} subtitle="Top values">
                {secondCat.length > 0 ? (
                  <DonutViz data={secondCat} />
                ) : (
                  <EmptyChart msg="Need a second categorical column." />
                )}
              </Panel>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Panel
                title={categoryCol ? `Top ${categoryCol} by ${target ?? "value"}` : "Top segments"}
                subtitle="Descending"
              >
                {topByCategory.length > 0 ? (
                  <BarViz data={topByCategory} />
                ) : (
                  <EmptyChart msg="Need a categorical + numeric column." />
                )}
              </Panel>
              <Panel title="Recent records" subtitle={`First 10 of ${profile.rows.toLocaleString()}`}>
                <div className="max-h-[280px] overflow-auto">
                  <table className="min-w-full text-xs">
                    <thead className="sticky top-0 bg-surface/80 backdrop-blur">
                      <tr>
                        {Object.keys(rows[0] ?? {}).slice(0, 6).map((k) => (
                          <th key={k} className="px-2 py-1.5 text-left text-muted-foreground">
                            {k}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 10).map((r, i) => (
                        <tr key={i} className="border-t border-border/40">
                          {Object.keys(rows[0] ?? {}).slice(0, 6).map((k) => (
                            <td key={k} className="px-2 py-1.5 font-mono">
                              {r[k] === null || r[k] === undefined ? "—" : String(r[k]).slice(0, 30)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </div>
          </div>
        )}

        {tab === "eda" && <EdaPanel />}
        {tab === "forecast" && <ForecastPanel />}
        {tab === "insights" && <InsightsPanel />}
        {tab === "chat" && (
          <Panel title="Chat with your data" subtitle="Powered by Lovable AI · Gemini">
            <ChatPanel />
          </Panel>
        )}
      </div>
    </div>
  );
}

function SelectPill({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: string[];
  onChange: (v: string | null) => void;
}) {
  if (options.length === 0) return null;
  return (
    <label className="flex items-center gap-2 rounded-xl border border-[#334155] bg-[#0f172a] px-3 py-1.5 text-xs shadow-sm">
      <span className="uppercase tracking-wider text-[#94a3b8]">{label}</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="cursor-pointer bg-transparent text-sm font-medium text-white outline-none focus:ring-2 focus:ring-[#2563eb] rounded"
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function EmptyChart({ msg }: { msg: string }) {
  return <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">{msg}</div>;
}
