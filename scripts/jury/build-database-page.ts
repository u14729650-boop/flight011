/**
 * Builds docs/jury/YA2-Database.html — a single self-contained page for the
 * project jury that explains the YA² database and runs real SQL in the
 * browser (SQLite compiled to WebAssembly, embedded in the file), so it
 * opens by double-click with no server.
 *
 *   npm run jury:page            → docs/jury/YA2-Database.html
 *   npm run jury:page -- out.html → also writes an artifact fragment to out.html
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import { buildSampleSql } from './sample-data';
import { calculateQuote } from '../../src/lib/pricing';
import { cityByName } from '../../src/data/cities';

const require = createRequire(import.meta.url);
const root = process.cwd();
const schemaSql = fs.readFileSync(path.join(root, 'server/db/schema.sqlite.sql'), 'utf8');
const sampleSql = buildSampleSql();

/* ----------------------------- content definition ----------------------------- */

// Price for the walk-through booking, from the site's own pricing engine.
const bookQuote = calculateQuote({
  mode: 'ROAD',
  cargoType: 'HOUSEHOLD',
  speed: 'STANDARD',
  weightKg: 1500,
  pickupState: 'Delhi',
  destinationState: 'Rajasthan',
  pickupCoords: cityByName('New Delhi').coords,
  destinationCoords: cityByName('Jaipur').coords,
});
const BOOK_PRICE = bookQuote.total;
const BOOK_BREAKDOWN = JSON.stringify({
  basePrice: bookQuote.basePrice,
  distanceFactor: bookQuote.distanceFactor,
  serviceFactor: bookQuote.serviceFactor,
  urgencyFactor: bookQuote.urgencyFactor,
  total: bookQuote.total,
});

interface Step {
  id: string;
  title: string;
  who: string;
  text: string;
  sql: string;
  check?: string;
  note?: string;
}

