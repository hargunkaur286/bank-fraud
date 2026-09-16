/**
 * Types mirror the real backend DTOs/entities exactly (account-service,
 * transaction-service, payment-service). Do not add fields the backend
 * does not return — see AccountResponse/TransactionResponse below.
 */

export type AccountType = "SAVINGS" | "CURRENT" | "FIXED_DEPOSIT";
export type AccountStatus = "ACTIVE" | "BLOCKED" | "CLOSED";

export interface AccountResponse {
  id: string;
  accountNumber: string;
  accountHolderName: string;
  email: string;
  phone: string;
  accountType: AccountType;
  status: AccountStatus;
  balance: number;
  dailyTransactionLimit: number;
  createdAt: string;
}

export interface CreateAccountRequest {
  accountHolderName: string;
  email: string;
  phone: string;
  accountType: AccountType;
  initialDeposit: number;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  account: AccountResponse;
}

export type TransactionType = "DEPOSIT" | "WITHDRAWAL" | "PAYMENT" | "TRANSFER";

/**
 * Exact backend enum (transaction-service TransactionStatus.java).
 * PENDING exists in the enum but the transfer() code path always saves
 * new transactions as PROCESSING, so PENDING is effectively unused today.
 * There is no REFUNDED status: a refund is represented as FLAGGED plus a
 * failureReason, with the sender's balance credited back server-side.
 */
export type TransactionStatus =
  | "PENDING"
  | "PROCESSING"
  | "PENDING_VERIFICATION"
  | "COMPLETED"
  | "FAILED"
  | "FLAGGED";

export interface TransactionResponse {
  id: string;
  senderAccountNumber: string;
  receiverAccountNumber: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description: string | null;
  failureReason: string | null;
  referenceNumber: string;
  createdAt: string;
  completedAt: string | null;
}

export interface TransferRequest {
  senderAccountNumber: string;
  receiverAccountNumber: string;
  amount: number;
  description?: string;
}

export interface PaymentOrderResponse {
  paymentId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  status: string;
  razorpayKeyId: string;
}

export interface CreatePaymentRequest {
  accountNumber: string;
  amount: number;
  description?: string;
}
