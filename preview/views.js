
  /* ================================================= icons + photos */
  const icon = (name, size = 20, cls = "") =>
    `<svg class="i ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${D.icons[name]}</svg>`;
  const photo = (key) => D.photos[key] || D.photos.hero;

  /* ================================================= flash + routing */
  let flashes = [];
  const flash = (msg, cat = "info") => flashes.push([cat, msg]);
  function showFlashes() {
    const box = $("#flashes");
    box.innerHTML = flashes.map(([c, m]) => `<div class="flash flash-${c}">${icon(c === "success" ? "check" : c === "error" ? "alert" : "info")}<span>${esc(m)}</span>
      <button type="button" aria-label="Dismiss">${icon("x", 16)}</button></div>`).join("");
    flashes = [];
    $$("button", box).forEach((b) => b.addEventListener("click", () => b.parentElement.remove()));
    setTimeout(() => box.replaceChildren(), 8000);
  }

  let route = { page: "home", params: {} };
  const HERO_PAGES = ["home", "about", "help", "map", "history", "privacy", "terms"];
  function go(page, params = {}) {
    if (["book", "history", "ticket"].includes(page) && !currentUser()) {
      flash("Please log in to continue.", "info");
      return go("login", { next: { page, params } });
    }
    route = { page, params };
    try { history.replaceState(null, "", "#" + page); } catch (e) { /* sandboxed */ }
    render();
    window.scrollTo({ top: 0, behavior: "instant" });
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
  const brandHtml = `<span class="brand-mark">${icon("plane", 20)}</span><span>Sky<b>Voyage</b></span>`;
  const pageHead = (key, eyebrow, title, text) => `
<section class="page-head">
  <div class="band-media" data-parallax="0.3" style="background-image: ${photo(key)}"></div>
  <div class="page-head-inner"><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p>${text}</p></div>
</section>`;

  /* ================================================= search form */
  const airportOptions = Object.entries(A).map(([c, a]) => `<option value="${esc(a[0])} (${c})">${esc(a[1])}, ${esc(a[2])}</option>`).join("");
  function searchForm(s = {}) {
    const val = (c) => (A[c] ? `${A[c][0]} (${c})` : "");
    const opts = (from, to, cur, word, plural) => Array.from({ length: to - from + 1 }, (_, i) => from + i)
      .map((k) => `<option value="${k}" ${k === cur ? "selected" : ""}>${k} ${k === 1 ? word : plural}</option>`).join("");
    return `
<form class="search" id="searchForm">
  <div class="search-top">
    <div class="segmented" role="radiogroup" aria-label="Trip type">
      <label><input type="radio" name="trip" value="oneway" ${s.trip !== "round" ? "checked" : ""}> One way</label>
      <label><input type="radio" name="trip" value="round" ${s.trip === "round" ? "checked" : ""}> Round trip</label>
    </div>
    <div class="search-extras">
      <span class="extras-label">${icon("users", 16)}</span>
      <select name="adults" id="sf-adults" aria-label="Adults (12+)">${opts(1, 9, s.adults || 1, "Adult", "Adults")}</select>
      <select name="children" id="sf-children" aria-label="Children (2–11)">${opts(0, 8, s.children || 0, "Child", "Children")}</select>
      <select name="infants" id="sf-infants" aria-label="Infants (under 2)">${opts(0, 4, s.infants || 0, "Infant", "Infants")}</select>
      <select name="cabin" id="sf-cabin" aria-label="Cabin class">${Object.entries(CAB).map(([c, v]) => `<option value="${c}" ${s.cabin === c ? "selected" : ""}>${v[0]}</option>`).join("")}</select>
      <select name="currency" id="sf-currency" aria-label="Currency">${Object.keys(CUR).map((c) => `<option ${(s.currency || "USD") === c ? "selected" : ""}>${c}</option>`).join("")}</select>
    </div>
  </div>
  <div class="search-grid">
    <div class="field"><label for="origin">${icon("takeoff", 14)} From</label>
      <input list="airportList" name="origin" id="origin" placeholder="City or airport" required autocomplete="off" value="${esc(val(s.origin))}"></div>
    <button type="button" class="swap" id="swapBtn" title="Swap origin and destination" aria-label="Swap origin and destination">${icon("swap", 18)}</button>
    <div class="field"><label for="dest">${icon("landing", 14)} To</label>
      <input list="airportList" name="dest" id="dest" placeholder="City or airport" required autocomplete="off" value="${esc(val(s.dest))}"></div>
    <div class="field"><label for="depart">${icon("calendar", 14)} Depart</label>
      <input type="date" name="depart" id="depart" required min="${iso(today())}" value="${s.depart ? iso(s.depart) : iso(addDays(today(), 14))}"></div>
    <div class="field field-return"><label for="returnDate">${icon("calendar", 14)} Return</label>
      <input type="date" name="return" id="returnDate" min="${iso(today())}" value="${s.ret ? iso(s.ret) : ""}"></div>
    <button class="btn btn-search" type="submit">${icon("search", 18)} Search</button>
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
      airline: c.airline, price: p.total, symbol: p.symbol, nonstop: fl.some((f) => !f.stops) };
  }
  function wireSearchForm() {
    const form = $("#searchForm");
    if (!form) return;
    const origin = $("#origin", form), dest = $("#dest", form), depart = $("#depart", form), ret = $("#returnDate", form);
    const syncTrip = () => {
      const round = form.querySelector("input[name=trip]:checked").value === "round";
      ret.required = round; ret.disabled = !round; ret.closest(".field").toggleAttribute("data-disabled", !round);
    };
    $$("input[name=trip]", form).forEach((r) => r.addEventListener("change", syncTrip));
    syncTrip();
    depart.addEventListener("change", () => { ret.min = depart.value; if (ret.value && ret.value < depart.value) ret.value = depart.value; });
    $("#swapBtn", form).addEventListener("click", () => { [origin.value, dest.value] = [dest.value, origin.value]; live(); });
    const out = $("#liveQuote", form);
    function live() {
      const o = airportCode(origin.value), d = airportCode(dest.value), dt = parseDate(depart.value);
      const q = A[o] && A[d] && o !== d && dt ? quote(o, d, dt, form.cabin.value, form.currency.value) : null;
      out.innerHTML = q ? `${q.flights} flights from ${o} to ${d} · ${q.distance_km.toLocaleString()} km · fastest ${q.duration} · from ` +
        `<b>${q.symbol}${Math.round(q.price).toLocaleString()}</b> with ${esc(q.airline)}${q.nonstop ? " · non-stop available" : ""}` : "";
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
    const cheapest = (o, d) => { const fl = generateFlights(o, d, when); return fl.reduce((a, b) => (b.fares.economy < a.fares.economy ? b : a)); };
    const whenShort = `${pad(when.getDate())} ${MON[when.getMonth()]}`;
    const whenLong = `${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][when.getDay()]}, ${pad(when.getDate())} ${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][when.getMonth()]}`;
    const dests = D.destinations.map(([code, tagline]) => {
      const f = cheapest("DEL", code);
      return `<a class="dest-card" ${link("results", { origin: "DEL", dest: code, depart: iso(when) })}>
        <div class="dest-photo" style="background-image: ${photo(code)}"></div>
        <div class="dest-body"><span class="country">${esc(A[code][2])}</span><h3>${esc(A[code][0])}</h3><p>${esc(tagline)}</p>
          <div class="dest-price"><span>${fmtDur(f.duration_min)} · ${f.stops ? "1 stop" : "Non-stop"}</span><span>from <b>${money(price(f).total)}</b></span></div></div></a>`;
    }).join("");
    const deals = D.popular.map(([o, d], i) => {
      const f = cheapest(o, d);
      return `<a class="deal panel reveal tilt" data-depth="${0.12 + (i % 4) * 0.05}" ${link("results", { origin: o, dest: d, depart: iso(when) })}>
        <div class="deal-photo" style="background-image: ${photo(d)}"></div>
        <div class="deal-body"><div class="deal-route"><span>${o}</span><span class="line">${icon("plane", 16)}</span><span>${d}</span></div>
          <span class="deal-meta">${esc(A[o][0])} to ${esc(A[d][0])}</span>
          <span class="deal-meta">${esc(f.airline)} · ${fmtDur(f.duration_min)} · ${f.stops ? "1 stop" : "Non-stop"}</span>
          <div class="deal-foot"><span class="muted small">from</span><b class="num">${money(price(f).total)}</b></div></div></a>`;
    }).join("");
    const trust = [["globe", String(Object.keys(A).length), "destinations worldwide"], ["plane", "20", "partner airlines"], ["seat", "4", "cabin classes"], ["headset", "24/7", "customer support"]];
    const features = [["trend", "Fares that follow the market", "Prices reflect route distance, booking window, day of week, time of day, cabin and seats left, the same factors airlines use."],
      ["tag", "Every fee shown upfront", "Base fare, taxes and convenience fee are itemised before you pay. What you see is what you pay."],
      ["ticket", "Instant e-tickets", "Your PNR, seats, terminal, gate and boarding time arrive the moment your booking is confirmed."],
      ["headset", "Support around the clock", "Our travel desk is available 24 hours a day on phone, email and WhatsApp."]];
    const steps = [["Search and compare", "Enter your route and dates. We show every flight with times, stops, duration and the full price."],
      ["Choose and book", "Pick your flight, add passenger details and a seat preference, then confirm securely."],
      ["Fly with your e-ticket", "Your e-ticket is saved to My trips, where you can view, print or cancel it any time."]];
    return `
