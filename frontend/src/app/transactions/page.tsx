"use client";

import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveAccount } from "@/lib/account-context";
import { useAccountTransactions } from "@/hooks/use-account-transactions";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { EMPTY_FILTERS, filterTransactions } from "@/lib/filter-transactions";

export default function TransactionsPage() {
  const { account } = useActiveAccount();
  const { transactions, isLoading, error, refresh } = useAccountTransactions(
    account?.accountNumber,
  );
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const filtered = useMemo(
    () => filterTransactions(transactions, filters),
    [transactions, filters],
  );

  if (!account) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            All transfers sent from {account.accountNumber}.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
          <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter transactions</CardTitle>
          <CardDescription>
            Filtering happens in your browser - the backend doesn&apos;t support
            server-side search or pagination yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionFilters filters={filters} onChange={setFilters} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-0 sm:px-0">
          {isLoading ? (
            <div className="space-y-2 p-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : error ? (
            <p className="p-6 text-sm text-destructive">{error.message}</p>
          ) : (
            <TransactionTable
              transactions={filtered}
              emptyMessage={
                transactions.length === 0
                  ? "No transactions yet. Send your first transfer to see it here."
                  : "No transactions match your filters."
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
