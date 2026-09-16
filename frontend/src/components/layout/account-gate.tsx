"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useActiveAccount } from "@/lib/account-context";
import { OnboardingScreen } from "@/components/onboarding/onboarding-screen";
import { AppShell } from "./app-shell";

export function AccountGate({ children }: { children: ReactNode }) {
  const { account, isReady } = useActiveAccount();

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!account) {
    return <OnboardingScreen />;
  }

  return <AppShell>{children}</AppShell>;
}
