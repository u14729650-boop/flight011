# HOMIES CHOICE — Perfume Store Website

A premium e-commerce website for **HOMIES CHOICE**, a fragrance store in Paldi, Ahmedabad selling designer fragrances, Arabic perfumes and watches — with a hidden admin panel for the shop team.

Built with **Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Radix UI · Lucide icons**.

## What works

| | |
|---|---|
| **Pages** | Home, Shop All, Watches, 12 collections (Men, Women, Unisex, Arabic, Designer, Bestsellers and the 6 mood edits), a page for every product, Order review, Contact, 4 policy pages, 404 and error pages |
| **Catalogue** | Search by name or brand, filter by men/women/unisex, Arabic/designer, fragrance family, bottle size and price range, sort by price or A–Z. Filters live in the URL, so they can be shared. Includes reset controls and an empty state |
| **Bag** | Add, remove, change quantity, change bottle size and correct subtotals. Opens in a slide-out drawer and is saved in the browser across refreshes |
| **WhatsApp ordering** | "Order on WhatsApp" opens a prefilled message with each product, its size, quantity and price, the subtotal and the customer's name. It asks the team to confirm stock, delivery charges and the final amount. The site never says an order is confirmed |
| **Product enquiries** | "Ask about this perfume" prefills the product name and selected size |
| **Contact form** | Name, number and message with validation. Opens as a WhatsApp message and is optionally stored in Supabase |
| **SEO** | Unique titles and descriptions, canonical URLs, Open Graph image, Store and Product JSON-LD (no ratings or reviews, and offers only once a price is set), sitemap.xml, robots.txt |
| **Accessibility** | Keyboard-operable menus and dialogs (focus trapped, Esc closes them), a skip link, visible focus rings, labelled controls and AA colour contrast |

## Admin panel (hidden)

The admin lives at **`/hc-admin`**. It is not linked anywhere on the site, is excluded from search engines (noindex headers, not in the sitemap or robots.txt) and requires a username and password. Sessions are signed, http-only cookies that expire after 12 hours, and repeated wrong passwords are throttled.

What the team can do there:

- **Products:** add and edit perfumes and **watches**, set prices per size or option, stock status, bestseller flag, draft or live, fragrance family and mood, verified notes, watch specifications, and upload product photos.
- **Overview:** see what still needs a price or a photograph.
- **Enquiries:** read contact-form messages, reply on WhatsApp in one tap, and mark them as replied.
- **Store settings:** change the announcement bar.

Changes appear on the live shop straight away.

### Setting it up (about 10 minutes)

1. Create a free project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run `supabase/schema.sql`.
3. In your hosting settings (for example Vercel → Settings → Environment Variables), add:
   - `ADMIN_USERNAME`: the admin username
   - `ADMIN_PASSWORD`: a strong password
   - `ADMIN_SESSION_SECRET`: a long random string
   - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, from Supabase → Project Settings → API
4. Redeploy, open `https://your-domain/hc-admin`, sign in, and press **Import starter catalogue**.

Without Supabase the shop still works from the built-in catalogue (`src/data/products.ts`), and the admin opens in read-only mode.

## Art direction

Until real campaign photography is supplied, the hero, collection, mood and watch sections use abstract backdrops generated in the brand palette by `brand/art/generate.py`: satin drapes and a sunburst watch-dial texture. They never depict a product. To swap in a photograph, see `src/data/media.ts`.

## Run it

```bash
cd homies-choice
npm install
npm run dev          # http://localhost:3000
npm run build && npm start
npm test             # unit tests (cart maths, filters, WhatsApp messages, validation)
npm run test:e2e     # browser tests: desktop, mobile and the admin flow against a local mock database (needs `npm run build` first)
```

## Before going live — what the shop needs to supply

The site is built not to invent anything. These are shown as placeholders until the shop confirms them:

1. **Logo:** done. The official HC monogram and wordmark are cut out of the brand board (`brand/homies-choice-brand-board.jpg`) as transparent PNGs in `public/images/brand/`, by `brand/extract-logo.py`. They are used in the header, footer, hero, favicon and share image. If you have the original vector (SVG/AI/PDF) or a high-resolution PNG, drop it into `public/images/brand/` with the same file names for even sharper edges.
2. **Prices, stock and sizes:** set them in the admin panel (or edit `src/data/products.ts` if you're not using a database). While `price` is `null` the site shows **"Price on request"** and the bag subtotal reads "To be confirmed". Each product has a `pendingVerification` note listing what is still unconfirmed.
   - **Rayhaan:** the exact fragrance within the Rayhaan range still needs confirming.
3. **Product photographs:** put authentic photos in `public/images/products/<slug>/` and list them in the product's `images`. Until then each product shows a labelled "Photograph coming soon" card. It never shows a different bottle.
4. **Campaign and editorial photos:** set `src` for each slot in `src/data/media.ts` (hero, collection tiles, mood tiles, editorial section). Until then tonal emerald and beige backdrops are used.
5. **Fragrance notes:** add `notes` only after checking them against the brand's own listing.
6. **Policies:** replace the interim text in `src/data/policies.ts` with the final shipping, returns and terms.
7. **Instagram, map and domain:** set `instagram` and, if available, a verified Google Business link (`address.mapsUrl`) in `src/config/site.ts`. Set `NEXT_PUBLIC_SITE_URL` to the live domain.
8. **Announcement bar:** edit `announcement.text` in `src/config/site.ts`.

Brand names are shown as text only. Nothing on the site claims an official partnership or authorised distribution.

## Payments

Online payment is not wired in yet; orders go through WhatsApp. It can be added once the business has a payment-gateway account.

## Deploy (Vercel)

Import the repository and set **Root Directory** to `homies-choice`. The framework is detected as Next.js automatically.

## Project map

```
src/config/site.ts        business details, announcement, navigation
src/data/products.ts      starter catalogue (used until the database is connected)
src/data/media.ts         editorial photo slots
src/data/collections.ts   collection & mood pages
src/data/policies.ts      policy page text
src/lib/                  cart maths, filters, WhatsApp messages, SEO, validation
src/components/           UI (header, cart, product, catalogue, home sections)
src/app/(shop)/           storefront pages
src/app/hc-admin/         hidden admin panel
src/app/api/admin/        admin API (session-protected)
src/proxy.ts              guards /hc-admin and /api/admin
src/lib/server/           database access, admin auth (server only)
```

## Browser-only preview

`npm run preview:build` bundles the same components into `preview/dist/`. That is a single page with an in-memory router and no server, used to share a clickable preview as a Claude artifact. In the preview, the admin is a demo that saves to your browser only: add `#hc-admin` to the preview link and sign in with the demo credentials (the bundle only contains their SHA-256 fingerprints). The real site is the Next.js build above.
