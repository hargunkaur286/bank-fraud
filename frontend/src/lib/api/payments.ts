import { apiClient } from "./client";
import { toApiError } from "./errors";
import type { CreatePaymentRequest, PaymentOrderResponse } from "./types";

/**
 * payment-service, routed via gateway at /api/v1/payments.
 * POST /payments/webhook is a server-to-server Razorpay callback and is
 * intentionally not exposed here. There is also no GET endpoint to poll
 * a payment's final status - confirmation only happens through Razorpay's
 * webhook to the backend, so the frontend relies on the Razorpay Checkout
 * client callback for immediate feedback (see the Payments page).
 */

export async function createPaymentOrder(
  payload: CreatePaymentRequest,
): Promise<PaymentOrderResponse> {
  try {
    const { data } = await apiClient.post<PaymentOrderResponse>(
      "/payments/create-order",
      payload,
    );
    return data;
  } catch (error) {
    throw toApiError(error, {
      500: "The payment order couldn't be created. Please try again.",
    });
  }
}
