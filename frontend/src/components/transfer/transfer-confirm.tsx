"use client";

import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AccountResponse } from "@/lib/api";
import type { TransferFormValues } from "@/lib/validation";
import { formatCurrency, maskAccountNumber } from "@/lib/format";

export function TransferConfirm({
  values,
  sender,
  recipient,
  isSubmitting,
  onConfirm,
  onBack,
}: {
  values: TransferFormValues;
  sender: AccountResponse;
  recipient: AccountResponse;
  isSubmitting: boolean;
  onConfirm: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
        <p className="text-xs text-muted-foreground">You&apos;re sending</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight">
          {formatCurrency(values.amount)}
        </p>
      </div>

      <dl className="space-y-3 text-sm">
        <Row label="From" value={sender.accountHolderName} sub={maskAccountNumber(sender.accountNumber)} />
        <Row
          label="To"
          value={recipient.accountHolderName}
          sub={maskAccountNumber(recipient.accountNumber)}
        />
        {values.description ? <Row label="Description" value={values.description} /> : null}
      </dl>

      <div className="flex items-start gap-2 rounded-md bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
        Every transfer is automatically screened for fraud. Some transfers may
        require a one-time verification code before completing.
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Button type="button" className="flex-1" onClick={onConfirm} disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
          Confirm &amp; Send
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2.5 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right">
        <span className="font-medium">{value}</span>
        {sub ? <span className="ml-2 font-mono text-xs text-muted-foreground">{sub}</span> : null}
      </dd>
    </div>
  );
}
