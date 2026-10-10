# HOMIES CHOICE — Perfume Store Website

A premium e-commerce website for **HOMIES CHOICE**, a fragrance store in Paldi, Ahmedabad selling designer fragrances and Arabic perfumes.

Built with **Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Radix UI · Lucide icons**.

## What works

| | |
|---|---|
| **Pages** | Home, Shop All, 12 collections (Men, Women, Unisex, Arabic, Designer, Bestsellers and the 6 mood edits), a page for every perfume, Order review, Contact, 4 policy pages, 404 and error pages |
| **Catalogue** | Search by name or brand, filter by men/women/unisex, Arabic/designer, fragrance family, bottle size and price range, sort by price or A–Z. Filters live in the URL, so they can be shared. Includes reset controls and an empty state |
| **Bag** | Add, remove, change quantity, change bottle size and correct subtotals. Opens in a slide-out drawer and is saved in the browser across refreshes |
| **WhatsApp ordering** | "Order on WhatsApp" opens a prefilled message with each product, its size, quantity and price, the subtotal and the customer's name. It asks the team to confirm stock, delivery charges and the final amount. The site never says an order is confirmed |
| **Product enquiries** | "Ask about this perfume" prefills the product name and selected size |
| **Contact form** | Name, number and message with validation. Opens as a WhatsApp message and is optionally stored in Supabase |
| **SEO** | Unique titles and descriptions, canonical URLs, Open Graph image, Store and Product JSON-LD (no ratings or reviews, and offers only once a price is set), sitemap.xml, robots.txt |
| **Accessibility** | Keyboard-operable menus and dialogs (focus trapped, Esc closes them), a skip link, visible focus rings, labelled controls and AA colour contrast |

## Run it

```bash
cd homies-choice
npm install
npm run dev          # http://localhost:3000
npm run build && npm start
npm test             # unit tests (cart maths, filters, WhatsApp messages, validation)
npm run test:e2e     # browser tests, desktop and mobile (needs `npm run build` first)
```

## Before going live — what the shop needs to supply

The site is built not to invent anything. These are shown as placeholders until the shop confirms them:

1. **Logo:** save the official HOMIES CHOICE logo to `public/images/brand/` and set `logo.src` in `src/config/site.ts`. Until then a temporary "HC" monogram is shown.
2. **Prices, stock and sizes:** edit `src/data/products.ts`. While `price` is `null` the site shows **"Price on request"** and the bag subtotal reads "To be confirmed". Each product has a `pendingVerification` note listing what is still unconfirmed.
   - **Rayhaan:** the exact fragrance within the Rayhaan range still needs confirming.
3. **Product photographs:** put authentic photos in `public/images/products/<slug>/` and list them in the product's `images`. Until then each product shows a labelled "Photograph coming soon" card. It never shows a different bottle.
4. **Campaign and editorial photos:** set `src` for each slot in `src/data/media.ts` (hero, collection tiles, mood tiles, editorial section). Until then tonal emerald and beige backdrops are used.
5. **Fragrance notes:** add `notes` only after checking them against the brand's own listing.
6. **Policies:** replace the interim text in `src/data/policies.ts` with the final shipping, returns and terms.
7. **Instagram, map and domain:** set `instagram` and, if available, a verified Google Business link (`address.mapsUrl`) in `src/config/site.ts`. Set `NEXT_PUBLIC_SITE_URL` to the live domain.
8. **Announcement bar:** edit `announcement.text` in `src/config/site.ts`.

Brand names are shown as text only. Nothing on the site claims an official partnership or authorised distribution.

## Optional: Supabase

`supabase/schema.sql` creates tables for categories, products, variants, inventory, orders, order items, enquiries and admin users, with row-level security. The public can read only the published catalogue, and only admins can manage it.

To store contact-form enquiries, set these **server-side** variables (never prefix them with `NEXT_PUBLIC_`):

```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Without them the form still works and goes to WhatsApp. Online payment is not wired in yet; it can be added once the business has a payment-gateway account.

## Deploy (Vercel)

Import the repository and set **Root Directory** to `homies-choice`. The framework is detected as Next.js automatically.

## Project map

```
src/config/site.ts        business details, announcement, navigation
src/data/products.ts      catalogue (prices, sizes, stock, images)
src/data/media.ts         editorial photo slots
src/data/collections.ts   collection & mood pages
src/data/policies.ts      policy page text
src/lib/                  cart maths, filters, WhatsApp messages, SEO, validation
src/components/           UI (header, cart, product, catalogue, home sections)
src/app/                  routes, sitemap, robots, OG image, /api/enquiry
```