<section class="hero">
  <div class="hero-media" data-parallax="0.35" style="background-image: ${photo("hero")}"></div>
  <div class="hero-veil"></div>
  <div class="hero-inner">
    <span class="eyebrow">Flights to ${Object.keys(A).length} cities worldwide</span>
    <h1>Your next journey starts at the right fare.</h1>
    <p class="lead">Compare schedules, flight numbers and live prices across 20 airlines, then book in under a minute with an instant e-ticket.</p>
    ${searchForm({})}
    <div class="hero-points"><span>${icon("shield", 18)} Secure checkout</span><span>${icon("tag", 18)} No hidden fees</span>
      <span>${icon("refund", 18)} Easy cancellations</span><span>${icon("headset", 18)} 24/7 support</span></div>
  </div>
</section>
<section class="container section-tight"><div class="trust">${trust.map(([ic, b, s]) => `<div class="trust-item panel reveal" data-depth="0.15">${icon(ic, 28)}<div><b>${b}</b><span>${s}</span></div></div>`).join("")}</div></section>
<section class="gallery-pin" id="gallery"><div class="gallery-sticky">
  <div class="container section-head"><div><span class="eyebrow">Popular destinations</span><h2>Where travellers are flying this season</h2></div>
    <p class="muted">Lowest fares from New Delhi, departing ${whenShort}. Prices update with demand.</p></div>
  <div class="gallery-stage"><div class="gallery-track" id="galleryTrack">${dests}</div></div>
  <div class="gallery-hint">Scroll to explore <span class="gallery-progress"><i id="galleryProgress"></i></span></div>
</div></section>
<section class="container section">
  <div class="section-head"><div><span class="eyebrow">Fare deals</span><h2>Lowest fares on popular routes</h2></div>
    <p class="muted">Economy, one way, per adult including taxes. Travel on ${whenLong}.</p></div>
  <div class="deal-grid">${deals}</div>
</section>
<section class="container section">
  <div class="section-head"><div><span class="eyebrow">Why SkyVoyage</span><h2>Booking made clear and dependable</h2></div></div>
  <div class="feature-grid">${features.map(([ic, t, x], k) => `<div class="feature panel reveal tilt" data-depth="${0.12 + k * 0.05}"><div class="feature-icon">${icon(ic, 24)}</div><h3>${t}</h3><p>${x}</p></div>`).join("")}</div>
</section>
<section class="container section-tight">
  <div class="section-head"><div><span class="eyebrow">How it works</span><h2>From search to boarding pass in three steps</h2></div></div>
  <div class="steps">${steps.map(([t, x], k) => `<div class="step panel reveal" data-depth="0.15"><span class="step-no">Step ${k + 1}</span><h3>${t}</h3><p>${x}</p></div>`).join("")}</div>
</section>
<section class="container section"><div class="map-card panel reveal" data-depth="0.1">
  <div class="section-head"><div><span class="eyebrow">Route map</span><h2>Explore our network</h2>
    <p class="muted">Select one airport for departure and another for arrival to see the route and the lowest fare.</p></div>
    <a class="btn btn-ghost" ${link("map")}>Open full map ${icon("arrow", 16)}</a></div>
  <div id="homeMap" class="map" data-map></div><div class="map-info"></div></div></section>
<section class="container section-tight" id="alerts"><div class="band">
  <div class="band-media" data-parallax="0.2" style="background-image: ${photo("beach")}"></div>
  <div class="band-inner"><div><span class="eyebrow" style="color:#9cc2ff">Fare alerts</span><h2>Get notified when prices drop</h2>
    <p>Tell us where you're going and we'll email you the best time to book. No spam, unsubscribe any time.</p></div>
    <form id="alertForm"><input type="email" id="alert-email" name="email" placeholder="Your email address" required aria-label="Email address">
      <button class="btn btn-lg" type="submit">${icon("send", 18)} Subscribe</button></form></div></div></section>`;
  };
  pages.home.init = () => {
    $("#alertForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      flash(`Fare alerts are on for ${$("#alert-email").value}. This is a preview, so no email will be sent.`, "success");
      showFlashes(); e.target.reset();
    });
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
      return [fl, all, cheapestByDay(a, b, when, cabin).map(([day, v]) => [day, Math.round(v * CUR[currency][1])])];
    };
    const [outbound, allAirlines, calOut] = build(o, d, dep);
    const [inbound, , calIn] = trip === "round" ? build(d, o, ret) : [[], [], []];
    const nPax = pax.adults + pax.children + pax.infants;
    const withP = (extra) => ({ ...p, ...extra });

    const card = (f, leg) => `
