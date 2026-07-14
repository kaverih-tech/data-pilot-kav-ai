import type { ReactNode } from "react";

export function KpiCard({
  label,
  value,
  hint,
  icon,
  accent = "primary",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  accent?: "primary" | "accent" | "success" | "warning" | "destructive";
}) {
  const accentClass = {
    primary: "text-primary",
    accent: "text-accent",
    success: "text-[#22c55e]",
    warning: "text-warning",
    destructive: "text-[#ef4444]",
  }[accent];
  return (
    <div className="glass group relative overflow-hidden rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:glow">
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-[#94a3b8]">{label}</div>
        {icon && <div className={`opacity-90 ${accentClass}`}>{icon}</div>}
      </div>
      <div className="mt-2 font-display text-3xl font-semibold tracking-tight text-white">{value}</div>
      {hint && <div className="mt-1 text-xs text-[#cbd5e1]">{hint}</div>}
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-25"
        style={{ background: "var(--gradient-primary)" }}
      />
    </div>
  );
}

export function Panel({
  title,
  subtitle,
  right,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`glass rounded-2xl p-5 ${className}`}>
      {(title || right) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            {title && <div className="font-display text-lg tracking-tight">{title}</div>}
            {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}
