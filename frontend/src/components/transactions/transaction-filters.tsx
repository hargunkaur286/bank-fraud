"use client";

import type { ReactNode } from "react";
import { RotateCcw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EMPTY_FILTERS, type TransactionFilterState } from "@/lib/filter-transactions";

const STATUS_OPTIONS: Array<{ value: TransactionFilterState["status"]; label: string }> = [
  { value: "ALL", label: "All statuses" },
  { value: "COMPLETED", label: "Completed" },
  { value: "PROCESSING", label: "Processing" },
  { value: "PENDING_VERIFICATION", label: "Pending Verification" },
  { value: "FLAGGED", label: "Flagged" },
  { value: "FAILED", label: "Failed" },
  { value: "PENDING", label: "Pending" },
];

const TYPE_OPTIONS: Array<{ value: TransactionFilterState["type"]; label: string }> = [
  { value: "ALL", label: "All types" },
  { value: "TRANSFER", label: "Transfer" },
  { value: "DEPOSIT", label: "Deposit" },
  { value: "WITHDRAWAL", label: "Withdrawal" },
  { value: "PAYMENT", label: "Payment" },
];

export function TransactionFilters({
  filters,
  onChange,
}: {
  filters: TransactionFilterState;
  onChange: (filters: TransactionFilterState) => void;
}) {
  const update = (patch: Partial<TransactionFilterState>) =>
    onChange({ ...filters, ...patch });

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by reference, account, or description"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="pl-8"
          />
        </div>
        <Select
          value={filters.status}
          onValueChange={(v) => update({ status: v as TransactionFilterState["status"] })}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.type}
          onValueChange={(v) => update({ type: v as TransactionFilterState["type"] })}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Field label="From date">
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => update({ dateFrom: e.target.value })}
            className="w-40"
          />
        </Field>
        <Field label="To date">
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => update({ dateTo: e.target.value })}
            className="w-40"
          />
        </Field>
        <Field label="Min amount">
          <Input
            type="number"
            placeholder="0"
            value={filters.amountMin}
            onChange={(e) => update({ amountMin: e.target.value })}
            className="w-28"
          />
        </Field>
        <Field label="Max amount">
          <Input
            type="number"
            placeholder="Any"
            value={filters.amountMax}
            onChange={(e) => update({ amountMax: e.target.value })}
            className="w-28"
          />
        </Field>
        <Button variant="ghost" size="sm" onClick={() => onChange(EMPTY_FILTERS)}>
          <RotateCcw className="size-3.5" />
          Reset
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}
