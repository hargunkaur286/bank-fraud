"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ShieldQuestion, TimerReset } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OTPInput } from "@/components/otp/otp-input";
import { TransactionProcessing } from "@/components/transfer/transaction-processing";
import { getTransaction, verifyOtp } from "@/lib/api/transactions";
import type { ApiError, TransactionResponse } from "@/lib/api";
import { formatCurrency, maskAccountNumber } from "@/lib/format";

export function OtpVerifyClient({ transactionId }: { transactionId: string }) {
  const [transaction, setTransaction] = useState<TransactionResponse | null>(null);
  const [loadError, setLoadError] = useState<ApiError | null>(null);
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<ApiError | null>(null);

  useEffect(() => {
    let cancelled = false;
    getTransaction(transactionId)
      .then((data) => !cancelled && setTransaction(data))
      .catch((err) => !cancelled && setLoadError(err as ApiError));
    return () => {
      cancelled = true;
    };
  }, [transactionId]);

  const handleVerify = async () => {
    if (!transaction) return;
    setIsVerifying(true);
    setVerifyError(null);
    try {
      const updated = await verifyOtp(transaction.id, otp);
      setTransaction(updated);
    } catch (err) {
      setVerifyError(err as ApiError);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Verify Transaction</h1>
        <p className="text-sm text-muted-foreground">
          Confirm this transfer with the one-time code.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>One-time verification</CardTitle>
          <CardDescription>
            Our fraud detection system flagged this transfer for extra verification.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadError ? (
            <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {loadError.message}
            </p>
          ) : !transaction ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : transaction.status !== "PENDING_VERIFICATION" ? (
            <TransactionProcessing
              transaction={transaction}
              actions={
                <Button asChild className="flex-1">
                  <Link href={`/transactions/${transaction.id}`}>View details</Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-5">
              <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold">{formatCurrency(transaction.amount)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-muted-foreground">From account</span>
                  <span className="font-mono text-xs">
                    {maskAccountNumber(transaction.senderAccountNumber)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-muted-foreground">To account</span>
                  <span className="font-mono text-xs">
                    {maskAccountNumber(transaction.receiverAccountNumber)}
                  </span>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Enter the 6-digit code</p>
                <OTPInput value={otp} onChange={setOtp} disabled={isVerifying} />
              </div>

              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <TimerReset className="mt-0.5 size-3.5 shrink-0" />
                This code expires shortly after being generated. If it has
                expired, verifying will mark this transfer as failed and
                automatically refund the amount.
              </div>

              <div className="flex items-start gap-2 rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                <ShieldQuestion className="mt-0.5 size-3.5 shrink-0" />
                Resending a code isn&apos;t available yet - if this one
                expires, you&apos;ll need to start a new transfer.
              </div>

              {verifyError ? (
                <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {verifyError.message}
                </p>
              ) : null}

              <Button
                className="w-full"
                disabled={otp.length !== 6 || isVerifying}
                onClick={handleVerify}
              >
                {isVerifying ? <Loader2 className="size-4 animate-spin" /> : null}
                Verify
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
