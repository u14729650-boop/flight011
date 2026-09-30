/**
 * Look inside the SQLite database.
 *
 *   npm run db                                   → tables with row counts
 *   npm run db -- "SELECT name, email FROM users" → run any SQL and print the rows
 */
import '../server/env';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import { ENV } from '../server/env';

if (!fs.existsSync(ENV.sqliteFile)) {
  console.log(`No database yet at ${ENV.sqliteFile}. Start the API (npm run dev) and sign up once.`);
  process.exit(0);
}
const db = new DatabaseSync(ENV.sqliteFile);
const sql = process.argv.slice(2).join(' ').trim();

if (!sql) {
  console.log(`Database: ${ENV.sqliteFile}\n`);
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as { name: string }[];
  console.table(tables.map(({ name }) => ({ table: name, rows: (db.prepare(`SELECT COUNT(*) AS n FROM "${name}"`).get() as { n: number }).n })));
  console.log('\nRun a query: npm run db -- "SELECT id, name, email, created_at FROM users"');
} else if (/^\s*(select|pragma|with)\b/i.test(sql)) {
  const rows = db.prepare(sql).all() as Record<string, unknown>[];
  // Never print password hashes or session tokens to the terminal.
  const safe = rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, /password_hash|token_hash/.test(k) ? '••••' : v])));
  console.table(safe);
  console.log(`${rows.length} row(s)`);
} else {
  const r = db.prepare(sql).run();
  console.log(`OK — ${r.changes} row(s) changed`);
}
db.close();
