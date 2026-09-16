"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Loader2, LogOut, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useActiveAccount } from "@/lib/account-context";
import { blockAccount } from "@/lib/api/accounts";
import type { ApiError } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";

export default function SettingsPage() {
  const { account, token, refresh, signOut } = useActiveAccount();
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [blockError, setBlockError] = useState<ApiError | null>(null);

  if (!account) return null;

  const handleBlock = async () => {
    setIsBlocking(true);
    setBlockError(null);
    try {
      await blockAccount(account.accountNumber);
      await refresh();
      setBlockDialogOpen(false);
      toast.success("Account blocked", {
        description: `${account.accountNumber} can no longer send or receive transfers.`,
      });
    } catch (err) {
      setBlockError(err as ApiError);
    } finally {
      setIsBlocking(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage this account and how this browser connects to it.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account details</CardTitle>
          <CardDescription>Read-only - the backend has no profile-edit endpoint yet</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Detail label="Account holder" value={account.accountHolderName} />
            <Detail label="Account number" value={account.accountNumber} mono />
            <Detail label="Email" value={account.email} />
            <Detail label="Phone" value={account.phone} />
            <Detail label="Account type" value={account.accountType.replace("_", " ")} />
            <Detail label="Status" value={account.status} />
            <Detail label="Balance" value={formatCurrency(account.balance)} />
            <Detail label="Daily transfer limit" value={formatCurrency(account.dailyTransactionLimit)} />
            <Detail label="Opened" value={formatDate(account.createdAt)} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>This session</CardTitle>
          <CardDescription>
            {token
              ? "You're signed in with email and password."
              : "You're using legacy account-number access - this account has no password on file."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Session details</p>
            <p className="text-xs text-muted-foreground">
              View the account and session type for this browser.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/accounts">View</Link>
          </Button>
        </CardContent>
        <Separator />
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Sign out of this account</p>
            <p className="text-xs text-muted-foreground">
              Forgets this account on this browser only.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="size-3.5" />
            Sign out
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>This action is permanent and cannot be undone from this app.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Block this account</p>
            <p className="text-xs text-muted-foreground">
              {token
                ? "Prevents any future transfers from this account."
                : "Requires a password-authenticated session - log in with email and password to do this."}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-destructive/30 text-destructive hover:bg-destructive/5"
            disabled={account.status !== "ACTIVE" || !token}
            onClick={() => setBlockDialogOpen(true)}
          >
            <ShieldOff className="size-3.5" />
            {account.status !== "ACTIVE"
              ? `Already ${account.status.toLowerCase()}`
              : !token
                ? "Log in required"
                : "Block account"}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-destructive" />
              Block this account?
            </DialogTitle>
            <DialogDescription>
              Account {account.accountNumber} won&apos;t be able to send or
              receive transfers after this. This can&apos;t be undone from
              here.
            </DialogDescription>
          </DialogHeader>
          {blockError ? (
            <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {blockError.message}
            </p>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)} disabled={isBlocking}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBlock} disabled={isBlocking}>
              {isBlocking ? <Loader2 className="size-4 animate-spin" /> : null}
              Block account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-sm font-medium ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
