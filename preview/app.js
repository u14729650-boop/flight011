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

  /* ================================================= flash + routing */
  let flashes = [];
  const flash = (msg, cat = "info") => flashes.push([cat, msg]);
  function showFlashes() {
    const box = $("#flashes");
    box.innerHTML = flashes.map(([c, m]) => `<div class="flash glass flash-${c}">${esc(m)}<button type="button" aria-label="Dismiss">×</button></div>`).join("");
    flashes = [];
    $$("button", box).forEach((b) => b.addEventListener("click", () => b.parentElement.remove()));
    setTimeout(() => box.replaceChildren(), 7000);
  }

  let route = { page: "home", params: {} };
  function go(page, params = {}) {
    if (["book", "history", "ticket"].includes(page) && !currentUser()) {
      flash("Please log in to continue.", "info");
      return go("login", { next: { page, params } });
    }
    route = { page, params };
    try { history.replaceState(null, "", "#" + page); } catch (e) { /* sandboxed */ }
    render();
    window.scrollTo(0, 0);
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-go]");
    if (!a) return;
    e.preventDefault();
    document.body.classList.remove("menu-open");
    let params = {};
    try { params = a.dataset.params ? JSON.parse(a.dataset.params) : {}; } catch (err) { params = {}; }
    go(a.dataset.go, params);
  });
  const link = (page, params) => `data-go="${page}"${params ? ` data-params="${esc(JSON.stringify(params))}"` : ""} href="#${page}"`;

  /* ================================================= shared pieces */
  const planeSvg = (cls = "") => `<svg class="${cls}" viewBox="0 0 64 64"><use href="#plane-icon"/></svg>`;
  const airportOptions = Object.entries(A).map(([c, a]) => `<option value="${esc(a[0])} (${c})">${esc(a[1])}, ${esc(a[2])}</option>`).join("");

  function searchForm(s = {}) {
    const val = (c) => (A[c] ? `${A[c][0]} (${c})` : "");
    const sel = (n, from, to, cur, label) => `<select name="${n}" id="sf-${n}" aria-label="${label}">` +
      Array.from({ length: to - from + 1 }, (_, i) => from + i).map((k) => `<option value="${k}" ${k === cur ? "selected" : ""}>${k} ${label}${k > 1 && label === "Adult" ? "s" : ""}</option>`).join("") + "</select>";
    return `
<form class="search glass tilt" id="searchForm" data-trip="${s.trip || "oneway"}">
  <div class="trip-tabs">
    <label><input type="radio" name="trip" value="oneway" ${s.trip !== "round" ? "checked" : ""}> One way</label>
    <label><input type="radio" name="trip" value="round" ${s.trip === "round" ? "checked" : ""}> Round trip</label>
  </div>
  <div class="search-grid">
    <div class="field"><label for="origin">From</label>
      <input list="airportList" name="origin" id="origin" placeholder="City or airport" required autocomplete="off" value="${esc(val(s.origin))}"></div>
    <button type="button" class="swap" id="swapBtn" title="Swap" aria-label="Swap from and to">⇄</button>
    <div class="field"><label for="dest">To</label>
      <input list="airportList" name="dest" id="dest" placeholder="City or airport" required autocomplete="off" value="${esc(val(s.dest))}"></div>
    <div class="field"><label for="depart">Departure</label>
      <input type="date" name="depart" id="depart" required min="${iso(today())}" value="${s.depart ? iso(s.depart) : iso(addDays(today(), 14))}"></div>
    <div class="field field-return"><label for="returnDate">Return</label>
      <input type="date" name="return" id="returnDate" min="${iso(today())}" value="${s.ret ? iso(s.ret) : ""}"></div>
    <div class="field"><label>Travellers</label>
      <div class="pax">${sel("adults", 1, 9, s.adults || 1, "Adult")}${sel("children", 0, 8, s.children || 0, "Child")}${sel("infants", 0, 4, s.infants || 0, "Infant")}</div></div>
    <div class="field"><label for="sf-cabin">Class</label>
      <select name="cabin" id="sf-cabin">${Object.entries(CAB).map(([c, v]) => `<option value="${c}" ${s.cabin === c ? "selected" : ""}>${v[0]}</option>`).join("")}</select></div>
    <div class="field"><label for="sf-currency">Currency</label>
      <select name="currency" id="sf-currency">${Object.keys(CUR).map((c) => `<option ${(s.currency || "USD") === c ? "selected" : ""}>${c}</option>`).join("")}</select></div>
    <button class="btn btn-search" type="submit">🔍 Search Flights</button>
  </div>
  <p class="live-quote" id="liveQuote"></p>
  <datalist id="airportList">${airportOptions}</datalist>
</form>`;
  }

  function quote(o, d, date, cabin = "economy", currency = "USD") {
    const fl = generateFlights(o, d, date);
    if (!fl.length) return null;
    const c = fl.reduce((a, b) => (b.fares[cabin] < a.fares[cabin] ? b : a));
    const p = price(c, cabin, undefined, currency);
    return { flights: fl.length, distance_km: c.distance_km, duration: fmtDur(Math.min(...fl.map((f) => f.duration_min))),
      airline: c.airline, price: p.total, symbol: p.symbol, nonstop: fl.some((f) => !f.stops), date };
  }

  function wireSearchForm() {
    const form = $("#searchForm");
    if (!form) return;
    const origin = $("#origin", form), dest = $("#dest", form), depart = $("#depart", form), ret = $("#returnDate", form);
    const syncTrip = () => {
      const trip = form.querySelector("input[name=trip]:checked").value;
      form.dataset.trip = trip; ret.required = trip === "round"; ret.disabled = trip !== "round";
    };
    $$("input[name=trip]", form).forEach((r) => r.addEventListener("change", syncTrip));
    syncTrip();
    depart.addEventListener("change", () => { ret.min = depart.value; if (ret.value && ret.value < depart.value) ret.value = depart.value; });
    $("#swapBtn", form).addEventListener("click", () => { [origin.value, dest.value] = [dest.value, origin.value]; live(); });
    const out = $("#liveQuote", form);
    function live() {
      const o = airportCode(origin.value), d = airportCode(dest.value), dt = parseDate(depart.value);
      const q = A[o] && A[d] && o !== d && dt ? quote(o, d, dt, form.cabin.value, form.currency.value) : null;
      out.innerHTML = q ? `✈ ${q.flights} flights ${o} → ${d} · ${q.distance_km.toLocaleString()} km · from ` +
        `<b class="grad-text">${q.symbol}${Math.round(q.price).toLocaleString()}</b> on ${esc(q.airline)}${q.nonstop ? " · non-stop available" : ""}` : "";
    }
    ["change", "input"].forEach((ev) => [origin, dest].forEach((el) => el.addEventListener(ev, live)));
    [depart, form.cabin, form.currency].forEach((el) => el.addEventListener("change", live));
    live();
    window.svFillSearch = (o, d) => { origin.value = o; dest.value = d; live(); };
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const f = new FormData(form);
      go("results", {
        origin: airportCode(f.get("origin")), dest: airportCode(f.get("dest")), depart: f.get("depart"), ret: f.get("return") || "",
        trip: f.get("trip"), cabin: f.get("cabin"), currency: f.get("currency"),
        adults: +f.get("adults"), children: +f.get("children"), infants: +f.get("infants"),
      });
    });
  }

  /* ================================================= pages */
  const pages = {};

  pages.home = () => {
    const when = addDays(today(), 21);
    const popular = [["DEL", "DXB"], ["BOM", "LHR"], ["DEL", "SIN"], ["BLR", "JFK"], ["DEL", "BOM"], ["MAA", "CMB"], ["BOM", "MLE"], ["DEL", "CDG"]];
    const deals = popular.map(([o, d], i) => {
      const fl = generateFlights(o, d, when), c = fl.reduce((a, b) => (b.fares.economy < a.fares.economy ? b : a));
      return `<a class="deal glass tilt scroll-3d" data-depth="${0.3 + (i % 4) * 0.12}" ${link("results", { origin: o, dest: d, depart: iso(when) })}>
        <div class="deal-route"><span class="code">${o}</span><span class="deal-line">${planeSvg()}</span><span class="code">${d}</span></div>
        <p class="deal-cities">${esc(A[o][0])} → ${esc(A[d][0])}</p>
        <p class="muted small">${esc(c.airline)} · ${fmtDur(c.duration_min)} · ${c.stops ? "1 stop" : "Non-stop"}</p>
        <p class="muted small">${DAY[when.getDay()]}, ${pad(when.getDate())} ${MON[when.getMonth()]}</p>
        <p class="deal-price">from <b>${money(price(c).total)}</b></p></a>`;
    }).join("");
    const spots = [["DXB", "🏙️", "Burj Khalifa & desert safaris", "linear-gradient(135deg,#f6d365,#fda085)"],
      ["CDG", "🗼", "Eiffel Tower & cafés", "linear-gradient(135deg,#a1c4fd,#c2e9fb)"],
      ["JFK", "🗽", "The city that never sleeps", "linear-gradient(135deg,#84fab0,#8fd3f4)"],
      ["NRT", "🏯", "Temples & cherry blossoms", "linear-gradient(135deg,#fbc2eb,#a6c1ee)"],
      ["MLE", "🏝️", "Overwater villas", "linear-gradient(135deg,#43e97b,#38f9d7)"],
      ["LHR", "🎡", "Big Ben & the Thames", "linear-gradient(135deg,#667eea,#b794f4)"],
      ["SYD", "🦘", "Opera House & beaches", "linear-gradient(135deg,#ff9a9e,#fecfef)"],
      ["SIN", "🌆", "Gardens by the Bay", "linear-gradient(135deg,#30cfd0,#6a82fb)"],
      ["IST", "🕌", "Where East meets West", "linear-gradient(135deg,#f093fb,#f5576c)"],
      ["CAI", "🐪", "Pyramids of Giza", "linear-gradient(135deg,#fad0c4,#ffd1ff)"]];
    const features = [["💸", "Real-time pricing", "Fares move with demand, booking window, weekday, time of day and seats left — just like real airlines."],
      ["🛡️", "Secure booking", "Every booking gets a unique PNR & e-ticket."],
      ["🕑", "Booking history", "All your trips in one place: upcoming, completed and cancelled."],
      ["🎧", "24×7 help centre", `Reach us any time on ${HELP.phone} or ${HELP.email}.`]];
    return `
<section class="hero">
  <div class="hero-text scroll-3d" data-depth="0.6">
    <span class="pill glass">✨ Live fares · ${Object.keys(A).length} cities · 20 airlines</span>
    <h1>Fly anywhere.<br><span class="grad-text">Pay the perfect price.</span></h1>
    <p class="lead">Compare flight times, arrivals, departures, flight numbers and real-time prices, then book in under a minute.</p>
  </div>
  <div class="hero-3d scene" aria-hidden="true"><div class="globe">
    <div class="globe-ring r1"></div><div class="globe-ring r2"></div><div class="globe-ring r3"></div><div class="globe-core"></div>
    <div class="orbit">${planeSvg("orbit-plane")}</div><div class="orbit orbit-2">${planeSvg("orbit-plane")}</div></div></div>
</section>
<section class="container">${searchForm({})}</section>
<section class="ring-section" id="ringSection"><div class="ring-sticky">
  <h2 class="section-title center">Trending destinations <span class="muted small">— scroll to spin ✈</span></h2>
  <div class="ring-stage"><div class="ring" id="ring">
    ${spots.map(([c, icon, tag, g], i) => `<a class="ring-card" style="--i:${i};--n:${spots.length};--g:${g}" ${link("results", { origin: "DEL", dest: c, depart: iso(when) })}>
      <span class="ring-icon">${icon}</span><strong>${esc(A[c][0])}</strong><span>${esc(A[c][2])}</span><em>${esc(tag)}</em></a>`).join("")}
  </div></div></div></section>
<section class="container"><h2 class="section-title">🔥 Cheapest fares this month</h2><div class="deal-grid">${deals}</div></section>
<section class="container"><div class="map-card glass scroll-3d" data-depth="0.4">
  <div class="map-head"><div><h2 class="section-title">🌍 Explore the world map</h2>
    <p class="muted">Click one airport for <b>From</b>, another for <b>To</b> — we'll show the route and the best fare.</p></div>
    <a class="btn btn-ghost" ${link("map")}>Open full map →</a></div>
  <div id="homeMap" class="map" data-map></div><div class="map-info"></div></div></section>
<section class="container features">${features.map(([i, t, x], k) => `<div class="feature glass tilt scroll-3d" data-depth="${0.25 + k * 0.15}">
  <span class="feature-icon">${i}</span><h3>${esc(t)}</h3><p class="muted">${esc(x)}</p></div>`).join("")}</section>`;
  };

  pages.results = (p) => {
    const o = p.origin, d = p.dest, dep = parseDate(p.depart), ret = parseDate(p.ret);
    const trip = p.trip === "round" ? "round" : "oneway", cabin = CAB[p.cabin] ? p.cabin : "economy";
    const currency = CUR[p.currency] ? p.currency : "USD", sym = CUR[currency][0];
    const pax = { adults: Math.max(1, Math.min(9, p.adults || 1)), children: Math.max(0, p.children || 0), infants: Math.max(0, Math.min(p.adults || 1, p.infants || 0)) };
    const sort = p.sort || "price", stops = p.stops || "any", airlineFilter = p.airlines || [];
    const errs = [];
    if (!A[o] || !A[d]) errs.push("Please choose valid departure and destination airports.");
    else if (o === d) errs.push("Departure and destination cannot be the same.");
    if (!dep || dep < today()) errs.push("Please choose a departure date from today onwards.");
    if (trip === "round" && (!ret || (dep && ret < dep))) errs.push("Return date must be on or after the departure date.");
    if (errs.length) { errs.forEach((e) => flash(e, "error")); setTimeout(() => go("home"), 0); return ""; }

    const build = (a, b, when) => {
      let fl = generateFlights(a, b, when);
      const all = [...new Set(fl.map((f) => f.airline))].sort();
      if (stops === "0") fl = fl.filter((f) => !f.stops);
      if (stops === "1") fl = fl.filter((f) => f.stops === 1);
      if (airlineFilter.length) fl = fl.filter((f) => airlineFilter.includes(f.airline));
      fl.forEach((f) => (f.price = price(f, cabin, pax, currency)));
      const key = { price: (f) => f.price.total, duration: (f) => f.duration_min, departure: (f) => +f.departure, arrival: (f) => +f.arrival }[sort] || ((f) => f.price.total);
      fl.sort((x, y) => key(x) - key(y));
      const cal = cheapestByDay(a, b, when, cabin).map(([day, v]) => [day, Math.round(v * CUR[currency][1])]);
      return [fl, all, cal];
    };
    const [outbound, allAirlines, calOut] = build(o, d, dep);
    const [inbound, , calIn] = trip === "round" ? build(d, o, ret) : [[], [], []];
    const nPax = pax.adults + pax.children + pax.infants;
    const withP = (extra) => ({ ...p, ...extra });

    const card = (f, leg) => `
<article class="flight glass scroll-3d" data-depth="0.25">
  <div class="flight-main">
    <div class="airline"><span class="airline-logo" style="background:${f.colour}">${f.airline_code}</span>
      <div><strong>${esc(f.airline)}</strong><span class="muted small">${f.flight_no} · ${f.aircraft}</span></div></div>
    <div class="times">
      <div class="t"><b>${hm(f.departure)}</b><span>${f.origin}</span><small class="muted">${esc(A[f.origin][0])} · ${f.terminal}</small></div>
      <div class="path"><span class="muted small">${fmtDur(f.duration_min)}</span>
        <span class="path-line ${f.stops ? "has-stop" : ""}"><i></i>${planeSvg()}</span>
        <span class="small ${f.stops ? "warn" : "ok"}">${f.stops ? "1 stop via " + f.via : "Non-stop"}</span></div>
      <div class="t"><b>${hm(f.arrival)}${f.day_diff ? `<sup class="warn">+${f.day_diff}</sup>` : ""}</b><span>${f.dest}</span><small class="muted">${esc(A[f.dest][0])}</small></div>
    </div>
    <div class="price-box"><span class="price">${money(f.price.total, sym)}</span>
      <span class="muted small">total for ${nPax} traveller${nPax > 1 ? "s" : ""}</span>
      ${f.seats_left <= 9 ? `<span class="badge badge-hot">Only ${f.seats_left} seats left!</span>` : ""}
      ${trip === "round" ? `<label class="btn btn-sm select-btn"><input type="radio" name="${leg}" value="${f.id}"> Select</label>`
        : `<a class="btn btn-sm" ${link("book", { out: f.id, cabin, currency, ...pax })}>Book now</a>`}
    </div>
  </div>
  <details class="flight-details"><summary>Flight details &amp; fare breakdown</summary>
    <div class="details-grid">
      <div><h4>Schedule</h4>
        <p><b>Departure:</b> ${dLong(f.departure)}, ${hm(f.departure)} — ${esc(A[f.origin][1])} (${f.origin}), ${f.terminal}, Gate ${f.gate}</p>
        ${f.via ? `<p><b>Layover:</b> ${fmtDur(f.layover_min)} at ${esc(A[f.via][0])} (${f.via})</p>` : ""}
        <p><b>Arrival:</b> ${dLong(f.arrival)}, ${hm(f.arrival)} (local time) — ${esc(A[f.dest][1])} (${f.dest})</p>
        <p><b>Distance:</b> ${f.distance_km.toLocaleString()} km · <b>Aircraft:</b> ${f.aircraft}</p></div>
      <div><h4>Included</h4><p>🧳 ${f.baggage}</p><p>${f.meal ? "🍱 Complimentary meal" : "🥤 Snacks for purchase"}</p>
        <p>${f.wifi ? "📶 Wi-Fi available" : "📵 No Wi-Fi"}</p><p>${f.refundable ? "✅ Refundable fare" : "⚠️ Non-refundable (cancellation fee applies)"}</p></div>
      <div><h4>Fare (${CAB[cabin][0]})</h4>
        <p class="row"><span>Base fare</span><span>${money(f.price.base, sym)}</span></p>
        <p class="row"><span>Taxes &amp; surcharges</span><span>${money(f.price.taxes, sym)}</span></p>
        <p class="row"><span>Convenience fee</span><span>${money(f.price.fees, sym)}</span></p>
        <p class="row total"><span>Total</span><span>${money(f.price.total, sym)}</span></p></div>
    </div></details>
</article>`;
    const calendar = (days, current, key) => {
      const low = Math.min(...days.map((x) => x[1]));
      return `<div class="fare-cal">${days.map(([day, v]) => `<a class="fare-day glass ${+day === +current ? "active" : ""} ${v === low ? "lowest" : ""}" ${link("results", withP({ [key]: iso(day) }))}>
        <span>${DAY[day.getDay()]}</span><b>${pad(day.getDate())} ${MON[day.getMonth()]}</b><span class="small">${sym}${v.toLocaleString()}</span></a>`).join("")}</div>`;
    };
    const radio = (name, v, label, cur) => `<label class="opt"><input type="radio" name="${name}" value="${v}" ${cur === v ? "checked" : ""}> ${label}</label>`;
    return `
<section class="container">
  <details class="modify"><summary class="btn btn-ghost">✏️ Modify search</summary>
    ${searchForm({ origin: o, dest: d, depart: dep, ret, trip, cabin, currency, ...pax })}</details>
  <div class="route-head glass scroll-3d" data-depth="0.3">
    <div><h1>${esc(A[o][0])} <span class="grad-text">→</span> ${esc(A[d][0])}${trip === "round" ? ` <span class="grad-text">→</span> ${esc(A[o][0])}` : ""}</h1>
      <p class="muted">${dLong(dep)}${trip === "round" ? " – " + dLong(ret) : ""} · ${pax.adults} adult${pax.adults > 1 ? "s" : ""}${pax.children ? `, ${pax.children} child` : ""}${pax.infants ? `, ${pax.infants} infant` : ""}
        · ${CAB[cabin][0]} · ${Math.round(km(o, d)).toLocaleString()} km</p></div>
    <div id="routeMap" class="map map-sm" data-route="${o},${d}"></div>
  </div>
  <div class="results-layout">
    <aside class="filters glass"><form id="filterForm">
      <h4>Sort by</h4>${[["price", "Cheapest"], ["duration", "Fastest"], ["departure", "Earliest departure"], ["arrival", "Earliest arrival"]].map(([v, l]) => radio("sort", v, l, sort)).join("")}
      <h4>Stops</h4>${[["any", "Any"], ["0", "Non-stop only"], ["1", "1 stop"]].map(([v, l]) => radio("stops", v, l, stops)).join("")}
      <h4>Airlines</h4>${allAirlines.map((a) => `<label class="opt"><input type="checkbox" name="airline" value="${esc(a)}" ${airlineFilter.includes(a) ? "checked" : ""}> ${esc(a)}</label>`).join("")}
      ${airlineFilter.length || stops !== "any" ? `<a class="small" ${link("results", withP({ stops: "any", airlines: [] }))}>Clear filters</a>` : ""}
    </form></aside>
    <div class="results">
      <h2 class="section-title">✈ Departing flights · ${outbound.length} found</h2>
      ${calendar(calOut, dep, "depart")}
      ${outbound.map((f) => card(f, "out")).join("") || `<p class="glass empty">No flights match these filters.</p>`}
      ${trip === "round" ? `<h2 class="section-title">🔁 Return flights · ${inbound.length} found</h2>${calendar(calIn, ret, "ret")}
        ${inbound.map((f) => card(f, "ret")).join("") || `<p class="glass empty">No return flights match these filters.</p>`}
        <form id="roundForm" class="round-bar glass"><span id="roundSummary">Select a departing and a return flight</span>
          <button class="btn" type="submit">Continue to book →</button></form>` : ""}
    </div>
  </div>
</section>`;
  };
  pages.results.init = (p) => {
    const ff = $("#filterForm");
    ff?.addEventListener("change", () => {
      const f = new FormData(ff);
      go("results", { ...p, sort: f.get("sort"), stops: f.get("stops"), airlines: f.getAll("airline") });
    });
    const rf = $("#roundForm");
    if (!rf) return;
    const summary = $("#roundSummary");
    const picked = () => ["out", "ret"].map((n) => $(`input[name=${n}]:checked`));
    const update = () => {
      const [a, b] = picked();
      const lab = (x) => { const c = x.closest(".flight"); return `<b>${c.querySelector(".airline strong").textContent}</b> ${c.querySelector(".price").textContent}`; };
      summary.innerHTML = (a ? "Departing: " + lab(a) : "Pick a departing flight") + " · " + (b ? "Return: " + lab(b) : "pick a return flight");
    };
    $$("input[name=out], input[name=ret]").forEach((r) => r.addEventListener("change", update));
    rf.addEventListener("submit", (e) => {
      e.preventDefault();
      const [a, b] = picked();
      if (!a || !b) { summary.innerHTML = "<b class='warn'>Select one departing and one return flight first.</b>"; return; }
      go("book", { out: a.value, ret: b.value, cabin: p.cabin, currency: p.currency, adults: p.adults || 1, children: p.children || 0, infants: p.infants || 0 });
    });
  };

  function bookCtx(p) {
    const out = findFlight(p.out), ret = p.ret ? findFlight(p.ret) : null;
    const cabin = CAB[p.cabin] ? p.cabin : "economy", currency = CUR[p.currency] ? p.currency : "USD";
    const pax = { adults: Math.max(1, +p.adults || 1), children: +p.children || 0, infants: +p.infants || 0 };
    const legs = [["Outbound", out]].concat(ret ? [["Return", ret]] : []);
    const prices = legs.map(([, f]) => price(f, cabin, pax, currency));
    const kinds = [...Array(pax.adults).fill("Adult"), ...Array(pax.children).fill("Child"), ...Array(pax.infants).fill("Infant")];
    return { out, legs, prices, cabin, currency, pax, kinds, sym: CUR[currency][0], total: Math.round(prices.reduce((s, x) => s + x.total, 0) * 100) / 100 };
  }
  pages.book = (p) => {
    const c = bookCtx(p), u = currentUser();
    if (!c.out) { flash("That flight is no longer available.", "error"); setTimeout(() => go("home"), 0); return ""; }
    return `
<section class="container book-layout">
  <form class="book-form glass scroll-3d" data-depth="0.2" id="bookForm">
    <h1>Complete your booking</h1>
    <h3>👥 Passenger details</h3>
    ${c.kinds.map((k, i) => `<fieldset class="pax-row"><legend>Passenger ${i + 1} · ${k}</legend>
      <select name="title_${i}" id="title_${i}" aria-label="Title">${(k === "Adult" ? ["Mr", "Ms", "Mrs", "Dr"] : ["Master", "Miss"]).map((t) => `<option>${t}</option>`).join("")}</select>
      <input name="first_${i}" id="first_${i}" placeholder="First name" required>
      <input name="last_${i}" id="last_${i}" placeholder="Last name" required></fieldset>`).join("")}
    <h3>📇 Contact details</h3>
    <div class="two"><input type="email" name="email" id="bk-email" placeholder="Email for e-ticket" required value="${esc(u.email)}">
      <input name="phone" id="bk-phone" placeholder="Mobile number" required minlength="7" value="${esc(u.phone || "")}"></div>
    <h3>💺 Seat preference</h3>
    <div class="seat-pref">${[["window", "🪟 Window"], ["aisle", "🚶 Aisle"], ["any", "🎲 No preference"]].map(([v, l], i) =>
      `<label class="chip glass"><input type="radio" name="seat_pref" value="${v}" ${i === 0 ? "checked" : ""}> ${l}</label>`).join("")}</div>
    <h3>💳 Payment</h3>
    <p class="muted small">Demo site — no real payment is taken. Any card details below are ignored.</p>
    <div class="two"><input id="bk-card" placeholder="Card number (demo)" inputmode="numeric" maxlength="19" autocomplete="off">
      <input id="bk-exp" placeholder="MM/YY  CVV (demo)" autocomplete="off"></div>
    <button class="btn btn-search" type="submit">Pay ${money(c.total, c.sym)} &amp; confirm</button>
  </form>
  <aside class="summary glass scroll-3d" data-depth="0.35"><h3>Trip summary</h3>
    ${c.legs.map(([leg, f], i) => { const pr = c.prices[i]; return `<div class="sum-leg"><span class="badge">${leg}</span>
      <p><b>${f.origin} → ${f.dest}</b> · ${esc(f.airline)} ${f.flight_no}</p>
      <p class="muted small">${dShort(f.departure)}, ${hm(f.departure)} → ${dShort(f.arrival)}, ${hm(f.arrival)}</p>
      <p class="muted small">${fmtDur(f.duration_min)} · ${f.stops ? "1 stop via " + f.via : "Non-stop"} · ${CAB[c.cabin][0]}</p>
      <p class="row"><span>Base fare</span><span>${money(pr.base, c.sym)}</span></p>
      <p class="row"><span>Taxes &amp; fees</span><span>${money(pr.taxes + pr.fees, c.sym)}</span></p>
      <p class="row"><span>Leg total</span><span>${money(pr.total, c.sym)}</span></p></div>`; }).join("")}
    <p class="row total"><span>Grand total</span><span>${money(c.total, c.sym)}</span></p>
    <p class="muted small">Need help? 📞 ${HELP.phone} · ✉️ ${HELP.email}</p></aside>
</section>`;
  };
  pages.book.init = (p) => {
    $("#bookForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const c = bookCtx(p), f = new FormData(e.target), u = currentUser();
      const names = c.kinds.map((k, i) => `${f.get("title_" + i)} ${f.get("first_" + i).trim()} ${f.get("last_" + i).trim()} (${k})`);
      const pref = f.get("seat_pref"), letters = { window: "AF", aisle: "CD", any: "ABCDEF" }[pref];
      const rows = { first: [1, 2], business: [3, 8], premium: [9, 14], economy: [15, 42] }[c.cabin];
      const now = new Date().toISOString();
      const all = bookings(), made = [];
      c.legs.forEach(([leg, fl], i) => {
        const row = rows[0] + Math.floor(Math.random() * (rows[1] - rows[0] + 1));
        const seats = Array.from({ length: c.pax.adults + c.pax.children }, (_, k) => `${row + Math.floor(k / letters.length)}${letters[k % letters.length]}`);
        const b = { pnr: newPnr(), user_id: u.id, flight_id: fl.id, airline: fl.airline, flight_no: fl.flight_no, origin: fl.origin, dest: fl.dest,
          via: fl.via, departure: fl.departure.toISOString(), arrival: fl.arrival.toISOString(), duration_min: fl.duration_min, cabin: c.cabin,
          passengers: names, seats: seats.join(", "), contact_email: f.get("email"), contact_phone: f.get("phone"), currency: c.currency,
          total: c.prices[i].total, status: "Confirmed", trip_leg: leg, booked_at: now };
        all.push(b); made.push(b);
      });
      store.set("bookings", all);
      flash("Booking confirmed! Have a wonderful trip ✈", "success");
      go("ticket", { pnr: made[0].pnr });
    });
  };

  const myBookings = () => { const u = currentUser(); return bookings().filter((b) => b.user_id === u.id); };

  pages.history = () => {
    const list = myBookings().map((b) => ({ ...b, state: bookingState(b), symbol: CUR[b.currency][0] }))
      .sort((a, b) => (b.booked_at.localeCompare(a.booked_at)) || a.departure.localeCompare(b.departure));
    const count = (s) => list.filter((b) => b.state === s).length;
    const kmSum = list.filter((b) => b.state !== "Cancelled").reduce((s, b) => s + Math.round(km(b.origin, b.dest)), 0);
    const stats = [["Total bookings", list.length, "🎫"], ["Upcoming", count("Upcoming"), "🛫"], ["Completed", count("Completed"), "🛬"],
      ["Cancelled", count("Cancelled"), "❌"], ["km flown / booked", kmSum.toLocaleString(), "🌍"]];
    return `
<section class="container">
  <h1 class="page-title">🧾 Booking history</h1>
  <div class="stats">${stats.map(([l, v, i], k) => `<div class="stat glass tilt scroll-3d" data-depth="${0.2 + k * 0.1}"><span>${i}</span><b>${v}</b><small class="muted">${l}</small></div>`).join("")}</div>
  <div class="history-tabs">${["All", "Upcoming", "Completed", "Cancelled"].map((t, i) => `<button type="button" class="chip glass ${i ? "" : "active"}" data-filter="${t}">${t}</button>`).join("")}</div>
  ${list.length ? "" : `<div class="glass empty"><p>No bookings yet. Your trips will show up here.</p><a class="btn" ${link("home")}>Search flights</a></div>`}
  <div class="timeline">${list.map((b) => {
    const dep = new Date(b.departure), arr = new Date(b.arrival);
    return `<article class="booking glass scroll-3d" data-depth="0.25" data-state="${b.state}">
      <div class="booking-top"><div><span class="badge badge-${b.state.toLowerCase()}">${b.state}</span><span class="badge">${b.trip_leg}</span>
        <span class="muted small">PNR <b>${b.pnr}</b> · booked ${dFull(new Date(b.booked_at))}</span></div>
        <span class="price">${money(b.total, b.symbol)}</span></div>
      <div class="booking-route"><div><b>${hm(dep)}</b><span>${b.origin}</span><small class="muted">${esc(A[b.origin][0])}</small></div>
        <div class="path"><span class="muted small">${fmtDur(b.duration_min)}</span><span class="path-line ${b.via ? "has-stop" : ""}"><i></i>${planeSvg()}</span>
          <span class="small">${b.via ? "via " + b.via : "Non-stop"}</span></div>
        <div><b>${hm(arr)}</b><span>${b.dest}</span><small class="muted">${esc(A[b.dest][0])}</small></div></div>
      <p class="muted small">${esc(b.airline)} ${b.flight_no} · ${dLong(dep)} · ${CAB[b.cabin][0]} · Seats ${b.seats}</p>
      <p class="small">${b.passengers.map(esc).join(" · ")}</p>
      <div class="booking-actions"><a class="btn btn-sm" ${link("ticket", { pnr: b.pnr })}>View e-ticket</a>
        ${b.state === "Upcoming" ? `<button type="button" class="btn btn-sm btn-danger" data-cancel="${b.pnr}">Cancel</button>` : ""}
        <a class="btn btn-sm btn-ghost" ${link("results", { origin: b.origin, dest: b.dest, depart: b.state === "Upcoming" ? b.departure.slice(0, 10) : iso(addDays(today(), 7)) })}>Book again</a></div>
    </article>`; }).join("")}</div>
</section>`;
  };
  pages.history.init = () => {
    $$(".history-tabs .chip").forEach((btn) => btn.addEventListener("click", () => {
      $$(".history-tabs .chip").forEach((b) => b.classList.toggle("active", b === btn));
      $$(".booking").forEach((b) => { b.hidden = !(btn.dataset.filter === "All" || b.dataset.state === btn.dataset.filter); });
      requestRender();
    }));
    $$("[data-cancel]").forEach((btn) => btn.addEventListener("click", () => {
      if (btn.dataset.armed !== "1") { btn.dataset.armed = "1"; btn.textContent = "Tap again to cancel"; return; }
      const all = bookings(), b = all.find((x) => x.pnr === btn.dataset.cancel);
      b.status = "Cancelled"; store.set("bookings", all);
      flash(`Booking ${b.pnr} cancelled. Refund will reach you in 5–7 working days.`, "success");
      go("history");
    }));
  };

  pages.ticket = (p) => {
    const b0 = myBookings().find((x) => x.pnr === p.pnr);
    if (!b0) { setTimeout(() => go("history"), 0); return ""; }
    const b = { ...b0, state: bookingState(b0), symbol: CUR[b0.currency][0] }, fl = findFlight(b.flight_id);
    const dep = new Date(b.departure), arr = new Date(b.arrival);
    const others = myBookings().filter((x) => x.booked_at === b.booked_at && x.pnr !== b.pnr);
    const bars = Array.from(b.pnr.repeat(5)).map((ch, i) => `<i style="width:${1 + (ch.charCodeAt(0) * (i + 3)) % 4}px"></i>`).join("");
    return `
<section class="container">
  <div class="ticket glass scroll-3d tilt" data-depth="0.3">
    <div class="ticket-main">
      <div class="ticket-head"><span class="brand"><span class="brand-logo">${planeSvg()}</span><span>Sky<b>Voyage</b></span></span>
        <span class="badge badge-${b.state.toLowerCase()}">${b.state}</span></div>
      <p class="muted small">E-TICKET / BOARDING PASS · ${b.trip_leg}</p>
      <div class="ticket-route">
        <div><span class="code big">${b.origin}</span><span>${esc(A[b.origin][0])}</span><small class="muted">${dFull(dep)}</small></div>
        <div class="ticket-plane">${planeSvg()}<small class="muted">${fmtDur(b.duration_min)}${b.via ? " · via " + b.via : ""}</small></div>
        <div><span class="code big">${b.dest}</span><span>${esc(A[b.dest][0])}</span><small class="muted">${dFull(arr)}</small></div></div>
      <div class="ticket-grid">
        <div><small class="muted">Flight</small><b>${b.flight_no}</b></div><div><small class="muted">Airline</small><b>${esc(b.airline)}</b></div>
        <div><small class="muted">Class</small><b>${CAB[b.cabin][0]}</b></div><div><small class="muted">Seats</small><b>${b.seats}</b></div>
        ${fl ? `<div><small class="muted">Terminal</small><b>${fl.terminal}</b></div><div><small class="muted">Gate</small><b>${fl.gate}</b></div>
        <div><small class="muted">Boarding</small><b>${hm(addMin(fl.departure, -45))}</b></div><div><small class="muted">Aircraft</small><b>${fl.aircraft}</b></div>` : ""}
      </div>
      <h4>Passengers</h4><ul class="pax-list">${b.passengers.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
      <p class="muted small">Contact: ${esc(b.contact_email)} · ${esc(b.contact_phone)}</p>
    </div>
    <div class="ticket-stub"><small class="muted">PNR</small><b class="pnr">${b.pnr}</b><div class="barcode" aria-hidden="true">${bars}</div>
      <small class="muted">Total paid</small><b>${money(b.total, b.symbol)}</b></div>
  </div>
  <div class="ticket-actions"><a class="btn btn-ghost" ${link("history")}>← Booking history</a>
    ${others.map((o) => `<a class="btn btn-ghost" ${link("ticket", { pnr: o.pnr })}>${o.trip_leg} ticket (${o.pnr})</a>`).join("")}</div>
</section>`;
  };

  pages.map = () => `
<section class="container">
  <h1 class="page-title">🌍 Flight world map</h1>
  <p class="muted">Click an airport to set <b>From</b>, then another to set <b>To</b>. Pick a date to see the cheapest fare, then search.</p>
  <div class="map-card glass">
    <div class="map-controls">
      <select id="mapFrom" aria-label="From"><option value="">From…</option>${Object.entries(A).map(([c, a]) => `<option value="${c}">${esc(a[0])} (${c})</option>`).join("")}</select>
      <button type="button" class="swap" id="mapSwap" aria-label="Swap">⇄</button>
      <select id="mapTo" aria-label="To"><option value="">To…</option>${Object.entries(A).map(([c, a]) => `<option value="${c}">${esc(a[0])} (${c})</option>`).join("")}</select>
      <input type="date" id="mapDate" min="${iso(today())}" value="${iso(addDays(today(), 14))}" aria-label="Date">
      <select id="mapCurrency" aria-label="Currency">${Object.keys(CUR).map((c) => `<option>${c}</option>`).join("")}</select>
    </div>
    <div id="bigMap" class="map map-lg" data-map></div><div class="map-info"></div>
  </div>
</section>`;

  pages.about = () => {
    const cards = [["🎯", "Our mission", "Make flying simple and transparent: every time, arrival, departure, flight number and fee shown upfront."],
      ["📈", "How our prices work", "Fares are calculated from route distance, how early you book, day of the week, time of day, airline, number of stops, cabin class and seats remaining."],
      ["🌐", "Worldwide network", `${Object.keys(A).length} airports across 6 continents and 20 partner airlines, from IndiGo to Emirates.`],
      ["🔒", "Your data is safe", "Passwords are stored as salted hashes. Bookings are private to your account."]];
    const team = [["Riya Kapoor", "Founder & CEO", "👩‍✈️"], ["Arjun Mehta", "Head of Engineering", "👨‍💻"], ["Sara Khan", "Customer Happiness", "🎧"], ["Leo Fernandes", "Design Lead", "🎨"]];
    return `
<section class="container">
  <div class="about-hero glass scroll-3d" data-depth="0.5"><h1>Hello! We are <span class="grad-text">SkyVoyage</span> 👋</h1>
    <p class="lead">We help travellers find the right flight at the right price — with honest fares, clear flight details and a booking flow that takes under a minute.</p></div>
  <div class="about-grid">${cards.map(([i, t, x], k) => `<div class="feature glass tilt scroll-3d" data-depth="${0.2 + k * 0.15}"><span class="feature-icon">${i}</span><h3>${t}</h3><p class="muted">${x}</p></div>`).join("")}</div>
  <div class="counters glass scroll-3d" data-depth="0.3">${[[2400000, "happy travellers"], [Object.keys(A).length, "airports"], [20, "airlines"], [24, "hour support"]]
    .map(([n, l]) => `<div><b class="counter" data-to="${n}">${n.toLocaleString()}${n > 1000 ? "+" : ""}</b><span class="muted">${l}</span></div>`).join("")}</div>
  <h2 class="section-title">Meet the team</h2>
  <div class="team">${team.map(([n, r, e], k) => `<div class="member glass tilt scroll-3d" data-depth="${0.25 + k * 0.1}"><span class="avatar">${e}</span><b>${n}</b><small class="muted">${r}</small></div>`).join("")}</div>
</section>`;
  };

  const copyBtn = (text) => `<button type="button" class="copy-btn" data-copy="${esc(text)}" aria-label="Copy ${esc(text)}">Copy</button>`;
  pages.help = () => {
    const u = currentUser();
    const faq = [["How are ticket prices calculated?", "Prices depend on distance, how many days before departure you book, weekday (Fridays & Sundays cost more), time of day, the airline, stops, cabin class and how many seats are left. Book 3–6 weeks ahead for the best fares."],
      ["How do I see my old bookings?", "Log in and open “My Bookings”. You will see upcoming, completed and cancelled trips with their e-tickets."],
      ["Can I cancel a booking?", "Yes — any upcoming booking can be cancelled from My Bookings. Refunds reach you in 5–7 working days."],
      ["What baggage is included?", "Short-haul flights include 15 kg check-in + 7 kg cabin bag. Long-haul flights include 30 kg + 7 kg."],
      ["Children and infant fares?", "Children (2–11) pay 75% of the adult fare, infants under 2 travelling on a lap pay 10%."],
      ["When should I reach the airport?", "2 hours before domestic and 3 hours before international flights. Boarding closes 45 minutes before departure."]];
    return `
<section class="container">
  <h1 class="page-title">🎧 Help Centre</h1>
  <div class="contact-grid">
    <div class="contact glass tilt scroll-3d" data-depth="0.3"><span class="feature-icon">✉️</span><h3>Email us</h3>
      <p class="selectable">${HELP.email} ${copyBtn(HELP.email)}</p><p class="muted small">Bookings: ${HELP.support_email}</p></div>
    <div class="contact glass tilt scroll-3d" data-depth="0.45"><span class="feature-icon">📞</span><h3>Call us</h3>
      <p class="selectable">${HELP.phone} ${copyBtn(HELP.phone)}</p><p class="muted small">International: ${HELP.phone_intl}</p></div>
    <div class="contact glass tilt scroll-3d" data-depth="0.6"><span class="feature-icon">💬</span><h3>WhatsApp</h3>
      <p class="selectable">${HELP.whatsapp} ${copyBtn(HELP.whatsapp)}</p><p class="muted small">Open ${HELP.hours}</p></div>
  </div>
  <div class="help-layout">
    <div class="faq glass scroll-3d" data-depth="0.25"><h2>Frequently asked questions</h2>
      ${faq.map(([q, a]) => `<details><summary>${q}</summary><p class="muted">${a}</p></details>`).join("")}</div>
    <form class="glass contact-form scroll-3d" data-depth="0.35" id="helpForm"><h2>Raise a support ticket</h2>
      <input name="name" id="hf-name" placeholder="Your name" required value="${esc(u ? u.name : "")}">
      <input type="email" name="email" id="hf-email" placeholder="Your email" required value="${esc(u ? u.email : "")}">
      <input name="pnr" id="hf-pnr" placeholder="PNR (optional)">
      <select name="topic" id="hf-topic"><option>Booking issue</option><option>Refund / cancellation</option><option>Baggage</option><option>Payment</option><option>Other</option></select>
      <textarea name="message" id="hf-msg" rows="4" placeholder="How can we help?" required></textarea>
      <button class="btn btn-search">Send message</button></form>
  </div>
</section>`;
  };
  pages.help.init = () => {
    $("#helpForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const t = "SV-" + String(Math.floor(100000 + Math.random() * 900000));
      flash(`Thanks ${new FormData(e.target).get("name").trim() || "traveller"}! Support ticket ${t} is saved. This is a preview, so no message is sent.`, "success");
      go("help");
    });
  };

  const authArt = (a, b) => `<div class="auth-art scroll-3d" data-depth="0.6" aria-hidden="true"><div class="boarding-3d tilt">
    <span class="code big">${a}</span>${planeSvg()}<span class="code big">${b}</span></div></div>`;
  pages.login = (p) => `
<section class="auth">${authArt("HELLO", "WORLD")}
  <form class="auth-card glass tilt" id="loginForm"><h1>Welcome back 👋</h1>
    <p class="muted">Log in to book flights and see your booking history.</p>
    <label for="lg-email">Email<input type="email" id="lg-email" name="email" required placeholder="you@example.com"></label>
    <label for="lg-pw">Password<span class="pw"><input type="password" id="lg-pw" name="password" required placeholder="••••••••">
      <button type="button" class="pw-toggle" aria-label="Show password">👁</button></span></label>
    <button class="btn btn-search" type="submit">Login</button>
    <p class="muted small center">New to SkyVoyage? <a ${link("register", p.next ? { next: p.next } : null)}>Create an account</a></p>
    <p class="muted small center">Just looking? <a href="#" id="demoLogin">Use a demo account</a></p>
  </form></section>`;
  const afterAuth = (p) => (p.next ? go(p.next.page, p.next.params) : go("home"));
  function demoAccount() {
    let u = users().find((x) => x.email === "demo@skyvoyage.app");
    if (!u) { u = { id: Date.now(), name: "Demo Traveller", email: "demo@skyvoyage.app", phone: "+91 90000 12345", pw: "demo" }; store.set("users", [...users(), u]); }
    return u;
  }
  pages.login.init = (p) => {
    $("#demoLogin")?.addEventListener("click", (e) => { e.preventDefault(); const u = demoAccount(); store.set("session", u.id); flash("Logged in as Demo Traveller.", "success"); afterAuth(p); });
    $("#loginForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = new FormData(e.target), email = f.get("email").trim().toLowerCase(), h = await hash(f.get("password"));
      const u = users().find((x) => x.email === email && x.pw === h);
      if (!u) { flash("Incorrect email or password.", "error"); showFlashes(); return; }
      store.set("session", u.id); flash(`Welcome back, ${u.name.split(" ")[0]}!`, "success"); afterAuth(p);
    });
  };
  pages.register = (p) => `
<section class="auth">${authArt("JOIN", "FLY")}
  <form class="auth-card glass tilt" id="regForm"><h1>Create your account ✈</h1>
    <p class="muted">It takes 20 seconds. In this preview your account is saved in this browser only.</p>
    <label for="rg-name">Full name<input id="rg-name" name="name" required placeholder="Aarav Sharma"></label>
    <label for="rg-email">Email<input type="email" id="rg-email" name="email" required placeholder="you@example.com"></label>
    <label for="rg-phone">Mobile<input id="rg-phone" name="phone" placeholder="+91 90000 00000"></label>
    <div class="two"><label for="rg-pw">Password<input type="password" id="rg-pw" name="password" required minlength="6" placeholder="min 6 characters"></label>
      <label for="rg-pw2">Confirm<input type="password" id="rg-pw2" name="confirm" required minlength="6" placeholder="repeat password"></label></div>
    <button class="btn btn-search" type="submit">Sign up</button>
    <p class="muted small center">Already have an account? <a ${link("login", p.next ? { next: p.next } : null)}>Log in</a></p>
  </form></section>`;
  pages.register.init = (p) => {
    $("#regForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = new FormData(e.target), email = f.get("email").trim().toLowerCase(), name = f.get("name").trim();
      if (f.get("password") !== f.get("confirm")) { flash("Passwords do not match.", "error"); showFlashes(); return; }
      if (users().some((u) => u.email === email)) { flash("An account with this email already exists. Please log in.", "error"); showFlashes(); return; }
      const u = { id: Date.now(), name, email, phone: f.get("phone").trim(), pw: await hash(f.get("password")) };
      store.set("users", [...users(), u]); store.set("session", u.id);
      flash(`Welcome aboard, ${name.split(" ")[0]}! Your account is ready.`, "success"); afterAuth(p);
    });
  };

  /* ================================================= nav */
  function renderNav() {
    const u = currentUser(), pg = route.page;
    const a = (p, label, act) => `<a ${link(p)} class="${act ? "active" : ""}">${label}</a>`;
    $("#navLinks").innerHTML = a("home", "Home", pg === "home") + a("map", "World Map", pg === "map") +
      a("history", "My Bookings", pg === "history" || pg === "ticket") + a("about", "About", pg === "about") + a("help", "Help Centre", pg === "help") +
      (u ? `<span class="nav-user">👤 ${esc(u.name.split(" ")[0])}</span><a href="#" class="btn btn-sm btn-ghost" id="logoutBtn">Logout</a>`
        : `<a class="btn btn-sm btn-ghost" ${link("login")}>Login</a><a class="btn btn-sm" ${link("register")}>Sign up</a>`);
    $("#logoutBtn")?.addEventListener("click", (e) => { e.preventDefault(); store.set("session", null); flash("You have been logged out.", "info"); go("home"); });
  }

  /* ================================================= 3-D scroll + tilt */
  let items = [];
  function collect3d() {
    items = $$(".scroll-3d, .tilt").map((el) => ({ el, scroll: el.classList.contains("scroll-3d"), depth: parseFloat(el.dataset.depth || "0.4"), tx: 0, ty: 0 }));
    if (!reduceMotion && matchMedia("(pointer: fine)").matches) {
      items.filter((it) => it.el.classList.contains("tilt")).forEach((it) => {
        it.el.addEventListener("mousemove", (e) => {
          const r = it.el.getBoundingClientRect();
          it.ty = ((e.clientX - r.left) / r.width - 0.5) * 10; it.tx = -((e.clientY - r.top) / r.height - 0.5) * 10; requestRender();
        });
        it.el.addEventListener("mouseleave", () => { it.tx = it.ty = 0; requestRender(); });
      });
    }
  }
  function render3d() {
    const vh = innerHeight;
    for (const it of items) {
      let t = "perspective(1100px)", op = 1;
      if (it.scroll && !reduceMotion) {
        const r = it.el.getBoundingClientRect();
        const p = Math.max(-1.3, Math.min(1.3, (r.top + r.height / 2 - vh / 2) / vh)), d = it.depth;
        t += ` translate3d(0, ${p * 60 * d}px, ${-Math.abs(p) * 260 * d}px) rotateX(${p * 32 * d}deg) rotateY(${p * -10 * d}deg)`;
        op = 1 - Math.max(0, Math.abs(p) - 0.75) * 1.6;
      }
      if (it.tx || it.ty) t += ` rotateX(${it.tx}deg) rotateY(${it.ty}deg)`;
      it.el.style.transform = t; it.el.style.opacity = Math.max(0.3, op);
    }
    renderRing();
  }
  let ticking = false;
  function requestRender() { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; render3d(); }); } }
  addEventListener("scroll", requestRender, { passive: true });
  addEventListener("resize", requestRender);
  let ringAuto = 0;
  function renderRing() {
    const ring = $("#ring"), sec = $("#ringSection");
    if (!ring) return;
    const r = sec.getBoundingClientRect(), prog = Math.max(0, Math.min(1, -r.top / (r.height - innerHeight)));
    ring.style.transform = `rotateX(-8deg) rotateY(${-prog * 360 - ringAuto}deg)`;
  }
  if (!reduceMotion) (function spin() { ringAuto += 0.04; renderRing(); requestAnimationFrame(spin); })();

  /* ================================================= maps (Leaflet + bundled world outline) */
  const maps = [];
  function arc(a, b, n = 64) {
    const rad = Math.PI / 180, xyz = (la, lo) => [Math.cos(la * rad) * Math.cos(lo * rad), Math.cos(la * rad) * Math.sin(lo * rad), Math.sin(la * rad)];
    const p = xyz(a[3], a[4]), q = xyz(b[3], b[4]), w = Math.acos(Math.min(1, p[0] * q[0] + p[1] * q[1] + p[2] * q[2]));
    const pts = []; let prev = null;
    for (let i = 0; i <= n; i++) {
      const t = i / n, s1 = Math.sin((1 - t) * w) / Math.sin(w), s2 = Math.sin(t * w) / Math.sin(w);
      const x = s1 * p[0] + s2 * q[0], y = s1 * p[1] + s2 * q[1], z = s1 * p[2] + s2 * q[2];
      const la = Math.atan2(z, Math.hypot(x, y)) / rad; let lo = Math.atan2(y, x) / rad;
      if (prev !== null) { while (lo - prev > 180) lo -= 360; while (lo - prev < -180) lo += 360; }
      prev = lo; pts.push([la, lo]);
    }
    return pts;
  }
  function makeMap(el, isStatic) {
    const map = L.map(el, { minZoom: 1, maxZoom: 6, zoomControl: !isStatic, dragging: !isStatic, scrollWheelZoom: false,
      doubleClickZoom: !isStatic, attributionControl: false, zoomSnap: 0.25, worldCopyJump: false }).setView([22, 40], 1.75);
    L.polygon(window.SV_WORLD, { className: "land", weight: 0.6, fillOpacity: 1, interactive: false }).addTo(map);
    map.on("click", () => map.scrollWheelZoom.enable());
    maps.push(map);
    return map;
  }
  const planeIcon = (deg) => L.divIcon({ className: "map-plane", iconSize: [28, 28], html: `<svg viewBox="0 0 64 64" style="transform:rotate(${deg}deg)"><use href="#plane-icon"/></svg>` });
  const dot = (cls) => L.divIcon({ className: "", html: `<div class="airport-dot ${cls}"></div>`, iconSize: [14, 14] });
  const timers = [];
  function drawRoute(map, a, b, layer) {
    layer.clearLayers(); clearInterval(layer._t);
    const pts = arc(A[a], A[b]);
    L.polyline(pts, { color: "#7c3aed", weight: 3, dashArray: "8 8", opacity: 0.9 }).addTo(layer);
    const plane = L.marker(pts[0], { icon: planeIcon(0), interactive: false }).addTo(layer);
    let i = 0;
    layer._t = setInterval(() => {
      i = (i + 1) % pts.length;
      const [la, lo] = pts[i], nx = pts[Math.min(i + 1, pts.length - 1)];
      plane.setLatLng([la, lo]); plane.setIcon(planeIcon(Math.atan2(-(nx[0] - la), nx[1] - lo) * 180 / Math.PI));
    }, 90);
    timers.push(layer._t);
    map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 4 });
  }
  function initMaps() {
    if (typeof L === "undefined") return;
    const routeEl = $("#routeMap");
    if (routeEl) {
      const [o, d] = routeEl.dataset.route.split(","), map = makeMap(routeEl, true), layer = L.layerGroup().addTo(map);
      drawRoute(map, o, d, layer);
      [o, d].forEach((c, k) => L.marker([A[c][3], A[c][4]], { icon: dot(k ? "to" : "from") }).addTo(map)
        .bindTooltip(`${A[c][0]} (${c})`, { permanent: true, direction: k ? "right" : "left" }));
    }
    $$("[data-map]").forEach((el) => {
      const map = makeMap(el, false), info = el.parentElement.querySelector(".map-info");
      const sFrom = $("#mapFrom"), sTo = $("#mapTo"), sDate = $("#mapDate"), sCur = $("#mapCurrency");
      const layer = L.layerGroup().addTo(map), markers = {};
      let from = null, to = null;
      const refresh = () => {
        Object.entries(markers).forEach(([c, m]) => m.setIcon(dot(c === from ? "from" : c === to ? "to" : "")));
        if (sFrom) sFrom.value = from || ""; if (sTo) sTo.value = to || "";
        if (from && to) { drawRoute(map, from, to, layer); showQuote(); }
        else { layer.clearLayers(); clearInterval(layer._t);
          info.innerHTML = from ? `From <b>${esc(A[from][0])} (${from})</b> — now pick a destination.` : "Click an airport to choose where you fly from."; }
      };
      const showQuote = () => {
        const date = sDate ? parseDate(sDate.value) || addDays(today(), 14) : addDays(today(), 14), cur = sCur ? sCur.value : "USD";
        const q = quote(from, to, date, "economy", cur);
        info.innerHTML = `<div class="quote"><div><b>${esc(A[from][0])} (${from}) → ${esc(A[to][0])} (${to})</b><br>
          <span class="muted small">${q.distance_km.toLocaleString()} km · ${q.duration} fastest · ${q.flights} flights on ${dLong(date)}${q.nonstop ? " · non-stop available" : ""}</span></div>
          <div>from <b class="big">${q.symbol}${Math.round(q.price).toLocaleString()}</b> <span class="muted small">${esc(q.airline)}</span></div>
          <a class="btn" ${link("results", { origin: from, dest: to, depart: iso(date), currency: cur })}>Search flights →</a></div>`;
        window.svFillSearch?.(`${A[from][0]} (${from})`, `${A[to][0]} (${to})`);
      };
      Object.entries(A).forEach(([c, a]) => {
        markers[c] = L.marker([a[3], a[4]], { icon: dot("") }).addTo(map).bindTooltip(`<b>${esc(a[0])} (${c})</b><br>${esc(a[1])}, ${esc(a[2])}`)
          .on("click", () => { if (!from || (from && to)) { from = c; to = null; } else if (c !== from) to = c; refresh(); });
      });
      sFrom?.addEventListener("change", () => { from = sFrom.value || null; if (from === to) to = null; refresh(); });
      sTo?.addEventListener("change", () => { to = sTo.value || null; if (from === to) from = null; refresh(); });
      $("#mapSwap")?.addEventListener("click", () => { [from, to] = [to, from]; refresh(); });
      [sDate, sCur].forEach((s) => s?.addEventListener("change", () => from && to && showQuote()));
      if (el.id === "bigMap") { from = "BOM"; to = "NRT"; }
      refresh();
    });
  }

  /* ================================================= render */
  function render() {
    maps.splice(0).forEach((m) => m.remove());
    timers.splice(0).forEach(clearInterval);
    window.svFillSearch = null;
    const view = pages[route.page] || pages.home;
    $("#app").innerHTML = view(route.params);
    renderNav();
    showFlashes();
    wireSearchForm();
    view.init?.(route.params);
    $$(".pw-toggle").forEach((b) => b.addEventListener("click", () => { const i = b.previousElementSibling; i.type = i.type === "password" ? "text" : "password"; }));
    $$("[data-copy]").forEach((b) => b.addEventListener("click", () => {
      navigator.clipboard?.writeText(b.dataset.copy).then(() => { b.textContent = "Copied"; }, () => { b.textContent = "Select to copy"; });
    }));
    collect3d();
    render3d();
    initMaps();
  }

  /* ================================================= theme */
  $("#themeToggle").addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("sv-theme", next); } catch (e) { /* ignore */ }
  });

  const start = (location.hash || "").slice(1);
  go(["home", "map", "about", "help", "login", "register", "history"].includes(start) ? start : "home");
})();