const ACTIONS: Step[] = [
  {
    id: 'register',
    title: 'A customer creates an account',
    who: 'Register page',
    text: 'The password is hashed with scrypt in the Node.js server before it reaches the database, so the real password is never stored.',
    sql: `INSERT INTO users (id, name, email, phone, password_hash, google_id, created_at, updated_at)
VALUES ('u-neha', 'Neha Gupta', 'neha@example.com', '+91 98990 11122',
        'scrypt$16384$8$1$Qm9zU2FsdA$Zm9vYmFyaGFzaA', NULL,
        '2026-09-30T10:00:00Z', '2026-09-30T10:00:00Z');`,
    check: `SELECT id, name, email, phone, created_at FROM users WHERE email = 'neha@example.com';`,
  },
  {
    id: 'login',
    title: 'The customer logs in',
    who: 'Login page',
    text: 'The server looks the user up by email, checks the password against the stored hash in code, then records a session. The browser only receives a random cookie; the database keeps a hash of it.',
    sql: `SELECT id, name, password_hash FROM users WHERE email = 'priya@example.com';

INSERT INTO sessions (token_hash, user_id, expires_at, created_at)
VALUES ('4b1e0c9a7f3d2e6b8a5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a',
        'u-priya', '2026-10-14T10:05:00Z', '2026-09-30T10:05:00Z');`,
    check: `SELECT user_id, expires_at, created_at FROM sessions WHERE user_id = 'u-priya' ORDER BY created_at DESC;`,
  },
  {
    id: 'enquiry',
    title: 'A visitor sends an enquiry',
    who: 'Contact page',
    text: 'Every message from the contact form becomes a row in contact_messages. Staff read these on the hidden admin page.',
    sql: `INSERT INTO contact_messages (id, name, email, phone, subject, message, created_at)
VALUES ('m-6', 'Karan Malhotra', 'karan@example.com', '9876012345',
        'Air cargo to Port Blair',
        'Can you send 40 KG of machine parts from Chennai to Port Blair this week?',
        '2026-09-30T10:10:00Z');`,
    check: `SELECT created_at, name, subject, message FROM contact_messages ORDER BY created_at DESC LIMIT 3;`,
  },
  {
    id: 'book',
    title: 'The customer books a shipment',
    who: 'Book a Shipment page',
    text: 'The server recalculates the price itself (the browser never sets it) and stores the booking as PENDING_PAYMENT, without a tracking ID yet.',
    sql: `INSERT INTO shipments (id, user_id, booking_id, tracking_id, status, mode, speed, cargo_type, weight_kg,
  sender_name, sender_phone, sender_address, sender_city, sender_state, sender_pincode,
  receiver_name, receiver_phone, receiver_address, receiver_city, receiver_state, receiver_pincode,
  price, breakdown_json, estimated_delivery, created_at, paid_at)
VALUES ('s-1409', 'u-neha', 'BK-2026-1409A', NULL, 'PENDING_PAYMENT', 'ROAD', 'STANDARD', 'HOUSEHOLD', 1500,
  'Neha Gupta', '9899011122', 'B-12, Vasant Kunj', 'New Delhi', 'Delhi', '110070',
  'Neha Gupta', '9899011122', 'C-Scheme, Ashok Marg', 'Jaipur', 'Rajasthan', '302001',
  ${BOOK_PRICE}, '${BOOK_BREAKDOWN}',
  NULL, '2026-09-30T10:20:00Z', NULL);`,
    check: `SELECT booking_id, status, sender_city, receiver_city, weight_kg, price FROM shipments WHERE id = 's-1409';`,
    note: 'Run “A customer creates an account” first: the booking must belong to an existing user (foreign key).',
  },
  {
    id: 'pay',
    title: 'The payment is confirmed',
    who: 'Payment page',
    text: 'After the payment is verified, the server records it, takes the next tracking number, updates the booking and writes the first two tracking events.',
    sql: `INSERT INTO payments (id, shipment_id, user_id, provider, order_id, amount, status, method, provider_payment_id, created_at, paid_at)
VALUES ('p-8', 's-1409', 'u-neha', 'demo', 'demo_order_1409', ${BOOK_PRICE}, 'PAID', 'UPI', 'demo_pay_1409',
        '2026-09-30T10:22:00Z', '2026-09-30T10:22:30Z');

UPDATE counters SET value = value + 1 WHERE name = 'tracking_seq';

UPDATE shipments
SET tracking_id = 'YA2-2026-' || printf('%06d', (SELECT value FROM counters WHERE name = 'tracking_seq')),
    status = 'PICKUP_SCHEDULED', paid_at = '2026-09-30T10:22:30Z', estimated_delivery = '2026-10-06T18:00:00Z'
WHERE id = 's-1409';

INSERT INTO shipment_events (shipment_id, stage, event_at, location, note) VALUES
  ('s-1409', 'ORDER_CONFIRMED',  '2026-09-30T10:22:30Z', 'New Delhi', 'Booking BK-2026-1409A confirmed'),
  ('s-1409', 'PICKUP_SCHEDULED', '2026-09-30T10:23:30Z', 'New Delhi', 'Pickup planned for Thu 1 Oct, 10 AM – 6 PM');`,
    check: `SELECT booking_id, tracking_id, status, price, paid_at FROM shipments WHERE id = 's-1409';`,
    note: 'Run the booking step first.',
  },
  {
    id: 'track',
    title: 'Anyone tracks a shipment',
    who: 'Track Shipment page',
    text: 'Tracking needs only the tracking ID. Two reads: the shipment itself, then its timeline in order.',
    sql: `SELECT tracking_id, status, mode, weight_kg, sender_city, receiver_city, estimated_delivery
FROM shipments WHERE tracking_id = 'YA2-2026-001403';

SELECT stage, event_at, location
FROM shipment_events
WHERE shipment_id = (SELECT id FROM shipments WHERE tracking_id = 'YA2-2026-001403')
ORDER BY event_at;`,
  },
  {
    id: 'dashboard',
    title: 'The customer opens their dashboard',
    who: 'My YA² dashboard',
    text: 'Only the logged-in customer’s own rows are read, newest first.',
    sql: `SELECT booking_id, tracking_id, status, sender_city, receiver_city, price, created_at
FROM shipments
WHERE user_id = 'u-priya'
ORDER BY created_at DESC;`,
  },
];

