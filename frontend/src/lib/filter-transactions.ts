import type { TransactionResponse, TransactionStatus, TransactionType } from "@/lib/api";

export interface TransactionFilterState {
  search: string;
  status: TransactionStatus | "ALL";
  type: TransactionType | "ALL";
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
}

export const EMPTY_FILTERS: TransactionFilterState = {
  search: "",
  status: "ALL",
  type: "ALL",
  dateFrom: "",
  dateTo: "",
  amountMin: "",
  amountMax: "",
};

export function filterTransactions(
  transactions: TransactionResponse[],
  filters: TransactionFilterState,
): TransactionResponse[] {
  const search = filters.search.trim().toLowerCase();
  const amountMin = filters.amountMin ? Number(filters.amountMin) : null;
  const amountMax = filters.amountMax ? Number(filters.amountMax) : null;
  const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : null;
  const dateTo = filters.dateTo ? new Date(`${filters.dateTo}T23:59:59`) : null;

  return transactions.filter((t) => {
    if (filters.status !== "ALL" && t.status !== filters.status) return false;
    if (filters.type !== "ALL" && t.type !== filters.type) return false;
    if (amountMin != null && t.amount < amountMin) return false;
    if (amountMax != null && t.amount > amountMax) return false;

    const createdAt = new Date(t.createdAt);
    if (dateFrom && createdAt < dateFrom) return false;
    if (dateTo && createdAt > dateTo) return false;

    if (search) {
      const haystack = [
        t.referenceNumber,
        t.receiverAccountNumber,
        t.senderAccountNumber,
        t.description ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    return true;
  });
}
