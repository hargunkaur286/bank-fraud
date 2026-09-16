"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getAccount, login as loginRequest } from "@/lib/api/accounts";
import type { AccountResponse, ApiError } from "@/lib/api";
import {
  clearSession,
  getSession,
  rememberRecentLogin,
  setSession,
} from "@/lib/session";

interface AccountContextValue {
  account: AccountResponse | null;
  /** null when signed in via the legacy "account number only" path - no
   *  password was ever set for that account, so no session token exists and
   *  token-gated actions (blocking the account) are unavailable. */
  token: string | null;
  isLoading: boolean;
  error: ApiError | null;
  /** true once the initial localStorage/lookup cycle has finished */
  isReady: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  continueWithAccountNumber: (accountNumber: string) => Promise<void>;
  signOut: () => void;
}

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [isReady, setIsReady] = useState(false);

  const loadAccount = useCallback(async (accountNumber: string) => {
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
      const session = getSession();
      if (session) {
        setToken(session.token);
        loadAccount(session.accountNumber).finally(() => setIsReady(true));
      } else {
        setIsReady(true);
      }
    }
    run();
  }, [loadAccount]);

  const refresh = useCallback(async () => {
    if (account) {
      await loadAccount(account.accountNumber);
    }
  }, [account, loadAccount]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginRequest({ email, password });
    setSession({ accountNumber: response.account.accountNumber, token: response.token });
    rememberRecentLogin({
      accountNumber: response.account.accountNumber,
      email: response.account.email,
      accountHolderName: response.account.accountHolderName,
    });
    setToken(response.token);
    setAccount(response.account);
    setError(null);
  }, []);

  const continueWithAccountNumber = useCallback(async (accountNumber: string) => {
    const data = await getAccount(accountNumber);
    setSession({ accountNumber: data.accountNumber, token: null });
    setToken(null);
    setAccount(data);
    setError(null);
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setAccount(null);
    setToken(null);
    setError(null);
  }, []);

  return (
    <AccountContext.Provider
      value={{
        account,
        token,
        isLoading,
        error,
        isReady,
        refresh,
        login,
        continueWithAccountNumber,
        signOut,
      }}
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
