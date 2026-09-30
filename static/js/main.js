/* SkyVoyage front-end: theme toggle, 3-D scroll effects, live fares, world map. */
(function () {
  "use strict";
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------ dark / light mode */
  const themeListeners = [];
  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("sv-theme", theme); } catch (e) { /* storage may be blocked */ }
    themeListeners.forEach((fn) => fn(theme));
  }
  $("#themeToggle")?.addEventListener("click", () =>
    setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));

  /* ------------------------------------------------ 3-D scroll + mouse tilt */
  const items = $$(".scroll-3d, .tilt").map((el) => ({
    el, scroll: el.classList.contains("scroll-3d"), depth: parseFloat(el.dataset.depth || "0.4"), tx: 0, ty: 0,
  }));

  function render3d() {
    const vh = innerHeight;
    for (const it of items) {
      let t = "perspective(1100px)";
      let opacity = 1;
      if (it.scroll && !reduceMotion) {
        const r = it.el.getBoundingClientRect();
        // -1 (element above centre) .. 0 (centred) .. 1 (below centre)
        const p = Math.max(-1.3, Math.min(1.3, (r.top + r.height / 2 - vh / 2) / vh));
        const d = it.depth;
        t += ` translate3d(0, ${p * 60 * d}px, ${-Math.abs(p) * 260 * d}px) rotateX(${p * 32 * d}deg) rotateY(${p * -10 * d}deg)`;
        opacity = 1 - Math.max(0, Math.abs(p) - 0.75) * 1.6;
      }
      if (it.tx || it.ty) t += ` rotateX(${it.tx}deg) rotateY(${it.ty}deg)`;
      it.el.style.transform = t;
      it.el.style.opacity = Math.max(0.15, opacity);
    }
    renderRing();
  }

  let ticking = false;
  function requestRender() {
    if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; render3d(); }); }
  }
  addEventListener("scroll", requestRender, { passive: true });
  addEventListener("resize", requestRender);

  if (!reduceMotion && matchMedia("(pointer: fine)").matches) {
    items.filter((it) => it.el.classList.contains("tilt")).forEach((it) => {
      it.el.addEventListener("mousemove", (e) => {
        const r = it.el.getBoundingClientRect();
        it.ty = ((e.clientX - r.left) / r.width - 0.5) * 10;
        it.tx = -((e.clientY - r.top) / r.height - 0.5) * 10;
        requestRender();
      });
      it.el.addEventListener("mouseleave", () => { it.tx = it.ty = 0; requestRender(); });
    });
  }

  /* ------------------------------------------------ 3-D destination ring (spins with scroll) */
  const ring = $("#ring"), ringSection = $("#ringSection");
  let ringAuto = 0;
  function renderRing() {
    if (!ring) return;
    const r = ringSection.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, -r.top / (r.height - innerHeight)));
    ring.style.transform = `rotateX(-8deg) rotateY(${-progress * 360 - ringAuto}deg)`;
  }
  if (ring && !reduceMotion) {
    (function spin() { ringAuto += 0.04; renderRing(); requestAnimationFrame(spin); })();
  }
  render3d();

  /* ------------------------------------------------ search form */
  const form = $("#searchForm");
  if (form) {
    const origin = $("#origin", form), dest = $("#dest", form), depart = $("#depart", form), ret = $("#returnDate", form);
    const syncTrip = () => {
      const trip = form.querySelector("input[name=trip]:checked").value;
      form.dataset.trip = trip;
      ret.required = trip === "round";
      ret.disabled = trip !== "round";
    };
    $$("input[name=trip]", form).forEach((r) => r.addEventListener("change", syncTrip));
    syncTrip();
    if (!depart.value) {
      const d = new Date(); d.setDate(d.getDate() + 14);
      depart.value = d.toISOString().slice(0, 10);
    }
    depart.addEventListener("change", () => {
      ret.min = depart.value;
      if (ret.value && ret.value < depart.value) ret.value = depart.value;
    });
    $("#swapBtn", form).addEventListener("click", () => {
      [origin.value, dest.value] = [dest.value, origin.value];
      liveQuote();
    });

    const codeOf = (v) => (v.match(/\(([A-Za-z]{3})\)\s*$/) || [null, v.trim()])[1].toUpperCase();
    const out = $("#liveQuote", form);
    async function liveQuote() {
      const o = codeOf(origin.value), d = codeOf(dest.value);
      if (o.length !== 3 || d.length !== 3 || o === d || !depart.value) { out.textContent = ""; return; }
      const params = new URLSearchParams({ from: o, to: d, date: depart.value,
        cabin: form.cabin.value, currency: form.currency.value });
      try {
        const res = await fetch("/api/quote?" + params);
        if (!res.ok) { out.textContent = ""; return; }
        const q = await res.json();
        out.innerHTML = `✈ ${q.flights} flights ${o} → ${d} · ${q.distance_km.toLocaleString()} km · from ` +
          `<b class="grad-text">${q.symbol}${Math.round(q.price).toLocaleString()}</b> on ${q.airline}` +
          `${q.nonstop ? " · non-stop available" : ""}`;
      } catch (e) { out.textContent = ""; }
    }
    ["change", "input"].forEach((ev) => [origin, dest].forEach((el) => el.addEventListener(ev, liveQuote)));
    [depart, form.cabin, form.currency].forEach((el) => el.addEventListener("change", liveQuote));
    liveQuote();
    window.svFillSearch = (o, d) => { origin.value = o; dest.value = d; liveQuote(); };
  }

  /* ------------------------------------------------ round-trip selection bar */
  const roundForm = $("#roundForm");
  if (roundForm) {
    const summary = $("#roundSummary");
    const update = () => {
      const picked = ["out", "ret"].map((n) => document.querySelector(`input[name=${n}]:checked`));
      const labels = picked.map((p) => p ? p.closest(".flight").querySelector(".airline strong").textContent + " " +
        p.closest(".flight").querySelector(".airline .small").textContent.split("·")[0].trim() : null);
      const prices = picked.map((p) => p ? p.closest(".flight").querySelector(".price").textContent : null);
      summary.innerHTML = (labels[0] ? `Departing: <b>${labels[0]}</b> ${prices[0]}` : "Pick a departing flight") +
        " · " + (labels[1] ? `Return: <b>${labels[1]}</b> ${prices[1]}` : "pick a return flight");
    };
    $$("input[name=out], input[name=ret]").forEach((r) => r.addEventListener("change", update));
  }

  /* ------------------------------------------------ booking history filter */
  $$(".history-tabs .chip").forEach((btn) => btn.addEventListener("click", () => {
    $$(".history-tabs .chip").forEach((b) => b.classList.toggle("active", b === btn));
    $$(".booking").forEach((b) => {
      b.style.display = btn.dataset.filter === "All" || b.dataset.state === btn.dataset.filter ? "" : "none";
    });
    requestRender();
  }));

  /* ------------------------------------------------ misc */
  $$(".pw-toggle").forEach((b) => b.addEventListener("click", () => {
    const input = b.previousElementSibling;
    input.type = input.type === "password" ? "text" : "password";
  }));
  setTimeout(() => $$(".flash").forEach((f) => f.remove()), 7000);

  const counterObs = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    counterObs.unobserve(e.target);
    const to = +e.target.dataset.to, start = performance.now();
    (function step(now) {
      const k = Math.min(1, (now - start) / 1600);
      e.target.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))).toLocaleString() + (k === 1 && to > 1000 ? "+" : "");
      if (k < 1) requestAnimationFrame(step);
    })(start);
  }));
  $$(".counter").forEach((c) => counterObs.observe(c));

  /* ------------------------------------------------ world map (Leaflet) */
  if (typeof L === "undefined") return;
  let airportsPromise;
  const getAirports = () => (airportsPromise ||= fetch("/api/airports").then((r) => r.json()));

  // Great-circle points between two airports, unwrapped so lines don't jump across the map
  function arc(a, b, n = 64) {
    const rad = Math.PI / 180, toXYZ = (lat, lon) =>
      [Math.cos(lat * rad) * Math.cos(lon * rad), Math.cos(lat * rad) * Math.sin(lon * rad), Math.sin(lat * rad)];
    const p = toXYZ(a.lat, a.lon), q = toXYZ(b.lat, b.lon);
    const w = Math.acos(Math.min(1, p[0] * q[0] + p[1] * q[1] + p[2] * q[2]));
    const pts = [];
    let prevLon = null;
    for (let i = 0; i <= n; i++) {
      const t = i / n, s1 = Math.sin((1 - t) * w) / Math.sin(w), s2 = Math.sin(t * w) / Math.sin(w);
      const x = s1 * p[0] + s2 * q[0], y = s1 * p[1] + s2 * q[1], z = s1 * p[2] + s2 * q[2];
      let lat = Math.atan2(z, Math.hypot(x, y)) / rad, lon = Math.atan2(y, x) / rad;
      if (prevLon !== null) { while (lon - prevLon > 180) lon -= 360; while (lon - prevLon < -180) lon += 360; }
      prevLon = lon;
      pts.push([lat, lon]);
    }
    return pts;
  }

  function makeMap(el, opts = {}) {
    const map = L.map(el, { worldCopyJump: true, minZoom: 2, zoomControl: !opts.static, scrollWheelZoom: false,
      dragging: !opts.static, attributionControl: true }).setView([22, 40], 2);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OpenStreetMap &copy; CARTO", subdomains: "abcd", maxZoom: 10,
    }).addTo(map);
    map.on("click", () => map.scrollWheelZoom.enable());
    return map;
  }

  const planeIcon = (angle) => L.divIcon({
    className: "map-plane", iconSize: [28, 28],
    html: `<svg viewBox="0 0 64 64" style="transform: rotate(${angle}deg)"><use href="#plane-icon"/></svg>`,
  });

  function drawRoute(map, a, b, layer) {
    layer.clearLayers();
    const pts = arc(a, b);
    L.polyline(pts, { color: "#7c3aed", weight: 3, dashArray: "8 8", opacity: 0.9 }).addTo(layer);
    const plane = L.marker(pts[0], { icon: planeIcon(0), interactive: false }).addTo(layer);
    let i = 0;
    clearInterval(layer._timer);
    layer._timer = setInterval(() => {
      i = (i + 1) % pts.length;
      const [lat, lon] = pts[i], nxt = pts[Math.min(i + 1, pts.length - 1)];
      const angle = Math.atan2(-(nxt[0] - lat), nxt[1] - lon) * 180 / Math.PI;
      plane.setLatLng([lat, lon]);
      plane.setIcon(planeIcon(angle));
    }, 90);
    map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 5 });
  }

  // compact route map on the results page
  const routeEl = $("#routeMap");
  if (routeEl) {
    const [o, d] = routeEl.dataset.route.split(",");
    const map = makeMap(routeEl, { static: true });
    getAirports().then((list) => {
      const byCode = Object.fromEntries(list.map((a) => [a.code, a]));
      const layer = L.layerGroup().addTo(map);
      drawRoute(map, byCode[o], byCode[d], layer);
      [o, d].forEach((c, k) => L.marker([byCode[c].lat, byCode[c].lon], {
        icon: L.divIcon({ className: "", html: `<div class="airport-dot ${k ? "to" : "from"}"></div>`, iconSize: [14, 14] }),
      }).addTo(map).bindTooltip(`${byCode[c].city} (${c})`, { permanent: true, direction: k ? "right" : "left" }));
    });
  }

  // interactive picker maps (home + world map page)
  $$("[data-map]").forEach((el) => {
    const map = makeMap(el);
    const info = el.parentElement.querySelector(".map-info");
    const selFrom = $("#mapFrom"), selTo = $("#mapTo"), selDate = $("#mapDate"), selCur = $("#mapCurrency");
    if (selDate) { const d = new Date(); d.setDate(d.getDate() + 14); selDate.value = d.toISOString().slice(0, 10); }
    const routeLayer = L.layerGroup().addTo(map);
    const markers = {};
    let from = null, to = null, byCode = {};

    const dot = (cls) => L.divIcon({ className: "", html: `<div class="airport-dot ${cls}"></div>`, iconSize: [14, 14] });
    function refresh() {
      Object.entries(markers).forEach(([c, m]) => m.setIcon(dot(c === from ? "from" : c === to ? "to" : "")));
      if (selFrom) selFrom.value = from || "";
      if (selTo) selTo.value = to || "";
      if (from && to) {
        drawRoute(map, byCode[from], byCode[to], routeLayer);
        quote();
      } else {
        routeLayer.clearLayers(); clearInterval(routeLayer._timer);
        info.innerHTML = from ? `From <b>${byCode[from].city} (${from})</b> — now pick a destination.` :
          "Click an airport to choose where you fly from.";
      }
    }
    async function quote() {
      const date = selDate ? selDate.value : "";
      const params = new URLSearchParams({ from, to, date, currency: selCur ? selCur.value : "USD" });
      info.innerHTML = "Finding the best fare…";
      try {
        const q = await (await fetch("/api/quote?" + params)).json();
        const search = new URLSearchParams({ origin: from, dest: to, depart: q.date, currency: selCur ? selCur.value : "USD" });
        info.innerHTML = `<div class="quote"><div><b>${byCode[from].city} (${from}) → ${byCode[to].city} (${to})</b><br>
          <span class="muted small">${q.distance_km.toLocaleString()} km · ${q.duration} fastest · ${q.flights} flights on ${q.date}
          ${q.nonstop ? "· non-stop available" : ""}</span></div>
          <div>from <b class="big">${q.symbol}${Math.round(q.price).toLocaleString()}</b> <span class="muted small">${q.airline}</span></div>
          <a class="btn" href="/search?${search}">Search flights →</a></div>`;
        window.svFillSearch?.(`${byCode[from].city} (${from})`, `${byCode[to].city} (${to})`);
      } catch (e) { info.textContent = "Could not load fares."; }
    }

    getAirports().then((list) => {
      byCode = Object.fromEntries(list.map((a) => [a.code, a]));
      list.forEach((a) => {
        markers[a.code] = L.marker([a.lat, a.lon], { icon: dot("") }).addTo(map)
          .bindTooltip(`<b>${a.city} (${a.code})</b><br>${a.name}, ${a.country}`)
          .on("click", () => {
            if (!from || (from && to)) { from = a.code; to = null; }
            else if (a.code !== from) { to = a.code; }
            refresh();
          });
      });
      refresh();
    });
    selFrom?.addEventListener("change", () => { from = selFrom.value || null; if (from === to) to = null; refresh(); });
    selTo?.addEventListener("change", () => { to = selTo.value || null; if (from === to) from = null; refresh(); });
    $("#mapSwap")?.addEventListener("click", () => { [from, to] = [to, from]; refresh(); });
    [selDate, selCur].forEach((s) => s?.addEventListener("change", () => from && to && quote()));
    themeListeners.push(() => map.invalidateSize());
  });
})();