const REPORTS: Step[] = [
  {
    id: 'r-enquiries',
    title: 'All enquiries, newest first',
    who: 'SELECT · ORDER BY',
    text: 'What the admin page shows under Enquiries.',
    sql: `SELECT created_at, name, email, subject, message
FROM contact_messages
ORDER BY created_at DESC;`,
  },
  {
    id: 'r-join',
    title: 'Shipments with the customer who booked them',
    who: 'INNER JOIN',
    text: 'Joins shipments to users through the foreign key user_id.',
    sql: `SELECT s.tracking_id, u.name AS customer, s.sender_city || ' → ' || s.receiver_city AS route,
       s.mode, s.weight_kg, s.price, s.status
FROM shipments s
JOIN users u ON u.id = s.user_id
ORDER BY s.created_at DESC;`,
  },
  {
    id: 'r-customers',
    title: 'Every customer and how much they have booked',
    who: 'LEFT JOIN · GROUP BY',
    text: 'LEFT JOIN keeps customers with no shipments (they show 0).',
    sql: `SELECT u.name, u.email,
       COUNT(s.id)              AS shipments,
       COALESCE(SUM(s.price), 0) AS total_value
FROM users u
LEFT JOIN shipments s ON s.user_id = u.id
GROUP BY u.id
ORDER BY total_value DESC;`,
  },
  {
    id: 'r-revenue',
    title: 'Paid revenue by transport mode',
    who: 'JOIN · SUM · GROUP BY',
    text: 'Only payments with status PAID are counted.',
    sql: `SELECT s.mode, COUNT(*) AS bookings, SUM(p.amount) AS revenue
FROM payments p
JOIN shipments s ON s.id = p.shipment_id
WHERE p.status = 'PAID'
GROUP BY s.mode
ORDER BY revenue DESC;`,
  },
  {
    id: 'r-status',
    title: 'Shipments by status',
    who: 'GROUP BY',
    text: 'A quick operations view of where every consignment is.',
    sql: `SELECT status, COUNT(*) AS shipments
FROM shipments
GROUP BY status
ORDER BY shipments DESC;`,
  },
  {
    id: 'r-routes',
    title: 'State-to-state routes and average price per KG',
    who: 'GROUP BY · ROUND',
    text: 'Useful for spotting the busiest lanes and checking pricing.',
    sql: `SELECT sender_state || ' → ' || receiver_state AS route,
       COUNT(*) AS shipments,
       ROUND(SUM(price) * 1.0 / SUM(weight_kg), 2) AS price_per_kg
FROM shipments
GROUP BY route
ORDER BY shipments DESC, price_per_kg DESC;`,
  },
  {
    id: 'r-timeline',
    title: 'Full tracking history of one shipment',
    who: 'JOIN · ORDER BY',
    text: 'Every milestone recorded for YA2-2026-001403 (Pune → Hyderabad move).',
    sql: `SELECT e.stage, e.event_at, e.location
FROM shipment_events e
JOIN shipments s ON s.id = e.shipment_id
WHERE s.tracking_id = 'YA2-2026-001403'
ORDER BY e.event_at;`,
  },
  {
    id: 'r-unpaid',
    title: 'Bookings still waiting for payment',
    who: 'WHERE',
    text: 'These have no tracking ID yet; support can follow up.',
    sql: `SELECT booking_id, sender_name, sender_city || ' → ' || receiver_city AS route, price, created_at
FROM shipments
WHERE status = 'PENDING_PAYMENT';`,
  },
  {
    id: 'r-subquery',
    title: 'Customers who sent an enquiry and also booked',
    who: 'Subquery · EXISTS',
    text: 'Matches enquiries to accounts by email.',
    sql: `SELECT u.name, u.email
FROM users u
WHERE EXISTS (SELECT 1 FROM contact_messages m WHERE m.email = u.email)
  AND EXISTS (SELECT 1 FROM shipments s WHERE s.user_id = u.id);`,
  },
  {
    id: 'r-security',
    title: 'What the database holds for passwords',
    who: 'Security',
    text: 'Only one-way hashes are stored. This page masks them anyway, like the admin console does.',
    sql: `SELECT name, email, password_hash FROM users LIMIT 3;`,
  },
];

