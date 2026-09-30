# YA² Transport

A multi-page Indian logistics website and customer platform: air transport, road transport and movers & packers,
with a price calculator, pickup/drop route estimates, a PAN India network map, shipment tracking, real account
login, booking, a demo payment flow and a customer dashboard. Light and dark themes are both supported.

## Run it

```bash
npm install
cp .env.example .env        # optional; defaults work for local dev
npm run dev                 # web on http://localhost:5173, API on :8787
```

Production: `npm run build && npm start` (Express serves `dist/` and the API on `PORT`).

Demo tracking IDs: `YA2-2026-001284`, `YA2-2026-001285`, `YA2-2026-001290`, `YA2-2026-001301`.

## Where to change things

| What | File |
|---|---|
| Company name, email, phone, nav, footer, stats, testimonials, rating | `src/config/site.ts` |
| WhatsApp number / Instagram username | `.env` → `VITE_WHATSAPP_NUMBER`, `VITE_INSTAGRAM_USERNAME` (or `SOCIAL` in `site.ts`) |
| Prices, per-KG rates, distance/service/urgency multipliers, transit days | `src/config/pricing.ts` |
| Pricing engine (used by the browser **and** the API) | `src/lib/pricing.ts` |
| Service page content | `src/config/services.ts` |
| States/UTs, PIN code → state mapping | `src/data/indiaStates.ts` |
| Cities, hubs, featured routes | `src/data/cities.ts` |
| Photos | `src/config/media.ts` + `public/images/` |
| Colour tokens (light + dark) | `src/styles/tokens.css` |

Until a WhatsApp number or Instagram username is set, those buttons show a "coming soon" message instead of linking
to an account that isn't the company's.

## Architecture

- **Frontend:** React 19 + Vite + TypeScript, React Router, handwritten CSS design system. The 3D objects (truck,
  cargo boxes, aircraft, pins, globe, arrows) are generated SVG, so no WebGL is needed.
- **India map:** `npm run map:build` regenerates `src/data/indiaMap.generated.ts` from DataMeet's state boundaries
  (the official Survey of India outline, all 36 States/UTs, CC BY 2.5 IN). Cities are placed with the same projection.
- **API:** Express (`server/`), run with `tsx`.
  - Auth: passwords hashed with scrypt, server-side sessions in an httpOnly SameSite cookie, rate limiting,
    password reset tokens (hashed, 30 min), optional Google OAuth 2.0.
  - Prices are always recomputed on the server; the browser never sets the amount.
  - Storage goes through the `Store` interface (`server/db/types.ts`).

## Database (SQL)

By default everything is stored in **SQLite**, a real SQL database kept in one file:
`server/.data/ya2.db`. It is created automatically on first start and needs no installation (Node 22.5+ has
SQLite built in). Tables: `users`, `sessions`, `password_resets`, `addresses`, `quotes`, `shipments`,
`shipment_events`, `payments`, `contact_messages` (schema: `server/db/schema.sqlite.sql`).

```bash
npm run db                                                   # tables and row counts
npm run db -- "SELECT name, email, created_at FROM users"    # any SQL query
npm run db -- "SELECT tracking_id, status, price FROM shipments"
```

You can also open `server/.data/ya2.db` in any SQLite tool (for example DB Browser for SQLite or the VS Code
SQLite extension). Password hashes and session tokens are one-way hashes and are masked by `npm run db`.

Back up the database by copying the `.db` file while the API is stopped.

## Admin console (hidden)

`/admin` is not linked anywhere and is excluded from search engines. Open it directly or press
**Ctrl + Shift + A** on any page. It shows every enquiry (contact form), user, shipment, payment, saved quote,
address and tracking event, with search and CSV download, plus a **read-only SQL console** (SELECT only, on a
read-only database connection; password hashes and tokens are always masked).

Sign-in uses `ADMIN_PASSWORD`, separate from customer accounts. In development, if it is not set, a temporary
password is printed in the API log. In production the console stays disabled until it is set.

## Deploying (Render)

`render.yaml` deploys the whole site with its SQLite database on a persistent disk:

1. Push this branch to GitHub (done).
2. On https://render.com: **New → Blueprint**, choose this repository and branch, then **Apply**.
3. When it is live, set `APP_URL` to the URL Render gives you and redeploy.
4. Read the generated `ADMIN_PASSWORD` under the service's **Environment** tab.

A persistent disk needs a paid instance (Render *Starter*). On a free instance remove the `disk` block: the site
works, but the database is wiped on every redeploy or restart, which is fine for a one-day demo.

## Connecting Oracle Database

1. Run `server/db/schema.oracle.sql` in your schema.
2. Set `DB_CLIENT=oracle` and the `ORACLE_*` variables in `.env`.
3. Restart the API. `server/db/oracleStore.ts` implements the full `Store` interface using `node-oracledb` (thin mode).

The Oracle adapter was written against the schema but hasn't been run against a live database yet. Smoke-test
register → book → pay → track before going live.

## Payments

`PAYMENT_PROVIDER=demo` (the default) runs a clearly labelled **Demo Payment Mode**: no money moves and card or UPI
details never leave the browser. Use UPI `fail@demo` or card `4000 0000 0000 0002` to test a declined payment.
`PAYMENT_PROVIDER=razorpay` with keys enables Razorpay Orders plus server-side signature verification (the checkout
script loads automatically). Stripe has a stub in `server/payments/index.ts`.

## Not yet connected (needs your accounts)

- An email provider for password-reset emails (`server/lib/mail.ts`). In development the reset link is printed in the
  API log and shown on screen.
- Google OAuth credentials, a payment gateway, and the real WhatsApp and Instagram accounts.
- Photography: every photo slot currently shows a branded 3D illustration. Add licensed photos in `src/config/media.ts`.
- Stats, testimonials and the 4.8 rating are sample values and are marked as such on the site
  (`SHOW_SAMPLE_NOTICES` in `site.ts`).
