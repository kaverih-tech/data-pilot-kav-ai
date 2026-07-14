import * as ss from "simple-statistics";

export type ColKind = "number" | "date" | "category" | "text" | "boolean";

export interface ColumnProfile {
  name: string;
  kind: ColKind;
  missing: number;
  unique: number;
  sample: unknown[];
  // number stats
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  stdev?: number;
  variance?: number;
  skew?: number;
  sum?: number;
  outliers?: number;
  // category stats
  top?: { value: string; count: number }[];
  // date stats
  minDate?: string;
  maxDate?: string;
}

export interface DatasetProfile {
  rows: number;
  cols: number;
  missingTotal: number;
  duplicateRows: number;
  qualityScore: number; // 0..100
  columns: ColumnProfile[];
  numericCols: string[];
  categoricalCols: string[];
  dateCols: string[];
  // suggestions
  suggestedTarget?: string;
  suggestedDate?: string;
  suggestedCategory?: string;
  domain: string; // "sales", "finance", "hr", "generic"...
}

const DATE_RX = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}|^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/;

function toNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return isFinite(v) ? v : null;
  const s = String(v).replace(/[$,€£₹%\s]/g, "").replace(/,(?=\d{3}\b)/g, "");
  const n = Number(s);
  return isFinite(n) ? n : null;
}

function toDate(v: unknown): Date | null {
  if (v == null || v === "") return null;
  if (v instanceof Date) return isNaN(+v) ? null : v;
  const s = String(v);
  if (!DATE_RX.test(s) && isNaN(Date.parse(s))) return null;
  const d = new Date(s);
  return isNaN(+d) ? null : d;
}

function detectKind(values: unknown[]): ColKind {
  const nonNull = values.filter((v) => v !== null && v !== undefined && v !== "");
  if (nonNull.length === 0) return "text";
  const sample = nonNull.slice(0, Math.min(200, nonNull.length));

  const boolCount = sample.filter((v) => {
    const s = String(v).toLowerCase();
    return s === "true" || s === "false" || s === "yes" || s === "no" || s === "0" || s === "1";
  }).length;
  if (boolCount / sample.length > 0.95 && new Set(sample.map(String)).size <= 3) return "boolean";

  const nums = sample.map(toNumber).filter((v) => v !== null);
  if (nums.length / sample.length > 0.85) return "number";

  const dates = sample.map(toDate).filter(Boolean);
  if (dates.length / sample.length > 0.8) return "date";

  const unique = new Set(sample.map(String)).size;
  if (unique / sample.length < 0.5 || unique < 30) return "category";
  return "text";
}

function outlierCount(nums: number[]): number {
  if (nums.length < 8) return 0;
  const q1 = ss.quantile(nums, 0.25);
  const q3 = ss.quantile(nums, 0.75);
  const iqr = q3 - q1;
  const lo = q1 - 1.5 * iqr;
  const hi = q3 + 1.5 * iqr;
  return nums.filter((n) => n < lo || n > hi).length;
}