/* ------------------------------ build-time data ------------------------------ */

const buildDb = () => {
  const db = new DatabaseSync(':memory:');
  db.exec(schemaSql);
  db.exec(sampleSql);
  return db;
};

const splitStatements = (sql: string) =>
  sql
    .split(/;\s*(?:\n|$)/)
    .map((s) => s.trim())
    .filter(Boolean);

type Rows = Record<string, unknown>[];
const precompute = (sql: string): { sql: string; rows: Rows }[] => {
  const db = buildDb();
  const out = splitStatements(sql)
    .filter((s) => /^\s*(select|with)\b/i.test(s))
    .map((s) => ({ sql: s, rows: db.prepare(s).all() as Rows }));
  db.close();
  return out;
};

const db0 = buildDb();
const tables = (db0.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as { name: string }[]).map(({ name }) => ({
  name,
  count: Number((db0.prepare(`SELECT COUNT(*) AS n FROM "${name}"`).get() as { n: number }).n),
  cols: db0.prepare(`PRAGMA table_info("${name}")`).all() as { name: string; type: string; notnull: number; pk: number }[],
  fks: db0.prepare(`PRAGMA foreign_key_list("${name}")`).all() as { table: string; from: string; to: string }[],
  uniques: (db0.prepare(`PRAGMA index_list("${name}")`).all() as { name: string; unique: number; origin: string }[])
    .filter((i) => i.unique && i.origin !== 'pk')
    .flatMap((i) => (db0.prepare(`PRAGMA index_info("${i.name}")`).all() as { name: string }[]).map((c) => c.name)),
}));
db0.close();

const TABLE_NOTES: Record<string, string> = {
  users: 'Customer accounts',
  sessions: 'Logged-in browsers (hashed tokens)',
  password_resets: 'One-time reset links',
  addresses: 'Saved pickup / drop addresses',
  quotes: 'Estimates saved from the calculator',
  shipments: 'Bookings, prices and status',
  shipment_events: 'Tracking timeline, one row per milestone',
  payments: 'Payment attempts and results',
  contact_messages: 'Enquiries from the contact form',
  counters: 'Next tracking number',
};

/* ---------------------------------- render ---------------------------------- */

const esc = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const KEYWORDS =
  'select|from|where|join|left|inner|on|and|or|not|in|exists|insert|into|values|update|set|delete|group|by|order|desc|asc|limit|as|count|sum|avg|round|coalesce|printf|null|is|case|when|then|else|end|distinct|having|with|primary|key|references|create|table|if'.split('|');
function highlight(sql: string) {
  return sql.replace(/('(?:[^']|'')*')|(--[^\n]*)|\b(\d+(?:\.\d+)?)\b|\b([A-Za-z_]+)\b|([^'\w]+)/g, (m, str, com, num, word) => {
    if (str) return `<span class="t-str">${esc(str)}</span>`;
    if (com) return `<span class="t-com">${esc(com)}</span>`;
    if (num) return `<span class="t-num">${num}</span>`;
    if (word && KEYWORDS.includes(word.toLowerCase())) return `<span class="t-kw">${word}</span>`;
    return esc(m);
  });
}

