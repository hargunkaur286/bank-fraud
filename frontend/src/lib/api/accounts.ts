import { apiClient } from "./client";
import { toApiError } from "./errors";
import type { AccountResponse, CreateAccountRequest, LoginRequest, LoginResponse } from "./types";

/**
 * account-service, routed via gateway at /api/v1/accounts.
 * Endpoints NOT wrapped here on purpose because they are internal SAGA
 * steps called service-to-service, not meant for a frontend client:
 *   PUT /accounts/{accountNumber}/deduct
 *   PUT /accounts/{accountNumber}/credit
 * There is also no "list accounts" endpoint - the backend has no concept
 * of a logged-in user owning multiple accounts.
 */

/**
 * "Not found" is not a real 404 here: the backend has no exception handler,
 * so an unknown account number surfaces as a bare 500 (verified against the
 * live deployment). We map both 404 and 500 to the same friendly message
 * since the backend gives us no way to tell "not found" apart from any
 * other unhandled failure.
 */
const ACCOUNT_NOT_FOUND: Partial<Record<number, string>> = {
  404: "We couldn't find an account with that number.",
  500: "We couldn't find an account with that number.",
};

export async function getAccount(accountNumber: string): Promise<AccountResponse> {
  try {
    const { data } = await apiClient.get<AccountResponse>(`/accounts/${accountNumber}`);
    return data;
  } catch (error) {
    throw toApiError(error, ACCOUNT_NOT_FOUND);
  }
}

export async function getBalance(accountNumber: string): Promise<number> {
  try {
    const { data } = await apiClient.get<number>(`/accounts/${accountNumber}/balance`);
    return data;
  } catch (error) {
    throw toApiError(error, ACCOUNT_NOT_FOUND);
  }
}

export async function createAccount(
  payload: CreateAccountRequest,
): Promise<AccountResponse> {
  try {
    const { data } = await apiClient.post<AccountResponse>("/accounts", payload);
    return data;
  } catch (error) {
    throw toApiError(error, {
      500: "That email may already be registered to another account.",
    });
  }
}

export async function blockAccount(accountNumber: string): Promise<void> {
  try {
    await apiClient.put(`/accounts/${accountNumber}/block`);
  } catch (error) {
    throw toApiError(error, ACCOUNT_NOT_FOUND);
  }
}

/**
 * Unlike every other endpoint in this file, login failures come back as a
 * real 401 with an accurate { message } body (account-service has a local
 * exception handler just for this) - so there's no fallback message to
 * override here; toApiError already surfaces the backend's own message.
 */
export async function login(payload: LoginRequest): Promise<LoginResponse> {
  try {
    const { data } = await apiClient.post<LoginResponse>("/accounts/login", payload);
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}
