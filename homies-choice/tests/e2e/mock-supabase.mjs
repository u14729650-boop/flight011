// Minimal in-memory stand-in for the Supabase REST (PostgREST) + Storage endpoints,
// compatible with @supabase/supabase-js. Usage: node tests/e2e/mock-supabase.mjs 54321
import http from "node:http";
import { randomUUID } from "node:crypto";

const port = Number(process.argv[2] ?? 54321);
const KEY = "test-service-key";
const tables = { products: [], enquiries: [], settings: [], banners: [], orders: [] };
const keys = { products: "slug", enquiries: "id", settings: "key", banners: "id", orders: "ref" };
const objects = new Map();

const RESERVED = new Set(["select", "order", "limit", "offset", "on_conflict", "columns"]);

function matches(row, params) {
  for (const [k, v] of params) {
    if (RESERVED.has(k)) continue;
    const m = /^(eq|neq|is)\.(.*)$/.exec(v);
    if (!m) continue;
    const [, op, raw] = m;
    const val = decodeURIComponent(raw);
    const cell = row[k];
    if (op === "eq" && String(cell) !== val) return false;
    if (op === "neq" && String(cell) === val) return false;
    if (op === "is" && !(val === "null" ? cell == null : String(cell) === val)) return false;
  }
  return true;
}

function order(rows, spec) {
  if (!spec) return rows;
  const parts = spec.split(",").map((p) => p.split("."));
  return [...rows].sort((a, b) => {
    for (const [col, dir = "asc"] of parts) {
      if (a[col] === b[col]) continue;
      const r = a[col] > b[col] ? 1 : -1;
      return dir === "desc" ? -r : r;
    }
    return 0;
  });
}

const defaults = {
  products: () => ({ is_published: true, bestseller: false, sort_order: 0, families: [], moods: [], specs: [], images: [], variants: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
  banners: () => ({ id: randomUUID(), theme: "dark", is_active: true, sort_order: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
  enquiries: () => ({ id: randomUUID(), handled: false, created_at: new Date().toISOString() }),
  settings: () => ({ updated_at: new Date().toISOString() }),
  orders: () => ({ id: randomUUID(), status: "new", customer_name: "", area: "", note: "", payment_ref: "", token_amount: null, subtotal: null, unpriced_items: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = Buffer.concat(chunks);
  const send = (code, data, extra = {}) => {
    res.writeHead(code, { "Content-Type": "application/json", ...extra });
    res.end(data === undefined ? "" : JSON.stringify(data));
  };
  if (req.headers.apikey !== KEY) return send(401, { message: "Invalid API key" });

  // Storage
  if (url.pathname.startsWith("/storage/v1/object/")) {
    if (req.method === "POST" || req.method === "PUT") {
      objects.set(url.pathname.replace("/storage/v1/object/", ""), { type: req.headers["content-type"], body });
      return send(200, { Key: url.pathname.replace("/storage/v1/object/", ""), Id: randomUUID() });
    }
    const obj = objects.get(url.pathname.replace("/storage/v1/object/public/", ""));
    if (!obj) return send(404, { error: "not found" });
    res.writeHead(200, { "Content-Type": obj.type }).end(obj.body);
    return;
  }

  const m = /^\/rest\/v1\/(\w+)$/.exec(url.pathname);
  if (!m || !tables[m[1]]) return send(404, { message: `relation "${m?.[1]}" does not exist`, code: "42P01" });
  const name = m[1];
  const prefer = String(req.headers.prefer ?? "");
  const single = String(req.headers.accept ?? "").includes("vnd.pgrst.object+json");
  const representation = prefer.includes("return=representation");

  const respond = (code, rows) => {
    if (single) {
      if (rows.length !== 1) return send(406, { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned", details: `The result contains ${rows.length} rows`, hint: null });
      return send(code, rows[0]);
    }
    return send(code, rows);
  };

  let rows = tables[name].filter((r) => matches(r, url.searchParams));

  if (req.method === "GET" || req.method === "HEAD") {
    rows = order(rows, url.searchParams.get("order"));
    const limit = Number(url.searchParams.get("limit") ?? Infinity);
    return respond(200, rows.slice(0, limit));
  }

  if (req.method === "POST") {
    const input = JSON.parse(body.toString() || "[]");
    const list = Array.isArray(input) ? input : [input];
    const key = keys[name];
    const out = [];
    for (const raw of list) {
      const row = { ...defaults[name](), ...raw };
      const i = tables[name].findIndex((r) => r[key] === row[key]);
      if (i >= 0) {
        if (!prefer.includes("merge-duplicates")) return send(409, { code: "23505", message: "duplicate key value violates unique constraint" });
        tables[name][i] = { ...tables[name][i], ...raw, updated_at: new Date().toISOString() };
        out.push(tables[name][i]);
      } else {
        tables[name].push(row);
        out.push(row);
      }
    }
    return representation ? respond(201, out) : send(201);
  }

  if (req.method === "PATCH") {
    const patch = JSON.parse(body.toString() || "{}");
    rows.forEach((r) => Object.assign(r, patch, { updated_at: new Date().toISOString() }));
    return representation ? respond(200, rows) : send(204);
  }

  if (req.method === "DELETE") {
    tables[name] = tables[name].filter((r) => !rows.includes(r));
    return representation ? respond(200, rows) : send(204);
  }
  send(405, {});
});

server.listen(port, () => console.log(`mock supabase on ${port}`));
