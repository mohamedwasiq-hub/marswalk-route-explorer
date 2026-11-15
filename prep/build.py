# AI-assisted: written with an AI coding assistant (Claude), directed and reviewed by the team. NASA Space Apps 2026 SI disclosure.
"""MarsWalk data build: DTM + orthoimage -> web layers, routes and scores.

Run:  ..\\.venv\\Scripts\\python.exe build.py
Writes everything the web app needs into ../web/data/.
"""
from __future__ import annotations

import json
import math
from datetime import date

import numpy as np
from PIL import Image

import method as M
from dtm import DTM_ID, ORTHO_ID, ORTHO_PATH, ROOT, hillshade, load_dtm, slope_degrees

OUT = ROOT / "web" / "data"
OUT.mkdir(parents=True, exist_ok=True)

# ---- Study clip on the Jezero delta front (full-DTM row/col, 0-based) ----
R0, R1 = 4600, 8600
C0, C1 = 1300, 5900   # west edge widened to include Belva crater (IAU feature 15872)
BLOCK = 3            # analysis grid = 3x3 block mean of the 1 m DTM (~3 m cells)
ROUTE_BLOCK = 2      # router grid = 2x2 cells of the analysis grid (~6 m)

# Start on the crater floor east of the delta front; destination on the delta top.
START_FULL = (6900, 5400)
GOAL_FULL = (6300, 3200)


