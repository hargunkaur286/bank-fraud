import Link from "next/link";
import { ShieldCheck, ShieldAlert, KeyRound, ScanSearch, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { TransactionResponse } from "@/lib/api";

export interface FraudMetrics {
  scanned: number;
  clean: number;
  flagged: number;
  pendingVerification: number;
}

export function computeFraudMetrics(transactions: TransactionResponse[]): FraudMetrics {
  return {
    scanned: transactions.length,
    clean: transactions.filter((t) => t.status === "COMPLETED").length,
    flagged: transactions.filter((t) => t.status === "FLAGGED").length,
    pendingVerification: transactions.filter((t) => t.status === "PENDING_VERIFICATION").length,
  };
}

export function FraudStatusCard({
  metrics,
  compact,
}: {
  metrics: FraudMetrics;
  compact?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-status-good" />
            Fraud Detection Active
          </CardTitle>
          <CardDescription>Based on your account&apos;s transaction history</CardDescription>
        </div>
        {compact ? (
          <Button asChild variant="ghost" size="sm">
            <Link href="/fraud-security">
              Details <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricTile icon={ScanSearch} label="Scanned" value={metrics.scanned} accent="border-border" />
          <MetricTile
            icon={ShieldCheck}
            label="Clean"
            value={metrics.clean}
            accent="border-status-good"
            iconClassName="text-status-good"
          />
          <MetricTile
            icon={KeyRound}
            label="Verification"
            value={metrics.pendingVerification}
            accent="border-status-warning"
            iconClassName="text-amber-600 dark:text-status-warning"
          />
          <MetricTile
            icon={ShieldAlert}
            label="Flagged"
            value={metrics.flagged}
            accent="border-status-critical"
            iconClassName="text-status-critical"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
  accent,
  iconClassName,
}: {
  icon: typeof ShieldCheck;
  label: string;
  value: number;
  accent: string;
  iconClassName?: string;
}) {
  return (
    <div className={`rounded-lg border-l-[3px] bg-muted/30 px-3.5 py-3 ${accent}`}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className={`size-3.5 ${iconClassName ?? ""}`} />
        {label}
      </div>
      <p className="mt-1.5 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
