"use client";

import Link from "next/link";
import { Eye, EyeOff, Send, PlusCircle } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AccountResponse } from "@/lib/api";
import { formatCurrency, maskAccountNumber } from "@/lib/format";

const ACCOUNT_TYPE_LABEL: Record<AccountResponse["accountType"], string> = {
  SAVINGS: "Savings Account",
  CURRENT: "Current Account",
  FIXED_DEPOSIT: "Fixed Deposit",
};

export function BalanceCard({ account }: { account: AccountResponse }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <Card className="relative overflow-hidden border-none bg-sidebar text-sidebar-foreground">
      <div className="bg-card-texture pointer-events-none absolute inset-0" />
      <CardContent className="relative px-6 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-9 rounded-[5px] bg-linear-to-br from-sidebar-primary/70 to-sidebar-primary/30 ring-1 ring-white/15" />
            <span className="text-xs font-semibold tracking-wide text-sidebar-foreground/60 uppercase">
              {ACCOUNT_TYPE_LABEL[account.accountType]}
            </span>
          </div>
          <Badge
            variant="outline"
            className="border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground"
          >
            {account.status === "ACTIVE" ? "Active" : account.status}
          </Badge>
        </div>

        <div className="mt-6">
          <p className="text-xs font-medium text-sidebar-foreground/60">Available balance</p>
          <p className="mt-1 text-4xl font-extrabold tracking-tight text-sidebar-foreground">
            {formatCurrency(account.balance)}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-sidebar-foreground/50">Account number</span>
            <span className="font-mono tracking-wide">
              {revealed ? account.accountNumber : maskAccountNumber(account.accountNumber)}
            </span>
            <button
              onClick={() => setRevealed((r) => !r)}
              className="text-sidebar-foreground/50 hover:text-sidebar-foreground"
              aria-label={revealed ? "Hide account number" : "Show account number"}
            >
              {revealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="sm" variant="secondary">
            <Link href="/send-money">
              <Send className="size-4" />
              Send Money
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Link href="/payments">
              <PlusCircle className="size-4" />
              Add Money
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
