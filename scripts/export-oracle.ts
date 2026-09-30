/**
 * Export the Oracle database (tables + every row) to one .sql file.
 *
 *   npm run db:export                    → docs/database/YA2-Oracle-Database.sql
 *   npm run db:export -- my-backup.sql   → any path
 *
 * Open the file in SQL Developer / SQL*Plus and run it to recreate the same
 * database anywhere. Login sessions and password-reset tokens are left out.
 */
import '../server/env';
import fs from 'node:fs';
import path from 'node:path';
import { ENV } from '../server/env';
import { createOracleStore, oracleReadOnly } from '../server/db/oracleStore';

if (ENV.dbClient !== 'oracle') {
  console.log('Set DB_CLIENT=oracle and the ORACLE_* variables in .env first.');
  process.exit(1);
}

const out = process.argv[2] ?? 'docs/database/YA2-Oracle-Database.sql';
const schema = fs.readFileSync('server/db/schema.oracle.sql', 'utf8').replace(/^--.*\n/gm, '').trim();

/** Tables in foreign-key order, with the column order used in the INSERTs. */
const TABLES: [string, string][] = [
  ['ya2_users', 'id, name, email, phone, password_hash, google_id, created_at, updated_at'],
  ['ya2_addresses', 'id, user_id, label, name, phone, line1, city, state, pincode, created_at'],
  ['ya2_quotes', 'id, user_id, mode_code, pickup_state, destination_state, pickup_city, destination_city, weight_kg, cargo_type, speed, total, transit_label, created_at'],
  ['ya2_shipments', 'id, user_id, booking_id, tracking_id, status, mode_code, speed, cargo_type, weight_kg, pickup_state, destination_state, sender_json, receiver_json, breakdown_json, price, estimated_delivery, created_at, paid_at'],
  ['ya2_shipment_events', 'shipment_id, stage, event_at, location, note'],
  ['ya2_payments', 'id, shipment_id, user_id, provider, order_id, amount, status, method, provider_payment_id, created_at, paid_at'],
  ['ya2_contact_messages', 'id, name, email, phone, subject, message, created_at'],
  ['ya2_activity', 'id, user_id, type, title, detail, ref, created_at'],
];
const ORDER: Record<string, string> = { ya2_shipment_events: 'shipment_id, event_at' };

const lit = (v: unknown): string => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(s)) {
    return `TIMESTAMP '${s.replace('T', ' ').replace('Z', '')} +00:00'`;
  }
  return `'${s.replace(/'/g, "''")}'`;
};

const store = await createOracleStore();
await store.init();
const lines: string[] = [];
const counts: string[] = [];
try {
  for (const [table, cols] of TABLES) {
    const { rows } = await oracleReadOnly(`SELECT ${cols} FROM ${table} ORDER BY ${ORDER[table] ?? 'created_at'}`, 100_000);
    counts.push(`--   ${table.padEnd(22)} ${rows.length} rows`);
    lines.push(`\n-- ${table} (${rows.length} rows)`);
    for (const r of rows) lines.push(`INSERT INTO ${table} (${cols}) VALUES (${Object.values(r).map(lit).join(', ')});`);
  }
  const next = Number((await oracleReadOnly("SELECT NVL(MAX(TO_NUMBER(SUBSTR(tracking_id, -6))), 1400) + 1 AS n FROM ya2_shipments")).rows[0].n);

  const sql = `-- ============================================================================
-- YA² Transport — Oracle Database export
-- Exported ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC from ${ENV.oracle.user}@${ENV.oracle.connectString}
--
-- Every row below was saved by the website (sign-up, booking, payment,
-- tracking, contact form). Run this whole file in SQL Developer (F5) or
-- SQL*Plus (@YA2-Oracle-Database.sql) to recreate the same database.
-- Login sessions and password-reset tokens are not exported.
--
${counts.join('\n')}
-- ============================================================================

SET DEFINE OFF

-- ---------------------------------------------------------------- 1. Tables
${schema.replace('START WITH 1401', `START WITH ${next}`)}

-- ------------------------------------------------------------------ 2. Data
${lines.join('\n')}

COMMIT;

-- -------------------------------------------------------- 3. Example queries
-- Customers and their bookings
SELECT u.name AS customer, s.booking_id, s.tracking_id, s.mode_code AS "MODE", s.weight_kg, s.price, s.status
FROM ya2_users u JOIN ya2_shipments s ON s.user_id = u.id
ORDER BY s.created_at;

-- Route of each shipment (sender/receiver are stored as JSON)
SELECT tracking_id, JSON_VALUE(sender_json, '$.city') AS from_city, JSON_VALUE(receiver_json, '$.city') AS to_city, price
FROM ya2_shipments;

-- Revenue by transport mode (paid only)
SELECT s.mode_code AS "MODE", COUNT(*) AS bookings, SUM(p.amount) AS revenue
FROM ya2_payments p JOIN ya2_shipments s ON s.id = p.shipment_id
WHERE p.status = 'PAID'
GROUP BY s.mode_code;

-- Tracking timeline of one shipment
SELECT e.stage, e.event_at, e.location, e.note
FROM ya2_shipment_events e JOIN ya2_shipments s ON s.id = e.shipment_id
WHERE s.tracking_id = (SELECT MIN(tracking_id) FROM ya2_shipments)
ORDER BY e.event_at;

-- Bookings waiting for payment
SELECT booking_id, price, created_at FROM ya2_shipments WHERE status = 'PENDING_PAYMENT';

-- One account's history (dashboard → History): each user only ever sees their own rows
SELECT a.created_at, a.type, a.title, a.detail
FROM ya2_activity a JOIN ya2_users u ON u.id = a.user_id
WHERE u.email = 'aarav.mehta@example.com'
ORDER BY a.created_at DESC;

-- How many history entries each account has
SELECT u.name, u.email, COUNT(a.id) AS history_entries, MAX(a.created_at) AS last_activity
FROM ya2_users u LEFT JOIN ya2_activity a ON a.user_id = u.id
GROUP BY u.name, u.email
ORDER BY last_activity DESC;

-- Enquiries from the contact form
SELECT created_at, name, email, subject FROM ya2_contact_messages ORDER BY created_at DESC;
`;
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, sql);
  console.log(`Wrote ${out}\n${counts.join('\n')}`);
} finally {
  await store.close();
}
