"use client";

import { useState } from "react";
import Script from "next/script";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, CreditCard, Info, Loader2, XCircle } from "lucide-react";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useActiveAccount } from "@/lib/account-context";
import { createPaymentOrder } from "@/lib/api/payments";
import type { ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

const schema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  description: z.string().trim().max(140, "Keep it under 140 characters").optional(),
});
type Values = z.infer<typeof schema>;

type Result = { kind: "success" } | { kind: "cancelled" } | { kind: "error"; message: string };

export default function PaymentsPage() {
  const { account, refresh } = useActiveAccount();
  const [scriptReady, setScriptReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  if (!account) return null;

  const onSubmit = async (values: Values) => {
    setIsSubmitting(true);
    setResult(null);
    try {
      const order = await createPaymentOrder({
        accountNumber: account.accountNumber,
        amount: values.amount,
        description: values.description,
      });

      if (!scriptReady || !window.Razorpay) {
        setResult({
          kind: "error",
          message: "Payment provider hasn't loaded yet. Please try again in a moment.",
        });
        return;
      }

      const checkout = new window.Razorpay({
        key: order.razorpayKeyId,
        amount: Math.round(order.amount * 100),
        currency: order.currency,
        order_id: order.razorpayOrderId,
        name: "Coverstone Bank",
        description: values.description || "Add money",
        prefill: {
          name: account.accountHolderName,
          email: account.email,
          contact: account.phone,
        },
        theme: { color: "#2a78d6" },
        handler: () => {
          setResult({ kind: "success" });
          reset();
          refresh();
        },
        modal: {
          ondismiss: () => setResult({ kind: "cancelled" }),
        },
      });
      checkout.open();
    } catch (err) {
      setResult({ kind: "error", message: (err as ApiError).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
        <p className="text-sm text-muted-foreground">Add money to your account via Razorpay.</p>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        Payments are confirmed by Razorpay&apos;s webhook directly to the
        bank&apos;s payment service. There&apos;s no endpoint yet for this app
        to poll a payment&apos;s final status, so the confirmation below
        reflects the Razorpay checkout result, not a verified backend update.
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <CreditCard className="mr-1 inline size-4" /> Add money
          </CardTitle>
          <CardDescription>
            To account {account.accountNumber} · Balance {formatCurrency(account.balance)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input id="amount" type="number" step="0.01" min="0" {...register("amount")} />
              {errors.amount ? (
                <p className="text-xs text-destructive">{errors.amount.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea id="description" rows={2} {...register("description")} />
            </div>

            {result?.kind === "success" ? (
              <StatusMessage
                tone="good"
                icon={CheckCircle2}
                title="Payment submitted"
                message="Razorpay confirmed the payment on your end. It will reflect in your balance once the bank's webhook processes it."
              />
            ) : null}
            {result?.kind === "cancelled" ? (
              <StatusMessage
                tone="warning"
                icon={XCircle}
                title="Payment cancelled"
                message="You closed the payment window before completing it."
              />
            ) : null}
            {result?.kind === "error" ? (
              <StatusMessage tone="critical" icon={XCircle} title="Something went wrong" message={result.message} />
            ) : null}

            <Button type="submit" className="w-full" disabled={isSubmitting || !scriptReady}>
              {isSubmitting || !scriptReady ? <Loader2 className="size-4 animate-spin" /> : null}
              {scriptReady ? "Continue to pay" : "Loading payment provider…"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

const TONE_CLASSES: Record<string, string> = {
  good: "border-status-good/20 bg-status-good/5 text-foreground",
  warning: "border-status-warning/25 bg-status-warning/10 text-foreground",
  critical: "border-status-critical/20 bg-status-critical/5 text-foreground",
};

function StatusMessage({
  tone,
  icon: Icon,
  title,
  message,
}: {
  tone: keyof typeof TONE_CLASSES;
  icon: typeof CheckCircle2;
  title: string;
  message: string;
}) {
  return (
    <div className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${TONE_CLASSES[tone]}`}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-0.5 text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
