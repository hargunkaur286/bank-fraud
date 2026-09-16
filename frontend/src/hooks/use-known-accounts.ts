"use client";

import { useCallback, useEffect, useState } from "react";
import { getAccount } from "@/lib/api/accounts";
import { getKnownAccountNumbers, removeKnownAccountNumber } from "@/lib/known-accounts";
import type { AccountResponse } from "@/lib/api";

interface KnownAccountEntry {
  accountNumber: string;
  account: AccountResponse | null;
  notFound?: boolean;
}

export function useKnownAccounts() {
  const [entries, setEntries] = useState<KnownAccountEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const numbers = getKnownAccountNumbers();
    const results = await Promise.all(
      numbers.map(async (accountNumber) => {
        try {
          const account = await getAccount(accountNumber);
          return { accountNumber, account };
        } catch {
          return { accountNumber, account: null, notFound: true };
        }
      }),
    );
    setEntries(results);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    function run() {
      refresh();
    }
    run();
  }, [refresh]);

  const forget = useCallback((accountNumber: string) => {
    removeKnownAccountNumber(accountNumber);
    setEntries((prev) => prev.filter((e) => e.accountNumber !== accountNumber));
  }, []);

  return { entries, isLoading, refresh, forget };
}
