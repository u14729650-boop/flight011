// Creates or updates the database tables (supabase/schema.sql) before each build.
//
// It runs only when a direct Postgres connection string is available — Vercel's
// Supabase integration adds POSTGRES_URL_NON_POOLING automatically — so connecting
// Supabase in Vercel is all it takes. Without one (local builds, the preview) it
// does nothing. The schema is written to be safe to apply again and again.
//
// A failure is reported loudly but doesn't stop the site from deploying; set
// DB_SETUP_STRICT=1 to make it fail the build instead.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const raw = process.env.POSTGRES_URL_NON_POOLING || process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!raw) {
  console.log("[database] No database connection string set — skipping table setup.");
  process.exit(0);
}

const url = new URL(raw);
const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
// TLS is configured below; drop URL options that would override it.
for (const key of ["sslmode", "supa", "pgbouncer"]) url.searchParams.delete(key);

const client = new pg.Client({
  connectionString: url.toString(),
  // Supabase serves its own certificate chain; the connection is still encrypted.
  ssl: local ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 20_000,
  statement_timeout: 60_000,
});

const sql = readFileSync(path.join(root, "supabase/schema.sql"), "utf8");
let failed = false;
try {
  await client.connect();
  // One simple-protocol query runs the whole file, functions and all.
  await client.query(sql);
  const { rows } = await client.query(
    "select string_agg(table_name, ', ' order by table_name) as tables from information_schema.tables where table_schema = 'public' and table_name in ('products','banners','enquiries','orders','settings')",
  );
  console.log(`[database] Tables ready on ${url.hostname}: ${rows[0].tables}`);
} catch (err) {
  failed = true;
  console.warn(`[database] Could not apply supabase/schema.sql on ${url.hostname}: ${err.message}`);
  console.warn("[database] The site will still deploy. Run supabase/schema.sql in Supabase → SQL Editor if this persists.");
} finally {
  await client.end().catch(() => {});
}
if (failed && process.env.DB_SETUP_STRICT === "1") process.exit(1);
