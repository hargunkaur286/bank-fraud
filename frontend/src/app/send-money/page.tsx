"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useActiveAccount } from "@/lib/account-context";
import { TransferForm } from "@/components/transfer/transfer-form";
import { TransferConfirm } from "@/components/transfer/transfer-confirm";
import { TransferProcessingStep } from "@/components/transfer/transfer-processing-step";
import { transfer } from "@/lib/api/transactions";
import type { AccountResponse, ApiError, TransactionResponse } from "@/lib/api";
import type { TransferFormValues } from "@/lib/validation";

type Step = "form" | "confirm" | "processing";

export default function SendMoneyPage() {
  const { account, refresh } = useActiveAccount();
  const [step, setStep] = useState<Step>("form");
  const [values, setValues] = useState<TransferFormValues | null>(null);
  const [recipient, setRecipient] = useState<AccountResponse | null>(null);
  const [transaction, setTransaction] = useState<TransactionResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<ApiError | null>(null);

  if (!account) return null;

  if (account.status !== "ACTIVE") {
    return (
      <div className="mx-auto max-w-lg">
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>This account is {account.status.toLowerCase()}</AlertTitle>
          <AlertDescription>
            You can&apos;t send money from an account that isn&apos;t active.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleConfirmSubmit = async () => {
    if (!values) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const created = await transfer(values);
      setTransaction(created);
      setStep("processing");
    } catch (err) {
      setSubmitError(err as ApiError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFlow = () => {
    setStep("form");
    setValues(null);
    setRecipient(null);
    setTransaction(null);
    setSubmitError(null);
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Send Money</h1>
        <p className="text-sm text-muted-foreground">
          Transfer funds to another account securely.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {step === "form" && "Transfer details"}
            {step === "confirm" && "Review & confirm"}
            {step === "processing" && "Transfer status"}
          </CardTitle>
          <CardDescription>
            {step === "form" && "Enter the recipient and amount."}
            {step === "confirm" && "Double-check everything before sending."}
            {step === "processing" && "We're processing your transfer."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "form" && (
            <TransferForm
              senderAccount={account}
              onContinue={(v, r) => {
                setValues(v);
                setRecipient(r);
                setStep("confirm");
              }}
            />
          )}

          {step === "confirm" && values && recipient && (
            <>
              <TransferConfirm
                values={values}
                sender={account}
                recipient={recipient}
                isSubmitting={isSubmitting}
                onConfirm={handleConfirmSubmit}
                onBack={() => setStep("form")}
              />
              {submitError ? (
                <p className="mt-4 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {submitError.message}
                </p>
              ) : null}
            </>
          )}

          {step === "processing" && transaction && (
            <TransferProcessingStep
              transaction={transaction}
              onSettledCompleted={refresh}
              onSendAnother={resetFlow}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
