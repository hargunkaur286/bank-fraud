import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { TransactionResponse, TransactionStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

const STATUS_ORDER: TransactionStatus[] = [
  "COMPLETED",
  "PROCESSING",
  "PENDING_VERIFICATION",
  "FLAGGED",
  "FAILED",
  "PENDING",
];

const STATUS_STYLE: Record<TransactionStatus, { label: string; dot: string; bar: string }> = {
  COMPLETED: { label: "Completed", dot: "bg-status-good", bar: "bg-status-good" },
  PROCESSING: { label: "Processing", dot: "bg-chart-1", bar: "bg-chart-1" },
  PENDING_VERIFICATION: {
    label: "Pending Verification",
    dot: "bg-status-warning",
    bar: "bg-status-warning",
  },
  FLAGGED: { label: "Flagged", dot: "bg-status-critical", bar: "bg-status-critical" },
  FAILED: { label: "Failed", dot: "bg-status-serious", bar: "bg-status-serious" },
  PENDING: { label: "Pending", dot: "bg-muted-foreground", bar: "bg-muted-foreground" },
};

export function StatusSummary({ transactions }: { transactions: TransactionResponse[] }) {
  const total = transactions.length;
  const counts = STATUS_ORDER.map((status) => ({
    status,
    count: transactions.filter((t) => t.status === status).length,
  })).filter((s) => s.count > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction status</CardTitle>
        <CardDescription>Breakdown of all your sent transfers</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">No transactions yet.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
              {counts.map(({ status, count }) => (
                <div
                  key={status}
                  className={cn(STATUS_STYLE[status].bar)}
                  style={{ width: `${(count / total) * 100}%` }}
                />
              ))}
            </div>
            <ul className="space-y-2">
              {counts.map(({ status, count }) => (
                <li key={status} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className={cn("size-2 rounded-full", STATUS_STYLE[status].dot)} />
                    <span className="text-muted-foreground">{STATUS_STYLE[status].label}</span>
                  </span>
                  <span className="font-medium tabular-nums">
                    {count}
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({Math.round((count / total) * 100)}%)
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
