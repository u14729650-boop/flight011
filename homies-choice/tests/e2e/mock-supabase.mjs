// Minimal in-memory stand-in for the Supabase REST + Storage endpoints the site uses.
// Usage: node tests/e2e/mock-supabase.mjs 54321
import http from "node:http";

const port = Number(process.argv[2] ?? 54321);
const tables = { products: [], enquiries: [], settings: [] };
const objects = new Map();
const KEY = "test-service-key";

function filterRows(rows, params) {
  let out = rows;
  for (const [k, v] of params) {
    if (["select", "order", "limit", "on_conflict"].includes(k)) continue;
    const m = /^eq\.(.*)$/.exec(v);
    if (m) out = out.filter((r) => String(r[k]) === decodeURIComponent(m[1]));
  }
  return out;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = Buffer.concat(chunks);
  if (req.headers.apikey !== KEY) {
    res.writeHead(401).end("bad key");
    return;
  }
  const send = (code, data) => {
    res.writeHead(code, { "Content-Type": "application/json" });
    res.end(data === undefined ? "" : JSON.stringify(data));
  };

  if (url.pathname.startsWith("/storage/v1/object/")) {
    if (req.method === "POST") {
      objects.set(url.pathname, { type: req.headers["content-type"], body });
      return send(200, { Key: url.pathname });
    }
    const obj = objects.get(url.pathname.replace("/public/", "/"));
    if (!obj) return send(404, { error: "not found" });
    res.writeHead(200, { "Content-Type": obj.type }).end(obj.body);
    return;
  }

  const m = /^\/rest\/v1\/(\w+)$/.exec(url.pathname);
  if (!m || !tables[m[1]]) return send(404, { message: "no table" });
  const table = tables[m[1]];
  const prefer = String(req.headers.prefer ?? "");
  const rows = filterRows(table, url.searchParams);

  if (req.method === "GET") return send(200, rows);
  if (req.method === "POST") {
    const input = JSON.parse(body.toString() || "[]");
    const list = Array.isArray(input) ? input : [input];
    for (const row of list) {
      const keyCol = m[1] === "settings" ? "key" : m[1] === "products" ? "slug" : "id";
      if (m[1] === "enquiries") Object.assign(row, { id: row.id ?? crypto.randomUUID(), handled: row.handled ?? false, created_at: new Date().toISOString() });
      if (m[1] === "products") row.created_at ??= new Date().toISOString();
      const existing = table.findIndex((r) => r[keyCol] === row[keyCol]);
      if (existing >= 0) {
        if (!prefer.includes("merge-duplicates")) return send(409, { message: "duplicate key" });
        table[existing] = { ...table[existing], ...row };
      } else table.push(row);
    }
    return prefer.includes("return=representation") ? send(201, list) : send(201);
  }
  if (req.method === "PATCH") {
    const patch = JSON.parse(body.toString() || "{}");
    rows.forEach((r) => Object.assign(r, patch));
    return prefer.includes("return=representation") ? send(200, rows) : send(204);
  }
  if (req.method === "DELETE") {
    tables[m[1]] = table.filter((r) => !rows.includes(r));
    return send(204);
  }
  send(405, {});
});

server.listen(port, () => console.log(`mock supabase on ${port}`));
