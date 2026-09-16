import { CheckCircle2, Clock, KeyRound, Loader2, ShieldX, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TransactionStatus } from "@/lib/api";

const STATUS_CONFIG: Record<
  TransactionStatus,
  { label: string; icon: typeof CheckCircle2; className: string; spin?: boolean }
> = {
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle2,
    className: "bg-status-good/10 text-status-good border-status-good/20",
  },
  PROCESSING: {
    label: "Processing",
    icon: Loader2,
    className: "bg-chart-1/10 text-chart-1 border-chart-1/20",
    spin: true,
  },
  PENDING_VERIFICATION: {
    label: "Pending Verification",
    icon: KeyRound,
    className: "bg-status-warning/15 text-amber-700 dark:text-status-warning border-status-warning/25",
  },
  FLAGGED: {
    label: "Flagged",
    icon: ShieldX,
    className: "bg-status-critical/10 text-status-critical border-status-critical/20",
  },
  FAILED: {
    label: "Failed",
    icon: XCircle,
    className: "bg-status-serious/10 text-status-serious border-status-serious/20",
  },
  PENDING: {
    label: "Pending",
    icon: Clock,
    className: "bg-muted text-muted-foreground border-border",
  },
};

export function TransactionStatusBadge({
  status,
  className,
}: {
  status: TransactionStatus;
  className?: string;
}) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        config.className,
        className,
      )}
    >
      <Icon className={cn("size-3.5", config.spin && "animate-spin")} />
      {config.label}
    </span>
  );
}
