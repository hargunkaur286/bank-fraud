import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TransactionStatusBadge } from "./transaction-status-badge";
import type { TransactionResponse } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/format";

export function TransactionTable({
  transactions,
  emptyMessage = "No transactions to show.",
}: {
  transactions: TransactionResponse[];
  emptyMessage?: string;
}) {
  if (transactions.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Recipient</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id} className="group cursor-pointer">
              <TableCell className="whitespace-nowrap text-muted-foreground">
                <Link href={`/transactions/${tx.id}`} className="block">
                  {formatDateTime(tx.createdAt)}
                </Link>
              </TableCell>
              <TableCell>
                <Link href={`/transactions/${tx.id}`} className="block font-medium">
                  {tx.receiverAccountNumber}
                </Link>
                {tx.description ? (
                  <Link
                    href={`/transactions/${tx.id}`}
                    className="block max-w-48 truncate text-xs text-muted-foreground"
                  >
                    {tx.description}
                  </Link>
                ) : null}
              </TableCell>
              <TableCell className="text-muted-foreground">
                <Link href={`/transactions/${tx.id}`} className="block font-mono text-xs">
                  {tx.referenceNumber.slice(0, 8)}
                </Link>
              </TableCell>
              <TableCell>
                <Link href={`/transactions/${tx.id}`} className="block">
                  {tx.type}
                </Link>
              </TableCell>
              <TableCell>
                <Link href={`/transactions/${tx.id}`} className="block">
                  <TransactionStatusBadge status={tx.status} />
                </Link>
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                <Link href={`/transactions/${tx.id}`} className="block">
                  {formatCurrency(tx.amount)}
                </Link>
              </TableCell>
              <TableCell>
                <ChevronRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
