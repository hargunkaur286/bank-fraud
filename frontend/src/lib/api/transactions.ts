import { apiClient } from "./client";
import { toApiError } from "./errors";
import type { TransactionResponse, TransferRequest } from "./types";

/**
 * transaction-service, routed via gateway at /api/v1/transactions.
 *
 * Notable backend constraints (there is no filtering/pagination support
 * server-side, so the transactions page filters/searches client-side):
 * - GET /transactions/account/{accountNumber} returns transactions where
 *   the account is the SENDER only (findBySenderAccountNumberOrderByCreatedAtDesc).
 *   Incoming transfers where this account is only the receiver do not
 *   appear here - there is no backend endpoint for that.
 * - There is no resend-OTP endpoint anywhere in the system.
 */

export async function transfer(payload: TransferRequest): Promise<TransactionResponse> {
  try {
    const { data } = await apiClient.post<TransactionResponse>(
      "/transactions/transfer",
      payload,
    );
    return data;
  } catch (error) {
    throw toApiError(error, {
      500: "The transfer couldn't be started. Check the account details and available balance.",
    });
  }
}

/**
 * Same story as accounts: there's no exception handler, so an unknown
 * transaction id comes back as a bare 500, not a 404 (verified live).
 */
const TRANSACTION_NOT_FOUND: Partial<Record<number, string>> = {
  404: "We couldn't find that transaction.",
  500: "We couldn't find that transaction.",
};

export async function getTransaction(transactionId: string): Promise<TransactionResponse> {
  try {
    const { data } = await apiClient.get<TransactionResponse>(
      `/transactions/${transactionId}`,
    );
    return data;
  } catch (error) {
    throw toApiError(error, TRANSACTION_NOT_FOUND);
  }
}

/**
 * Returns [] for an account with no transactions (or an unknown account
 * number) rather than erroring - there's no existence check on this query.
 */
export async function getTransactionsByAccount(
  accountNumber: string,
): Promise<TransactionResponse[]> {
  try {
    const { data } = await apiClient.get<TransactionResponse[]>(
      `/transactions/account/${accountNumber}`,
    );
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

/**
 * A wrong or expired OTP is not an error response at all - the backend
 * answers 200 with a TransactionResponse whose status is FLAGGED (funds are
 * refunded server-side). This only throws for things like a malformed or
 * unknown transaction id, which - per the pattern above - comes back as 500.
 */
export async function verifyOtp(
  transactionId: string,
  otp: string,
): Promise<TransactionResponse> {
  try {
    const { data } = await apiClient.post<TransactionResponse>(
      `/transactions/${transactionId}/verify`,
      null,
      { params: { otp } },
    );
    return data;
  } catch (error) {
    throw toApiError(error, TRANSACTION_NOT_FOUND);
  }
}
