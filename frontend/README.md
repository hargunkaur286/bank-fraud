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

Log in with email + password, or create an account (also sets a password
now). Accounts created before this feature existed have no password on file
and keep working through a third "account number" tab with no auth at all —
see the Real authentication section below. **This requires a backend change
that isn't deployed yet** — see Deploying below before you try logging in
against the live server.

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

## Real authentication (account-service)

Login is genuine, not decorative: `account-service` now stores a BCrypt
hash on the `Account` entity, `POST /accounts/login` verifies it and issues
an HMAC-signed JWT (`TokenService`, 24h expiry), and
`PUT /accounts/{accountNumber}/block` requires that token and checks it
matches the account being blocked - tested locally by attempting to block
one account with another account's token and confirming a 401.

What it deliberately does **not** cover:

- **`GET /accounts/{accountNumber}` stays public.** Send Money looks up the
  recipient's name before you confirm a transfer, the same way most banking
  apps resolve an account holder's name from an account number alone without
  the recipient being logged in. Locking this down would break that.
- **transaction-service and payment-service don't check this token at all.**
  They're separate Spring Boot apps with their own unauthenticated
  endpoints. This means `POST /transactions/transfer` still accepts any
  `senderAccountNumber` from anyone who knows it - logging in does not yet
  protect money movement, only the one account-service action (block) that
  was in scope for this change. Extending the token check to those services
  is a reasonable next step, not done here.
- **Accounts created before this shipped have `password = NULL`.** They
  still work via the old "enter account number" tab (unauthenticated, same
  trust model as before this change - not a new hole). There's no
  "set a password retroactively" endpoint, so the only way to get a real
  login is creating a new account.

## Deploying this change

`account-service`'s Dockerfile packages a pre-built jar, and the deployed
stack pulls images from ECR (see `../docker-compose.yml`) - editing the
Java source here does **not** change what's running on `34.228.56.9` until
someone rebuilds and pushes that image and restarts the stack. That needs
AWS/SSH credentials this assistant doesn't have, so to actually go live:

```bash
cd account-service
./mvnw clean package -DskipTests
docker build -t 885427126350.dkr.ecr.us-east-1.amazonaws.com/account-service:latest .
docker push 885427126350.dkr.ecr.us-east-1.amazonaws.com/account-service:latest

ssh ubuntu@34.228.56.9
docker compose pull account-service
docker compose up -d account-service
```

Set a real `APP_JWT_SECRET` (long random string) in `docker-compose.yml`'s
`account-service` environment block before doing this for anything beyond a
demo - the checked-in value is a placeholder. Hibernate's `ddl-auto: update`
will add the new nullable `password` column automatically on first boot
against the existing database; it won't touch or invalidate any accounts
already there.

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
