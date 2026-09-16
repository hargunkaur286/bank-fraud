"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getAccount } from "@/lib/api/accounts";
import type { AccountResponse } from "@/lib/api";
import { transferSchema, type TransferFormValues } from "@/lib/validation";
import { formatCurrency, maskAccountNumber } from "@/lib/format";

export function TransferForm({
  senderAccount,
  onContinue,
}: {
  senderAccount: AccountResponse;
  onContinue: (values: TransferFormValues, recipient: AccountResponse) => void;
}) {
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: { senderAccountNumber: senderAccount.accountNumber },
  });

  const onSubmit = async (values: TransferFormValues) => {
    setLookupError(null);

    if (values.receiverAccountNumber === senderAccount.accountNumber) {
      setLookupError("You can't send money to your own account.");
      return;
    }
    if (values.amount > senderAccount.balance) {
      setLookupError("That amount exceeds your available balance.");
      return;
    }
    if (values.amount > senderAccount.dailyTransactionLimit) {
      setLookupError("That amount exceeds your daily transfer limit.");
      return;
    }

    setIsLookingUp(true);
    try {
      const recipient = await getAccount(values.receiverAccountNumber);
      onContinue(values, recipient);
    } catch {
      setLookupError(
        "We couldn't find an account with that number. Double-check it and try again.",
      );
    } finally {
      setIsLookingUp(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <Label>From</Label>
        <div className="flex items-center justify-between rounded-md border border-input bg-muted/40 px-3 py-2.5 text-sm">
          <span className="font-medium">{senderAccount.accountHolderName}</span>
          <span className="font-mono text-muted-foreground">
            {maskAccountNumber(senderAccount.accountNumber)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Available balance: {formatCurrency(senderAccount.balance)}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="receiverAccountNumber">Recipient account number</Label>
        <Input
          id="receiverAccountNumber"
          inputMode="numeric"
          placeholder="Enter 12-digit account number"
          {...register("receiverAccountNumber")}
        />
        {errors.receiverAccountNumber ? (
          <p className="text-xs text-destructive">{errors.receiverAccountNumber.message}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="amount">Amount (₹)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          {...register("amount")}
        />
        {errors.amount ? (
          <p className="text-xs text-destructive">{errors.amount.message}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          placeholder="What's this for?"
          rows={2}
          {...register("description")}
        />
        {errors.description ? (
          <p className="text-xs text-destructive">{errors.description.message}</p>
        ) : null}
      </div>

      {lookupError ? (
        <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {lookupError}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isLookingUp}>
        {isLookingUp ? <Loader2 className="size-4 animate-spin" /> : null}
        Continue
        {!isLookingUp ? <ArrowRight className="size-4" /> : null}
      </Button>
    </form>
  );
}
