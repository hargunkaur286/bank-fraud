# Coverstone Bank — frontend

Next.js (App Router) + TypeScript + Tailwind + shadcn/ui frontend for the
existing bank-fraud microservices backend. The backend is not part of this
directory and is not modified by it — see [../README.md](../README.md) for
the services themselves.

## Running it

```bash
npm install
npm run dev
```

Open http://localhost:3000. `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
points at the deployed gateway (`http://34.228.56.9:8080` by default — see
`.env.example`).

There is no login screen. The backend has no authentication and no "list my
accounts" endpoint, so this app identifies you purely by account number, the
same way the API does — enter an existing one or create a new one on first
visit. `src/lib/known-accounts.ts` explains the reasoning; it's a browser
convenience, not a session.

## Why calls go through `/api/v1/...` instead of the gateway directly

The gateway (`api-gateway-service`) sends no CORS headers. `next.config.ts`
rewrites `/api/v1/:path*` to `NEXT_PUBLIC_API_BASE_URL` server-side, so the
browser only ever talks to this Next.js server (same-origin) and CORS never
comes up. The API client in `src/lib/api/client.ts` calls the relative path;
nothing else needs to know the real backend host.

## API layer

```
src/lib/api/
  types.ts         AccountResponse, TransactionResponse, etc. - mirror the
                    backend DTOs field-for-field, not aspirational shapes
  client.ts         the one axios instance
  errors.ts         maps backend errors to user-facing messages
  accounts.ts       account-service calls
  transactions.ts   transaction-service calls
  payments.ts       payment-service calls
```

Only endpoints that actually exist on the deployed backend are wrapped here.
Notably absent, on purpose:

- **No "list accounts" call** - account-service has no such endpoint.
- **No transaction filters/pagination** - `getTransactionsByAccount` returns
  everything; `src/lib/filter-transactions.ts` filters client-side.
- **No resend-OTP call** - there is no resend endpoint anywhere in the
  system. If a code expires, verifying just fails the transaction.
- **No payment-status polling** - `payments.ts` only has `create-order`;
  confirmation happens via Razorpay's webhook straight to the backend, which
  this app can't observe. The Payments page is upfront about that.

One thing worth knowing if you extend this: none of the backend services
have an exception handler (`@ControllerAdvice`), so "not found" and most
business-rule failures (bad account, insufficient balance, wrong/expired
transaction id) come back as a bare **500**, not 404/409/422. `errors.ts`
and the per-call fallback messages in `accounts.ts`/`transactions.ts` are
keyed accordingly — this was verified against the live deployment, not
guessed from the code.

## The transaction lifecycle

Transfers are asynchronous (Kafka/SAGA). `POST /transactions/transfer`
returns almost immediately with `status: "PROCESSING"`.
`src/hooks/use-transaction-polling.ts` polls `GET /transactions/{id}` every
2s until it reaches `COMPLETED`, `FAILED`, `FLAGGED`, or
`PENDING_VERIFICATION`, giving up after 60s. `PENDING_VERIFICATION` routes to
`/transactions/[id]/verify` (the OTP screen); a wrong or expired OTP doesn't
error — the backend answers 200 with `status: "FLAGGED"` and refunds the
sender, which the UI just renders as a security warning.

## Testing the OTP flow (a real gap, not a frontend bug)

`notification-service` never sends an email or SMS - it only logs the OTP to
its own container's stdout, and no service exposes it over HTTP. To read a
real code while testing a flagged transfer, tail that container's logs on
the server while you complete the transfer in the app:

```bash
ssh ubuntu@34.228.56.9
docker logs -f --tail 50 notification-service
```

Trigger a transfer large enough to get flagged for verification, then watch
that stream for the `transaction.otp.generated` line - the 6-digit code is
in it. This is intentionally not solved on the frontend: doing so would mean
either opening Redis to the public internet (it's already reachable on
`6379` inside the docker network, but not from outside it) or adding a
backend endpoint, both of which are backend/infra decisions, not frontend
ones.

## How the Razorpay flow actually works

The Payments page calls `POST /payments/create-order`, which creates a
Razorpay order server-side and returns `razorpayOrderId` + `razorpayKeyId`
(a **test-mode** key, `rzp_test_...`, already configured on the backend - no
real money moves). The frontend then opens Razorpay's own hosted Checkout
widget (`checkout.razorpay.com`, loaded via `next/script`) with those
values - pay with [Razorpay's published test card numbers](https://razorpay.com/docs/payments/payments/test-card-upi-details/).
Razorpay confirms the payment to the backend via its own webhook, which is
server-to-server and invisible to this app - there's no `GET /payments/{id}`
endpoint to poll. So the "payment submitted" message on screen reflects what
Razorpay's client-side callback said, not a confirmed backend state.

## Demo vs. real data

Everywhere a number on screen is derived from real API data (spending
chart, status breakdown, fraud metrics), it's computed from your account's
actual transaction history, not fabricated. The one exception is "Total
money received" on the dashboard: the backend only exposes transfers where
you're the *sender*, so there is no way to compute that number, and it's
shown as unavailable rather than made up.
