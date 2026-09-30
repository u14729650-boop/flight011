/* SkyVoyage front-end: theme, navigation, scroll motion (parallax, 3-D gallery), live fares, route maps. */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PLANE = '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>';

  /* ------------------------------------------------ theme */
  const themeListeners = [];
  $("#themeToggle")?.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("sv-theme", next); } catch (e) { /* storage blocked */ }
    themeListeners.forEach((fn) => fn(next));
  });

  /* ------------------------------------------------ scroll-driven motion */
  const nav = $("#nav");
  const parallax = $$("[data-parallax]");
  const reveals = $$(".reveal").map((el) => ({ el, depth: parseFloat(el.dataset.depth || "0.12") }));
  const track = $("#galleryTrack"), pin = $("#gallery"), progressBar = $("#galleryProgress");
  const cards = track ? $$(".dest-card", track) : [];
  const galleryActive = () => track && matchMedia("(min-width: 861px)").matches;

  const scenes = $$(".bg .bg-photo");
  const heroWindows = $("#heroWindows"), windowEls = heroWindows ? $$(".window, .window-chip", heroWindows) : [];
  const mouse = { x: 0, y: 0 };
  if (heroWindows && !reduceMotion && matchMedia("(pointer: fine)").matches) {
    addEventListener("mousemove", (e) => { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = e.clientY / innerHeight - 0.5; request(); });
  }
  function frame() {
    const vh = innerHeight, sy = scrollY;
    nav?.classList.toggle("scrolled", sy > 40);

    // site background: the photo glides and zooms as the page scrolls, like flying forward;
    // with several photos they also dissolve into one another
    if (scenes.length) {
      const prog = Math.max(0, Math.min(1, sy / Math.max(1, document.documentElement.scrollHeight - vh)));
      const pos = prog * (scenes.length - 1);
      scenes.forEach((el, i) => {
        const d = pos - i, op = scenes.length > 1 ? Math.max(0, 1 - Math.abs(d)) : 1;
        el.style.opacity = op.toFixed(3);
        if (!reduceMotion && op > 0) {
          const ty = -prog * 14, tx = -prog * 8 + Math.sin(prog * Math.PI * 2) * 2, sc = 1.02 + prog * 0.22;
          el.style.transform = `translate3d(${tx.toFixed(2)}%, ${ty.toFixed(2)}%, 0) scale(${sc.toFixed(3)})`;
        }
      });
    }
    if (reduceMotion) return;

    // hero plane windows: each floats at its own depth as the page scrolls
    if (heroWindows) {
      const r = heroWindows.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) {
        const p = Math.max(-1, Math.min(1.5, -r.top / vh + 0.2));
        for (const w of windowEls) {
          const d = parseFloat(w.dataset.depth), base = w.classList.contains("w1") ? [16, -6] : w.classList.contains("w2") ? [-14, 4] : [0, 0];
          w.style.transform = `translate3d(${(mouse.x * 18 * d).toFixed(1)}px, ${(-p * 120 * d + mouse.y * 14 * d).toFixed(1)}px, 0) ` +
            `rotateY(${(base[0] + mouse.x * 8 - p * 10 * d).toFixed(2)}deg) rotateZ(${(base[1] + p * 4 * d).toFixed(2)}deg) rotateX(${(mouse.y * -6).toFixed(2)}deg)`;
          const photoEl = w.querySelector(".window-photo");
          if (photoEl) photoEl.style.transform = `translate3d(${(-mouse.x * 14).toFixed(1)}px, ${(p * 40).toFixed(1)}px, 0) scale(1.08)`;
        }
      }
    }

    // photo parallax: the image drifts slower than the page
    for (const el of parallax) {
      const host = el.parentElement.getBoundingClientRect();
      if (host.bottom < 0 || host.top > vh) continue;
      const k = parseFloat(el.dataset.parallax);
      el.style.transform = `translate3d(0, ${(-host.top * k).toFixed(1)}px, 0) scale(${(1.06 + Math.max(0, -host.top) / vh * 0.18).toFixed(3)})`;
    }

    // gentle 3-D reveal: panels settle flat as they reach the middle of the screen
    for (const it of reveals) {
      const r = it.el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) continue;
      const p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / vh));
      const d = it.depth;
      if (!it.el.matches(":hover")) {
        it.el.style.transform = `perspective(1200px) translate3d(0, ${(p * 40 * d * 3).toFixed(1)}px, 0) rotateX(${(p * 18 * d * 2).toFixed(2)}deg)`;
      }
    }

    // destination gallery: vertical scroll moves the cards sideways and turns them in 3-D
    if (galleryActive()) {
      const r = pin.getBoundingClientRect();
      const prog = Math.max(0, Math.min(1, -r.top / (r.height - vh)));
      const max = track.scrollWidth - innerWidth;
      track.style.transform = `translate3d(${(-prog * max).toFixed(1)}px, 0, 0)`;
      if (progressBar) progressBar.style.width = (prog * 100).toFixed(1) + "%";
      const cx = innerWidth / 2;
      for (const c of cards) {
        const b = c.getBoundingClientRect();
        const off = Math.max(-1.6, Math.min(1.6, (b.left + b.width / 2 - cx) / b.width));
        c.style.transform = `rotateY(${(-off * 22).toFixed(2)}deg) translateZ(${(-Math.abs(off) * 120).toFixed(1)}px) scale(${(1 - Math.abs(off) * 0.05).toFixed(3)})`;
        c.firstElementChild.style.transform = `translate3d(${(off * 40).toFixed(1)}px, 0, 0)`;
      }
    }
  }
  let ticking = false;
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; frame(); }); } };
  addEventListener("scroll", request, { passive: true });
  addEventListener("resize", request);
  frame();

  // subtle mouse tilt on cards
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

  /* ------------------------------------------------ search form */
  const form = $("#searchForm");
  if (form) {
    const origin = $("#origin", form), dest = $("#dest", form), depart = $("#depart", form), ret = $("#returnDate", form);
    const retField = ret.closest(".field");
    const syncTrip = () => {
      const round = form.querySelector("input[name=trip]:checked").value === "round";
      ret.required = round; ret.disabled = !round;
      retField.toggleAttribute("data-disabled", !round);
    };
    $$("input[name=trip]", form).forEach((r) => r.addEventListener("change", syncTrip));
    syncTrip();
    if (!depart.value) {
      const d = new Date(); d.setDate(d.getDate() + 14);
      depart.value = d.toISOString().slice(0, 10);
    }
    depart.addEventListener("change", () => { ret.min = depart.value; if (ret.value && ret.value < depart.value) ret.value = depart.value; });
    $("#swapBtn", form).addEventListener("click", () => { [origin.value, dest.value] = [dest.value, origin.value]; liveQuote(); });

    const codeOf = (v) => (v.match(/\(([A-Za-z]{3})\)\s*$/) || [null, v.trim()])[1].toUpperCase();
    const out = $("#liveQuote", form);
    async function liveQuote() {
      const o = codeOf(origin.value), d = codeOf(dest.value);
      if (o.length !== 3 || d.length !== 3 || o === d || !depart.value) { out.textContent = ""; return; }
      const params = new URLSearchParams({ from: o, to: d, date: depart.value, cabin: form.cabin.value, currency: form.currency.value });
      try {
        const res = await fetch("/api/quote?" + params);
        if (!res.ok) { out.textContent = ""; return; }
        const q = await res.json();
        out.innerHTML = `${q.flights} flights from ${o} to ${d} · ${q.distance_km.toLocaleString()} km · fastest ${q.duration} · from ` +
          `<b>${q.symbol}${Math.round(q.price).toLocaleString()}</b> with ${q.airline}${q.nonstop ? " · non-stop available" : ""}`;
      } catch (e) { out.textContent = ""; }
    }
    ["change", "input"].forEach((ev) => [origin, dest].forEach((el) => el.addEventListener(ev, liveQuote)));
    [depart, form.cabin, form.currency].forEach((el) => el.addEventListener("change", liveQuote));
    liveQuote();
    window.svFillSearch = (o, d) => { origin.value = o; dest.value = d; liveQuote(); };
  }

  /* ------------------------------------------------ round-trip selection bar */
  const summary = $("#roundSummary");
  if (summary) {
    const update = () => {
      const pick = (n) => {
        const r = document.querySelector(`input[name=${n}]:checked`);
        if (!r) return null;
        const card = r.closest(".flight");
        return `<b>${card.querySelector(".airline strong").textContent}</b> ${card.querySelector(".price").textContent}`;
      };
      const a = pick("out"), b = pick("ret");
      summary.innerHTML = (a ? `Departing: ${a}` : "Choose a departing flight") + " · " + (b ? `Return: ${b}` : "choose a return flight");
    };
    $$("input[name=out], input[name=ret]").forEach((r) => r.addEventListener("change", update));
  }

  /* ------------------------------------------------ booking history filter */
  $$(".history-tabs .chip").forEach((btn) => btn.addEventListener("click", () => {
    $$(".history-tabs .chip").forEach((b) => b.classList.toggle("active", b === btn));
    $$(".booking").forEach((b) => { b.hidden = !(btn.dataset.filter === "All" || b.dataset.state === btn.dataset.filter); });
  }));

  /* ------------------------------------------------ misc */
  $$(".pw-toggle").forEach((b) => b.addEventListener("click", () => {
    const input = b.previousElementSibling;
    input.type = input.type === "password" ? "text" : "password";
  }));
  setTimeout(() => $$(".flash").forEach((f) => f.remove()), 8000);

  /* ------------------------------------------------ route maps (Leaflet) */
  if (typeof L === "undefined") return;
  let airportsPromise;
  const getAirports = () => (airportsPromise ||= fetch("/api/airports").then((r) => r.json()));

  function arc(a, b, n = 64) {
    const rad = Math.PI / 180, xyz = (lat, lon) => [Math.cos(lat * rad) * Math.cos(lon * rad), Math.cos(lat * rad) * Math.sin(lon * rad), Math.sin(lat * rad)];
    const p = xyz(a.lat, a.lon), q = xyz(b.lat, b.lon), w = Math.acos(Math.min(1, p[0] * q[0] + p[1] * q[1] + p[2] * q[2]));
    const pts = []; let prev = null;
    for (let i = 0; i <= n; i++) {
      const t = i / n, s1 = Math.sin((1 - t) * w) / Math.sin(w), s2 = Math.sin(t * w) / Math.sin(w);
      const x = s1 * p[0] + s2 * q[0], y = s1 * p[1] + s2 * q[1], z = s1 * p[2] + s2 * q[2];
      const lat = Math.atan2(z, Math.hypot(x, y)) / rad; let lon = Math.atan2(y, x) / rad;
      if (prev !== null) { while (lon - prev > 180) lon -= 360; while (lon - prev < -180) lon += 360; }
      prev = lon; pts.push([lat, lon]);
    }
    return pts;
  }
  function makeMap(el, isStatic) {
    const map = L.map(el, { worldCopyJump: true, minZoom: 2, zoomControl: !isStatic, scrollWheelZoom: false, dragging: !isStatic,
      doubleClickZoom: !isStatic }).setView([22, 40], 2);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO", subdomains: "abcd", maxZoom: 10,
    }).addTo(map);
    map.on("click", () => map.scrollWheelZoom.enable());
    return map;
  }
  const planeIcon = (deg) => L.divIcon({ className: "map-plane", iconSize: [24, 24],
    html: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none" style="transform:rotate(${deg}deg)">${PLANE}</svg>` });
  const dot = (cls) => L.divIcon({ className: "", html: `<div class="airport-dot ${cls}"></div>`, iconSize: [12, 12] });

  function drawRoute(map, a, b, layer) {
    layer.clearLayers(); clearInterval(layer._timer);
    const pts = arc(a, b);
    L.polyline(pts, { color: "#1560e8", weight: 2.5, dashArray: "6 8", opacity: 0.9 }).addTo(layer);
    const plane = L.marker(pts[0], { icon: planeIcon(0), interactive: false }).addTo(layer);
    let i = 0;
    layer._timer = setInterval(() => {
      i = (i + 1) % pts.length;
      const [lat, lon] = pts[i], nx = pts[Math.min(i + 1, pts.length - 1)];
      // the plane glyph points up-right (45°), so rotate from the path heading
      const heading = Math.atan2(nx[1] - lon, nx[0] - lat) * 180 / Math.PI;
      plane.setLatLng([lat, lon]); plane.setIcon(planeIcon(heading - 45));
    }, 90);
    map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 5 });
  }

  const routeEl = $("#routeMap");
  if (routeEl) {
    const [o, d] = routeEl.dataset.route.split(",");
    const map = makeMap(routeEl, true);
    getAirports().then((list) => {
      const by = Object.fromEntries(list.map((a) => [a.code, a]));
      drawRoute(map, by[o], by[d], L.layerGroup().addTo(map));
      [o, d].forEach((c, k) => L.marker([by[c].lat, by[c].lon], { icon: dot(k ? "to" : "from") }).addTo(map)
        .bindTooltip(`${by[c].city} (${c})`, { permanent: true, direction: k ? "right" : "left" }));
    });
  }

  $$("[data-map]").forEach((el) => {
    const map = makeMap(el, false), info = el.parentElement.querySelector(".map-info");
    const sFrom = $("#mapFrom"), sTo = $("#mapTo"), sDate = $("#mapDate"), sCur = $("#mapCurrency");
    if (sDate) { const d = new Date(); d.setDate(d.getDate() + 14); sDate.value = d.toISOString().slice(0, 10); }
    const layer = L.layerGroup().addTo(map), markers = {};
    let from = null, to = null, by = {};
    function refresh() {
      Object.entries(markers).forEach(([c, m]) => m.setIcon(dot(c === from ? "from" : c === to ? "to" : "")));
      if (sFrom) sFrom.value = from || "";
      if (sTo) sTo.value = to || "";
      if (from && to) { drawRoute(map, by[from], by[to], layer); quote(); }
      else {
        layer.clearLayers(); clearInterval(layer._timer);
        info.innerHTML = from ? `Departing from <b>${by[from].city} (${from})</b>. Now choose where you're flying to.`
          : `<span class="muted">Select an airport on the map to choose where you're flying from.</span>`;
      }
    }
    async function quote() {
      const cur = sCur ? sCur.value : "USD";
      const params = new URLSearchParams({ from, to, date: sDate ? sDate.value : "", currency: cur });
      info.innerHTML = `<span class="muted">Finding the lowest fare…</span>`;
      try {
        const q = await (await fetch("/api/quote?" + params)).json();
        const search = new URLSearchParams({ origin: from, dest: to, depart: q.date, currency: cur });
        info.innerHTML = `<div class="quote"><div><b>${by[from].city} (${from}) to ${by[to].city} (${to})</b><br>
          <span class="muted small">${q.distance_km.toLocaleString()} km · fastest ${q.duration} · ${q.flights} flights on ${q.date}${q.nonstop ? " · non-stop available" : ""}</span></div>
          <div><span class="muted small">from</span> <b class="big">${q.symbol}${Math.round(q.price).toLocaleString()}</b> <span class="muted small">${q.airline}</span></div>
          <a class="btn" href="/search?${search}">View flights</a></div>`;
        window.svFillSearch?.(`${by[from].city} (${from})`, `${by[to].city} (${to})`);
      } catch (e) { info.textContent = "Fares could not be loaded. Please try again."; }
    }
    getAirports().then((list) => {
      by = Object.fromEntries(list.map((a) => [a.code, a]));
      list.forEach((a) => {
        markers[a.code] = L.marker([a.lat, a.lon], { icon: dot("") }).addTo(map)
          .bindTooltip(`<b>${a.city} (${a.code})</b><br>${a.name}, ${a.country}`)
          .on("click", () => { if (!from || (from && to)) { from = a.code; to = null; } else if (a.code !== from) to = a.code; refresh(); });
      });
      if (el.dataset.default) [from, to] = el.dataset.default.split(",");
      refresh();
    });
    sFrom?.addEventListener("change", () => { from = sFrom.value || null; if (from === to) to = null; refresh(); });
    sTo?.addEventListener("change", () => { to = sTo.value || null; if (from === to) from = null; refresh(); });
    $("#mapSwap")?.addEventListener("click", () => { [from, to] = [to, from]; refresh(); });
    [sDate, sCur].forEach((s) => s?.addEventListener("change", () => from && to && quote()));
    themeListeners.push(() => map.invalidateSize());
  });
})();