const SECRET = /^(scrypt\$|[0-9a-f]{64}$)/;
const MONEY = /(price|amount|total|revenue|value)$/i;
const fmtCell = (col: string, v: unknown) => {
  if (v === null || v === undefined) return '<span class="nul">NULL</span>';
  if (typeof v === 'string' && SECRET.test(v)) return '<span class="mask">•••• hidden</span>';
  if (typeof v === 'number' && MONEY.test(col)) return `₹${v.toLocaleString('en-IN')}`;
  return esc(v);
};
const tableHtml = (rows: Rows) => {
  if (!rows.length) return '<p class="res-empty">No rows.</p>';
  const cols = Object.keys(rows[0]);
  return `<div class="res-scroll"><table><thead><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows
    .map((r) => `<tr>${cols.map((c) => `<td class="${typeof r[c] === 'number' ? 'num' : ''}">${fmtCell(c, r[c])}</td>`).join('')}</tr>`)
    .join('')}</tbody></table></div><p class="res-meta">${rows.length} row${rows.length === 1 ? '' : 's'}</p>`;
};

const stepHtml = (s: Step, precomputed: boolean) => {
  const results = precomputed ? precompute(s.sql).map((r) => tableHtml(r.rows)).join('') : '';
  return `<article class="step" id="${s.id}">
  <header class="step__head">
    <div><span class="step__who">${esc(s.who)}</span><h3>${esc(s.title)}</h3></div>
    <button class="run" type="button" data-step="${s.id}">Run on sample data</button>
  </header>
  <p class="step__text">${esc(s.text)}</p>
  <pre class="sql"><code>${highlight(s.sql)}</code></pre>
  ${s.note ? `<p class="step__note">${esc(s.note)}</p>` : ''}
  <div class="res" data-result="${s.id}">${results || '<p class="res-empty">Press “Run on sample data” to execute these statements.</p>'}</div>
</article>`;
};

const relationships = tables.flatMap((t) => t.fks.map((f) => ({ from: t.name, col: f.from, to: f.table })));
const totalRows = tables.reduce((n, t) => n + t.count, 0);

const tableCards = tables
  .map(
    (t) => `<article class="tcard" id="t-${t.name}">
  <header><h3>${t.name}</h3><span class="tcount">${t.count} row${t.count === 1 ? '' : 's'}</span></header>
  <p class="tnote">${esc(TABLE_NOTES[t.name] ?? '')}</p>
  <ul>${t.cols
    .map((c) => {
      const fk = t.fks.find((f) => f.from === c.name);
      const tags = [
        c.pk ? '<span class="tag tag--pk">PK</span>' : '',
        fk ? `<span class="tag tag--fk">FK → ${fk.table}</span>` : '',
        t.uniques.includes(c.name) ? '<span class="tag">UNIQUE</span>' : '',
      ].join('');
      return `<li><code>${c.name}</code><span class="ctype">${c.type || 'ANY'}${c.notnull || c.pk ? '' : ' · null'}</span>${tags}</li>`;
    })
    .join('')}</ul>
</article>`,
  )
  .join('\n');

const css = fs.readFileSync(path.join(root, 'scripts/jury/page.css'), 'utf8');
const clientJs = fs.readFileSync(path.join(root, 'scripts/jury/page.client.js'), 'utf8');
const sqlJs = fs.readFileSync(require.resolve('sql.js/dist/sql-wasm.js'), 'utf8').replace(/<\/script/gi, '<\\/script');
const wasmB64 = fs.readFileSync(require.resolve('sql.js/dist/sql-wasm.wasm')).toString('base64');
const safeJson = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c');