<article class="flight panel reveal" data-depth="0.08">
  <div class="flight-main">
    <div class="airline"><span class="airline-logo" style="background:${f.colour}">${f.airline_code}</span>
      <div><strong>${esc(f.airline)}</strong><span class="muted small">${f.flight_no} · ${f.aircraft}</span></div></div>
    <div class="times">
      <div class="t"><b class="num">${hm(f.departure)}</b><span>${f.origin}</span><small class="muted">${f.terminal}</small></div>
      <div class="path"><span class="muted small">${fmtDur(f.duration_min)}</span><span class="path-line ${f.stops ? "has-stop" : ""}"><i></i></span>
        <span class="small ${f.stops ? "warn" : "ok"}">${f.stops ? "1 stop · " + f.via : "Non-stop"}</span></div>
      <div class="t"><b class="num">${hm(f.arrival)}${f.day_diff ? `<sup class="warn small">+${f.day_diff}</sup>` : ""}</b><span>${f.dest}</span><small class="muted">${esc(A[f.dest][0])}</small></div>
    </div>
    <div class="price-box"><span class="price num">${money(f.price.total, sym)}</span><span class="muted small">total, ${nPax} traveller${nPax > 1 ? "s" : ""}</span>
      ${trip === "round" ? `<label class="btn btn-sm select-btn"><input type="radio" name="${leg}" value="${f.id}"> Select</label>`
        : `<a class="btn btn-sm" ${link("book", { out: f.id, cabin, currency, ...pax })}>Select ${icon("arrow", 16)}</a>`}</div>
  </div>
  <div class="flight-tags"><span>${icon("luggage", 16)} ${f.baggage}</span><span>${icon("meal", 16)} ${f.meal ? "Meal included" : "Meals for purchase"}</span>
    ${f.wifi ? `<span>${icon("wifi", 16)} Wi-Fi</span>` : ""}<span>${icon("refund", 16)} ${f.refundable ? "Refundable" : "Non-refundable"}</span>
    ${f.seats_left <= 9 ? `<span class="badge badge-hot">${f.seats_left} seats left at this price</span>` : ""}</div>
  <details class="flight-details"><summary>Flight details and fare breakdown</summary>
    <div class="details-grid">
      <div><h4>Itinerary</h4>
        <p><b>Departs</b> ${dLong(f.departure)}, ${hm(f.departure)} · ${esc(A[f.origin][1])} (${f.origin}), ${f.terminal}, gate ${f.gate}</p>
        ${f.via ? `<p><b>Connection</b> ${fmtDur(f.layover_min)} in ${esc(A[f.via][0])} (${f.via})</p>` : ""}
        <p><b>Arrives</b> ${dLong(f.arrival)}, ${hm(f.arrival)} local time · ${esc(A[f.dest][1])} (${f.dest})</p>
        <p><b>Distance</b> ${f.distance_km.toLocaleString()} km · <b>Aircraft</b> ${f.aircraft}</p></div>
      <div><h4>Fare conditions</h4><p>${f.baggage}</p><p>${f.meal ? "Complimentary meal on board" : "Food and drinks for purchase"}</p>
        <p>${f.wifi ? "Wi-Fi available on board" : "No Wi-Fi on this aircraft"}</p>
        <p>${f.refundable ? "Free cancellation up to 24 hours before departure" : "Non-refundable; taxes are refunded on cancellation"}</p></div>
      <div><h4>Price · ${CAB[cabin][0]}</h4>
        <p class="row"><span>Base fare</span><span class="num">${money(f.price.base, sym)}</span></p>
        <p class="row"><span>Taxes and surcharges</span><span class="num">${money(f.price.taxes, sym)}</span></p>
        <p class="row"><span>Convenience fee</span><span class="num">${money(f.price.fees, sym)}</span></p>
        <p class="row total"><span>Total</span><span class="num">${money(f.price.total, sym)}</span></p></div>
    </div></details>
</article>`;
    const calendar = (days, current, key) => {
      const low = Math.min(...days.map((x) => x[1]));
      return `<div class="fare-cal">${days.map(([day, v]) => `<a class="fare-day panel ${+day === +current ? "active" : ""} ${v === low ? "lowest" : ""}" ${link("results", withP({ [key]: iso(day) }))}>
        <span>${DAY[day.getDay()]}</span><b>${pad(day.getDate())} ${MON[day.getMonth()]}</b><em class="num">${sym}${v.toLocaleString()}</em></a>`).join("")}</div>`;
    };
    const radio = (name, v, label, cur) => `<label class="opt"><input type="radio" name="${name}" value="${v}" ${cur === v ? "checked" : ""}> ${label}</label>`;
    return `
