"use client";

import { KeyRound, LogOut, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AccountCard } from "@/components/accounts/account-card";
import { useActiveAccount } from "@/lib/account-context";

export default function AccountsPage() {
  const { account, token, signOut } = useActiveAccount();

  if (!account) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
          <p className="text-sm text-muted-foreground">The account you&apos;re currently signed into.</p>
        </div>
        <Button variant="outline" size="sm" onClick={signOut}>
          <LogOut className="size-3.5" />
          Switch account
        </Button>
      </div>

      <AccountCard account={account} active />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {token ? (
              <>
                <KeyRound className="size-4 text-status-good" />
                Signed in with a password
              </>
            ) : (
              <>
                <ShieldAlert className="size-4 text-status-warning" />
                Legacy access
              </>
            )}
          </CardTitle>
          <CardDescription>
            {token
              ? "This session was authenticated with email and password - actions like blocking the account are available."
              : "This account was created before login existed and has no password on file. You accessed it by account number alone, so password-gated actions (like blocking it) aren't available in this session."}
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
