"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActiveAccount } from "@/lib/account-context";
import { loginSchema, type LoginFormValues } from "@/lib/validation";
import { getRecentLogins } from "@/lib/session";
import type { ApiError } from "@/lib/api";

export function LoginForm() {
  const { login } = useActiveAccount();
  const [serverError, setServerError] = useState<string | null>(null);
  // This component only ever mounts client-side (after AccountGate's
  // isReady flips post-hydration), so reading localStorage in the lazy
  // initializer here can't cause a hydration mismatch.
  const [recent] = useState(() => getRecentLogins());

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      await login(values.email, values.password);
    } catch (err) {
      setServerError((err as ApiError).message);
    }
  };

  return (
    <div className="space-y-4">
      {recent.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {recent.map((entry) => (
            <button
              key={entry.accountNumber}
              type="button"
              onClick={() => setValue("email", entry.email)}
              className="rounded-full border border-input bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted"
            >
              {entry.accountHolderName.split(" ")[0]} · {entry.email}
            </button>
          ))}
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          {errors.email ? (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
          {errors.password ? (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          ) : null}
        </div>
        {serverError ? <p className="text-xs text-destructive">{serverError}</p> : null}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LogIn className="size-4" />
          )}
          Log in
        </Button>
      </form>
    </div>
  );
}
