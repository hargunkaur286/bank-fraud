"use client";

import { useCallback, useEffect, useState } from "react";
import { getTransactionsByAccount } from "@/lib/api/transactions";
import type { ApiError, TransactionResponse } from "@/lib/api";

export function useAccountTransactions(accountNumber: string | undefined) {
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const refresh = useCallback(async () => {
    if (!accountNumber) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getTransactionsByAccount(accountNumber);
      setTransactions(data);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setIsLoading(false);
    }
  }, [accountNumber]);

  useEffect(() => {
    function run() {
      refresh();
    }
    run();
  }, [refresh]);

  return { transactions, isLoading, error, refresh };
}
