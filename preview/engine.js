/* SkyVoyage browser-only preview.
   A JavaScript port of app.py + flight_data.py so the site can run as a static page
   (no Python server). Bookings and accounts are saved in this browser only. */
(function () {
  "use strict";
  const D = window.SV_DATA;           // airports, airlines, cabins, currencies, hubs, help (from flight_data.py)
  const A = D.airports, AL = D.airlines, CAB = D.cabins, CUR = D.currencies, HELP = D.help;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ================================================= dates */
  const pad = (n) => String(n).padStart(2, "0");
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseDate = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ""); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const addMin = (d, n) => new Date(d.getTime() + n * 60000);
  const daysBetween = (a, b) => Math.round((b - a) / 86400000);
  const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const hm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const dShort = (d) => `${DAY[d.getDay()]} ${pad(d.getDate())} ${MON[d.getMonth()]}`;
  const dLong = (d) => `${DAY[d.getDay()]}, ${pad(d.getDate())} ${MON[d.getMonth()]} ${d.getFullYear()}`;
  const dFull = (d) => `${pad(d.getDate())} ${MON[d.getMonth()]} ${d.getFullYear()}, ${hm(d)}`;
  const fmtDur = (m) => `${Math.floor(m / 60)}h ${pad(m % 60)}m`;
  const money = (v, sym = "$") => sym + (v >= 1000 ? Math.round(v).toLocaleString("en-US")
    : v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

  /* ================================================= fare engine (port of flight_data.py) */
  function rngFor(...parts) {
    let h = 2166136261;
    for (const ch of parts.join("|")) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    let s = h >>> 0;
    const next = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    return {
      random: next,
      randint: (a, b) => a + Math.floor(next() * (b - a + 1)),
      uniform: (a, b) => a + next() * (b - a),
      choice: (arr) => arr[Math.floor(next() * arr.length)],
      sample: (arr, k) => { const c = arr.slice(); for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; } return c.slice(0, k); },
    };
  }
  function km(a, b) {
    const r = Math.PI / 180, [la1, lo1] = [A[a][3] * r, A[a][4] * r], [la2, lo2] = [A[b][3] * r, A[b][4] * r];
    const h = Math.sin((la2 - la1) / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin((lo2 - lo1) / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.sqrt(h));
  }
  const flightMin = (k) => Math.floor(35 + k / 830 * 60);
  function aircraft(k, r) {
    if (k < 1500) return r.choice(["Airbus A320neo", "Boeing 737 MAX 8", "Airbus A321neo", "ATR 72-600"]);
    if (k < 5000) return r.choice(["Airbus A321neo", "Boeing 737-800", "Airbus A330-300", "Boeing 787-8"]);
    return r.choice(["Boeing 777-300ER", "Airbus A350-900", "Boeing 787-9", "Airbus A380-800"]);
  }
  function pickAirlines(o, d, r) {
    const india = A[o][2] === "India" || A[d][2] === "India";
    if (A[o][2] === "India" && A[d][2] === "India") return ["AI", "6E", "UK", "SG"];
    const home = Object.keys(AL).filter((c) => AL[c][2].includes(o) || AL[c][2].includes(d));
    const pool = [...new Set([...home, ...r.sample(Object.keys(AL), 6)])];
    return pool.filter((c) => !["6E", "SG"].includes(c) || india);
  }
  function demand(date) {
    const days = daysBetween(today(), date);
    let f = days <= 2 ? 1.85 : days <= 6 ? 1.5 : days <= 13 ? 1.28 : days <= 21 ? 1.12 : days <= 45 ? 1.0 : days <= 90 ? 0.93 : 0.9;
    const pyWeekday = (date.getDay() + 6) % 7;   // Monday = 0, as in Python
    f *= ({ 4: 1.14, 6: 1.12, 5: 1.03, 1: 0.94, 2: 0.92 })[pyWeekday] || 1.0;
    const m = date.getMonth() + 1;
    if ((m === 12 && date.getDate() >= 15) || m === 5 || m === 6) f *= 1.18;
    return f;
  }
  function market(o, d) {
    const c = new Set([A[o][2], A[d][2]]);
    if (c.size === 1 && c.has("India")) return 0.42;
    if (c.has("India") && ["Nepal", "Sri Lanka", "Maldives", "UAE", "Qatar"].some((x) => c.has(x))) return 0.8;
    if ([...c].every((x) => ["USA", "Canada", "Mexico"].includes(x))) return 0.85;
    return 1.0;
  }
  const baseFare = (k) => (k < 1500 ? 38 + 0.11 * k : 110 + 0.062 * k);

  const flightCache = new Map();
  function generateFlights(o, d, date) {
    if (!A[o] || !A[d] || o === d || !date) return [];
    const key = `${o}-${d}-${iso(date)}`;
    if (flightCache.has(key)) return flightCache.get(key).map((f) => ({ ...f }));
    const dist = km(o, d), r = rngFor(o, d, iso(date));
    const airlines = pickAirlines(o, d, r), dem = demand(date) * market(o, d);
    const count = dist < 3000 ? r.randint(7, 12) : r.randint(6, 10);
    const out = [];
    for (let idx = 0; idx < count; idx++) {
      const code = r.choice(airlines), [name, premium, hubs, colour] = AL[code];
      let stops = 0, via = null;
      const nonstop = dist < 3000 ? 0.9 : dist < 9000 ? 0.55 : 0.3;
      if (r.random() > nonstop) {
        const opts = [...hubs, ...D.hubs].filter((h) => h !== o && h !== d && km(o, h) + km(h, d) < dist * 1.35);
        if (opts.length) { stops = 1; via = r.choice(opts); }
      }
      let fly, layover;
      if (via) { fly = flightMin(km(o, via)) + flightMin(km(via, d)); layover = r.choice([75, 95, 120, 150, 185, 240, 320]); }
      else { fly = flightMin(dist); layover = 0; }
      const duration = fly + layover + r.randint(-10, 15);
      const depMin = Math.floor(r.randint(0, 23 * 60 + 11) / 5) * 5;
      const dep = addMin(date, depMin);
      const arr = addMin(dep, duration + (A[d][5] - A[o][5]) * 60);
      const hour = dep.getHours();
      const timeF = hour < 5 ? 0.84 : (hour >= 6 && hour <= 9) || (hour >= 17 && hour <= 20) ? 1.1 : 1.0;
      const seats = r.randint(1, 42);
      const scarcity = seats <= 4 ? 1.25 : seats <= 9 ? 1.1 : 1.0;
      const eco = baseFare(dist) * premium * dem * timeF * (stops ? 0.86 : 1.12) * scarcity * r.uniform(0.93, 1.09);
      const fares = {};
      for (const c of Object.keys(CAB)) fares[c] = Math.round(eco * CAB[c][1] * r.uniform(0.96, 1.04) * 100) / 100;
      const depDay = new Date(dep); depDay.setHours(0, 0, 0, 0);
      const arrDay = new Date(arr); arrDay.setHours(0, 0, 0, 0);
      out.push({
        id: `${o}-${d}-${iso(date)}-${idx}`, airline_code: code, airline: name, colour,
        flight_no: `${code} ${r.randint(100, 2999)}`, aircraft: aircraft(dist, r), origin: o, dest: d, via, stops,
        segments: stops + 1, layover_min: layover, departure: dep, arrival: arr, day_diff: daysBetween(depDay, arrDay),
        duration_min: duration, distance_km: Math.round(dist), terminal: `T${r.randint(1, 3)}`,
        gate: `${r.choice("ABCDE".split(""))}${r.randint(1, 40)}`, seats_left: seats,
        baggage: dist < 3000 ? "15 kg check-in, 7 kg cabin" : "30 kg check-in, 7 kg cabin",
        meal: dist > 1200, wifi: r.random() < (dist < 2000 ? 0.3 : 0.75), refundable: r.random() < 0.35, fares,
      });
    }
    out.sort((a, b) => a.departure - b.departure);
    flightCache.set(key, out);
    return out.map((f) => ({ ...f }));
  }
  function findFlight(id) {
    const m = /^([A-Z]{3})-([A-Z]{3})-(\d{4}-\d{2}-\d{2})-(\d+)$/.exec(id || "");
    return m ? generateFlights(m[1], m[2], parseDate(m[3])).find((f) => f.id === id) || null : null;
  }
  function price(f, cabin = "economy", pax = { adults: 1, children: 0, infants: 0 }, currency = "USD") {
    const [symbol, rate] = CUR[currency] || CUR.USD, per = f.fares[cabin];
    const base = per * pax.adults + per * 0.75 * pax.children + per * 0.1 * pax.infants;
    const taxes = base * 0.12 + 18 * f.segments * (pax.adults + pax.children);
    const fees = 7.5 * (pax.adults + pax.children);
    const c = (v) => Math.round(v * rate * 100) / 100;
    return { currency, symbol, base: c(base), taxes: c(taxes), fees: c(fees), total: c(base + taxes + fees), per_adult: c(per) };
  }
  function cheapestByDay(o, d, center, cabin) {
    const out = [];
    for (let k = -3; k <= 3; k++) {
      const day = addDays(center, k);
      if (day < today()) continue;
      const fl = generateFlights(o, d, day);
      if (fl.length) out.push([day, Math.min(...fl.map((f) => f.fares[cabin]))]);
    }
    return out;
  }
  function airportCode(v) {
    v = (v || "").trim();
    const m = /\(([A-Za-z]{3})\)\s*$/.exec(v);
    const code = (m ? m[1] : v).toUpperCase();
    if (A[code]) return code;
    const hit = Object.keys(A).find((c) => A[c][0].toLowerCase() === v.toLowerCase());
    return hit || code;
  }

  /* ================================================= storage (this browser only) */
  const mem = {};
  const store = {
    get(k, def) { try { const v = localStorage.getItem("svp-" + k); return v ? JSON.parse(v) : def; } catch (e) { return mem[k] ?? def; } },
    set(k, v) { mem[k] = v; try { localStorage.setItem("svp-" + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
  };
  const users = () => store.get("users", []);
  const currentUser = () => users().find((u) => u.id === store.get("session", null)) || null;
  const bookings = () => store.get("bookings", []);
  async function hash(pw) {
    try {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("skyvoyage:" + pw));
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch (e) { return "plain:" + pw; }
  }
  const newPnr = () => Array.from({ length: 6 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
  function bookingState(b) {
    if (b.status === "Cancelled") return "Cancelled";
    return new Date(b.arrival) < new Date() ? "Completed" : "Upcoming";
  }

