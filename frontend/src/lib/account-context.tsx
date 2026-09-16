"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getAccount } from "@/lib/api/accounts";
import type { AccountResponse, ApiError } from "@/lib/api";
import {
  clearActiveAccountNumber,
  getActiveAccountNumber,
  setActiveAccountNumber,
} from "@/lib/known-accounts";

interface AccountContextValue {
  account: AccountResponse | null;
  isLoading: boolean;
  error: ApiError | null;
  /** true once the initial localStorage/lookup cycle has finished */
  isReady: boolean;
  refresh: () => Promise<void>;
  switchAccount: (accountNumber: string) => Promise<void>;
  signOut: () => void;
}

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [isReady, setIsReady] = useState(false);

  const load = useCallback(async (accountNumber: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAccount(accountNumber);
      setAccount(data);
    } catch (err) {
      setAccount(null);
      setError(err as ApiError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    function run() {
      const stored = getActiveAccountNumber();
      if (stored) {
        load(stored).finally(() => setIsReady(true));
      } else {
        setIsReady(true);
      }
    }
    run();
  }, [load]);

  const refresh = useCallback(async () => {
    if (account) {
      await load(account.accountNumber);
    }
  }, [account, load]);

  const switchAccount = useCallback(
    async (accountNumber: string) => {
      setActiveAccountNumber(accountNumber);
      await load(accountNumber);
    },
    [load],
  );

  const signOut = useCallback(() => {
    clearActiveAccountNumber();
    setAccount(null);
    setError(null);
  }, []);

  return (
    <AccountContext.Provider
      value={{ account, isLoading, error, isReady, refresh, switchAccount, signOut }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useActiveAccount(): AccountContextValue {
  const ctx = useContext(AccountContext);
  if (!ctx) {
    throw new Error("useActiveAccount must be used within an AccountProvider");
  }
  return ctx;
}
