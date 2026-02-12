import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusKey =
  | "active"
  | "in_progress"
  | "completed"
  | "pending"
  | "cancelled";

const STATUS_CONFIG: Record<
  StatusKey,
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800",
  },
  in_progress: {
    label: "In Progress",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 border-amber-200 dark:border-amber-800",
  },
  completed: {
    label: "Completed",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 border-blue-200 dark:border-blue-800",
  },
  pending: {
    label: "Pending",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 border-amber-200 dark:border-amber-800",
  },
  cancelled: {
    label: "Cancelled",
    className:
      "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200 border-rose-200 dark:border-rose-800",
  },
};

/** Returns the left border class for status-based card accents */
export function getStatusBorderClass(
  status: string | undefined | null
): string {
  const normalized = (status ?? "").toLowerCase().trim();
  const borderMap: Record<string, string> = {
    active: "border-l-emerald-400 dark:border-l-emerald-500",
    in_progress: "border-l-amber-400 dark:border-l-amber-500",
    pending: "border-l-amber-400 dark:border-l-amber-500",
    completed: "border-l-blue-400 dark:border-l-blue-500",
    cancelled: "border-l-rose-400 dark:border-l-rose-500",
  };
  return borderMap[normalized] ?? "border-l-muted-foreground/50";
}

interface StatusBadgeProps {
  status: string | undefined | null;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = (status ?? "").toLowerCase().trim().replace(/\s+/g, "_") as StatusKey;
  const config = STATUS_CONFIG[normalized];
  const label =
    config?.label ?? (status ? status.replace(/_/g, " ") : "—");

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] px-2 py-0.5 font-semibold uppercase tracking-wide shrink-0",
        config?.className ?? "bg-muted text-muted-foreground border-border",
        className
      )}
    >
      {label}
    </Badge>
  );
}
