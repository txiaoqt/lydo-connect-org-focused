import React from "react";

type StatusBadgeProps = {
  status?: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  published: "bg-emerald-100 text-emerald-700 border-emerald-200/80",
  upcoming: "bg-primary/10 text-primary border-primary/20",
  ongoing: "bg-cyan-100 text-cyan-700 border-cyan-200/80",
  draft: "bg-muted text-muted-foreground border-border",
  archived: "bg-slate-200/70 text-slate-700 border-slate-300/70",
  cancelled: "bg-destructive/10 text-destructive border-destructive/25",
  postponed: "bg-amber-100 text-amber-700 border-amber-200/80",
  completed: "bg-violet-100 text-violet-700 border-violet-200/80",
  pending: "bg-amber-100 text-amber-700 border-amber-200/80",
  enabled: "bg-emerald-100 text-emerald-700 border-emerald-200/80",
  disabled: "bg-destructive/10 text-destructive border-destructive/25",
};

const formatLabel = (value: string) => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = (status ?? "").trim().toLowerCase();
  const style = STATUS_STYLES[normalized] ?? "bg-muted text-muted-foreground border-border";
  const label = normalized ? formatLabel(normalized) : "N/A";

  return (
    <span className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold text-center ${style}`}>
      {label}
    </span>
  );
}
