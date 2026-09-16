"use client";

import { Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveAccount } from "@/lib/account-context";
import { useAccountTransactions } from "@/hooks/use-account-transactions";
import { FraudStatusCard, computeFraudMetrics } from "@/components/fraud/fraud-status-card";
import { FraudActivityChart } from "@/components/fraud/fraud-activity-chart";
import { SecurityEventsTable } from "@/components/fraud/security-events-table";

export default function FraudSecurityPage() {
  const { account } = useActiveAccount();
  const { transactions, isLoading, error } = useAccountTransactions(account?.accountNumber);

  if (!account) return null;

  const metrics = computeFraudMetrics(transactions);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Fraud &amp; Security</h1>
        <p className="text-sm text-muted-foreground">
          Every transfer from this account is automatically screened.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        The fraud detection service runs on transaction data and has no
        reporting API of its own, so every metric on this page is calculated
        from this account&apos;s transaction history, not a system-wide feed.
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : error ? (
        <p className="text-sm text-destructive">{error.message}</p>
      ) : (
        <>
          <FraudStatusCard metrics={metrics} />
          <FraudActivityChart transactions={transactions} />
          <Card>
            <CardHeader>
              <CardTitle>Recent security events</CardTitle>
              <CardDescription>
                Transfers that were flagged, required verification, or failed
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 sm:px-0">
              <SecurityEventsTable transactions={transactions} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
