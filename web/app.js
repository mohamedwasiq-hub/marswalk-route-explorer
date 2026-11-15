/* AI-assisted: written with an AI coding assistant (Claude), directed and reviewed by the team. NASA Space Apps 2026 SI disclosure. */
/* MarsWalk Route Explorer — front end.
 * Map coordinates are ground metres: x east, y south from the clip's top-left corner.
 * Leaflet CRS.Simple uses [lat, lng] = [-y, x].
 */
(async function () {
  "use strict";

  const COLORS = { A: getCss("--A"), B: getCss("--B"), C: getCss("--C") };
  const SLOPE_CLASSES = [ // matches prep/build.py slope_rgba
    { max: 5, color: "transparent", label: "0–5°" },
    { max: 10, color: "#ffeda0", label: "5–10°" },
    { max: 15, color: "#feb24c", label: "10–15°" },
    { max: 20, color: "#f03b20", label: "15–20°" },
    { max: 25, color: "#bd0026", label: "20–25°" },
    { max: 999, color: "#50005a", label: "over 25°" },
  ];
  const WEIGHT_LABELS = { slope: "Gentle terrain", length: "Shorter distance", coverage: "Data coverage" };
  const SHORT = { A: "Straight line", B: "Computer search, avoids steep ground", C: "Drawn by you" };

  const need = (url, as) => fetch(url).then(r => { if (!r.ok) throw new Error(url + " " + r.status); return r[as](); });
  const optional = url => fetch(url).then(r => (r.ok ? r.json() : null)).catch(() => null);
  const [meta, baseRoutes, elevBuf, slopeBuf, sens, places] = await Promise.all([
    need("data/meta.json", "json"),
    need("data/routes.json", "json"),
    need("data/elev3.bin", "arrayBuffer"),
    need("data/slope3.bin", "arrayBuffer"),
    optional("data/sensitivity.json"),
    optional("data/places.json"),
  ]);
  const G = meta.grid3;
  const elev = new Int16Array(elevBuf);    // cm above G.zbase, -32768 = no data
  const slope = new Uint16Array(slopeBuf); // 0.01 deg, 65535 = no data
  const P = meta.params;
  const W = meta.width_m, H = meta.height_m;

  const routes = baseRoutes.slice();
  const byId = () => Object.fromEntries(routes.map(r => [r.id, r]));

  const state = {
    weights: { ...P.default_weights },
    selected: "B",
    segment: null,            // {route, index}
    draw: { active: false, pts: [] },
    view: "site",             // "site" | "mars"
  };
  const DIAMOND = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1l5 5-5 5-5-5z"/></svg>';

  // ================================================================ scoring (port of prep/method.py)
  const elevAt = i => (elev[i] === -32768 ? NaN : G.zbase + elev[i] / 100);
  const slopeAt = i => (slope[i] === 65535 ? NaN : slope[i] / 100);
  function bilinear(get, y, x) {
    if (!(y >= 0 && x >= 0 && y <= G.rows - 1 && x <= G.cols - 1)) return NaN;
    const y0 = Math.min(Math.max(Math.floor(y), 0), G.rows - 2), x0 = Math.min(Math.max(Math.floor(x), 0), G.cols - 2);
    const fy = y - y0, fx = x - x0, i = y0 * G.cols + x0;
    return get(i) * (1 - fy) * (1 - fx) + get(i + 1) * (1 - fy) * fx + get(i + G.cols) * fy * (1 - fx) + get(i + G.cols + 1) * fy * fx;
  }
  function resample(pts, step) {
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const total = cum[cum.length - 1];
    const n = Math.max(Math.floor(total / step), 1);
    const s = [];
    for (let k = 0; k <= n; k++) s.push(k * step);
    if (n * step < total) s.push(total); else s[s.length - 1] = Math.min(s[s.length - 1], total);
    const out = [];
    let j = 0;
    for (const d of s) {
      while (j < cum.length - 2 && cum[j + 1] < d) j++;
      const span = cum[j + 1] - cum[j] || 1, t = Math.min(Math.max((d - cum[j]) / span, 0), 1);
      out.push([pts[j][0] + (pts[j + 1][0] - pts[j][0]) * t, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * t]);
    }
    return { xy: out, s };
  }
  const nn = v => (Number.isNaN(v) ? null : v);
  function scoreRoute(id, name, how, vertices) {
    const { xy, s } = resample(vertices, P.sample_step_m);
    const z = xy.map(([x, y]) => bilinear(elevAt, y / G.cell_dy_m, x / G.cell_dx_m));
    const sl = xy.map(([x, y]) => bilinear(slopeAt, y / G.cell_dy_m, x / G.cell_dx_m));
    const valid = z.map((v, i) => !Number.isNaN(v) && !Number.isNaN(sl[i]));
    const vs = sl.filter((_, i) => valid[i]);
    let ascent = 0, descent = 0;
    for (let i = 1; i < z.length; i++) { const dz = z[i] - z[i - 1]; if (dz > 0) ascent += dz; else if (dz < 0) descent -= dz; }
    const length = s[s.length - 1], straight = meta.straight_m;
    const mean = a => (a.length ? a.reduce((p, c) => p + c, 0) / a.length : NaN);
    const cov = valid.filter(Boolean).length / valid.length;
    const summary = {
      length_m: length, straight_m: straight, detour_pct: 100 * (length - straight) / straight,
      ascent_m: ascent, descent_m: descent,
      max_slope_deg: vs.length ? Math.max(...vs) : NaN, mean_slope_deg: mean(vs),
      steep_share_pct: vs.length ? 100 * vs.filter(v => v > P.steep_flag_deg).length / vs.length : NaN,
      coverage_pct: 100 * cov, n_samples: valid.length,
    };
    const components = {
      S: vs.length ? mean(vs.map(v => Math.min(v / P.slope_ref_deg, 1))) : 1,
      L: Math.min(Math.max((length - straight) / straight, 0), 1),
      C: 1 - cov,
    };
    const segments = [];
    for (let e0 = 0; e0 < length; e0 += P.segment_m) {
      const e1 = Math.min(e0 + P.segment_m, length);
      const idx = [];
      s.forEach((d, i) => { if (d >= e0 && d <= e1) idx.push(i); });
      if (idx.length < 2) continue;
      const v = idx.filter(i => valid[i]).map(i => sl[i]);
      segments.push({
        i: segments.length, from_m: s[idx[0]], to_m: s[idx[idx.length - 1]], i0: idx[0], i1: idx[idx.length - 1],
        elev_start: nn(z[idx[0]]), elev_end: nn(z[idx[idx.length - 1]]),
        max_slope: v.length ? Math.max(...v) : null, mean_slope: v.length ? mean(v) : null,
        burden: v.length ? mean(v.map(x => Math.min(x / P.slope_ref_deg, 1))) : null,
        coverage_pct: 100 * idx.filter(i => valid[i]).length / idx.length,
      });
    }
    return {
      id, name, how, vertices_m: vertices, summary, components, segments,
      samples: { chainage: s, x: xy.map(p => p[0]), y: xy.map(p => p[1]), elev: z.map(nn), slope: sl.map(nn), valid },
    };
  }
  function tdiOf(r, w = state.weights) {
    const tot = w.slope + w.length + w.coverage, c = r.components;
    if (tot <= 0) return 100 * (c.S + c.L + c.C) / 3;
    return 100 * (w.slope * c.S + w.length * c.L + w.coverage * c.C) / tot;
  }

  // ================================================================ map
  const toLL = (x, y) => [-y, x];
  const bounds = [[-H, 0], [0, W]];
  const map = L.map("map", {
    crs: L.CRS.Simple, minZoom: -4, maxZoom: 2, zoomSnap: 0.25, zoomDelta: 0.5,
    attributionControl: false, zoomControl: false, maxBounds: [[-H * 1.3, -W * 0.3], [H * 0.3, W * 1.3]],
  });
  L.control.zoom({ position: "topright" }).addTo(map);
  // On a narrow map the floating panels would cover the terrain, so start them collapsed;
  // on a wide map, leave room for the layers panel on the left.
  const fit = () => {
    map.invalidateSize();
    const wide = map.getSize().x >= 720;
    map.fitBounds(bounds, wide ? { paddingTopLeft: [280, 10], paddingBottomRight: [10, 10] } : { padding: [10, 10] });
  };
  if (document.getElementById("map").clientWidth < 720) {
    document.getElementById("layers").open = false;
    document.getElementById("legend-box").open = false;
  }
  fit();
  requestAnimationFrame(fit);
  new ResizeObserver(() => map.invalidateSize()).observe(document.getElementById("map"));

  const bases = {
    ortho: L.imageOverlay("data/ortho.jpg", bounds),
    hillshade: L.imageOverlay("data/hillshade.jpg", bounds),
    elevation: L.imageOverlay("data/elevation.jpg", bounds),
  };
  bases.ortho.addTo(map);
  const slopeLayer = L.imageOverlay("data/slope.png", bounds, { opacity: 0.75 }).addTo(map);

  const routeLayers = {};
  function addRouteLayer(r) {
    if (routeLayers[r.id]) map.removeLayer(routeLayers[r.id]);
    const ll = r.vertices_m.map(([x, y]) => toLL(x, y));
    const casing = L.polyline(ll, { color: "#0b0d12", weight: 8, opacity: 0.85, interactive: false });
    const line = L.polyline(ll, { color: COLORS[r.id], weight: 4, opacity: 1 });
    const hit = L.polyline(ll, { color: "#000", weight: 18, opacity: 0.001 }); // easy clicking
    hit.on("click", e => { if (!state.draw.active) onRouteClick(r.id, e.latlng); });
    hit.on("mouseover", () => line.setStyle({ weight: 6 }));
    hit.on("mouseout", () => line.setStyle({ weight: state.selected === r.id ? 5 : 4 }));
    routeLayers[r.id] = L.layerGroup([casing, line, hit]).addTo(map);
    routeLayers[r.id].line = line;
  }
  routes.forEach(addRouteLayer);
  const segHighlight = L.polyline([], { color: "#fff", weight: 9, opacity: 0.95, interactive: false }).addTo(map);
  const hoverDot = L.circleMarker([0, 0], { radius: 7, color: "#fff", weight: 3, fillColor: "#ff7a45", fillOpacity: 1, interactive: false });

  for (const [key, color] of [["start", "#ffffff"], ["goal", "#ffd84a"]]) {
    const p = meta[key];
    L.marker(toLL(p.x, p.y), {
      icon: L.divIcon({ className: "", html: `<div class="pin" style="color:${color}"></div>`, iconSize: [16, 16], iconAnchor: [8, 8] }),
      keyboard: false, interactive: false,
    }).addTo(map).bindTooltip(p.label, { permanent: true, direction: key === "start" ? "right" : "left", offset: [10, 0], className: "pin-label" });
  }

  // ---- science stops
  function closestApproach(r, sx, sy) {
    let best = Infinity;
    const s = r.samples;
    for (let i = 0; i < s.x.length; i++) best = Math.min(best, Math.hypot(s.x[i] - sx, s.y[i] - sy));
    return best;
  }
  function stopPopup(st) {
    const near = routes.map(r => `Route ${r.id}: ${Math.round(closestApproach(r, st.x, st.y))} m`).join(" · ");
    return `<div class="stop-pop"><span class="kind">${st.kind}</span><h3>${st.name}</h3><p>${st.text}</p>
      <p class="near"><b>Closest approach</b><br>${near}</p>
      <p class="src">Source: <a href="${st.url}" target="_blank" rel="noopener">${st.source}</a></p></div>`;
  }
  const stopsLayer = L.layerGroup((meta.stops || []).map(st => {
    const m = L.marker(toLL(st.x, st.y), {
      icon: L.divIcon({ className: "", html: `<div class="stop">${DIAMOND}</div>`, iconSize: [22, 22], iconAnchor: [11, 11] }),
      title: st.name,
    });
    m.bindPopup(() => stopPopup(st), { maxWidth: 280 });
    return m;
  })).addTo(map);

  // ---- layer controls
  document.querySelectorAll('input[name="base"]').forEach(inp => inp.addEventListener("change", () => {
    for (const [k, lyr] of Object.entries(bases)) {
      if (k === inp.value) { lyr.addTo(map); lyr.bringToBack(); } else map.removeLayer(lyr);
    }
    renderLegend();
  }));
  const slopeToggle = document.getElementById("tgl-slope");
  slopeToggle.addEventListener("change", () => { slopeToggle.checked ? slopeLayer.addTo(map) : map.removeLayer(slopeLayer); renderLegend(); });
  document.getElementById("slope-op").addEventListener("input", e => slopeLayer.setOpacity(e.target.value / 100));
  document.getElementById("tgl-stops").addEventListener("change", e => { e.target.checked ? stopsLayer.addTo(map) : map.removeLayer(stopsLayer); renderLegend(); });
  for (const id of ["A", "B", "C"]) {
    document.getElementById("tgl-" + id).addEventListener("change", e => {
      if (!routeLayers[id]) return;
      e.target.checked ? routeLayers[id].addTo(map) : map.removeLayer(routeLayers[id]);
    });
  }

  // ================================================================ readout + scale + legend
  const readout = document.getElementById("readout");
  function latLon(x, y) {
    const p = meta.proj;
    const row = p.row0 + y / p.dy_full, col = p.col0 + x / p.dx_full;
    return {
      lat: (p.line_offset - row) / p.map_resolution,
      lon: p.center_lon + (col - p.sample_offset) / (p.map_resolution * Math.cos(p.center_lat * Math.PI / 180)),
    };
  }
  map.on("mousemove", e => {
    const x = e.latlng.lng, y = -e.latlng.lat;
    if (x < 0 || y < 0 || x > W || y > H) { readout.textContent = "Outside study area"; return; }
    const z = bilinear(elevAt, y / G.cell_dy_m, x / G.cell_dx_m), s = bilinear(slopeAt, y / G.cell_dy_m, x / G.cell_dx_m);
    const { lat, lon } = latLon(x, y);
    readout.innerHTML = `<b>${lat.toFixed(5)}°N ${lon.toFixed(5)}°E</b>&ensp;·&ensp;` +
      `Elevation <b>${Number.isNaN(z) ? "no data" : z.toFixed(1) + " m"}</b> · Slope <b>${Number.isNaN(s) ? "–" : s.toFixed(1) + "°"}</b>`;
  });
  map.on("mouseout", () => { readout.textContent = "Move over the map"; });

  const scalebar = document.getElementById("scalebar");
  function updateScale() {
    const pxPerM = (map.latLngToContainerPoint([0, 1000]).x - map.latLngToContainerPoint([0, 0]).x) / 1000;
    const target = 110 / pxPerM;
    const nice = [10, 20, 50, 100, 200, 250, 500, 1000, 2000, 5000].reduce((a, b) => (Math.abs(b - target) < Math.abs(a - target) ? b : a));
    scalebar.querySelector(".bar").style.width = nice * pxPerM + "px";
    scalebar.querySelector("span").textContent = nice >= 1000 ? nice / 1000 + " km" : nice + " m";
  }
  map.on("zoomend resize", updateScale);
  updateScale();

  function renderLegend() {
    const base = document.querySelector('input[name="base"]:checked').value;
    let html = "";
    if (slopeToggle.checked) {
      html += `<h3>Terrain slope</h3>` + SLOPE_CLASSES.map(c =>
        `<div class="row"><span class="chip" style="background:${c.color === "transparent" ? "none" : c.color}"></span>${c.label}</div>`).join("");
    }
    if (base === "elevation") {
      const [lo, hi] = meta.elev_legend_m;
      html += `<h3>Elevation (m, Mars 2000 datum)</h3><div class="ramp"></div><div class="ends"><span>${lo.toFixed(0)}</span><span>${hi.toFixed(0)}</span></div>`;
    }
    html += `<h3>Markers</h3><div class="row"><span class="chip dot" style="background:#fff"></span>Start</div><div class="row"><span class="chip dot" style="background:#ffd84a"></span>Destination</div>`;
    if (document.getElementById("tgl-stops").checked) html += `<div class="row"><span class="dia">${DIAMOND}</span>Science stop</div>`;
    document.getElementById("legend").innerHTML = html;
  }
  renderLegend();

  // ================================================================ route cards
  const fmtKm = m => (m / 1000).toFixed(2) + " km";
  const ROWS = [
    ["Length", r => fmtKm(r.summary.length_m), r => r.summary.length_m],
    ["Extra vs direct", r => "+" + r.summary.detour_pct.toFixed(0) + "%", r => r.summary.detour_pct],
    ["Total climb", r => r.summary.ascent_m.toFixed(0) + " m", r => r.summary.ascent_m],
    ["Steepest point", r => r.summary.max_slope_deg.toFixed(1) + "°", r => r.summary.max_slope_deg],
    ["Average slope", r => r.summary.mean_slope_deg.toFixed(1) + "°", r => r.summary.mean_slope_deg],
    ["Over 15° slope", r => r.summary.steep_share_pct.toFixed(1) + "%", r => r.summary.steep_share_pct],
    ["Data coverage", r => r.summary.coverage_pct.toFixed(0) + "%", r => -r.summary.coverage_pct],
  ];
  const TITLE = { A: "Direct", B: "Terrain-aware", C: "Yours" };
  function renderCards() {
    // One comparison table: a column per route, a row per measurement.
    const scores = routes.map(r => tdiOf(r));
    const min = Math.min(...scores);
    const nBest = scores.filter(v => Math.abs(v - min) < 0.05).length;
    const head = routes.map((r, i) => {
      const lowest = Math.abs(scores[i] - min) < 0.05 && nBest === 1;
      return `<th scope="col"><button class="colbtn" data-route="${r.id}" aria-pressed="${state.selected === r.id}" style="--rc:${COLORS[r.id]}" title="${SHORT[r.id]}">
        <span class="rid"><i></i><span class="rword">Route&nbsp;</span>${r.id}</span><span class="rname">${TITLE[r.id]}</span>
        <span class="tdi">${scores[i].toFixed(1)}</span><span class="tdi-l">TDI</span>
        <span class="lowest">${lowest ? "lowest" : ""}</span></button></th>`;
    }).join("");
    const body = ROWS.map(([label, fmt, val]) => {
      const vals = routes.map(val), lo = Math.min(...vals), differs = vals.some(v => v !== lo);
      return `<tr><th scope="row">${label}</th>${routes.map((r, i) =>
        `<td class="${state.selected === r.id ? "sel " : ""}${differs && vals[i] === lo ? "best" : ""}">${fmt(r)}</td>`).join("")}</tr>`;
    }).join("");
    document.getElementById("route-cards").innerHTML =
      `<table class="cmp${routes.length > 2 ? " three" : ""}"><caption hidden>Route comparison</caption><colgroup><col class="metric">${routes.map(() => "<col>").join("")}</colgroup>
       <thead><tr><td></td>${head}</tr></thead><tbody>${body}</tbody></table>`;
    document.querySelectorAll(".colbtn").forEach(el => el.addEventListener("click", () => selectRoute(el.dataset.route)));
    document.getElementById("trip").textContent = `direct ${fmtKm(meta.straight_m)}`;
  }

  // ================================================================ weights
  function renderWeights() {
    const box = document.getElementById("weights");
    box.innerHTML = Object.keys(WEIGHT_LABELS).map(k =>
      `<label>${WEIGHT_LABELS[k]}<input type="range" min="0" max="100" value="${Math.round(state.weights[k] * 100)}" data-w="${k}"><output>${Math.round(state.weights[k] * 100)}</output></label>`).join("");
    box.querySelectorAll("input").forEach(inp => inp.addEventListener("input", () => {
      state.weights[inp.dataset.w] = inp.value / 100;
      inp.nextElementSibling.textContent = inp.value;
      renderCards(); renderBriefing();
    }));
  }
  document.getElementById("reset-w").addEventListener("click", () => {
    state.weights = { ...P.default_weights }; renderWeights(); renderCards(); renderBriefing();
  });

  // ================================================================ selection
  function renderTabs() {
    const box = document.getElementById("profile-tabs");
    box.innerHTML = routes.map(r => `<button role="tab" data-route="${r.id}" aria-selected="${r.id === state.selected}">${r.id}</button>`).join("");
    box.querySelectorAll("button").forEach(b => b.addEventListener("click", () => selectRoute(b.dataset.route)));
  }
  function selectRoute(id) {
    if (!byId()[id]) id = "B";
    state.selected = id;
    for (const r of routes) routeLayers[r.id].line.setStyle({ weight: r.id === id ? 5 : 4, opacity: r.id === id ? 1 : 0.6 });
    if (state.segment && state.segment.route !== id) clearSegment();
    renderTabs(); renderCards(); drawProfile(); renderHardest(); renderBriefing();
  }
  function onRouteClick(id, latlng) {
    if (state.selected !== id) selectRoute(id);
    const r = byId()[id], s = r.samples;
    const x = latlng.lng, y = -latlng.lat;
    let bi = 0, bd = Infinity;
    for (let i = 0; i < s.x.length; i++) {
      const d = (s.x[i] - x) ** 2 + (s.y[i] - y) ** 2;
      if (d < bd) { bd = d; bi = i; }
    }
    showSegment(id, Math.max(r.segments.findIndex(sg => bi >= sg.i0 && bi <= sg.i1), 0));
    document.dispatchEvent(new CustomEvent("mw:segment"));
  }

  // ================================================================ inspector
  const EMPTY_INSPECTOR = '<p class="empty">Nothing selected yet. Click a route line on the map or the profile, or jump to one of this route\'s hardest stretches:</p>';
  function clearSegment() {
    state.segment = null;
    segHighlight.setLatLngs([]);
    document.getElementById("inspector").innerHTML = EMPTY_INSPECTOR;
    drawProfile();
  }
  function showSegment(id, index) {
    const r = byId()[id], sg = r.segments[index], s = r.samples;
    state.segment = { route: id, index };
    const ll = [];
    for (let i = sg.i0; i <= sg.i1; i++) ll.push(toLL(s.x[i], s.y[i]));
    segHighlight.setLatLngs(ll);
    const dz = sg.elev_end != null && sg.elev_start != null ? sg.elev_end - sg.elev_start : null;
    const ratio = r.components.S > 0 && sg.burden != null ? sg.burden / r.components.S : null;
    const why = sg.max_slope == null ? "No terrain data along this segment, so it can't be assessed. It counts against the route's data coverage." :
      sg.max_slope > P.no_go_deg ? `Crosses ground steeper than the ${P.no_go_deg}° no-go limit (illustrative). This is a main reason this route scores worse.` :
      sg.max_slope > P.steep_flag_deg ? `Includes ground steeper than ${P.steep_flag_deg}°. Its slope burden is ${ratio.toFixed(1)}× this route's average.` :
      ratio > 1.3 ? `Steeper than average for this route (${ratio.toFixed(1)}× the route's slope burden), but no point above ${P.steep_flag_deg}°.` :
      `Gentle segment. It adds little to this route's difficulty.`;
    document.getElementById("inspector").innerHTML = `
      <dl>
        <dt>Route / segment</dt><dd><b style="color:${COLORS[id]}">${id}</b> · #${index + 1} of ${r.segments.length}</dd>
        <dt>Position</dt><dd>${(sg.from_m / 1000).toFixed(2)}–${(sg.to_m / 1000).toFixed(2)} km</dd>
        <dt>Elevation change</dt><dd>${dz == null ? "–" : (dz >= 0 ? "+" : "") + dz.toFixed(1) + " m"}</dd>
        <dt>Steepest point</dt><dd>${sg.max_slope == null ? "–" : sg.max_slope.toFixed(1) + "°"}</dd>
        <dt>Average slope</dt><dd>${sg.mean_slope == null ? "–" : sg.mean_slope.toFixed(1) + "°"}</dd>
        <dt>Data coverage</dt><dd>${sg.coverage_pct.toFixed(0)}%</dd>
        <dt>Source</dt><dd><code>${meta.sources.dtm.slice(0, 17)}…</code></dd>
      </dl>
      <p class="why">${why}</p>`;
    drawProfile();
  }
  function renderHardest() {
    const r = byId()[state.selected];
    const top = r.segments.filter(s => s.burden != null).slice().sort((a, b) => b.burden - a.burden).slice(0, 3);
    const ol = document.getElementById("hardest");
    ol.innerHTML = top.map(sg => `<li><button data-i="${sg.i}">Route ${r.id}, ${(sg.from_m / 1000).toFixed(2)} km: up to ${sg.max_slope.toFixed(1)}°</button></li>`).join("");
    ol.querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
      const sg = r.segments[+b.dataset.i];
      showSegment(r.id, +b.dataset.i);
      const s = r.samples, mid = Math.round((sg.i0 + sg.i1) / 2);
      map.flyTo(toLL(s.x[mid], s.y[mid]), Math.max(map.getZoom(), 0), { duration: 0.6 });
    }));
  }

  // ================================================================ profile chart
  const canvas = document.getElementById("profile");
  const tip = document.getElementById("tip");
  const ctx = canvas.getContext("2d");
  const PAD = { l: 44, r: 8, t: 10, b: 22 };
  let chartGeom = null;
  function slopeColor(v) {
    if (v == null) return "#555";
    for (const c of SLOPE_CLASSES) if (v <= c.max) return c.color === "transparent" ? "#a89d8f" : c.color;
    return "#50005a";
  }
  function drawProfile(hoverIdx = null) {
    const r = byId()[state.selected], s = r.samples;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = 170;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const allZ = routes.flatMap(rt => rt.samples.elev.filter(v => v != null)); // shared axes for fair comparison
    const zmin = Math.floor(Math.min(...allZ) / 10) * 10, zmax = Math.ceil(Math.max(...allZ) / 10) * 10;
    const maxD = Math.max(...routes.map(rt => rt.summary.length_m));
    const X = d => PAD.l + (d / maxD) * (w - PAD.l - PAD.r);
    const Y = z => PAD.t + (1 - (z - zmin) / (zmax - zmin)) * (h - PAD.t - PAD.b);
    chartGeom = { X, maxD, w };

    ctx.font = "11px " + getCss("--mono");
    ctx.fillStyle = getCss("--faint"); ctx.strokeStyle = getCss("--line-soft"); ctx.lineWidth = 1;
    for (let k = 0; k <= 4; k++) {
      const z = zmin + (k / 4) * (zmax - zmin), y = Y(z);
      ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(w - PAD.r, y); ctx.stroke();
      ctx.textAlign = "right"; ctx.fillText(z.toFixed(0), PAD.l - 6, y + 4);
    }
    ctx.textAlign = "center";
    const kmStep = maxD > 4000 ? 1 : 0.5;
    for (let km = 0; km <= maxD / 1000; km += kmStep) ctx.fillText(km.toFixed(1) + " km", X(km * 1000), h - 6);

    if (state.segment && state.segment.route === r.id) {
      const sg = r.segments[state.segment.index];
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(X(sg.from_m), PAD.t, X(sg.to_m) - X(sg.from_m), h - PAD.t - PAD.b);
    }
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < s.chainage.length; i++) {
      if (s.elev[i] == null) continue;
      const px = X(s.chainage[i]), py = Y(s.elev[i]);
      started ? ctx.lineTo(px, py) : (ctx.moveTo(px, py), started = true);
    }
    ctx.lineTo(X(s.chainage[s.chainage.length - 1]), h - PAD.b); ctx.lineTo(X(0), h - PAD.b); ctx.closePath();
    ctx.fillStyle = COLORS[r.id] + "22"; ctx.fill();
    ctx.lineWidth = 3; ctx.lineCap = "round";
    for (let i = 1; i < s.chainage.length; i++) {
      if (s.elev[i] == null || s.elev[i - 1] == null) continue;
      ctx.strokeStyle = slopeColor(s.slope[i]);
      ctx.beginPath(); ctx.moveTo(X(s.chainage[i - 1]), Y(s.elev[i - 1])); ctx.lineTo(X(s.chainage[i]), Y(s.elev[i])); ctx.stroke();
    }
    if (hoverIdx != null && s.elev[hoverIdx] != null) {
      const px = X(s.chainage[hoverIdx]);
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px, PAD.t); ctx.lineTo(px, h - PAD.b); ctx.stroke();
      ctx.fillStyle = "#ff7a45"; ctx.beginPath(); ctx.arc(px, Y(s.elev[hoverIdx]), 4, 0, 7); ctx.fill();
    }
  }
  function profileIndexAt(evt) {
    if (!chartGeom) return null;
    const s = byId()[state.selected].samples;
    const px = evt.clientX - canvas.getBoundingClientRect().left;
    const d = ((px - PAD.l) / (chartGeom.w - PAD.l - PAD.r)) * chartGeom.maxD;
    if (d < 0 || d > s.chainage[s.chainage.length - 1]) return null;
    let lo = 0, hi = s.chainage.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; s.chainage[m] < d ? (lo = m) : (hi = m); }
    return d - s.chainage[lo] < s.chainage[hi] - d ? lo : hi;
  }
  canvas.addEventListener("mousemove", e => {
    const i = profileIndexAt(e);
    const s = byId()[state.selected].samples;
    if (i == null) { tip.hidden = true; map.removeLayer(hoverDot); drawProfile(); return; }
    drawProfile(i);
    tip.hidden = false;
    tip.innerHTML = `${(s.chainage[i] / 1000).toFixed(2)} km · ${s.elev[i] == null ? "no data" : s.elev[i].toFixed(1) + " m"} · ${s.slope[i] == null ? "–" : s.slope[i].toFixed(1) + "°"}`;
    tip.style.left = Math.min(chartGeom.X(s.chainage[i]) + 8, chartGeom.w - tip.offsetWidth - 4) + "px";
    hoverDot.setLatLng(toLL(s.x[i], s.y[i])).addTo(map);
  });
  canvas.addEventListener("mouseleave", () => { tip.hidden = true; map.removeLayer(hoverDot); drawProfile(); });
  canvas.addEventListener("click", e => {
    const i = profileIndexAt(e); if (i == null) return;
    const r = byId()[state.selected];
    const k = r.segments.findIndex(sg => i >= sg.i0 && i <= sg.i1);
    if (k >= 0) showSegment(r.id, k);
  });
  window.addEventListener("resize", () => drawProfile());

  // ================================================================ briefing
  function renderBriefing() {
    const r = byId()[state.selected];
    const others = routes.filter(x => x.id !== r.id);
    const s = r.samples;
    let mi = -1, mv = -1;
    s.slope.forEach((v, i) => { if (v != null && v > mv) { mv = v; mi = i; } });
    const steepSegs = r.segments.filter(sg => sg.max_slope != null && sg.max_slope > P.steep_flag_deg);
    const tR = tdiOf(r);
    const o = others.slice().sort((a, b) => tdiOf(a) - tdiOf(b))[0], tO = tdiOf(o);
    const verdict = Math.abs(tR - tO) < 0.05 ? `Route ${r.id} and Route ${o.id} score the same under your current weights.`
      : tR < tO ? `Under your current weights, Route ${r.id} has the <b>lowest terrain difficulty</b> (TDI ${tR.toFixed(1)}; next is Route ${o.id} at ${tO.toFixed(1)}).`
        : `Under your current weights, Route ${o.id} scores lower (TDI ${tO.toFixed(1)} vs ${tR.toFixed(1)}).`;
    const gaps = r.summary.coverage_pct < 99.95 ? ` <b>Part of this route has no terrain data.</b>` : "";
    document.getElementById("briefing").innerHTML = `
      <p><b style="color:${COLORS[r.id]}">Route ${r.id}</b>: crater floor → delta top.</p>
      <ul>
        <li>Walk ${fmtKm(r.summary.length_m)}, ${r.summary.detour_pct.toFixed(0)}% longer than the direct line.</li>
        <li>Total climb about ${r.summary.ascent_m.toFixed(0)} m; descent about ${r.summary.descent_m.toFixed(0)} m.</li>
        <li>Steepest sampled ground: ${mv.toFixed(1)}° at ${(s.chainage[mi] / 1000).toFixed(2)} km.</li>
        <li>${steepSegs.length ? `${steepSegs.length} segment${steepSegs.length > 1 ? "s" : ""} cross ground over ${P.steep_flag_deg}°. Check them in the inspector.` : `No segment crosses ground over ${P.steep_flag_deg}°.`}</li>
        <li>Terrain data covers ${r.summary.coverage_pct.toFixed(0)}% of the route.${gaps}</li>
      </ul>
      <p class="verdict">${verdict}</p>
      <p class="caveat">Based on a 2007 elevation model at ~3&nbsp;m slope baseline. Does not account for boulders under 3&nbsp;m, sand, weather, lighting or suit limits.</p>`;
  }

  // ================================================================ draw your own route
  const drawLine = L.polyline([], { color: COLORS.C, weight: 3, dashArray: "6 6", interactive: false }).addTo(map);
  const drawDots = L.layerGroup().addTo(map);
  const btnDraw = document.getElementById("draw-start"), btnUndo = document.getElementById("draw-undo"),
    btnDone = document.getElementById("draw-finish"), btnDel = document.getElementById("draw-clear"),
    drawHint = document.getElementById("draw-hint");
  function refreshDraw() {
    const d = state.draw, hasC = !!byId().C;
    const pts = d.active ? [[meta.start.x, meta.start.y], ...d.pts] : [];
    drawLine.setLatLngs(pts.map(([x, y]) => toLL(x, y)));
    drawDots.clearLayers();
    d.pts.forEach(([x, y]) => L.circleMarker(toLL(x, y), { radius: 4, color: "#0b0d12", weight: 2, fillColor: COLORS.C, fillOpacity: 1, interactive: false }).addTo(drawDots));
    btnDraw.hidden = d.active; btnUndo.hidden = btnDone.hidden = !d.active;
    btnUndo.disabled = !d.pts.length;
    btnDel.hidden = d.active ? false : !hasC;
    btnDel.textContent = d.active ? "Cancel" : "Delete my route";
    btnDraw.textContent = hasC ? "Redraw my route" : "Draw a route";
    drawHint.textContent = d.active
      ? `Click the map to add waypoints from the start (${d.pts.length} so far). Then press Finish: the route is joined to the destination and scored.`
      : hasC ? "Route C is scored with the same method and data as A and B." : "Think you can beat the computer? Draw your own path from start to destination and see how it scores.";
    document.getElementById("map").classList.toggle("drawing", d.active);
  }
  function setDrawing(on) {
    state.draw.active = on; state.draw.pts = [];
    on ? map.doubleClickZoom.disable() : map.doubleClickZoom.enable();
    refreshDraw();
  }
  map.on("click", e => {
    if (!state.draw.active) return;
    const x = e.latlng.lng, y = -e.latlng.lat;
    if (x < 0 || y < 0 || x > W || y > H) return;
    state.draw.pts.push([x, y]); refreshDraw();
  });
  btnDraw.addEventListener("click", () => setDrawing(true));
  btnUndo.addEventListener("click", () => { state.draw.pts.pop(); refreshDraw(); });
  btnDone.addEventListener("click", () => {
    const verts = [[meta.start.x, meta.start.y], ...state.draw.pts, [meta.goal.x, meta.goal.y]];
    setRouteC(verts);
    setDrawing(false);
  });
  btnDel.addEventListener("click", () => {
    if (state.draw.active) { setDrawing(false); return; }
    const i = routes.findIndex(r => r.id === "C");
    if (i >= 0) routes.splice(i, 1);
    if (routeLayers.C) { map.removeLayer(routeLayers.C); delete routeLayers.C; }
    document.getElementById("lbl-C").hidden = true;
    refreshDraw(); selectRoute(state.selected === "C" ? "B" : state.selected);
    syncGlobeRoutes();
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && state.draw.active) setDrawing(false); });
  function setRouteC(verts) {
    const r = scoreRoute("C", "Route C: Your route", "Drawn by the user in the app", verts);
    const i = routes.findIndex(x => x.id === "C");
    i >= 0 ? (routes[i] = r) : routes.push(r);
    addRouteLayer(r);
    document.getElementById("lbl-C").hidden = false;
    document.getElementById("tgl-C").checked = true;
    selectRoute("C");
    syncGlobeRoutes();
  }

  // ================================================================ whole-Mars view
  // A second map in plain latitude/longitude. The study site is an equirectangular clip, so its
  // image and routes drop onto the planet at their true position.
  const nw = latLon(0, 0), se = latLon(W, H);
  const siteBounds = [[se.lat, nw.lon], [nw.lat, se.lon]];
  const WORLD = [[-90, -180], [90, 180]];
  let globe = null, globeRoutes = null;
  const fmtLL = (lat, lon) => `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? "N" : "S"} ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? "E" : "W"}`;
  function initGlobe() {
    globe = L.map("globe", {
      crs: L.CRS.EPSG4326, minZoom: 0, maxZoom: 13, zoomSnap: 0.25, zoomDelta: 0.5,
      attributionControl: false, zoomControl: false, maxBounds: [[-100, -200], [100, 200]], maxBoundsViscosity: 0.9,
    });
    L.control.zoom({ position: "topright" }).addTo(globe);
    L.imageOverlay("data/mars_global.jpg", WORLD).addTo(globe); // bundled, works offline
    const bm = places && places.basemap;
    if (bm) L.tileLayer(bm.tiles, { maxNativeZoom: bm.max_native_zoom, maxZoom: 13, noWrap: true, bounds: WORLD }).addTo(globe); // sharper when online
    L.imageOverlay("data/ortho.jpg", siteBounds).addTo(globe);
    L.rectangle(siteBounds, { color: getCss("--accent"), weight: 1.5, fill: false, interactive: false }).addTo(globe);
    globeRoutes = L.layerGroup().addTo(globe);

    const site = places && places.site;
    if (site) {
      // crater rim from the IAU diameter (Mars mean radius 3389.5 km -> 59.16 km per degree)
      const rDeg = site.diameter_km / 2 / 59.16, ring = [];
      for (let k = 0; k <= 72; k++) {
        const t = (k / 72) * 2 * Math.PI;
        ring.push([site.lat + rDeg * Math.sin(t), site.lon + (rDeg * Math.cos(t)) / Math.cos(site.lat * Math.PI / 180)]);
      }
      L.polyline(ring, { color: getCss("--accent"), weight: 1.2, dashArray: "4 5", opacity: 0.9, interactive: false }).addTo(globe);
    }
    const c = [(siteBounds[0][0] + siteBounds[1][0]) / 2, (siteBounds[0][1] + siteBounds[1][1]) / 2];
    L.marker(c, { icon: L.divIcon({ className: "", html: '<div class="gl-site"></div>', iconSize: [16, 16], iconAnchor: [8, 8] }), title: "Fly to the study site" })
      .addTo(globe).on("click", flyToSite)
      .bindTooltip("Jezero · study site", { permanent: true, direction: "top", offset: [0, -12], className: "gl-label site" });
    for (const p of (places ? places.landmarks : [])) {
      L.marker([p.lat, p.lon], { icon: L.divIcon({ className: "", html: '<div class="gl-dot"></div>', iconSize: [7, 7], iconAnchor: [3.5, 3.5] }) })
        .addTo(globe)
        .bindTooltip(p.name, { permanent: true, direction: p.label || "right", offset: p.label === "left" ? [-7, 0] : [7, 0], className: "gl-label" })
        .bindPopup(`<div class="stop-pop"><span class="kind">IAU-named feature · ${p.type}</span><h3>${p.name}</h3>
          <p>About ${Math.round(p.diameter_km).toLocaleString("en")} km across. Centre ${fmtLL(p.lat, p.lon)}.</p>
          <p class="src">Source: <a href="${places.base_url}${p.id}" target="_blank" rel="noopener">IAU / USGS Gazetteer, feature ${p.id}</a></p></div>`, { maxWidth: 260 });
    }
    globe.on("mousemove", e => {
      const { lat, lng } = e.latlng;
      readout.innerHTML = Math.abs(lat) > 90 || Math.abs(lng) > 180 ? "Off the map" : `<b>${fmtLL(lat, lng)}</b>&ensp;·&ensp;Planet view: no elevation here`;
    });
    globe.on("mouseout", () => { readout.textContent = "Move over the map"; });
    if (bm) document.getElementById("mars-credit").textContent = `Base map: ${bm.name}. ${bm.credit}. Place names: IAU / USGS Gazetteer.`;
    globe.fitBounds(WORLD);
  }
  function syncGlobeRoutes() {
    if (!globeRoutes) return;
    globeRoutes.clearLayers();
    for (const r of routes) {
      const ll = r.vertices_m.map(([x, y]) => { const q = latLon(x, y); return [q.lat, q.lon]; });
      L.polyline(ll, { color: COLORS[r.id], weight: 3, interactive: false }).addTo(globeRoutes);
    }
  }
  function flyToSite() { globe.flyToBounds(siteBounds, { padding: [60, 60], duration: 2.2 }); }
  function setView(v) {
    state.view = v;
    const mars = v === "mars";
    if (mars && state.draw.active) setDrawing(false);
    document.getElementById("map").hidden = mars;
    document.getElementById("site-ui").hidden = mars;
    document.getElementById("globe").hidden = !mars;
    document.getElementById("mars-ui").hidden = !mars;
    document.getElementById("view-site").setAttribute("aria-pressed", String(!mars));
    document.getElementById("view-mars").setAttribute("aria-pressed", String(mars));
    readout.textContent = "Move over the map";
    if (mars) {
      if (!globe) initGlobe();
      globe.invalidateSize();
      syncGlobeRoutes();
    } else {
      map.invalidateSize();
    }
  }
  document.getElementById("view-site").addEventListener("click", () => setView("site"));
  document.getElementById("view-mars").addEventListener("click", () => { setView("mars"); globe.fitBounds(WORLD); });
  document.getElementById("mars-fly").addEventListener("click", flyToSite);
  document.getElementById("mars-world").addEventListener("click", () => globe.flyToBounds(WORLD, { duration: 1.6 }));

  // ================================================================ export
  function download(name, text, type) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  const rnd = (v, n = 2) => (v == null || Number.isNaN(v) ? null : +v.toFixed(n));
  document.getElementById("dl-json").addEventListener("click", () => {
    const out = {
      generated: new Date().toISOString(), site: meta.site, sources: meta.sources, weights: state.weights,
      routes: routes.map(r => ({
        id: r.id, name: r.name, how: r.how, tdi: rnd(tdiOf(r)),
        summary: Object.fromEntries(Object.entries(r.summary).map(([k, v]) => [k, rnd(v)])),
        components: Object.fromEntries(Object.entries(r.components).map(([k, v]) => [k, rnd(v, 4)])),
        segments: r.segments.map(sg => Object.fromEntries(Object.entries(sg).map(([k, v]) => [k, typeof v === "number" ? rnd(v) : v]))),
        vertices_m: r.vertices_m.map(p => p.map(v => rnd(v, 1))),
        vertices_latlon: r.vertices_m.map(([x, y]) => { const q = latLon(x, y); return [rnd(q.lat, 6), rnd(q.lon, 6)]; }),
      })),
      note: "Prototype route screening. TDI is relative and not a probability of danger.",
    };
    download("marswalk-routes.json", JSON.stringify(out, null, 2), "application/json");
  });
  document.getElementById("dl-csv").addEventListener("click", () => {
    const rows = [["route", "segment", "from_m", "to_m", "elev_start_m", "elev_end_m", "max_slope_deg", "mean_slope_deg", "coverage_pct"]];
    for (const r of routes) for (const sg of r.segments)
      rows.push([r.id, sg.i + 1, rnd(sg.from_m, 1), rnd(sg.to_m, 1), rnd(sg.elev_start), rnd(sg.elev_end), rnd(sg.max_slope), rnd(sg.mean_slope), rnd(sg.coverage_pct, 1)]);
    download("marswalk-segments.csv", rows.map(r => r.join(",")).join("\n"), "text/csv");
  });

  // ================================================================ method dialog
  function renderMethod() {
    const g = meta.grid;
    const tr = (k, v) => `<tr><th>${k}</th><td>${v}</td></tr>`;
    const sensHtml = !sens ? "" : `
      <h3>Does Route B depend on our settings?</h3>
      <p>We re-ran the route search with different settings and scored each result with the same method. Route A scores ${sens.route_a_tdi}.</p>
      <table><tr><th>Setting</th><th>Length</th><th>Steepest</th><th>TDI</th></tr>
      ${sens.cases.map(c => c.found ? `<tr><td>${c.label} (no-go ${c.no_go}°, penalty ${c.scale}°)</td><td>${c.length_m} m</td><td>${c.max_slope}°</td><td>${c.tdi}</td></tr>` : `<tr><td>${c.label}</td><td colspan="3">no path found</td></tr>`).join("")}</table>
      <p>${sens.all_cases_beat_route_a ? "In every case the terrain-aware route still scores lower than the direct route. The exact path and numbers do change, so treat single values as approximate." : "The terrain-aware route does not beat the direct route in every case."}</p>`;
    const stopsHtml = `
      <h3>Science stops and context</h3>
      <table>${(meta.stops || []).map(s => tr(s.name, `${s.kind}. <a href="${s.url}" target="_blank" rel="noopener">${s.source}</a>`)).join("")}
      ${(meta.context || []).map(c => tr("Context", `${c.text} <a href="${c.url}" target="_blank" rel="noopener">${c.source}</a>`)).join("")}</table>`;
    document.getElementById("method-body").innerHTML = `
      <h3>Data sources</h3>
      <table>
        ${tr("Terrain", `HiRISE Digital Terrain Model <code>${meta.sources.dtm}</code> (MRO-M-HIRISE-5-DTM-V1.0), University of Arizona. Elevation in metres above the Mars 2000 areoid. 1.0096 m/post, equirectangular.`)}
        ${tr("Image", `HiRISE orthoimage <code>${meta.sources.ortho}</code>, same grid as the DTM. Display only: no measurements are taken from image brightness.`)}
        ${tr("Source images", "PSP_002387_1985 and PSP_003798_1985 (2007), Mars Reconnaissance Orbiter")}
        ${tr("Archive", `<a href="https://ode.rsl.wustl.edu/mars/indexproductpage.aspx?product_id=${meta.sources.dtm}" target="_blank" rel="noopener">Mars ODE product page</a> · <a href="https://www.uahirise.org/dtm/" target="_blank" rel="noopener">HiRISE DTM archive</a>`)}
        ${tr("Study area", `${meta.site}. ${(W / 1000).toFixed(2)} × ${(H / 1000).toFixed(2)} km clip (DTM rows ${meta.clip_full.row0}–${meta.clip_full.row1}, columns ${meta.clip_full.col0}–${meta.clip_full.col1}); ${meta.clip_valid_pct}% valid data.`)}
      </table>
      <h3>Processing</h3>
      <ol>
        <li>Read the PDS3 file directly (label + 32-bit float grid) and mask the no-data value.</li>
        <li>Average 3 × 3 posts into ~${g.cell_dx_m.toFixed(2)} × ${g.cell_dy_m.toFixed(2)} m cells. A block with any missing post stays missing.</li>
        <li>East–west cell size is corrected for latitude (the projection is true at 15°, the site is at 18.5°): ${g.cell_dx_m.toFixed(3)} m vs ${g.cell_dy_m.toFixed(3)} m.</li>
        <li>Slope = arctan(|∇z|) with central differences.</li>
        <li>Route B: A* search on a ~6 m grid. Step cost = distance × (1 + (slope / ${P.router_slope_scale}°)²); cells over ${P.no_go_deg}° are blocked.</li>
        <li>Every route, including one you draw, is sampled every ${P.sample_step_m} m with bilinear interpolation on the same 3 m grid, then split into ${P.segment_m} m segments.</li>
      </ol>
      <h3>Terrain Difficulty Index</h3>
      <pre>TDI = 100 × (w_s·S + w_l·L + w_c·C) / (w_s + w_l + w_c)

S = mean of min(slope / ${P.slope_ref_deg}°, 1) over route samples
L = min((route length − direct length) / direct length, 1)
C = share of samples with no terrain data</pre>
      <p>Default weights: slope ${P.default_weights.slope}, length ${P.default_weights.length}, coverage ${P.default_weights.coverage}. This is our own prototype formula, not a NASA standard.</p>
      <h3>Current values</h3>
      <table>${routes.map(r => tr("Route " + r.id, `S = ${r.components.S.toFixed(3)}, L = ${r.components.L.toFixed(3)}, C = ${r.components.C.toFixed(3)} → TDI ${tdiOf(r).toFixed(1)}`)).join("")}</table>
      ${sensHtml}
      <h3>Validation</h3>
      <p>14 automated checks pass (<code>prep/test_method.py</code>): flat and tilted test surfaces give the exact expected slope, route lengths match geometry, missing data lowers coverage, the router avoids a blocked wall, DTM values match the raw file, and our slopes agree with a hand calculation and with Horn's 3 × 3 method (the one GIS tools use) to a median of about 0.2°. The browser's scoring code reproduces the Python results for Routes A and B. These are software checks, not field validation.</p>
      ${stopsHtml}
      <h3>Reproduce</h3>
      <pre>python -m venv .venv && .venv\\Scripts\\pip install numpy pillow
.venv\\Scripts\\python prep\\build.py
.venv\\Scripts\\python prep\\test_method.py
.venv\\Scripts\\python prep\\sensitivity.py</pre>`;
  }

  // ================================================================ dialogs
  document.querySelectorAll("[data-open]").forEach(b => b.addEventListener("click", () => {
    if (b.dataset.open === "method") renderMethod();
    document.getElementById("dlg-" + b.dataset.open).showModal();
  }));
  document.querySelectorAll("dialog").forEach(d => d.addEventListener("click", e => { if (e.target === d) d.close(); }));

  function getCss(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

  // ================================================================ init
  renderWeights();
  refreshDraw();
  document.getElementById("inspector").innerHTML = EMPTY_INSPECTOR;
  selectRoute("B");
  window.marswalk = { meta, routes, scoreRoute, tdiOf, setRouteC, setView }; // for tests and curious users
  // lift the loading veil once the base image has painted (or after a short grace period)
  const veil = document.getElementById("veil");
  const lift = () => { veil.classList.add("done"); setTimeout(() => { veil.hidden = true; }, 400); }; // remove outright, don't rely on the fade finishing
  const baseImg = bases.ortho.getElement();
  if (baseImg && baseImg.complete && baseImg.naturalWidth) lift();
  else { bases.ortho.once("load", lift); bases.ortho.once("error", lift); }
  setTimeout(lift, 4000);
})().catch(err => {
  console.error(err);
  const veil = document.getElementById("veil");
  veil.classList.add("error");
  veil.querySelector(".veil-in").innerHTML =
    `MarsWalk couldn't load its terrain data.<small>${String(err.message).replace(/[<>&]/g, "")}</small>
     <small>Run <code>python -m http.server</code> inside the <code>web</code> folder, then open http://localhost:8000.</small>`;
});
