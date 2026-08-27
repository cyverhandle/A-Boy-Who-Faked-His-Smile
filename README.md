# A Boy Who Faked His Smile — book sales site

A direct-from-author sales page for the book "A Boy Who Faked His Smile" by Sad Person,
with Razorpay checkout built in.

## What's already wired up

- `src/lib/book-store.ts` — book title, price, description, etc. (env-overridable)
- `src/app/page.tsx` — the landing page, using the real cover (`public/cover-front.jpg`)
- `src/components/book-checkout.tsx` — the order form + Razorpay Checkout popup
- `src/app/api/checkout/create-order/route.ts` — creates a Razorpay order + saves it to Postgres
- `src/app/api/checkout/verify-payment/route.ts` — verifies the Razorpay signature after payment
- `src/app/api/razorpay/webhook/route.ts` — optional webhook to keep order status in sync
- `src/db/schema.ts` — the `bookOrders` table (Drizzle ORM)

## 1. Get your Razorpay keys

1. Sign up / log in at https://dashboard.razorpay.com
2. Go to **Settings → API Keys** and generate a **Test Mode** key pair first.
3. Copy the `Key Id` and `Key Secret`.

## 2. Set environment variables

Copy `.env.example` to `.env` and fill in:

```
DATABASE_URL=...                 # any Postgres connection string
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=xxxx
RAZORPAY_WEBHOOK_SECRET=xxxx      # optional, only needed if you enable the webhook
```

The `BOOK_*` variables are optional — the site already defaults to this book's real
title, subtitle, author, price (₹299), and description. Override them if you want to
change the price or copy without touching code.

## 3. Run it

```bash
npm install
npm run db:push   # or your preferred drizzle migration command, if you added one
npm run dev
```

Visit http://localhost:3000 — you'll see the real cover, the book's blurb, and a working
"Pay with Razorpay" button once your keys are set.

## 4. Go live

1. Complete Razorpay KYC/activation to get **Live Mode** keys.
2. Replace the test `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` with the live ones in your
   hosting provider's environment variables (Vercel, Railway, etc.).
3. (Optional) In the Razorpay Dashboard, add a webhook pointing to
   `https://yourdomain.com/api/razorpay/webhook`, choose the `payment.captured` and
   `payment.failed` events, and set the same secret as `RAZORPAY_WEBHOOK_SECRET`.

## Changing the price or cover later

- Price: set `BOOK_PRICE_INR` in your environment, or edit `DEFAULT_PRICE_INR` in
  `src/lib/book-store.ts`.
- Cover image: replace `public/cover-front.jpg` (front cover) and/or
  `public/cover-full.jpg` (full wraparound cover, not currently displayed but kept for
  future use, e.g. a "flip the book" section).
