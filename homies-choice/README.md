# HOMIES CHOICE — Perfume Store Website

A premium e-commerce website for **HOMIES CHOICE**, a fragrance store in Paldi, Ahmedabad selling designer fragrances, Arabic perfumes and watches — with a hidden admin panel for the shop team.

Built with **Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Radix UI · Lucide icons**.

## What works

| | |
|---|---|
| **Pages** | Home, Shop All, Watches, 12 collections (Men, Women, Unisex, Arabic, Designer, Bestsellers and the 6 mood edits), a page for every product, Order review, Contact, 4 policy pages, 404 and error pages |
| **Catalogue** | Search by name or brand, filter by men/women/unisex, Arabic/designer, fragrance family, bottle size and price range, sort by price or A–Z. Filters live in the URL, so they can be shared. Includes reset controls and an empty state |
| **Bag** | Add, remove, change quantity, change bottle size and correct subtotals. Opens in a slide-out drawer and is saved in the browser across refreshes |
| **3D hero** | A turning, interactive Homies Choice flacon (three.js): faceted glass, coloured perfume, a gold cap with an emerald stone, the HC monogram, gold orbit rings and drifting gold dust. Drag sideways to spin it. A still render paints instantly and stays as the fallback without WebGL |
| **WhatsApp ordering** | Checkout opens a prefilled WhatsApp message with an order reference (e.g. `HC-7K4Q2M`), each product, its size, quantity and price, the subtotal, the customer's name and their payment choice. It asks the team to confirm stock, delivery charges and the final amount. The site never says an order is confirmed |
| **Payments** | Cash on delivery (optionally with an advance token paid by UPI) and UPI (QR code, one-tap "Open UPI app" link and copyable UPI ID). Customers can type their UPI transaction ID so the team can match the payment. All of it is set from the dashboard |
| **Product enquiries** | "Ask about this perfume" prefills the product name and selected size |
| **Contact form** | Name, number and message with validation. Opens as a WhatsApp message and is optionally stored in Supabase |
| **SEO** | Unique titles and descriptions, canonical URLs, Open Graph image, Store and Product JSON-LD (no ratings or reviews, and offers only once a price is set), sitemap.xml, robots.txt |
| **Accessibility** | Keyboard-operable menus and dialogs (focus trapped, Esc closes them), a skip link, visible focus rings, labelled controls and AA colour contrast |

## Admin panel (hidden)

The admin lives at **`/hc-admin`**. It is not linked anywhere on the site, is excluded from search engines (noindex headers, not in the sitemap or robots.txt) and requires a username and password. Sessions are signed, http-only cookies that expire after 12 hours, and repeated wrong passwords are throttled.

What the team can do there:

- **Overview:** new orders, what still needs a price or a photograph, and **every page of the website** with a link to open it and to where it is changed.
- **Orders:** every order sent from the checkout, with its reference, items, total, payment choice, token and the customer's UPI transaction ID. Move orders through New → Confirmed → Paid → Shipped → Delivered (or Cancelled).
- **Products:** add and edit perfumes and **watches**, set prices per size or option, stock status, bestseller flag, draft or live, fragrance family and mood, verified notes, watch specifications, and upload product photos.
- **Home page:** choose the hero visual (the 3D bottle, with a live preview and five perfume colours, or the photograph and monogram), edit the headline, supporting text and both buttons, show or hide the figures panel, and switch each home-page section on or off.
- **Banners:** create website banners for the home-page carousel or the top of the shop pages, with a headline, button, wide and phone images, a light or dark style, an on/off switch, a start/end schedule and a display order. A live preview shows the result as you edit.
- **Payments:** switch cash on delivery on or off, ask for an advance token (and set its amount), add your UPI ID and payee name (with a test QR code), and add a note for customers under each option.
- **Enquiries:** read contact-form messages, reply on WhatsApp in one tap, and mark them as replied.
- **Store settings:** business details used across the site (WhatsApp and calling numbers, contact person, address, area, PIN code, map link, opening hours, email, Instagram, footer text), the announcement bar, the search-engine title and description, and the text of the four policy pages.

Changes appear on the live shop straight away.

### Setting it up (about 10 minutes)

