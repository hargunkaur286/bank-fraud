"use client";

import { useEffect, useRef, useState } from "react";
import { getTransaction } from "@/lib/api/transactions";
import type { ApiError, TransactionResponse } from "@/lib/api";

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_MS = 60000;

const ACTIONABLE_STATUSES = new Set([
  "COMPLETED",
  "FAILED",
  "FLAGGED",
  "PENDING_VERIFICATION",
]);

/**
 * The backend resolves a transfer asynchronously through Kafka/SAGA, so a
 * freshly-created transaction is almost always PROCESSING. This polls
 * GET /transactions/{id} until it reaches a state the UI can act on, or
 * gives up after MAX_POLL_MS so the user is never stuck on a spinner
 * forever if something on the backend stalls.
 *
 * Callers must mount a fresh instance per transaction (e.g. by only
 * rendering the component once the transaction exists) rather than passing
 * a changing `initial` into a long-lived instance.
 */
export function useTransactionPolling(
  initial: TransactionResponse,
): {
  transaction: TransactionResponse;
  isSettled: boolean;
  timedOut: boolean;
  error: ApiError | null;
} {
  const [transaction, setTransaction] = useState(initial);
  const [timedOut, setTimedOut] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const startedAtRef = useRef<number | null>(null);

  const isSettled = ACTIONABLE_STATUSES.has(transaction.status);

  useEffect(() => {
    if (isSettled) return;

    function run() {
      if (startedAtRef.current === null) {
        startedAtRef.current = Date.now();
      }
    }
    run();
  }, [isSettled]);

  useEffect(() => {
    if (isSettled) return;

    let cancelled = false;
    const timer = setInterval(async () => {
      const startedAt = startedAtRef.current ?? Date.now();
      if (Date.now() - startedAt > MAX_POLL_MS) {
        setTimedOut(true);
        clearInterval(timer);
        return;
      }
      try {
        const latest = await getTransaction(transaction.id);
        if (!cancelled) {
          setTransaction(latest);
          if (ACTIONABLE_STATUSES.has(latest.status)) {
            clearInterval(timer);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as ApiError);
        }
      }
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [transaction.id, isSettled]);

  return { transaction, isSettled, timedOut, error };
}