export function profileDataset(rows: Record<string, unknown>[]): DatasetProfile {
  const cols = Object.keys(rows[0] ?? {});
  const columns: ColumnProfile[] = [];
  let missingTotal = 0;

  for (const col of cols) {
    const raw = rows.map((r) => r[col]);
    const missing = raw.filter((v) => v === null || v === undefined || v === "").length;
    missingTotal += missing;
    const kind = detectKind(raw);
    const nonNull = raw.filter((v) => v !== null && v !== undefined && v !== "");
    const unique = new Set(nonNull.map((v) => String(v))).size;

    const profile: ColumnProfile = {
      name: col,
      kind,
      missing,
      unique,
      sample: nonNull.slice(0, 5),
    };

    if (kind === "number") {
      const nums = raw.map(toNumber).filter((v): v is number => v !== null);
      if (nums.length > 0) {
        profile.min = ss.min(nums);
        profile.max = ss.max(nums);
        profile.mean = ss.mean(nums);
        profile.median = ss.median(nums);
        profile.stdev = nums.length > 1 ? ss.standardDeviation(nums) : 0;
        profile.variance = nums.length > 1 ? ss.variance(nums) : 0;
        profile.skew = nums.length > 2 ? ss.sampleSkewness(nums) : 0;
        profile.sum = ss.sum(nums);
        profile.outliers = outlierCount(nums);
      }
    } else if (kind === "category" || kind === "boolean" || kind === "text") {
      const counts = new Map<string, number>();
      for (const v of nonNull) {
        const k = String(v);
        counts.set(k, (counts.get(k) ?? 0) + 1);
      }
      profile.top = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([value, count]) => ({ value, count }));
    } else if (kind === "date") {
      const ds = raw.map(toDate).filter((d): d is Date => d !== null).map((d) => +d);
      if (ds.length) {
        profile.minDate = new Date(ss.min(ds)).toISOString();
        profile.maxDate = new Date(ss.max(ds)).toISOString();
      }
    }

    columns.push(profile);
  }

  // duplicate rows
  const seen = new Set<string>();
  let duplicateRows = 0;
  for (const r of rows) {
    const k = JSON.stringify(cols.map((c) => r[c]));
    if (seen.has(k)) duplicateRows++;
    else seen.add(k);
  }

  const totalCells = rows.length * cols.length;
  const missingRatio = totalCells ? missingTotal / totalCells : 0;
  const dupRatio = rows.length ? duplicateRows / rows.length : 0;
  const qualityScore = Math.max(0, Math.round(100 - missingRatio * 60 - dupRatio * 40));

  const numericCols = columns.filter((c) => c.kind === "number").map((c) => c.name);
  const categoricalCols = columns.filter((c) => c.kind === "category" || c.kind === "boolean").map((c) => c.name);
  const dateCols = columns.filter((c) => c.kind === "date").map((c) => c.name);

  const targetPriority = ["revenue", "sales", "profit", "amount", "total", "price", "income", "loss"];
  const suggestedTarget =
    numericCols.find((n) => targetPriority.some((t) => n.toLowerCase().includes(t))) ?? numericCols[0];

  const datePriority = ["date", "time", "created", "order", "period", "month", "year"];
  const suggestedDate =
    dateCols.find((n) => datePriority.some((t) => n.toLowerCase().includes(t))) ?? dateCols[0];

  const catPriority = ["category", "product", "region", "country", "state", "department", "segment", "channel"];
  const suggestedCategory =
    categoricalCols.find((n) => catPriority.some((t) => n.toLowerCase().includes(t))) ?? categoricalCols[0];

  const lowerCols = cols.map((c) => c.toLowerCase()).join(" ");
  let domain = "General";
  if (/revenue|sales|order|customer/.test(lowerCols)) domain = "Sales & Revenue";
  else if (/profit|loss|expense|cost|invoice/.test(lowerCols)) domain = "Finance";
  else if (/employee|salary|department|hire/.test(lowerCols)) domain = "HR";
  else if (/stock|inventory|sku|warehouse/.test(lowerCols)) domain = "Inventory";
  else if (/campaign|click|impression|conversion/.test(lowerCols)) domain = "Marketing";

  return {
    rows: rows.length,
    cols: cols.length,
    missingTotal,
    duplicateRows,
    qualityScore,
    columns,
    numericCols,
    categoricalCols,
    dateCols,
    suggestedTarget,
    suggestedDate,
    suggestedCategory,
    domain,
  };
}

/* ---------- Aggregations ---------- */

