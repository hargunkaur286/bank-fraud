/**
 * The backend has no authentication and no concept of a logged-in user
 * owning multiple accounts (account-service exposes only lookup-by-number,
 * never a "list my accounts" endpoint). Per the project rules we must not
 * fabricate a fake login. Instead, this browser remembers which account
 * numbers you've created/added, purely as a local convenience so you can
 * switch between accounts you know the number of. It is not a session and
 * proves nothing to the backend - every request still authenticates by
 * account number alone, same as the backend itself does.
 */

const KNOWN_ACCOUNTS_KEY = "bankfraud.knownAccounts";
const ACTIVE_ACCOUNT_KEY = "bankfraud.activeAccount";

export function getKnownAccountNumbers(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KNOWN_ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function addKnownAccountNumber(accountNumber: string): void {
  if (typeof window === "undefined") return;
  const existing = getKnownAccountNumbers();
  if (existing.includes(accountNumber)) return;
  window.localStorage.setItem(
    KNOWN_ACCOUNTS_KEY,
    JSON.stringify([...existing, accountNumber]),
  );
}

export function removeKnownAccountNumber(accountNumber: string): void {
  if (typeof window === "undefined") return;
  const existing = getKnownAccountNumbers();
  window.localStorage.setItem(
    KNOWN_ACCOUNTS_KEY,
    JSON.stringify(existing.filter((a) => a !== accountNumber)),
  );
}

export function getActiveAccountNumber(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_ACCOUNT_KEY);
}

export function setActiveAccountNumber(accountNumber: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_ACCOUNT_KEY, accountNumber);
  addKnownAccountNumber(accountNumber);
}

export function clearActiveAccountNumber(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
}
