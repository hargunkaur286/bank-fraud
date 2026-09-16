"use client";

import { useState } from "react";
import { PlusCircle, ShieldOff, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountCard } from "@/components/accounts/account-card";
import { EnterAccountForm } from "@/components/onboarding/enter-account-form";
import { CreateAccountForm } from "@/components/onboarding/create-account-form";
import { useActiveAccount } from "@/lib/account-context";
import { useKnownAccounts } from "@/hooks/use-known-accounts";

export default function AccountsPage() {
  const { account, switchAccount } = useActiveAccount();
  const { entries, isLoading, forget } = useKnownAccounts();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!account) return null;

  const others = entries.filter((e) => e.accountNumber !== account.accountNumber);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
          <p className="text-sm text-muted-foreground">
            The active account, plus any others you&apos;ve added on this browser.
          </p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <PlusCircle className="size-4" />
          Add account
        </Button>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Active</p>
        <AccountCard account={account} active />
      </div>

      {others.length > 0 || isLoading ? (
        <div>
          <p className="mb-2 text-sm font-medium">Others on this browser</p>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((entry) =>
                entry.account ? (
                  <div key={entry.accountNumber} className="group relative">
                    <button
                      className="block w-full text-left"
                      onClick={() => switchAccount(entry.accountNumber)}
                    >
                      <AccountCard account={entry.account} />
                    </button>
                    <button
                      onClick={() => {
                        forget(entry.accountNumber);
                        toast("Removed from this browser", {
                          description: `${entry.accountNumber} is no longer saved here. The account itself is unaffected.`,
                        });
                      }}
                      title="Remove from this browser"
                      className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-background/80 text-muted-foreground opacity-0 shadow-sm ring-1 ring-border transition-opacity group-hover:opacity-100 hover:text-destructive"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    key={entry.accountNumber}
                    className="flex items-center justify-between rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldOff className="size-4" />
                      {entry.accountNumber} no longer exists
                    </span>
                    <button
                      onClick={() => forget(entry.accountNumber)}
                      className="text-xs underline"
                    >
                      Remove
                    </button>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add an account</DialogTitle>
            <DialogDescription>
              Switch to an account you already have, or create a new one.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="existing">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing">Existing account</TabsTrigger>
              <TabsTrigger value="new">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="existing" className="pt-4">
              <EnterAccountForm />
            </TabsContent>
            <TabsContent value="new" className="pt-4">
              <CreateAccountForm />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