const body = `<title>YA² Database</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap">
<style>${css}</style>
<div class="page">
<header class="top">
  <div class="brand"><span class="mark">YA<sup>2</sup></span><span class="brand__txt">YA<sup>2</sup> Transport</span></div>
  <h1>How YA<sup>2</sup> stores its data</h1>
  <p class="lede">The website saves every account, enquiry, booking, payment and tracking event in a relational SQL database (SQLite). This page shows the tables, the exact SQL the website runs, and reports built on top of it. The queries run live, right here in the browser.</p>
  <dl class="facts">
    <div><dt>Database</dt><dd>SQLite 3</dd></div>
    <div><dt>Tables</dt><dd>${tables.length}</dd></div>
    <div><dt>Relationships</dt><dd>${relationships.length}</dd></div>
    <div><dt>Sample rows</dt><dd>${totalRows}</dd></div>
    <div><dt>Engine status</dt><dd id="engine" class="engine">Loading…</dd></div>
  </dl>
  <p class="sample">All names, emails and phone numbers below are fictional sample data. Prices come from the website’s real pricing engine.</p>
</header>

<nav class="toc" aria-label="Contents">
  <a href="#tables">1 · Tables</a><a href="#actions">2 · What the website runs</a><a href="#reports">3 · Reports</a><a href="#console">4 · Try a query</a>
</nav>

<section id="tables">
  <h2>1 · Tables and relationships</h2>
  <p class="sec-lede">Each table has a primary key (PK). Foreign keys (FK) link rows to each other, for example every shipment belongs to one user.</p>
  <div class="rels">${relationships
    .filter((r, i, a) => a.findIndex((x) => x.from === r.from && x.to === r.to) === i)
    .map((r) => `<span class="rel"><b>${r.to}</b> 1 ─── ∞ <b>${r.from}</b><small>${r.from}.${r.col}</small></span>`)
    .join('')}</div>
  <div class="tgrid">${tableCards}</div>
</section>

<section id="actions">
  <h2>2 · What the website runs</h2>
  <p class="sec-lede">Follow one customer from sign-up to delivery. Each card is the SQL the server executes for that action. “Run” executes it on this page’s own copy of the database, so you can follow the steps in order.</p>
  ${ACTIONS.map((s) => stepHtml(s, false)).join('\n')}
</section>

<section id="reports">
  <h2>3 · Reports</h2>
  <p class="sec-lede">Questions the business asks, answered with SQL. Results shown are from the sample data; press Run to re-run them live (for example after running the steps above).</p>
  ${REPORTS.map((s) => stepHtml(s, true)).join('\n')}
</section>

<section id="console">
  <h2>4 · Try a query</h2>
  <p class="sec-lede">Type any SQL and press Run (or Ctrl + Enter). Changes only affect this page’s copy of the sample data.</p>
  <div class="console">
    <label for="sql-input" class="lbl">SQL</label>
    <textarea id="sql-input" spellcheck="false">SELECT name, email, created_at FROM users ORDER BY created_at;</textarea>
    <div class="console__bar">
      <button class="run" type="button" id="console-run">Run query</button>
      <button class="ghost" type="button" id="reset">Reset sample data</button>
      <span class="hint">Tables: ${tables.map((t) => `<code>${t.name}</code>`).join(' ')}</span>
    </div>
    <div class="res" id="console-result"><p class="res-empty">Results appear here.</p></div>
  </div>
</section>

<footer class="foot">YA<sup>2</sup> Transport · The live website uses this same schema in <code>server/.data/ya2.db</code>. Password hashes and session tokens are masked on this page.</footer>
</div>
<script type="application/json" id="data">${safeJson({
  schema: schemaSql,
  sample: sampleSql,
  steps: Object.fromEntries([...ACTIONS, ...REPORTS].map((s) => [s.id, { sql: s.sql, check: s.check ?? null }])),
})}</script>
<script type="text/plain" id="wasm">${wasmB64}</script>
<script>${sqlJs}</script>
<script>${clientJs}</script>`;

const outDir = path.join(root, 'docs/jury');
fs.mkdirSync(outDir, { recursive: true });
const full = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
</head>
<body>
${body}
</body>
</html>
`;
fs.writeFileSync(path.join(outDir, 'YA2-Database.html'), full);
const fragOut = process.argv[2];
if (fragOut) fs.writeFileSync(fragOut, body);
console.log(`Wrote docs/jury/YA2-Database.html (${(full.length / 1024).toFixed(0)} KB, ${tables.length} tables, ${totalRows} sample rows)`);
