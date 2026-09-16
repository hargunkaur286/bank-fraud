import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TransactionStatusBadge } from "@/components/transactions/transaction-status-badge";
import type { TransactionResponse } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/format";

const SECURITY_STATUSES = new Set(["FLAGGED", "PENDING_VERIFICATION", "FAILED"]);

export function SecurityEventsTable({ transactions }: { transactions: TransactionResponse[] }) {
  const events = transactions.filter((t) => SECURITY_STATUSES.has(t.status));

  if (events.length === 0) {
    return (
      <div className="flex h-28 items-center justify-center text-sm text-muted-foreground">
        No security events - every transaction has been clean.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Reason</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatDateTime(tx.createdAt)}
              </TableCell>
              <TableCell>
                <Link href={`/transactions/${tx.id}`} className="font-mono text-xs hover:underline">
                  {tx.referenceNumber.slice(0, 8)}
                </Link>
              </TableCell>
              <TableCell className="tabular-nums">{formatCurrency(tx.amount)}</TableCell>
              <TableCell>
                <TransactionStatusBadge status={tx.status} />
              </TableCell>
              <TableCell className="max-w-64 truncate text-muted-foreground">
                {tx.failureReason ??
                  (tx.status === "PENDING_VERIFICATION"
                    ? "Awaiting one-time code verification"
                    : "—")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
