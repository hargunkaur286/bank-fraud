import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { TransactionTimeline } from "@/components/transactions/transaction-timeline";
import type { TransactionResponse } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

export function TransactionProcessing({
  transaction,
  timedOut,
  actions,
}: {
  transaction: TransactionResponse;
  timedOut?: boolean;
  actions?: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="overflow-x-auto pb-2">
        <TransactionTimeline status={transaction.status} />
      </div>

      <StatusPanel transaction={transaction} timedOut={timedOut} />

      {actions ? <div className="flex gap-3">{actions}</div> : null}
    </div>
  );
}

function StatusPanel({
  transaction,
  timedOut,
}: {
  transaction: TransactionResponse;
  timedOut?: boolean;
}) {
  switch (transaction.status) {
    case "PROCESSING":
    case "PENDING":
      return (
        <Panel tone="info">
          <p className="font-medium">
            {timedOut ? "Still processing" : "Processing your transfer"}
          </p>
          <p className="mt-1 text-muted-foreground">
            {timedOut
              ? "This is taking longer than usual. You can safely leave this page - check the transaction details later for its final status."
              : "We're screening this transaction for fraud. This usually takes a few seconds."}
          </p>
        </Panel>
      );
    case "COMPLETED":
      return (
        <Panel tone="good" icon={CheckCircle2}>
          <p className="font-medium">Transfer completed</p>
          <p className="mt-1 text-muted-foreground">
            {formatCurrency(transaction.amount)} was sent to{" "}
            {transaction.receiverAccountNumber}.
          </p>
        </Panel>
      );
    case "FLAGGED":
      return (
        <Panel tone="critical" icon={ShieldAlert}>
          <p className="font-medium">This transfer was flagged for fraud</p>
          <p className="mt-1 text-muted-foreground">
            {transaction.failureReason ??
              "Our fraud detection system stopped this transfer. Any deducted funds have been refunded to your account."}
          </p>
        </Panel>
      );
    case "FAILED":
      return (
        <Panel tone="serious" icon={AlertTriangle}>
          <p className="font-medium">Transfer failed</p>
          <p className="mt-1 text-muted-foreground">
            {transaction.failureReason ?? "Something went wrong and this transfer couldn't be completed."}
          </p>
        </Panel>
      );
    case "PENDING_VERIFICATION":
      return (
        <Panel tone="warning">
          <p className="font-medium">Verification required</p>
          <p className="mt-1 text-muted-foreground">
            This transfer needs a one-time verification code before it can complete.
          </p>
        </Panel>
      );
    default:
      return null;
  }
}

const TONE_CLASSES: Record<string, string> = {
  info: "border-chart-1/20 bg-chart-1/5 text-foreground",
  good: "border-status-good/20 bg-status-good/5 text-foreground",
  warning: "border-status-warning/25 bg-status-warning/10 text-foreground",
  serious: "border-status-serious/20 bg-status-serious/5 text-foreground",
  critical: "border-status-critical/20 bg-status-critical/5 text-foreground",
};

function Panel({
  tone,
  icon: Icon,
  children,
}: {
  tone: keyof typeof TONE_CLASSES;
  icon?: typeof CheckCircle2;
  children: ReactNode;
}) {
  return (
    <div className={`flex items-start gap-3 rounded-lg border p-4 text-sm ${TONE_CLASSES[tone]}`}>
      {Icon ? <Icon className="mt-0.5 size-5 shrink-0" /> : null}
      <div>{children}</div>
    </div>
  );
}
