"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TransactionStatusBadge } from "@/components/transactions/transaction-status-badge";
import { TransactionTimeline } from "@/components/transactions/transaction-timeline";
import { useTransactionPolling } from "@/hooks/use-transaction-polling";
import { getTransaction } from "@/lib/api/transactions";
import type { ApiError, TransactionResponse } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/format";

export function TransactionDetailClient({ transactionId }: { transactionId: string }) {
  const [transaction, setTransaction] = useState<TransactionResponse | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let cancelled = false;
    getTransaction(transactionId)
      .then((data) => !cancelled && setTransaction(data))
      .catch((err) => !cancelled && setError(err as ApiError));
    return () => {
      cancelled = true;
    };
  }, [transactionId]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/transactions">
          <ArrowLeft className="size-3.5" />
          Back to transactions
        </Link>
      </Button>

      {error ? (
        <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error.message}
        </p>
      ) : !transaction ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <TransactionDetailBody transaction={transaction} />
      )}
    </div>
  );
}

function TransactionDetailBody({ transaction }: { transaction: TransactionResponse }) {
  const { transaction: latest } = useTransactionPolling(transaction);

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>Transaction details</CardTitle>
            <CardDescription>Reference {latest.referenceNumber}</CardDescription>
          </div>
          <TransactionStatusBadge status={latest.status} />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="overflow-x-auto pb-2">
            <TransactionTimeline status={latest.status} />
          </div>

          <Separator />

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Detail label="Amount" value={formatCurrency(latest.amount)} emphasize />
            <Detail label="Type" value={latest.type} />
            <Detail label="Transaction ID" value={latest.id} mono />
            <Detail label="Reference number" value={latest.referenceNumber} mono />
            <Detail label="Sender account" value={latest.senderAccountNumber} mono />
            <Detail label="Receiver account" value={latest.receiverAccountNumber} mono />
            <Detail label="Created at" value={formatDateTime(latest.createdAt)} />
            <Detail label="Completed at" value={formatDateTime(latest.completedAt)} />
          </dl>

          {latest.description ? (
            <div>
              <p className="text-xs text-muted-foreground">Description</p>
              <p className="mt-1 text-sm">{latest.description}</p>
            </div>
          ) : null}

          {latest.failureReason ? (
            <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {latest.failureReason}
            </div>
          ) : null}

          {latest.status === "PENDING_VERIFICATION" ? (
            <Button asChild className="w-full">
              <Link href={`/transactions/${latest.id}/verify`}>
                <KeyRound className="size-4" />
                Verify this transaction
              </Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </>
  );
}

function Detail({
  label,
  value,
  mono,
  emphasize,
}: {
  label: string;
  value: string;
  mono?: boolean;
  emphasize?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`mt-0.5 text-sm ${mono ? "font-mono text-xs" : ""} ${
          emphasize ? "text-lg font-semibold" : "font-medium"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