<section class="container section-tight">
  <details class="modify"><summary class="btn btn-ghost">${icon("search", 16)} Change search</summary>
    ${searchForm({ origin: o, dest: d, depart: dep, ret, trip, cabin, currency, ...pax })}</details>
  <div class="route-head panel">
    <div><h1>${esc(A[o][0])} ${icon("arrow", 22)} ${esc(A[d][0])}${trip === "round" ? ` ${icon("arrow", 22)} ${esc(A[o][0])}` : ""}</h1>
      <p class="muted">${dLong(dep)}${trip === "round" ? " – " + dLong(ret) : ""} · ${pax.adults} adult${pax.adults > 1 ? "s" : ""}${pax.children ? `, ${pax.children} child` : ""}${pax.infants ? `, ${pax.infants} infant` : ""}
        · ${CAB[cabin][0]} · ${Math.round(km(o, d)).toLocaleString()} km</p></div>
    <div id="routeMap" class="map map-sm" data-route="${o},${d}"></div>
  </div>
  <div class="results-layout">
    <aside class="filters panel"><form id="filterForm">
      <h4>Sort by</h4>${[["price", "Lowest price"], ["duration", "Shortest duration"], ["departure", "Earliest departure"], ["arrival", "Earliest arrival"]].map(([v, l]) => radio("sort", v, l, sort)).join("")}
      <h4>Stops</h4>${[["any", "Any number of stops"], ["0", "Non-stop only"], ["1", "1 stop"]].map(([v, l]) => radio("stops", v, l, stops)).join("")}
      <h4>Airlines</h4>${allAirlines.map((a) => `<label class="opt"><input type="checkbox" name="airline" value="${esc(a)}" ${airlineFilter.includes(a) ? "checked" : ""}> ${esc(a)}</label>`).join("")}
      ${airlineFilter.length || stops !== "any" ? `<a class="small" ${link("results", withP({ stops: "any", airlines: [] }))}>Clear all filters</a>` : ""}
    </form></aside>
    <div class="results">
      <h2 class="results-title">${icon("takeoff")} Departing flights <span class="muted small">${outbound.length} results</span></h2>
      ${calendar(calOut, dep, "depart")}
      ${outbound.map((f) => card(f, "out")).join("") || `<p class="panel empty">No flights match these filters. Try clearing a filter.</p>`}
      ${trip === "round" ? `<h2 class="results-title" style="margin-top:2rem">${icon("landing")} Return flights <span class="muted small">${inbound.length} results</span></h2>
        ${calendar(calIn, ret, "ret")}
        ${inbound.map((f) => card(f, "ret")).join("") || `<p class="panel empty">No return flights match these filters.</p>`}
        <form id="roundForm" class="round-bar panel panel-solid"><span id="roundSummary">Select a departing and a return flight</span>
          <button class="btn" type="submit">Continue ${icon("arrow", 16)}</button></form>` : ""}
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
    const lab = (x) => { const c = x.closest(".flight"); return `<b>${c.querySelector(".airline strong").textContent}</b> ${c.querySelector(".price").textContent}`; };
    $$("input[name=out], input[name=ret]").forEach((r) => r.addEventListener("change", () => {
      const [a, b] = picked();
      summary.innerHTML = (a ? "Departing: " + lab(a) : "Choose a departing flight") + " · " + (b ? "Return: " + lab(b) : "choose a return flight");
    }));
    rf.addEventListener("submit", (e) => {
      e.preventDefault();
      const [a, b] = picked();
      if (!a || !b) { summary.innerHTML = "<b class='warn'>Choose one departing and one return flight first.</b>"; return; }
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
<section class="container section-tight book-layout">
  <form class="book-form panel" id="bookForm">
    <span class="eyebrow">Step 2 of 2</span><h1 style="font-size:1.8rem">Passenger details and payment</h1>
    <h3>${icon("users")} Passengers</h3>
    <p class="muted small">Enter names exactly as they appear on the passport or government ID.</p>
    ${c.kinds.map((k, i) => `<fieldset class="pax-row"><legend>Passenger ${i + 1} · ${k}</legend>
      <select name="title_${i}" id="title_${i}" aria-label="Title">${(k === "Adult" ? ["Mr", "Ms", "Mrs", "Dr"] : ["Master", "Miss"]).map((t) => `<option>${t}</option>`).join("")}</select>
      <input name="first_${i}" id="first_${i}" placeholder="First name" required aria-label="First name">
      <input name="last_${i}" id="last_${i}" placeholder="Last name" required aria-label="Last name"></fieldset>`).join("")}
    <h3>${icon("mail")} Contact details</h3>
    <div class="two"><label for="bk-email">Email for your e-ticket<input type="email" name="email" id="bk-email" required value="${esc(u.email)}"></label>
      <label for="bk-phone">Mobile number<input name="phone" id="bk-phone" required minlength="7" value="${esc(u.phone || "")}"></label></div>
    <h3>${icon("seat")} Seat preference</h3>
    <div class="seat-pref">${[["window", "Window"], ["aisle", "Aisle"], ["any", "No preference"]].map(([v, l], i) =>
      `<label class="chip"><input type="radio" name="seat_pref" value="${v}" ${i === 0 ? "checked" : ""}> ${l}</label>`).join("")}</div>
    <h3>${icon("card")} Payment</h3>
    <div class="two"><label for="bk-card">Card number<input id="bk-card" inputmode="numeric" maxlength="19" autocomplete="off" placeholder="1234 5678 9012 3456"></label>
      <label for="bk-exp">Expiry and CVV<input id="bk-exp" autocomplete="off" placeholder="MM/YY · CVV"></label></div>
    <p class="secure-note">${icon("lock", 16)} Demonstration checkout: no payment is taken and card details are not stored.</p>
    <button class="btn btn-lg btn-block" type="submit" style="margin-top:1.2rem">Pay ${money(c.total, c.sym)} and confirm</button>
  </form>
  <aside class="summary panel panel-solid"><h3>Trip summary</h3>
    ${c.legs.map(([leg, f], i) => { const pr = c.prices[i]; return `<div class="sum-leg"><span class="badge">${leg}</span>
      <p style="margin-top:.5rem"><b>${esc(A[f.origin][0])} (${f.origin}) → ${esc(A[f.dest][0])} (${f.dest})</b></p>
      <p class="muted small">${esc(f.airline)} ${f.flight_no} · ${CAB[c.cabin][0]}</p>
      <p class="muted small">${dShort(f.departure)}, ${hm(f.departure)} → ${dShort(f.arrival)}, ${hm(f.arrival)} · ${fmtDur(f.duration_min)} · ${f.stops ? "1 stop via " + f.via : "Non-stop"}</p>
      <p class="row"><span>Base fare</span><span class="num">${money(pr.base, c.sym)}</span></p>
      <p class="row"><span>Taxes and fees</span><span class="num">${money(pr.taxes + pr.fees, c.sym)}</span></p></div>`; }).join("")}
    <p class="row total"><span>Total to pay</span><span class="num">${money(c.total, c.sym)}</span></p>
    <p class="muted small" style="margin-top:1rem">Questions? Call ${HELP.phone} or email ${HELP.email}.</p></aside>
</section>`;
  };
  pages.book.init = (p) => {
    $("#bookForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const c = bookCtx(p), f = new FormData(e.target), u = currentUser();
      const names = c.kinds.map((k, i) => `${f.get("title_" + i)} ${f.get("first_" + i).trim()} ${f.get("last_" + i).trim()} (${k})`);
      const letters = { window: "AF", aisle: "CD", any: "ABCDEF" }[f.get("seat_pref")];
      const rows = { first: [1, 2], business: [3, 8], premium: [9, 14], economy: [15, 42] }[c.cabin];
      const now = new Date().toISOString(), all = bookings(), made = [];
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
      flash("Booking confirmed. Your e-ticket is ready below.", "success");
      go("ticket", { pnr: made[0].pnr });
    });
  };

  const myBookings = () => { const u = currentUser(); return bookings().filter((b) => b.user_id === u.id); };
  pages.history = () => {
    const list = myBookings().map((b) => ({ ...b, state: bookingState(b), symbol: CUR[b.currency][0] }))
      .sort((a, b) => b.booked_at.localeCompare(a.booked_at) || a.departure.localeCompare(b.departure));
    const count = (s) => list.filter((b) => b.state === s).length;
    const kmSum = list.filter((b) => b.state !== "Cancelled").reduce((s, b) => s + Math.round(km(b.origin, b.dest)), 0);
    const stats = [["Total bookings", list.length, "ticket"], ["Upcoming", count("Upcoming"), "takeoff"], ["Completed", count("Completed"), "landing"],
      ["Cancelled", count("Cancelled"), "x"], ["Kilometres booked", kmSum.toLocaleString(), "globe"]];
    return pageHead("hero", "My trips", "Booking history", "Every flight you have booked with SkyVoyage: upcoming trips, completed journeys and cancellations.") + `
<section class="container section-tight">
  <div class="stats">${stats.map(([l, v, ic]) => `<div class="stat panel reveal" data-depth="0.1">${icon(ic, 22)}<b class="num">${v}</b><small>${l}</small></div>`).join("")}</div>
  <div class="history-tabs">${["All", "Upcoming", "Completed", "Cancelled"].map((t, i) => `<button type="button" class="chip ${i ? "" : "active"}" data-filter="${t}">${t}</button>`).join("")}</div>
  ${list.length ? "" : `<div class="panel empty"><h3>No trips yet</h3><p class="muted">When you book a flight it will appear here with its e-ticket.</p><a class="btn" ${link("home")}>${icon("search", 16)} Search flights</a></div>`}
  ${list.map((b) => { const dep = new Date(b.departure), arr = new Date(b.arrival); return `
  <article class="booking panel" data-state="${b.state}">
    <div class="booking-top"><div><span class="badge badge-${b.state.toLowerCase()}">${b.state}</span><span class="badge">${b.trip_leg}</span>
      <span class="muted small">Booking reference <b>${b.pnr}</b> · booked ${dFull(new Date(b.booked_at))}</span></div>
      <span class="price num">${money(b.total, b.symbol)}</span></div>
    <div class="booking-route"><div><b class="num">${hm(dep)}</b><span>${b.origin}</span><small class="muted">${esc(A[b.origin][0])}</small></div>
      <div class="path"><span class="muted small">${fmtDur(b.duration_min)}</span><span class="path-line ${b.via ? "has-stop" : ""}"><i></i></span>
        <span class="small muted">${b.via ? "1 stop · " + b.via : "Non-stop"}</span></div>
      <div><b class="num">${hm(arr)}</b><span>${b.dest}</span><small class="muted">${esc(A[b.dest][0])}</small></div></div>
    <p class="muted small">${esc(b.airline)} ${b.flight_no} · ${dLong(dep)} · ${CAB[b.cabin][0]} · Seats ${b.seats}</p>
    <p class="small">${b.passengers.map(esc).join(" · ")}</p>
    <div class="booking-actions"><a class="btn btn-sm" ${link("ticket", { pnr: b.pnr })}>${icon("ticket", 16)} View e-ticket</a>
      ${b.state === "Upcoming" ? `<button type="button" class="btn btn-sm btn-ghost" data-cancel="${b.pnr}">Cancel booking</button>` : ""}
      <a class="btn btn-sm btn-ghost" ${link("results", { origin: b.origin, dest: b.dest, depart: b.state === "Upcoming" ? b.departure.slice(0, 10) : iso(addDays(today(), 7)) })}>Book again</a></div>
  </article>`; }).join("")}
</section>`;
  };
  pages.history.init = () => {
    $$(".history-tabs .chip").forEach((btn) => btn.addEventListener("click", () => {
      $$(".history-tabs .chip").forEach((b) => b.classList.toggle("active", b === btn));
      $$(".booking").forEach((b) => { b.hidden = !(btn.dataset.filter === "All" || b.dataset.state === btn.dataset.filter); });
    }));
    $$("[data-cancel]").forEach((btn) => btn.addEventListener("click", () => {
      if (btn.dataset.armed !== "1") { btn.dataset.armed = "1"; btn.textContent = "Confirm cancellation"; btn.classList.add("btn-danger"); btn.classList.remove("btn-ghost"); return; }
      const all = bookings(), b = all.find((x) => x.pnr === btn.dataset.cancel);
      b.status = "Cancelled"; store.set("bookings", all);
      flash(`Booking ${b.pnr} cancelled. Your refund will reach you in 5–7 working days.`, "success");
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
<section class="container section-tight">
  <div class="ticket panel panel-solid">
    <div class="ticket-main">
      <div class="ticket-head"><span class="brand">${brandHtml}</span><span class="badge badge-${b.state.toLowerCase()}">${b.state}</span></div>
      <p class="muted small" style="margin-top:1rem">ELECTRONIC TICKET · ${b.trip_leg.toUpperCase()} FLIGHT</p>
      <div class="ticket-route">
        <div><span class="code-big">${b.origin}</span><span>${esc(A[b.origin][0])}</span><small class="muted">${dFull(dep)}</small></div>
        <div class="ticket-plane">${icon("plane", 34)}<small class="muted">${fmtDur(b.duration_min)}${b.via ? " · via " + b.via : ""}</small></div>
        <div><span class="code-big">${b.dest}</span><span>${esc(A[b.dest][0])}</span><small class="muted">${dFull(arr)}</small></div></div>
      <div class="ticket-grid">
        <div><small>Flight</small><b>${b.flight_no}</b></div><div><small>Airline</small><b>${esc(b.airline)}</b></div>
        <div><small>Class</small><b>${CAB[b.cabin][0]}</b></div><div><small>Seats</small><b>${b.seats}</b></div>
        ${fl ? `<div><small>Terminal</small><b>${fl.terminal}</b></div><div><small>Gate</small><b>${fl.gate}</b></div>
        <div><small>Boarding</small><b>${hm(addMin(fl.departure, -45))}</b></div><div><small>Aircraft</small><b>${fl.aircraft}</b></div>` : ""}
      </div>
      <h4>Passengers</h4><ul class="pax-list">${b.passengers.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
      <p class="muted small">Contact: ${esc(b.contact_email)} · ${esc(b.contact_phone)} · Boarding closes 45 minutes before departure.</p>
    </div>
    <div class="ticket-stub"><small>Booking reference</small><b class="pnr">${b.pnr}</b><div class="barcode" aria-hidden="true">${bars}</div>
      <small>Total paid</small><b class="num">${money(b.total, b.symbol)}</b></div>
  </div>
  <div class="ticket-actions"><a class="btn btn-ghost" ${link("history")}>${icon("history", 16)} All my trips</a>
    ${others.map((o) => `<a class="btn btn-ghost" ${link("ticket", { pnr: o.pnr })}>${o.trip_leg} ticket (${o.pnr})</a>`).join("")}</div>
</section>`;
  };

  pages.map = () => pageHead("hero", "Route map", "Explore our network", "Select a departure and an arrival airport to see the route, flight time and the lowest available fare.") + `
<section class="container section-tight"><div class="map-card panel">
  <div class="map-controls">
    <select id="mapFrom" aria-label="From"><option value="">From…</option>${Object.entries(A).map(([c, a]) => `<option value="${c}">${esc(a[0])} (${c})</option>`).join("")}</select>
    <button type="button" class="swap" id="mapSwap" aria-label="Swap">${icon("swap", 18)}</button>
    <select id="mapTo" aria-label="To"><option value="">To…</option>${Object.entries(A).map(([c, a]) => `<option value="${c}">${esc(a[0])} (${c})</option>`).join("")}</select>
    <input type="date" id="mapDate" min="${iso(today())}" value="${iso(addDays(today(), 14))}" aria-label="Travel date">
    <select id="mapCurrency" aria-label="Currency">${Object.keys(CUR).map((c) => `<option>${c}</option>`).join("")}</select>
  </div>
  <div id="bigMap" class="map map-lg" data-map data-default="BOM,NRT"></div><div class="map-info"></div>
</div></section>`;

  pages.about = () => {
    const values = [["tag", "Clear pricing", "Base fare, taxes and fees are always itemised. No surprises at checkout."],
      ["shield", "Secure accounts", "Passwords are stored as salted hashes and bookings are private to your account."],
      ["globe", "Global network", `${Object.keys(A).length} airports on six continents with 20 partner airlines.`],
      ["headset", "Real support", "A travel desk that is reachable by phone, email and WhatsApp around the clock."]];
    const team = [["Riya Kapoor", "Founder and CEO"], ["Arjun Mehta", "Head of Engineering"], ["Sara Khan", "Head of Customer Care"], ["Leo Fernandes", "Design Lead"]];
    return pageHead("india", "About SkyVoyage", "Hello! We make flying simpler.", "SkyVoyage helps travellers find the right flight at a fair price, with every time, flight number and fee shown clearly before they pay.") + `
<section class="container section"><div class="split">
  <div class="reveal" data-depth="0.12"><span class="eyebrow">Our mission</span><h2>Transparent fares and a booking flow that respects your time</h2>
    <p class="muted">We believe booking a flight should be as easy as choosing where to go. That means honest prices, complete flight information and support that answers when you call.</p>
    <p class="muted">Our fares follow the same factors airlines use: distance, how early you book, the day and time you fly, the cabin you choose and how many seats remain.</p></div>
  <div class="split-media reveal" data-depth="0.18" style="background-image: ${photo("LHR")}"></div>
</div></section>
<section class="container section-tight"><div class="counters panel reveal" data-depth="0.1">
  ${[[Object.keys(A).length, "destinations"], [20, "partner airlines"], [4, "cabin classes"], [24, "hour support, every day"]].map(([n, l]) => `<div><b class="num">${n}</b><span>${l}</span></div>`).join("")}
</div></section>
<section class="container section"><div class="section-head"><div><span class="eyebrow">What we stand for</span><h2>Our commitments to every traveller</h2></div></div>
  <div class="feature-grid">${values.map(([ic, t, x], k) => `<div class="feature panel reveal tilt" data-depth="${0.12 + k * 0.05}"><div class="feature-icon">${icon(ic, 24)}</div><h3>${t}</h3><p>${x}</p></div>`).join("")}</div></section>
<section class="container section-tight"><div class="section-head"><div><span class="eyebrow">Leadership</span><h2>The team behind SkyVoyage</h2></div></div>
  <div class="team">${team.map(([n, r]) => `<div class="member panel reveal" data-depth="0.12"><span class="avatar">${n.split(" ").map((w) => w[0]).join("")}</span><b>${n}</b><small class="muted">${r}</small></div>`).join("")}</div></section>`;
  };

  const copyBtn = (text) => `<button type="button" class="copy-btn" data-copy="${esc(text)}" aria-label="Copy ${esc(text)}">${icon("copy", 14)} Copy</button>`;
  pages.help = () => {
    const u = currentUser();
    const faq = [["How are ticket prices calculated?", "Prices depend on distance, how many days before departure you book, the day of the week (Fridays and Sundays cost more), time of day, airline, number of stops, cabin class and seats remaining. Booking three to six weeks ahead usually gives the best fares."],
      ["Where can I find my booking?", "Log in and open My trips. You will see upcoming, completed and cancelled trips, each with its e-ticket."],
      ["Can I cancel a booking?", "Yes. Any upcoming booking can be cancelled from My trips. Refunds reach your original payment method in 5 to 7 working days."],
      ["What baggage is included?", "Short-haul flights include 15 kg checked baggage and a 7 kg cabin bag. Long-haul flights include 30 kg checked and 7 kg cabin."],
      ["How much do children and infants pay?", "Children aged 2 to 11 pay 75% of the adult fare. Infants under 2 travelling on an adult's lap pay 10%."],
      ["When should I arrive at the airport?", "Two hours before domestic flights and three hours before international flights. Boarding closes 45 minutes before departure."]];
    return pageHead("DXB", "Help centre", "How can we help?", `Our travel desk is available ${esc(HELP.hours.toLowerCase())}. Contact us or find a quick answer below.`) + `
<section class="container section-tight">
  <div class="contact-grid">
    <div class="contact panel reveal" data-depth="0.1"><div class="feature-icon">${icon("mail", 24)}</div><h3>Email</h3>
      <span class="value">${HELP.email} ${copyBtn(HELP.email)}</span><span class="muted small">Bookings: ${HELP.support_email}</span></div>
    <div class="contact panel reveal" data-depth="0.14"><div class="feature-icon">${icon("phone", 24)}</div><h3>Phone</h3>
      <span class="value">${HELP.phone} ${copyBtn(HELP.phone)}</span><span class="muted small">International: ${HELP.phone_intl}</span></div>
    <div class="contact panel reveal" data-depth="0.18"><div class="feature-icon">${icon("chat", 24)}</div><h3>WhatsApp</h3>
      <span class="value">${HELP.whatsapp} ${copyBtn(HELP.whatsapp)}</span><span class="muted small">Replies within 15 minutes</span></div>
  </div>
  <div class="help-layout">
    <div class="faq panel"><h2 style="font-size:1.4rem">Frequently asked questions</h2>${faq.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("")}</div>
    <form class="panel contact-form" id="helpForm"><h2 style="font-size:1.4rem">Send us a message</h2>
      <label for="hf-name">Your name<input id="hf-name" name="name" required value="${esc(u ? u.name : "")}"></label>
      <label for="hf-email">Email address<input type="email" id="hf-email" name="email" required value="${esc(u ? u.email : "")}"></label>
      <label for="hf-pnr">Booking reference (optional)<input id="hf-pnr" name="pnr" placeholder="e.g. 9A1DO8"></label>
      <label for="hf-topic">Topic<select id="hf-topic" name="topic"><option>Booking issue</option><option>Refund or cancellation</option><option>Baggage</option><option>Payment</option><option>Other</option></select></label>
      <label for="hf-msg">Message<textarea id="hf-msg" name="message" rows="4" required></textarea></label>
      <button class="btn btn-block">${icon("send", 16)} Send message</button></form>
  </div>
</section>`;
  };
  pages.help.init = () => {
    $("#helpForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const t = "SV-" + String(Math.floor(100000 + Math.random() * 900000));
      flash(`Thanks ${new FormData(e.target).get("name").trim() || "for your message"}. Ticket ${t} is saved. This is a preview, so no message is sent.`, "success");
      go("help");
    });
  };

  const legal = (kind) => () => pageHead("hero", "Legal", kind === "privacy" ? "Privacy policy" : "Terms of use", `Last updated ${dLong(today()).split(", ")[1]}`) + `
<section class="container section-tight"><article class="panel prose">${kind === "privacy" ? `
  <p>This policy explains what information SkyVoyage collects when you use our website and how we use it.</p>
  <h2>Information we collect</h2><p>When you create an account we store your name, email address, mobile number and a salted hash of your password. When you book, we store passenger names, contact details and the flights you selected.</p>
  <h2>How we use it</h2><ul><li>To issue e-tickets and show your booking history.</li><li>To contact you about changes to your trip.</li><li>To answer support requests.</li></ul>
  <h2>Payment information</h2><p>Card details entered at checkout are not stored by SkyVoyage.</p>
  <h2>Your choices</h2><p>You can ask us to update or delete your account at any time by writing to ${HELP.email}.</p>` : `
  <p>By using SkyVoyage you agree to these terms. Please read them before booking.</p>
  <h2>Bookings</h2><p>A booking is confirmed when you receive a booking reference (PNR) and e-ticket. Please check that passenger names match travel documents.</p>
  <h2>Fares and payment</h2><p>Fares shown include base fare, taxes and a convenience fee. Prices can change until a booking is confirmed.</p>
  <h2>Cancellations and refunds</h2><p>Upcoming bookings can be cancelled from My trips. Refundable fares are refunded in full; for non-refundable fares, taxes are refunded. Refunds take 5 to 7 working days.</p>
  <h2>Travel documents</h2><p>Travellers are responsible for holding valid passports, visas and health documents for their journey.</p>
  <h2>Contact</h2><p>Questions about these terms can be sent to ${HELP.email} or ${HELP.phone}.</p>`}</article></section>`;
  pages.privacy = legal("privacy");
  pages.terms = legal("terms");

  const authPanel = (key, eyebrow, title, text, points) => `
  <div class="auth-media"><div class="band-media" data-parallax="0.2" style="background-image: ${photo(key)}"></div>
    <div class="auth-copy"><span class="eyebrow" style="color:#9cc2ff">${eyebrow}</span><h2>${title}</h2><p>${text}</p>
      <ul>${points.map((x) => `<li>${icon("check", 18)} ${x}</li>`).join("")}</ul></div></div>`;
  pages.login = (p) => `
<section class="auth">${authPanel("SIN", "Welcome back", "Pick up where you left off.", "Log in to book faster and keep every trip in one place.",
    ["Your e-tickets and booking history", "Saved traveller and contact details", "Cancel or rebook in a few clicks"])}
  <div class="auth-form-wrap"><form class="auth-card panel panel-solid" id="loginForm">
    <h1>Log in</h1><p class="muted" style="margin:0">Use the email address you registered with.</p>
    <label for="lg-email">Email address<input type="email" id="lg-email" name="email" required autocomplete="email"></label>
    <label for="lg-pw">Password<span class="pw"><input type="password" id="lg-pw" name="password" required autocomplete="current-password">
      <button type="button" class="pw-toggle" aria-label="Show password">${icon("eye", 18)}</button></span></label>
    <button class="btn btn-lg btn-block" type="submit">Log in</button>
    <button class="btn btn-ghost btn-block" type="button" id="demoLogin">Continue with a demo account</button>
    <div class="divider">New to SkyVoyage?</div>
    <a class="btn btn-ghost btn-block" ${link("register", p.next ? { next: p.next } : null)}>Create an account</a>
  </form></div></section>`;
  const afterAuth = (p) => (p.next ? go(p.next.page, p.next.params) : go("home"));
  pages.login.init = (p) => {
    $("#demoLogin")?.addEventListener("click", () => {
      let u = users().find((x) => x.email === "demo@skyvoyage.app");
      if (!u) { u = { id: Date.now(), name: "Demo Traveller", email: "demo@skyvoyage.app", phone: "+91 90000 12345", pw: "demo" }; store.set("users", [...users(), u]); }
      store.set("session", u.id); flash("You're logged in with the demo account.", "success"); afterAuth(p);
    });
    $("#loginForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = new FormData(e.target), email = f.get("email").trim().toLowerCase(), h = await hash(f.get("password"));
      const u = users().find((x) => x.email === email && x.pw === h);
      if (!u) { flash("That email and password don't match an account. Check them or create an account.", "error"); showFlashes(); return; }
      store.set("session", u.id); flash(`Welcome back, ${u.name.split(" ")[0]}.`, "success"); afterAuth(p);
    });
  };
  pages.register = (p) => `
<section class="auth">${authPanel("MLE", "Join SkyVoyage", "Travel more, spend less time booking.", "Creating an account takes less than a minute.",
    ["Faster checkout with saved details", "All your e-tickets in My trips", "Fare alerts for routes you follow"])}
  <div class="auth-form-wrap"><form class="auth-card panel panel-solid" id="regForm">
    <h1>Create your account</h1>
    <label for="rg-name">Full name<input id="rg-name" name="name" required autocomplete="name"></label>
    <label for="rg-email">Email address<input type="email" id="rg-email" name="email" required autocomplete="email"></label>
    <label for="rg-phone">Mobile number<input id="rg-phone" name="phone" autocomplete="tel" placeholder="+91 90000 00000"></label>
    <div class="two"><label for="rg-pw">Password<input type="password" id="rg-pw" name="password" required minlength="6" autocomplete="new-password" placeholder="At least 6 characters"></label>
      <label for="rg-pw2">Confirm password<input type="password" id="rg-pw2" name="confirm" required minlength="6" autocomplete="new-password"></label></div>
    <button class="btn btn-lg btn-block" type="submit">Create account</button>
    <p class="muted small center" style="margin:0">By continuing you agree to our <a ${link("terms")}>Terms of use</a> and <a ${link("privacy")}>Privacy policy</a>.</p>
    <div class="divider">Already registered?</div>
    <a class="btn btn-ghost btn-block" ${link("login", p.next ? { next: p.next } : null)}>Log in</a>
  </form></div></section>`;
  pages.register.init = (p) => {
    $("#regForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = new FormData(e.target), email = f.get("email").trim().toLowerCase(), name = f.get("name").trim();
      if (f.get("password") !== f.get("confirm")) { flash("The two passwords don't match. Type them again.", "error"); showFlashes(); return; }
      if (users().some((u) => u.email === email)) { flash("An account with this email already exists. Log in instead.", "error"); showFlashes(); return; }
      const u = { id: Date.now(), name, email, phone: f.get("phone").trim(), pw: await hash(f.get("password")) };
      store.set("users", [...users(), u]); store.set("session", u.id);
      flash(`Welcome aboard, ${name.split(" ")[0]}. Your account is ready.`, "success"); afterAuth(p);
    });
  };

  /* ================================================= nav */
  function renderNav() {
    const u = currentUser(), pg = route.page;
    const a = (p, label, act) => `<a ${link(p)} class="${act ? "active" : ""}">${label}</a>`;
    $("#navLinks").innerHTML = a("home", "Flights", pg === "home") + a("map", "Route map", pg === "map") +
      a("history", "My trips", pg === "history" || pg === "ticket") + a("about", "About", pg === "about") + a("help", "Help", pg === "help") +
      (u ? `<span class="nav-user">${icon("user", 18)} ${esc(u.name.split(" ")[0])}</span><a href="#" class="btn btn-sm btn-ghost" id="logoutBtn">${icon("logout", 16)} Log out</a>`
        : `<a class="btn btn-sm btn-ghost" ${link("login")}>Log in</a><a class="btn btn-sm" ${link("register")}>Sign up</a>`);
    $("#logoutBtn")?.addEventListener("click", (e) => { e.preventDefault(); store.set("session", null); flash("You have been logged out.", "info"); go("home"); });
  }

  /* ================================================= scroll motion */
  let parallax = [], reveals = [], track = null, pin = null, bar = null, cards = [];
  function collectMotion() {
    parallax = $$("[data-parallax]");
    reveals = $$(".reveal").map((el) => ({ el, depth: parseFloat(el.dataset.depth || "0.12") }));
    track = $("#galleryTrack"); pin = $("#gallery"); bar = $("#galleryProgress");
    cards = track ? $$(".dest-card", track) : [];
    if (!reduceMotion && matchMedia("(pointer: fine)").matches) {
      $$(".tilt").forEach((el) => {
        el.addEventListener("mousemove", (e) => {
          const r = el.getBoundingClientRect();
          const ry = ((e.clientX - r.left) / r.width - 0.5) * 6, rx = -((e.clientY - r.top) / r.height - 0.5) * 6;
          el.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-3px)`;
        });
        el.addEventListener("mouseleave", () => { el.style.transform = ""; request(); });
      });
    }
  }
  function frame() {
    const vh = innerHeight;
    $("#nav").classList.toggle("scrolled", scrollY > 40);
    if (reduceMotion) return;
    for (const el of parallax) {
      const host = el.parentElement.getBoundingClientRect();
      if (host.bottom < 0 || host.top > vh) continue;
      el.style.transform = `translate3d(0, ${(-host.top * parseFloat(el.dataset.parallax)).toFixed(1)}px, 0) scale(1.06)`;
    }
    for (const it of reveals) {
      const r = it.el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100 || it.el.matches(":hover")) continue;
      const p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / vh));
      it.el.style.transform = `perspective(1200px) translate3d(0, ${(p * 120 * it.depth).toFixed(1)}px, 0) rotateX(${(p * 36 * it.depth).toFixed(2)}deg)`;
    }
    if (track && matchMedia("(min-width: 861px)").matches) {
      const r = pin.getBoundingClientRect(), prog = Math.max(0, Math.min(1, -r.top / (r.height - vh)));
      track.style.transform = `translate3d(${(-prog * (track.scrollWidth - innerWidth)).toFixed(1)}px, 0, 0)`;
      if (bar) bar.style.width = (prog * 100).toFixed(1) + "%";
      const cx = innerWidth / 2;
      for (const c of cards) {
        const b = c.getBoundingClientRect(), off = Math.max(-1.6, Math.min(1.6, (b.left + b.width / 2 - cx) / b.width));
        c.style.transform = `rotateY(${(-off * 22).toFixed(2)}deg) translateZ(${(-Math.abs(off) * 120).toFixed(1)}px) scale(${(1 - Math.abs(off) * 0.05).toFixed(3)})`;
        c.firstElementChild.style.transform = `translate3d(${(off * 40).toFixed(1)}px, 0, 0)`;
      }
    }
  }
  let ticking = false;
  function request() { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; frame(); }); } }
  addEventListener("scroll", request, { passive: true });
  addEventListener("resize", request);

  /* ================================================= maps (Leaflet + bundled world outline) */
  const maps = [], timers = [];
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
      doubleClickZoom: !isStatic, attributionControl: false, zoomSnap: 0.25 }).setView([22, 40], 1.75);
    L.polygon(window.SV_WORLD, { className: "land", weight: 0.6, fillOpacity: 1, interactive: false }).addTo(map);
    map.on("click", () => map.scrollWheelZoom.enable());
    maps.push(map);
    return map;
  }
  const planeIcon = (deg) => L.divIcon({ className: "map-plane", iconSize: [24, 24],
    html: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none" style="transform:rotate(${deg}deg)">${D.icons.plane}</svg>` });
  const dot = (cls) => L.divIcon({ className: "", html: `<div class="airport-dot ${cls}"></div>`, iconSize: [12, 12] });
  function drawRoute(map, a, b, layer) {
    layer.clearLayers(); clearInterval(layer._t);
    const pts = arc(A[a], A[b]);
    L.polyline(pts, { color: "#1560e8", weight: 2.5, dashArray: "6 8", opacity: 0.9 }).addTo(layer);
    const plane = L.marker(pts[0], { icon: planeIcon(0), interactive: false }).addTo(layer);
    let i = 0;
    layer._t = setInterval(() => {
      i = (i + 1) % pts.length;
      const [la, lo] = pts[i], nx = pts[Math.min(i + 1, pts.length - 1)];
      plane.setLatLng([la, lo]); plane.setIcon(planeIcon(Math.atan2(nx[1] - lo, nx[0] - la) * 180 / Math.PI - 45));
    }, 90);
    timers.push(layer._t);
    map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 4 });
  }
  function initMaps() {
    if (typeof L === "undefined") return;
    const routeEl = $("#routeMap");
    if (routeEl) {
      const [o, d] = routeEl.dataset.route.split(","), map = makeMap(routeEl, true);
      drawRoute(map, o, d, L.layerGroup().addTo(map));
      [o, d].forEach((c, k) => L.marker([A[c][3], A[c][4]], { icon: dot(k ? "to" : "from") }).addTo(map)
        .bindTooltip(`${A[c][0]} (${c})`, { permanent: true, direction: k ? "right" : "left" }));
    }
    $$("[data-map]").forEach((el) => {
      const map = makeMap(el, false), info = el.parentElement.querySelector(".map-info");
      const sFrom = $("#mapFrom"), sTo = $("#mapTo"), sDate = $("#mapDate"), sCur = $("#mapCurrency");
      const layer = L.layerGroup().addTo(map), markers = {};
      let from = null, to = null;
      const showQuote = () => {
        const date = sDate ? parseDate(sDate.value) || addDays(today(), 14) : addDays(today(), 14), cur = sCur ? sCur.value : "USD";
        const q = quote(from, to, date, "economy", cur);
        info.innerHTML = `<div class="quote"><div><b>${esc(A[from][0])} (${from}) to ${esc(A[to][0])} (${to})</b><br>
          <span class="muted small">${q.distance_km.toLocaleString()} km · fastest ${q.duration} · ${q.flights} flights on ${dLong(date)}${q.nonstop ? " · non-stop available" : ""}</span></div>
          <div><span class="muted small">from</span> <b class="big">${q.symbol}${Math.round(q.price).toLocaleString()}</b> <span class="muted small">${esc(q.airline)}</span></div>
          <a class="btn" ${link("results", { origin: from, dest: to, depart: iso(date), currency: cur })}>View flights</a></div>`;
        window.svFillSearch?.(`${A[from][0]} (${from})`, `${A[to][0]} (${to})`);
      };
      const refresh = () => {
        Object.entries(markers).forEach(([c, m]) => m.setIcon(dot(c === from ? "from" : c === to ? "to" : "")));
        if (sFrom) sFrom.value = from || ""; if (sTo) sTo.value = to || "";
        if (from && to) { drawRoute(map, from, to, layer); showQuote(); }
        else { layer.clearLayers(); clearInterval(layer._t);
          info.innerHTML = from ? `Departing from <b>${esc(A[from][0])} (${from})</b>. Now choose where you're flying to.`
            : `<span class="muted">Select an airport on the map to choose where you're flying from.</span>`; }
      };
      Object.entries(A).forEach(([c, a]) => {
        markers[c] = L.marker([a[3], a[4]], { icon: dot("") }).addTo(map).bindTooltip(`<b>${esc(a[0])} (${c})</b><br>${esc(a[1])}, ${esc(a[2])}`)
          .on("click", () => { if (!from || (from && to)) { from = c; to = null; } else if (c !== from) to = c; refresh(); });
      });
      sFrom?.addEventListener("change", () => { from = sFrom.value || null; if (from === to) to = null; refresh(); });
      sTo?.addEventListener("change", () => { to = sTo.value || null; if (from === to) from = null; refresh(); });
      $("#mapSwap")?.addEventListener("click", () => { [from, to] = [to, from]; refresh(); });
      [sDate, sCur].forEach((s) => s?.addEventListener("change", () => from && to && showQuote()));
      if (el.dataset.default) [from, to] = el.dataset.default.split(",");
      refresh();
    });
  }

  /* ================================================= render */
  function render() {
    maps.splice(0).forEach((m) => m.remove());
    timers.splice(0).forEach(clearInterval);
    window.svFillSearch = null;
    const view = pages[route.page] || pages.home;
    document.body.classList.toggle("has-hero", HERO_PAGES.includes(route.page));
    $("#app").innerHTML = view(route.params);
    renderNav();
    showFlashes();
    wireSearchForm();
    view.init?.(route.params);
    $$(".pw-toggle").forEach((b) => b.addEventListener("click", () => { const i = b.previousElementSibling; i.type = i.type === "password" ? "text" : "password"; }));
    $$("[data-copy]").forEach((b) => b.addEventListener("click", () => {
      navigator.clipboard?.writeText(b.dataset.copy).then(() => { b.lastChild.textContent = " Copied"; }, () => { b.lastChild.textContent = " Select to copy"; });
    }));
    collectMotion();
    frame();
    initMaps();
  }

  $("#themeToggle").addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("sv-theme", next); } catch (e) { /* ignore */ }
  });

  const start = (location.hash || "").slice(1);
  go(["home", "map", "about", "help", "login", "register", "history", "privacy", "terms"].includes(start) ? start : "home");
})();
