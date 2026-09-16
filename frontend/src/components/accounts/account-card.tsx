import { CheckCircle2, ShieldOff, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { AccountResponse } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";

const STATUS_CONFIG: Record<AccountResponse["status"], { label: string; icon: typeof CheckCircle2; className: string }> = {
  ACTIVE: { label: "Active", icon: CheckCircle2, className: "bg-status-good/10 text-status-good border-status-good/20" },
  BLOCKED: { label: "Blocked", icon: ShieldOff, className: "bg-status-critical/10 text-status-critical border-status-critical/20" },
  CLOSED: { label: "Closed", icon: XCircle, className: "bg-muted text-muted-foreground border-border" },
};

const TYPE_LABEL: Record<AccountResponse["accountType"], string> = {
  SAVINGS: "Savings",
  CURRENT: "Current",
  FIXED_DEPOSIT: "Fixed Deposit",
};

export function AccountCard({ account, active }: { account: AccountResponse; active?: boolean }) {
  const status = STATUS_CONFIG[account.status];
  const StatusIcon = status.icon;

  return (
    <Card className={active ? "border-primary/40 ring-1 ring-primary/10" : undefined}>
      <CardContent className="space-y-4 px-5 py-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{TYPE_LABEL[account.accountType]} account</p>
            <p className="mt-0.5 font-mono text-sm font-medium">{account.accountNumber}</p>
          </div>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${status.className}`}
          >
            <StatusIcon className="size-3" />
            {status.label}
          </span>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Balance</p>
          <p className="text-2xl font-semibold tracking-tight">{formatCurrency(account.balance)}</p>
        </div>

        <dl className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
          <div>
            <dt className="text-muted-foreground">Holder</dt>
            <dd className="mt-0.5 font-medium">{account.accountHolderName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Daily limit</dt>
            <dd className="mt-0.5 font-medium">{formatCurrency(account.dailyTransactionLimit)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="mt-0.5 truncate font-medium">{account.email}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Opened</dt>
            <dd className="mt-0.5 font-medium">{formatDate(account.createdAt)}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