1. Create a free project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run `supabase/schema.sql`. It's safe to run again after updates; for example, it adds the `banners` and `orders` tables, indexes and storage rules.
3. In your hosting settings (for example Vercel → Settings → Environment Variables), add:
   - `ADMIN_USERNAME`: the admin username
   - `ADMIN_PASSWORD`: a strong password
   - `ADMIN_SESSION_SECRET`: a long random string
   - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, from Supabase → Project Settings → API
4. Redeploy, open `https://your-domain/hc-admin`, sign in, and press **Import starter catalogue**.

Without Supabase the shop still works from the built-in catalogue (`src/data/products.ts`) and the starter banners (`src/data/banners.ts`), and the admin opens in read-only mode.

### How the backend works

- The server talks to Supabase with the official `@supabase/supabase-js` client, typed against the schema (`src/lib/server/database.types.ts`), using the service-role key. That key never reaches the browser.
- Storefront reads (products, banners, settings) are cached by Next.js with tags. Pages stay static and fast, and a save in the admin refreshes just the affected data straight away.
- Photos are uploaded to Supabase Storage (`product-images` bucket) and served through Next.js image optimisation as resized AVIF/WebP, cached for 30 days.
- The database uses indexes for every storefront query, keeps `updated_at` current automatically, and has row-level security on every table.

## Performance

Lighthouse mobile scores (median of three runs, measured locally on a simulated mid-range phone): home page 91, shop 91, product page 93; cumulative layout shift 0; accessibility, best practices and SEO 100. What does it:

- The hero's still bottle image is the first thing painted, with a high fetch priority. The 3D (three.js, about 140 KB compressed) is a separate file fetched only after the page has loaded, and only on devices with a real graphics chip; phones skip the desktop satin backdrop entirely.
- No streaming "Loading…" swap on first load, and page fade transitions only on in-app navigation.
- Optimised fonts (self-hosted via `next/font`), light glass effects on phones, and a small favicon.

## The 3D bottle

- The scene is plain three.js in `src/components/home/bottle/scene.ts`, wrapped by `Bottle3D.tsx`. It is loaded only after the page has finished loading and the browser is idle, so it never delays the first paint; until then (and on devices without WebGL, or if the GPU resets) a still render of the same scene is shown.
- It pauses when scrolled out of view or when the tab is hidden, uses a lower resolution and fewer particles on phones, stays still for visitors who prefer reduced motion (it can still be dragged), and frees its GPU memory when you leave the page.
- It only runs on a real graphics chip. Where WebGL is missing or emulated on the CPU (some old devices, many test robots) the still image stays. Add `?bottle=3d` to the address to force the 3D on anyway.
- The still images in `public/images/editorial/bottle-<colour>.webp` are rendered from the same scene by `node brand/art/render-bottle.mjs`. Re-run it after changing the bottle.
- Perfume colours live in `src/components/home/bottle/liquids.ts`.

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
6. **Policies:** write the final shipping, returns and terms in Dashboard → Store settings → Policies (until then the standard interim wording is used).
7. **Instagram, map, hours and domain:** add them in Dashboard → Store settings. Set `NEXT_PUBLIC_SITE_URL` to the live domain.
8. **Payments:** add your UPI ID and, if you want one, the cash-on-delivery token amount in Dashboard → Payments. Test the QR code with a small payment first.

Brand names are shown as text only. Nothing on the site claims an official partnership or authorised distribution.

## Payments

Payments are set up in Dashboard → Payments:

- **Cash on delivery**, optionally with an **advance token**: the customer pays the token by UPI to confirm the order and the balance in cash on delivery.
- **UPI**: the customer scans the QR code or taps "Open UPI app" (Google Pay, PhonePe, Paytm…). The amount and the order reference are filled in for them when all prices are known.

The money goes straight to your UPI ID; the website never handles it and nothing is charged automatically. Customers can type their UPI transaction ID at checkout; it is sent to you on WhatsApp and shown under Orders so you can match it in your bank or UPI app before confirming. A payment gateway (cards, automatic confirmation) can be added later once the business has a gateway account.

## Deploy (Vercel)

Import the repository and set **Root Directory** to `homies-choice`. The framework is detected as Next.js automatically.

## Project map

```
src/config/site.ts        brand name, logo, default business details, navigation
src/lib/store-settings.ts everything editable in the dashboard (business, home page, payments, SEO, policies)
src/lib/orders.ts         order references, validation, statuses
src/components/home/bottle/ the 3D hero bottle (three.js scene, React wrapper, colours)
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
