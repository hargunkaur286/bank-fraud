"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActiveAccount } from "@/lib/account-context";
import { accountNumberSchema } from "@/lib/validation";
import { z } from "zod";

const schema = z.object({ accountNumber: accountNumberSchema });
type Values = z.infer<typeof schema>;

export function EnterAccountForm() {
  const { switchAccount } = useActiveAccount();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: Values) => {
    setServerError(null);
    try {
      await switchAccount(values.accountNumber);
    } catch {
      setServerError(
        "We couldn't find an account with that number. Double-check it and try again.",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="accountNumber">Account number</Label>
        <Input
          id="accountNumber"
          placeholder="e.g. 302102309885"
          inputMode="numeric"
          autoComplete="off"
          {...register("accountNumber")}
        />
        {errors.accountNumber ? (
          <p className="text-xs text-destructive">{errors.accountNumber.message}</p>
        ) : null}
        {serverError ? <p className="text-xs text-destructive">{serverError}</p> : null}
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <LogIn className="size-4" />
        )}
        Continue
      </Button>
    </form>
  );
}