export function groupSum(
  rows: Record<string, unknown>[],
  groupCol: string,
  valueCol: string,
  limit = 10,
): { name: string; value: number }[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = r[groupCol];
    if (k === null || k === undefined || k === "") continue;
    const v = toNumber(r[valueCol]);
    if (v === null) continue;
    const key = String(k);
    map.set(key, (map.get(key) ?? 0) + v);
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export function timeSeries(
  rows: Record<string, unknown>[],
  dateCol: string,
  valueCol: string,
  granularity: "day" | "month" | "year" = "month",
): { name: string; value: number; ts: number }[] {
  const map = new Map<string, { value: number; ts: number }>();
  for (const r of rows) {
    const d = toDate(r[dateCol]);
    const v = toNumber(r[valueCol]);
    if (!d || v === null) continue;
    let key: string;
    let ts: number;
    if (granularity === "year") {
      key = `${d.getFullYear()}`;
      ts = +new Date(d.getFullYear(), 0, 1);
    } else if (granularity === "day") {
      key = d.toISOString().slice(0, 10);
      ts = +new Date(d.getFullYear(), d.getMonth(), d.getDate());
    } else {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      ts = +new Date(d.getFullYear(), d.getMonth(), 1);
    }
    const prev = map.get(key);
    map.set(key, { value: (prev?.value ?? 0) + v, ts });
  }
  return [...map.entries()]
    .map(([name, { value, ts }]) => ({ name, value, ts }))
    .sort((a, b) => a.ts - b.ts);
}

/* ---------- Correlation ---------- */

export function correlationMatrix(
  rows: Record<string, unknown>[],
  numericCols: string[],
): { cols: string[]; matrix: number[][] } {
  const cols = numericCols.slice(0, 8);
  const data = cols.map((c) => rows.map((r) => toNumber(r[c])));
  const matrix = cols.map((_, i) =>
    cols.map((_, j) => {
      const a: number[] = [];
      const b: number[] = [];
      for (let k = 0; k < data[i].length; k++) {
        if (data[i][k] !== null && data[j][k] !== null) {
          a.push(data[i][k]!);
          b.push(data[j][k]!);
        }
      }
      if (a.length < 3) return 0;
      try {
        return Math.round(ss.sampleCorrelation(a, b) * 100) / 100;
      } catch {
        return 0;
      }
    }),
  );
  return { cols, matrix };
}

/* ---------- Linear regression ---------- */

export function linearRegression(rows: Record<string, unknown>[], xCol: string, yCol: string) {
  const pts: [number, number][] = [];
  for (const r of rows) {
    const x = toNumber(r[xCol]);
    const y = toNumber(r[yCol]);
    if (x !== null && y !== null) pts.push([x, y]);
  }
  if (pts.length < 3) return null;
  const lr = ss.linearRegression(pts);
  const line = ss.linearRegressionLine(lr);
  const preds = pts.map(([x]) => line(x));
  const actual = pts.map(([, y]) => y);
  const meanY = ss.mean(actual);
  const ssTot = actual.reduce((s, y) => s + (y - meanY) ** 2, 0);
  const ssRes = actual.reduce((s, y, i) => s + (y - preds[i]) ** 2, 0);
  const r2 = ssTot ? 1 - ssRes / ssTot : 0;
  const rmse = Math.sqrt(ssRes / pts.length);
  const mae = ss.mean(actual.map((y, i) => Math.abs(y - preds[i])));
  return { slope: lr.m, intercept: lr.b, r2, rmse, mae, n: pts.length };
}

/* ---------- Forecasting: Holt-Winters (additive, no seasonality fallback to Holt) ---------- */

export function forecast(series: number[], periods: number, alpha = 0.4, beta = 0.1) {
  if (series.length < 3) {
    const last = series[series.length - 1] ?? 0;
    return Array.from({ length: periods }, () => last);
  }
  let level = series[0];
  let trend = series[1] - series[0];
  for (let i = 1; i < series.length; i++) {
    const prevLevel = level;
    level = alpha * series[i] + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }
  const out: number[] = [];
  for (let h = 1; h <= periods; h++) out.push(Math.max(0, level + h * trend));
  return out;
}

/* ---------- Summary for AI ---------- */

export function summarizeForAi(profile: DatasetProfile, rows: Record<string, unknown>[]): string {
  const lines: string[] = [];
  lines.push(`Dataset: ${profile.rows} rows × ${profile.cols} columns. Domain: ${profile.domain}. Quality: ${profile.qualityScore}/100.`);
  lines.push(`Missing cells: ${profile.missingTotal}. Duplicate rows: ${profile.duplicateRows}.`);
  lines.push("Columns:");
  for (const c of profile.columns) {
    if (c.kind === "number") {
      lines.push(`- ${c.name} [number] mean=${c.mean?.toFixed(2)} median=${c.median?.toFixed(2)} min=${c.min} max=${c.max} sum=${c.sum?.toFixed(2)} outliers=${c.outliers} missing=${c.missing}`);
    } else if (c.kind === "date") {
      lines.push(`- ${c.name} [date] range=${c.minDate?.slice(0,10)}..${c.maxDate?.slice(0,10)} missing=${c.missing}`);
    } else {
      const top = (c.top ?? []).slice(0, 5).map((t) => `${t.value}(${t.count})`).join(", ");
      lines.push(`- ${c.name} [${c.kind}] unique=${c.unique} top=${top} missing=${c.missing}`);
    }
  }
  // Sample rows
  lines.push("Sample rows (up to 8):");
  lines.push(JSON.stringify(rows.slice(0, 8)));
  return lines.join("\n");
}
