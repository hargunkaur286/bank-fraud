"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TransactionProcessing } from "@/components/transfer/transaction-processing";
import { useTransactionPolling } from "@/hooks/use-transaction-polling";
import type { TransactionResponse } from "@/lib/api";

export function TransferProcessingStep({
  transaction,
  onSettledCompleted,
  onSendAnother,
}: {
  transaction: TransactionResponse;
  onSettledCompleted?: () => void;
  onSendAnother: () => void;
}) {
  const router = useRouter();
  const { transaction: latest, isSettled, timedOut } = useTransactionPolling(transaction);

  useEffect(() => {
    if (!isSettled) return;
    if (latest.status === "PENDING_VERIFICATION") {
      router.push(`/transactions/${latest.id}/verify`);
    } else if (latest.status === "COMPLETED") {
      onSettledCompleted?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSettled, latest.status, latest.id]);

  return (
    <TransactionProcessing
      transaction={latest}
      timedOut={timedOut}
      actions={
        isSettled && latest.status !== "PENDING_VERIFICATION" ? (
          <>
            <Button variant="outline" onClick={onSendAnother}>
              Send another
            </Button>
            <Button asChild className="flex-1">
              <Link href={`/transactions/${latest.id}`}>View details</Link>
            </Button>
          </>
        ) : undefined
      }
    />
  );
}
