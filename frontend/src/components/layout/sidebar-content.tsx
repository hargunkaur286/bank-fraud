"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";
import { useActiveAccount } from "@/lib/account-context";
import { maskAccountNumber } from "@/lib/format";

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { account, signOut } = useActiveAccount();

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <span className="text-base font-extrabold tracking-tight text-sidebar-foreground">
          Coverstone
        </span>
        <div className="mt-1.5 h-0.75 w-7 rounded-full bg-sidebar-primary" />
        <p className="mt-2 text-[11px] text-sidebar-foreground/50">
          Digital Banking &amp; Fraud Detection
        </p>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md border-l-2 px-3 py-2.5 text-sm font-semibold transition-colors",
                isActive
                  ? "border-sidebar-primary bg-sidebar-accent/70 text-sidebar-accent-foreground"
                  : "border-transparent text-sidebar-foreground/65 hover:border-sidebar-border hover:bg-sidebar-accent/40 hover:text-sidebar-foreground",
              )}
            >
              <Icon
                className={cn(
                  "size-4.5 shrink-0",
                  isActive ? "text-sidebar-primary" : "text-sidebar-foreground/50",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        {account ? (
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
              {account.accountHolderName
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">
                {account.accountHolderName}
              </p>
              <p className="truncate text-[11px] text-sidebar-foreground/50">
                {maskAccountNumber(account.accountNumber)}
              </p>
            </div>
            <button
              onClick={() => {
                signOut();
                onNavigate?.();
              }}
              title="Switch account"
              className="flex size-8 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
