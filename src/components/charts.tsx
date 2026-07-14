import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  Legend,
} from "recharts";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

const axis = { stroke: "var(--muted-foreground)", fontSize: 11 };
const grid = { stroke: "var(--border)" };
const tooltipStyle = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    color: "var(--popover-foreground)",
    fontSize: 12,
  },
  cursor: { fill: "var(--muted)", opacity: 0.2 },
};

function fmt(n: number) {
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function BarViz({ data, dataKey = "value" }: { data: { name: string; value: number }[]; dataKey?: string }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <CartesianGrid vertical={false} {...grid} />
        <XAxis dataKey="name" {...axis} interval={0} angle={-20} textAnchor="end" height={50} />
        <YAxis {...axis} tickFormatter={(v) => fmt(Number(v))} />
        <Tooltip {...tooltipStyle} formatter={(v: number) => fmt(v)} />
        <Bar dataKey={dataKey} radius={[6, 6, 0, 0]} fill="url(#barGrad)" />
        <defs>
          <linearGradient id="barGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" />
            <stop offset="100%" stopColor="var(--chart-2)" />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LineViz({
  data,
  keys,
}: {
  data: Record<string, number | string>[];
  keys: string[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <CartesianGrid vertical={false} {...grid} />
        <XAxis dataKey="name" {...axis} />
        <YAxis {...axis} tickFormatter={(v) => fmt(Number(v))} />
        <Tooltip {...tooltipStyle} formatter={(v: number) => fmt(v)} />
        {keys.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {keys.map((k, i) => (
          <Line
            key={k}
            type="monotone"
            dataKey={k}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
            strokeDasharray={k === "forecast" ? "5 4" : undefined}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function AreaViz({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.6} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} {...grid} />
        <XAxis dataKey="name" {...axis} />
        <YAxis {...axis} tickFormatter={(v) => fmt(Number(v))} />
        <Tooltip {...tooltipStyle} formatter={(v: number) => fmt(v)} />
        <Area type="monotone" dataKey="value" stroke="var(--chart-1)" strokeWidth={2} fill="url(#areaGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DonutViz({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Tooltip {...tooltipStyle} formatter={(v: number) => fmt(v)} />
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ScatterViz({ data }: { data: { x: number; y: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ScatterChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <CartesianGrid {...grid} />
        <XAxis type="number" dataKey="x" {...axis} tickFormatter={(v) => fmt(Number(v))} />
        <YAxis type="number" dataKey="y" {...axis} tickFormatter={(v) => fmt(Number(v))} />
        <Tooltip {...tooltipStyle} formatter={(v: number) => fmt(v)} />
        <Scatter data={data} fill="var(--chart-2)" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export function Heatmap({ cols, matrix }: { cols: string[]; matrix: number[][] }) {
  const cellSize = useMemo(() => Math.min(48, Math.floor(480 / Math.max(cols.length, 1))), [cols.length]);
  const color = (v: number) => {
    const alpha = Math.min(1, Math.abs(v));
    return v >= 0
      ? `color-mix(in oklab, var(--chart-1) ${alpha * 100}%, transparent)`
      : `color-mix(in oklab, var(--destructive) ${alpha * 100}%, transparent)`;
  };
  return (
    <div className="overflow-x-auto">
      <div className="inline-block">
        <div className="flex" style={{ marginLeft: 90 }}>
          {cols.map((c) => (
            <div
              key={c}
              className="truncate px-1 text-[10px] text-muted-foreground"
              style={{ width: cellSize, transform: "rotate(-30deg)", transformOrigin: "left bottom" }}
              title={c}
            >
              {c}
            </div>
          ))}
        </div>
        {matrix.map((row, i) => (
          <div key={i} className="flex items-center">
            <div className="w-[90px] truncate pr-2 text-right text-[11px] text-muted-foreground" title={cols[i]}>
              {cols[i]}
            </div>
            {row.map((v, j) => (
              <div
                key={j}
                className="flex items-center justify-center border border-border/40 text-[10px]"
                style={{ width: cellSize, height: cellSize, background: color(v) }}
                title={`${cols[i]} × ${cols[j]}: ${v.toFixed(2)}`}
              >
                {v.toFixed(2)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export { fmt };
