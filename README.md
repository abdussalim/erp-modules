# JavaMifi ERP - MiFi Rental

A small ERP web app for a portable MiFi modem rental business (traveler rentals, JavaMifi theme).
Staff add devices and customers, create rentals, bill them through Midtrans, and n8n sends notifications.

## Features per module

| Module | What it does |
|---|---|
| Dashboard | Available devices, active rentals, unpaid invoices, total paid revenue |
| Inventory | List devices, add device, change status (AVAILABLE / RENTED / SERVICE) |
| Customers | List and add customers |
| Rentals | Create rental (customer, available device, destination country, dates). Invoice is created automatically (days x daily rate). "Return" sets rental RETURNED and device AVAILABLE |
| Billing | List invoices, **Pay** (Midtrans Snap), **Check status** |

## The 3 mandatory items

1. **API connection**
   - Internal REST API: Next.js route handlers in `app/api/*`. The pages call them with `fetch`.
   - External API: `app/api/countries/route.ts` fetches country names from `countriesnow.space` (server-side, cached 1 day, small fallback list if it is down) for the destination-country dropdown.
2. **Payment gateway**: Midtrans Sandbox (Snap), plain `fetch`, no SDK (`lib/midtrans.ts`).
   Without keys the app runs in **MOCK mode** (a "Simulate payment?" confirm), so the demo works anywhere.
3. **n8n automation** (workflows in `n8n/`)
   - `payment-paid.json`: webhook, then a formatted message. Triggered by the app when an invoice is paid.
   - `overdue-check.json`: daily 08:00 cron, calls `GET /api/rentals?overdue=1`, builds a reminder.
   - Both end in a plain output node and have a **disabled** Telegram node (optional).

## Tech stack

Next.js (App Router) + TypeScript + Tailwind, Prisma + SQLite, Midtrans Snap sandbox, n8n.

## Install and run

```bash
npm install
cp .env.example .env      # keys empty = mock payment mode
npm run db:setup          # creates SQLite DB (prisma db push) and seeds sample data
npm run dev               # http://localhost:3000
```

**n8n (separate terminal):**

```bash
npx n8n                   # http://localhost:5678
```

In n8n: Workflows > Import from file > pick `n8n/payment-paid.json`, then `n8n/overdue-check.json`.
Open each workflow and click **Execute workflow** (test URL) or toggle **Active** (production URL).
`N8N_WEBHOOK_URL` in `.env` uses the production URL `/webhook/payment-paid`, so the workflow must be Active.
To use Telegram, enable the Telegram node, add your bot credentials and chat id.

**Midtrans sandbox (optional):** create a sandbox account, copy the keys into `.env`:

```
MIDTRANS_SERVER_KEY="SB-Mid-server-..."
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="SB-Mid-client-..."
```

Restart `npm run dev`. Pay with a Midtrans test card, then click **Check status**
(Midtrans cannot reach localhost, so this button asks Midtrans directly). For the real callback,
expose the app (e.g. ngrok) and set the Midtrans notification URL to `<public-url>/api/payments/callback`.

## Architecture

```mermaid
flowchart LR
  Browser["Browser (Next.js pages)"] -->|fetch /api/*| API["Next.js route handlers"]
  Browser -->|snap.js popup| MT["Midtrans Sandbox"]
  API --> DB[("SQLite via Prisma")]
  API -->|country list| CN["countriesnow.space"]
  API -->|create token / check status| MT
  MT -->|notification (callback)| API
  API -->|POST payment.paid| N8N["n8n webhook"]
  CRON["n8n daily cron"] -->|GET /api/rentals?overdue=1| API
  N8N --> MSG["Message / Telegram"]
  CRON --> MSG
```

## Code flow: from clicking "Pay" to the n8n notification

1. `app/billing/page.tsx` - `pay()` calls `POST /api/payments` with the invoice id.
2. `app/api/payments/route.ts` - reads the invoice, builds order id `INV-{id}-{timestamp}`, asks `createSnapToken()` for a token, saves the order id on the invoice, returns `{ token }` (or `{ mock: true }` in mock mode).
3. `lib/midtrans.ts` - `createSnapToken()` POSTs to the Midtrans Snap sandbox API.
4. `app/billing/page.tsx` - loads `snap.js` and calls `window.snap.pay(token)`. The customer pays in the popup. (Mock mode: `confirm("Simulate payment?")` then calls the callback route with `mock: true`.)
5. Payment confirmed by one of two paths, both end at the same function:
   - `app/api/payments/callback/route.ts` - Midtrans notification, signature verified, status `settlement` or `capture`.
   - `app/api/payments/route.ts` (GET) - "Check status" button, asks `getTransactionStatus()` in `lib/midtrans.ts`.
6. `lib/midtrans.ts` - `markInvoicePaid()`: invoice PAID + `paidAt`, rental ACTIVE, device RENTED, then `notifyN8n("payment.paid", ...)`.
7. `lib/n8n.ts` - `notifyN8n()` POSTs JSON to `N8N_WEBHOOK_URL` (never throws).
8. `n8n/payment-paid.json` - Webhook, Format Message, Show Message (optional Telegram).

## Folder structure

```
app/
  layout.tsx, page.tsx            nav + dashboard (server component)
  inventory/page.tsx              devices list/add/status
  customers/page.tsx              customers list/add
  rentals/page.tsx                create rental, return, country dropdown
  billing/page.tsx                invoices, Pay, Check status
  api/inventory/route.ts          GET, POST, PATCH (status)
  api/customers/route.ts          GET, POST
  api/rentals/route.ts            GET (?overdue=1 for n8n), POST (also creates invoice), PATCH (return)
  api/invoices/route.ts           GET invoices for the Billing page
  api/countries/route.ts          GET country names (external API proxy)
  api/payments/route.ts           POST start payment, GET check status
  api/payments/callback/route.ts  Midtrans notification (and mock pay)
lib/
  db.ts                           Prisma client
  midtrans.ts                     Midtrans calls, signature check, markInvoicePaid()
  n8n.ts                          notifyN8n()
prisma/
  schema.prisma                   Device, Customer, Rental, Invoice
  seed.ts                         sample data
n8n/
  payment-paid.json               webhook workflow
  overdue-check.json              daily cron workflow
```
