/**
 * Look inside the database (SQLite or Oracle, whichever DB_CLIENT selects).
 *
 *   npm run db                                   → tables with row counts
 *   npm run db -- "SELECT name, email FROM users" → run any SQL and print the rows
 *
 * Oracle tables carry a ya2_ prefix: npm run db -- "SELECT name, email FROM ya2_users"
 */
import '../server/env';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import { ENV } from '../server/env';

const sql = process.argv.slice(2).join(' ').trim().replace(/;\s*$/, '');
const isRead = /^\s*(select|pragma|with)\b/i.test(sql);

// Never print password hashes or session tokens to the terminal.
const safe = (rows: Record<string, unknown>[]) =>
  rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, /password_hash|token_hash/i.test(k) ? '••••' : v])));

if (ENV.dbClient === 'oracle') {
  const { createOracleStore, oracleReadOnly } = await import('../server/db/oracleStore');
  const store = await createOracleStore();
  await store.init(); // creates the tables on first run
  try {
    if (!sql) {
      console.log(`Oracle Database: ${ENV.oracle.user}@${ENV.oracle.connectString}\n`);
      const { rows } = await oracleReadOnly("SELECT table_name FROM user_tables WHERE table_name LIKE 'YA2\\_%' ESCAPE '\\' ORDER BY table_name");
      const counts = [];
      for (const { table_name } of rows as { table_name: string }[]) {
        const n = (await oracleReadOnly(`SELECT COUNT(*) AS n FROM ${table_name}`)).rows[0].n;
        counts.push({ table: table_name.toLowerCase(), rows: n });
      }
      console.table(counts);
      console.log('\nRun a query: npm run db -- "SELECT id, name, email, created_at FROM ya2_users"');
    } else if (isRead) {
      const { rows } = await oracleReadOnly(sql, 1000);
      console.table(safe(rows));
      console.log(`${rows.length} row(s)`);
    } else {
      console.log('Only SELECT queries here. Change data through the website, or use SQL Developer / SQL*Plus.');
    }
  } finally {
    await store.close();
  }
} else {
  if (!fs.existsSync(ENV.sqliteFile)) {
    console.log(`No database yet at ${ENV.sqliteFile}. Start the API (npm run dev) and sign up once.`);
    process.exit(0);
  }
  const db = new DatabaseSync(ENV.sqliteFile);
  if (!sql) {
    console.log(`Database: ${ENV.sqliteFile}\n`);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as { name: string }[];
    console.table(tables.map(({ name }) => ({ table: name, rows: (db.prepare(`SELECT COUNT(*) AS n FROM "${name}"`).get() as { n: number }).n })));
    console.log('\nRun a query: npm run db -- "SELECT id, name, email, created_at FROM users"');
  } else if (isRead) {
    const rows = db.prepare(sql).all() as Record<string, unknown>[];
    console.table(safe(rows));
    console.log(`${rows.length} row(s)`);
  } else {
    const r = db.prepare(sql).run();
    console.log(`OK — ${r.changes} row(s) changed`);
  }
  db.close();
}