def block_mean(a: np.ndarray, k: int) -> np.ndarray:
    h, w = (a.shape[0] // k) * k, (a.shape[1] // k) * k
    b = a[:h, :w].reshape(h // k, k, w // k, k)
    with np.errstate(invalid="ignore"):
        m = np.nanmean(b, axis=(1, 3))
    # any missing pixel in the block -> block missing (never silently fill)
    m[np.isnan(b).any(axis=(1, 3))] = np.nan
    return m.astype(np.float32)


def slope_rgba(s: np.ndarray) -> np.ndarray:
    """Slope classes -> RGBA. Gentle terrain stays transparent so the image shows through."""
    classes = [  # upper bound deg, RGBA
        (5, (0, 0, 0, 0)),
        (10, (255, 237, 160, 120)),
        (15, (254, 178, 76, 170)),
        (20, (240, 59, 32, 200)),
        (25, (189, 0, 38, 220)),
        (999, (80, 0, 90, 235)),
    ]
    out = np.zeros(s.shape + (4,), np.uint8)
    lo = -1
    for hi, rgba in classes:
        m = (s > lo) & (s <= hi)
        out[m] = rgba
        lo = hi
    out[np.isnan(s)] = (60, 60, 60, 200)
    return out


def elev_rgb(z: np.ndarray, lo: float, hi: float) -> np.ndarray:
    stops = np.array([[38, 70, 83], [42, 157, 143], [233, 196, 106], [244, 162, 97], [231, 111, 81]], float)
    t = np.clip((z - lo) / (hi - lo), 0, 1)
    t = np.nan_to_num(t)
    pos = t * (len(stops) - 1)
    i = np.clip(pos.astype(int), 0, len(stops) - 2)
    f = (pos - i)[..., None]
    rgb = stops[i] * (1 - f) + stops[i + 1] * f
    rgb[np.isnan(z)] = 40
    return rgb.astype(np.uint8)


def r(x, n=2):
    return None if x is None or (isinstance(x, float) and math.isnan(x)) else round(float(x), n)


def main():
    d = load_dtm()
    clip = d.elev[R0:R1, C0:C1]
    valid_pct = 100.0 * (~np.isnan(clip)).mean()
    print(f"clip {clip.shape}  valid {valid_pct:.2f}%  dx {d.dx:.4f} dy {d.dy:.4f}")

    # Analysis grid (~3 m)
    e3 = block_mean(clip, BLOCK)
    dx3, dy3 = d.dx * BLOCK, d.dy * BLOCK
    s3 = slope_degrees(e3, dx3, dy3)
    hs = hillshade(e3, dx3, dy3, z=2.0)
    H3, W3 = e3.shape
    width_m, height_m = W3 * dx3, H3 * dy3
    print(f"analysis grid {e3.shape} cell {dx3:.2f} x {dy3:.2f} m -> {width_m:.0f} x {height_m:.0f} m")

    # ---- Layers ----
    zlo, zhi = np.nanpercentile(e3, [1, 99])
    Image.fromarray(slope_rgba(s3), "RGBA").save(OUT / "slope.png", optimize=True)
    Image.fromarray(elev_rgb(e3, zlo, zhi)).save(OUT / "elevation.jpg", quality=88)
    Image.fromarray((np.nan_to_num(hs, nan=0.15) * 255).astype(np.uint8)).save(OUT / "hillshade.jpg", quality=88)

    Image.MAX_IMAGE_PIXELS = None
    ortho = Image.open(ORTHO_PATH)
    if ortho.size != (d.elev.shape[1], d.elev.shape[0]):
        raise SystemExit(f"ortho size {ortho.size} does not match DTM grid")
    oc = ortho.crop((C0, R0, C1, R1))
    oc = oc.resize((oc.width // 2, oc.height // 2), Image.LANCZOS)
    oa = np.asarray(oc).astype(np.float32)
    nz = oa[oa > 0]
    lo, hi = np.percentile(nz, [0.5, 99.5])
    oa = np.clip((oa - lo) / (hi - lo) * 255, 0, 255).astype(np.uint8)
    Image.fromarray(oa).save(OUT / "ortho.jpg", quality=85)

    # ---- Routes ----
    def full_to_m(rc):
        rr, cc = rc[0] - R0, rc[1] - C0
        return np.array([cc * d.dx, rr * d.dy])

    start_m, goal_m = full_to_m(START_FULL), full_to_m(GOAL_FULL)
    straight = float(np.hypot(*(goal_m - start_m)))

    # Route A: direct line
    route_a = np.vstack([start_m, goal_m])

    # Route B: least-cost path on ~6 m grid
    s6 = block_mean(s3, ROUTE_BLOCK)
    dx6, dy6 = dx3 * ROUTE_BLOCK, dy3 * ROUTE_BLOCK
    to_cell = lambda p: (int(round(p[1] / dy6)), int(round(p[0] / dx6)))
    path = M.least_cost_path(s6, to_cell(start_m), to_cell(goal_m), dx6, dy6)
    pts = np.array([[c * dx6, rr * dy6] for rr, c in path])
    pts[0], pts[-1] = start_m, goal_m
    route_b = M.simplify(pts, tol=4.0)
    print(f"route B: {len(path)} grid steps -> {len(route_b)} vertices")

    routes_out = []
    for rid, name, kind, poly in [
        ("A", "Route A: Direct", "Straight line from start to destination", route_a),
        ("B", "Route B: Terrain-aware", "Least-cost path that avoids slopes over "
         f"{M.NO_GO_DEG:.0f}° and penalises steep ground", route_b),
    ]:
        samp = M.sample_route(poly, e3, s3, dx3, dy3)
        summ = M.summarize(samp, straight)
        comp = M.components(samp, straight)
        segs = M.segments(samp)
        routes_out.append({
            "id": rid, "name": name, "how": kind,
            "vertices_m": [[r(x, 1), r(y, 1)] for x, y in poly],
            "summary": {k: r(v) for k, v in summ.items()},
            "components": {k: r(v, 4) for k, v in comp.items()},
            "tdi_default": r(M.tdi(comp)),
            "samples": {
                "chainage": [r(v, 1) for v in samp["chainage"]],
                "x": [r(v, 1) for v in samp["xy"][:, 0]],
                "y": [r(v, 1) for v in samp["xy"][:, 1]],
                "elev": [r(v) for v in samp["elev"]],
                "slope": [r(v, 1) for v in samp["slope"]],
                "valid": [bool(v) for v in samp["valid"]],
            },
            "segments": [{k: (r(v) if isinstance(v, float) else v) for k, v in sg.items()} for sg in segs],
        })
        print(f"{rid}: {summ['length_m']:.0f} m, max {summ['max_slope_deg']:.1f}°, "
              f"mean {summ['mean_slope_deg']:.1f}°, steep {summ['steep_share_pct']:.1f}%, "
              f"ascent {summ['ascent_m']:.1f} m, cov {summ['coverage_pct']:.1f}%, TDI {M.tdi(comp):.1f}")

    # ---- Science stops: every stop carries its source; nothing is inferred from image texture ----
    def latlon_to_m(lat, lon):
        row = d.line_offset - lat * d.map_resolution
        col = d.sample_offset + (lon - d.center_lon) * d.map_resolution * math.cos(math.radians(d.center_lat))
        return (col - C0) * d.dx, (row - R0) * d.dy

    bx, by = latlon_to_m(18.48, 77.38)
    ra = routes_out[0]["samples"]
    k = int(np.nanargmax(np.array([v if v is not None else np.nan for v in ra["slope"]], float)))
    stops = [
        {"id": "belva", "name": "Belva crater", "kind": "IAU-named feature",
         "x": r(bx, 1), "y": r(by, 1),
         "text": "An impact crater about 0.9 km across on the delta. Marker is at the IAU catalogue centre "
                 "(18.48°N, 77.38°E), which is given to 0.01° (about 600 m), so treat the position as approximate.",
         "source": "IAU / USGS Gazetteer of Planetary Nomenclature, Feature 15872",
         "url": "https://planetarynames.wr.usgs.gov/Feature/15872"},
        {"id": "scarp", "name": "Delta front scarp", "kind": "Observation from our terrain data + NASA context",
         "x": ra["x"][k], "y": ra["y"][k],
         "text": f"The steepest ground the direct route crosses ({ra['slope'][k]:.1f}° in our slope grid). "
                 "NASA describes the landform here as an ancient river delta, evidence that a lake once filled Jezero Crater.",
         "source": "Slope: HiRISE DTM " + DTM_ID + ". Context: NASA/JPL Mars 2020 landing press kit",
         "url": "https://www.jpl.nasa.gov/news/press_kits/mars_2020/landing/mission/landing_site/"},
    ]

    # ---- Analysis grid for the browser (cursor readout + scoring user-drawn routes) ----
    # Same 3 m grid the Python scoring uses, so browser scores match build scores.
    zbase = float(np.floor(np.nanmin(e3)))
    ei = np.where(np.isnan(e3), -32768, np.round((e3 - zbase) * 100)).astype("<i2")      # centimetres above zbase
    si = np.where(np.isnan(s3), 65535, np.round(np.clip(s3, 0, 90) * 100)).astype("<u2")  # hundredths of a degree
    (OUT / "elev3.bin").write_bytes(ei.tobytes())
    (OUT / "slope3.bin").write_bytes(si.tobytes())
    for old in ("elev6.bin", "slope6.bin"):
        (OUT / old).unlink(missing_ok=True)

    # ---- Metadata for the app ----
    meta = {
        "built": date.today().isoformat(),
        "site": "Jezero Crater, western delta front",
        "width_m": r(width_m, 1), "height_m": r(height_m, 1),
        "grid": {"rows": H3, "cols": W3, "cell_dx_m": r(dx3, 4), "cell_dy_m": r(dy3, 4)},
        "clip_full": {"row0": R0, "row1": R1, "col0": C0, "col1": C1},
        "clip_valid_pct": r(valid_pct, 2),
        "elev_range_m": [r(np.nanmin(e3)), r(np.nanmax(e3))],
        "elev_legend_m": [r(zlo), r(zhi)],
        "start": {"x": r(start_m[0], 1), "y": r(start_m[1], 1), "label": "Start: crater floor"},
        "goal": {"x": r(goal_m[0], 1), "y": r(goal_m[1], 1), "label": "Destination: delta top"},
        "straight_m": r(straight, 1),
        "stops": stops,
        "context": [
            {"text": "Jezero is an IAU-named crater 47.5 km across, centred at 18.41°N, 77.69°E. The study area lies inside its western part.",
             "source": "IAU / USGS Gazetteer, Feature 14300", "url": "https://planetarynames.wr.usgs.gov/Feature/14300"},
            {"text": "NASA's Perseverance rover landed in Jezero Crater on 18 February 2021. NASA reports the nearest delta remnant was about 2.3 km west of the landing site. Our start point is a chosen point on the crater floor, not the landing site.",
             "source": "NASA Science: Perseverance view of the delta", "url": "https://science.nasa.gov/resource/perseverance-view-of-the-delta-in-jezero-crater/"},
        ],
        "grid3": {"rows": H3, "cols": W3, "cell_dx_m": dx3, "cell_dy_m": dy3, "zbase": zbase,
                  "elev": "elev3.bin int16 LE, centimetres above zbase, -32768 = no data",
                  "slope": "slope3.bin uint16 LE, hundredths of a degree, 65535 = no data"},
        "proj": {  # to convert map metres back to lat/lon in the browser
            "dx_full": d.dx, "dy_full": d.dy, "row0": R0, "col0": C0,
            "map_resolution": d.map_resolution, "center_lat": d.center_lat, "center_lon": d.center_lon,
            "line_offset": d.line_offset, "sample_offset": d.sample_offset,
        },
        "params": {
            "analysis_block": BLOCK, "router_block": ROUTE_BLOCK,
            "sample_step_m": M.SAMPLE_STEP_M, "segment_m": M.SEGMENT_M,
            "slope_ref_deg": M.SLOPE_REF_DEG, "steep_flag_deg": M.STEEP_FLAG_DEG,
            "no_go_deg": M.NO_GO_DEG, "router_slope_scale": M.ROUTER_SLOPE_SCALE,
            "default_weights": M.DEFAULT_WEIGHTS,
        },
        "sources": {"dtm": DTM_ID, "ortho": ORTHO_ID},
    }
    (OUT / "meta.json").write_text(json.dumps(meta, indent=1))
    (OUT / "routes.json").write_text(json.dumps(routes_out, separators=(",", ":")))
    print("wrote", sorted(p.name for p in OUT.iterdir()))


if __name__ == "__main__":
    main()
