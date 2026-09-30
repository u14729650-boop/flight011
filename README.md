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

Contact links: phone opens the dialler (`tel:`), email opens Gmail compose in a new tab, and WhatsApp opens a chat with
the company phone number (+1 555 019 9238, change it with `VITE_WHATSAPP_NUMBER`). Until an Instagram username is set,
the Instagram buttons show a "coming soon" message instead of linking to an account that isn't the company's.

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

## Oracle Database

Set `DB_CLIENT=oracle` and the `ORACLE_*` variables, then start the API. On first start it creates all tables from
`server/db/schema.oracle.sql` by itself (tables are prefixed `ya2_`), so an empty Oracle schema is all you need.
Tested end to end against Oracle Database 23ai Free: register, login, addresses, saved quotes, booking, payment,
tracking, password change/reset, contact form and the admin console.

```bash
# .env
DB_CLIENT=oracle
ORACLE_USER=ya2
ORACLE_PASSWORD=your-password
ORACLE_CONNECT_STRING=localhost:1521/FREEPDB1
```

Try it locally with Docker:

```bash
docker run -d --name ya2-oracle -p 1521:1521 -e ORACLE_PASSWORD=SysPass123 \
  -e APP_USER=ya2 -e APP_USER_PASSWORD=your-password gvenzl/oracle-free:23-slim-faststart
npm run dev          # wait for "DATABASE IS READY TO USE!" in `docker logs ya2-oracle` first
npm run db           # tables and row counts in Oracle
npm run db -- "SELECT name, email, created_at FROM ya2_users"
```

The hidden admin console (`/admin`) reads Oracle too, inside a READ ONLY transaction, and its example queries switch
to Oracle SQL.

## Deploying with Oracle (Render + Oracle Cloud Free Tier)

1. **Create the database.** On https://cloud.oracle.com (Always Free): **Autonomous Database → Create** (Transaction
   Processing). Set an ADMIN password.
2. **Allow TLS without a wallet.** On the database page, **Network → Access control list → Edit**: allow
   `0.0.0.0/0` (or Render's outbound IPs), then set **Mutual TLS (mTLS) authentication** to *Not required*.
3. **Copy the connection string.** **Database connection → Connection strings**, TLS authentication: *TLS*, and copy
   the `…_low` value (it starts with `(description=`).
4. **Deploy.** On https://render.com: **New → Blueprint**, choose this repository and branch, then fill in the
   values it asks for: `ORACLE_USER` = `ADMIN` (or a user you created), `ORACLE_PASSWORD`, `ORACLE_CONNECT_STRING`
   = the string from step 3, and `APP_URL`. Click **Apply**.
5. Open the site and register an account. The rows appear in Oracle (**Database Actions → SQL**:
   `SELECT * FROM ya2_users;`). The generated `ADMIN_PASSWORD` for `/admin` is under the service's **Environment** tab.

Using a wallet instead: unzip it on the server and set `ORACLE_WALLET_DIR` and `ORACLE_WALLET_PASSWORD`.

To deploy with SQLite instead, set `DB_CLIENT=sqlite` and `SQLITE_FILE=/var/data/ya2.db` and add a persistent disk
mounted at `/var/data` (needs a paid Render instance).

## Payments

`PAYMENT_PROVIDER=demo` (the default) runs a clearly labelled **Demo Payment Mode**: no money moves and card or UPI
details never leave the browser. Use UPI `fail@demo` or card `4000 0000 0000 0002` to test a declined payment.
`PAYMENT_PROVIDER=razorpay` with keys enables Razorpay Orders plus server-side signature verification (the checkout
script loads automatically). Stripe has a stub in `server/payments/index.ts`.

## Not yet connected (needs your accounts)

- An email provider for password-reset emails (`server/lib/mail.ts`). In development the reset link is printed in the
  API log and shown on screen.
- Google OAuth credentials, a payment gateway, and the real Instagram account.
- Photography: every photo slot currently shows a branded 3D illustration. Add licensed photos in `src/config/media.ts`.
- Stats, testimonials and the 4.8 rating are sample values and are marked as such on the site
  (`SHOW_SAMPLE_NOTICES` in `site.ts`).
