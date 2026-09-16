"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActiveAccount } from "@/lib/account-context";
import { createAccount } from "@/lib/api/accounts";
import type { ApiError } from "@/lib/api";
import { createAccountSchema, type CreateAccountFormValues } from "@/lib/validation";

export function CreateAccountForm() {
  const { switchAccount } = useActiveAccount();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateAccountFormValues>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: { accountType: "SAVINGS" },
  });

  const onSubmit = async (values: CreateAccountFormValues) => {
    setServerError(null);
    try {
      const created = await createAccount(values);
      await switchAccount(created.accountNumber);
    } catch (err) {
      setServerError((err as ApiError).message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="accountHolderName">Full name</Label>
        <Input id="accountHolderName" {...register("accountHolderName")} />
        {errors.accountHolderName ? (
          <p className="text-xs text-destructive">{errors.accountHolderName.message}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email ? (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register("phone")} />
          {errors.phone ? (
            <p className="text-xs text-destructive">{errors.phone.message}</p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Account type</Label>
          <Controller
            control={control}
            name="accountType"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAVINGS">Savings</SelectItem>
                  <SelectItem value="CURRENT">Current</SelectItem>
                  <SelectItem value="FIXED_DEPOSIT">Fixed Deposit</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="initialDeposit">Opening deposit (₹)</Label>
          <Input
            id="initialDeposit"
            type="number"
            step="0.01"
            min="0"
            {...register("initialDeposit")}
          />
          {errors.initialDeposit ? (
            <p className="text-xs text-destructive">{errors.initialDeposit.message}</p>
          ) : null}
        </div>
      </div>

      {serverError ? <p className="text-xs text-destructive">{serverError}</p> : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <UserPlus className="size-4" />
        )}
        Create account
      </Button>
    </form>
  );
}
