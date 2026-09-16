/**
 * account-service now issues a real session token from POST /accounts/login
 * (bcrypt-verified password, HMAC-signed JWT) - see account-service's
 * TokenService. Accounts created before that existed have no password, so
 * they keep working through the old "enter your account number" path with
 * token: null. Anything gated by a token (currently just blocking your own
 * account) is unavailable in that legacy mode.
 *
 * recentLogins is a separate, non-sensitive convenience list (account
 * number/email/name only - never a token or password) purely so the login
 * form can prefill an email you've used on this browser before. Clicking one
 * only prefills the form; it never logs you in without the password.
 */

const SESSION_KEY = "bankfraud.session";
const RECENT_LOGINS_KEY = "bankfraud.recentLogins";
const MAX_RECENT_LOGINS = 5;

export interface Session {
  accountNumber: string;
  token: string | null;
}

export interface RecentLogin {
  accountNumber: string;
  email: string;
  accountHolderName: string;
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.accountNumber !== "string") return null;
    return { accountNumber: parsed.accountNumber, token: parsed.token ?? null };
  } catch {
    return null;
  }
}

export function setSession(session: Session): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}

export function getRecentLogins(): RecentLogin[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_LOGINS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function rememberRecentLogin(entry: RecentLogin): void {
  if (typeof window === "undefined") return;
  const existing = getRecentLogins().filter((e) => e.accountNumber !== entry.accountNumber);
  const next = [entry, ...existing].slice(0, MAX_RECENT_LOGINS);
  window.localStorage.setItem(RECENT_LOGINS_KEY, JSON.stringify(next));
}

export function forgetRecentLogin(accountNumber: string): void {
  if (typeof window === "undefined") return;
  const next = getRecentLogins().filter((e) => e.accountNumber !== accountNumber);
  window.localStorage.setItem(RECENT_LOGINS_KEY, JSON.stringify(next));
}
