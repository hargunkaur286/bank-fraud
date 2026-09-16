"use client";

import Link from "next/link";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Receipt } from "lucide-react";
import { useActiveAccount } from "@/lib/account-context";
import { useAccountTransactions } from "@/hooks/use-account-transactions";
import { BalanceCard } from "@/components/dashboard/balance-card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { StatusSummary } from "@/components/dashboard/status-summary";
import { FraudStatusCard, computeFraudMetrics } from "@/components/fraud/fraud-status-card";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";

export default function DashboardPage() {
  const { account } = useActiveAccount();
  const { transactions, isLoading, error } = useAccountTransactions(account?.accountNumber);

  if (!account) return null;

  const totalSent = transactions
    .filter((t) => t.status === "COMPLETED")
    .reduce((sum, t) => sum + t.amount, 0);
  const metrics = computeFraudMetrics(transactions);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {account.accountHolderName.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening with your account today.
        </p>
      </div>

      <BalanceCard account={account} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Total money sent"
          value={formatCurrency(totalSent)}
          icon={ArrowUpRight}
          hint="Completed transfers"
          accent="critical"
        />
        <StatsCard
          label="Total money received"
          value="—"
          icon={ArrowDownLeft}
          unavailableReason="The backend only exposes transfers where this account is the sender - there's no endpoint yet for incoming transfers."
          accent="good"
        />
        <StatsCard
          label="Transactions"
          value={String(transactions.length)}
          icon={Receipt}
          hint="All-time, this account"
          accent="info"
        />
        <StatsCard
          label="Daily transfer limit"
          value={formatCurrency(account.dailyTransactionLimit)}
          icon={ArrowRight}
          hint={`${account.accountType.replace("_", " ")} account`}
          accent="violet"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {isLoading ? <Skeleton className="h-80 w-full rounded-xl" /> : (
            <ActivityChart transactions={transactions} />
          )}
        </div>
        <div>
          {isLoading ? <Skeleton className="h-80 w-full rounded-xl" /> : (
            <StatusSummary transactions={transactions} />
          )}
        </div>
      </div>

      <FraudStatusCard metrics={metrics} compact />

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Recent transactions</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/transactions">
              View all <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="px-0 sm:px-0">
          {isLoading ? (
            <div className="space-y-2 px-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : error ? (
            <p className="px-6 py-4 text-sm text-destructive">{error.message}</p>
          ) : (
            <TransactionTable
              transactions={transactions.slice(0, 5)}
              emptyMessage="No transactions yet. Send your first transfer to see it here."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
