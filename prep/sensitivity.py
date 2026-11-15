# AI-assisted: written with an AI coding assistant (Claude), directed and reviewed by the team. NASA Space Apps 2026 SI disclosure.
"""Sensitivity of Route B to the router's illustrative parameters.

Re-runs the least-cost search with different no-go limits and slope penalties and
re-scores each result with the fixed scoring method. Writes sensitivity-results.md
and web/data/sensitivity.json.  Run: ..\\.venv\\Scripts\\python.exe sensitivity.py
"""
import json

import numpy as np

import method as M
from build import BLOCK, C0, C1, GOAL_FULL, OUT, R0, R1, ROUTE_BLOCK, START_FULL, block_mean
from dtm import ROOT, load_dtm, slope_degrees

d = load_dtm()
e3 = block_mean(d.elev[R0:R1, C0:C1], BLOCK)
dx3, dy3 = d.dx * BLOCK, d.dy * BLOCK
s3 = slope_degrees(e3, dx3, dy3)
s6 = block_mean(s3, ROUTE_BLOCK)
dx6, dy6 = dx3 * ROUTE_BLOCK, dy3 * ROUTE_BLOCK
to_m = lambda rc: np.array([(rc[1] - C0) * d.dx, (rc[0] - R0) * d.dy])
start, goal = to_m(START_FULL), to_m(GOAL_FULL)
straight = float(np.hypot(*(goal - start)))
cell = lambda p: (int(round(p[1] / dy6)), int(round(p[0] / dx6)))

base = (M.NO_GO_DEG, M.ROUTER_SLOPE_SCALE)
cases = [(25, 10, "baseline"), (20, 10, "stricter no-go"), (30, 10, "looser no-go"),
         (25, 5, "stronger slope penalty"), (25, 20, "weaker slope penalty")]
rows = []
for nogo, scale, label in cases:
    M.NO_GO_DEG, M.ROUTER_SLOPE_SCALE = float(nogo), float(scale)
    try:
        path = M.least_cost_path(s6, cell(start), cell(goal), dx6, dy6)
    except ValueError as ex:
        rows.append({"label": label, "no_go": nogo, "scale": scale, "found": False, "note": str(ex)})
        continue
    pts = np.array([[c * dx6, r * dy6] for r, c in path])
    pts[0], pts[-1] = start, goal
    poly = M.simplify(pts, 4.0)
    M.NO_GO_DEG, M.ROUTER_SLOPE_SCALE = base  # scoring always uses the fixed method
    samp = M.sample_route(poly, e3, s3, dx3, dy3)
    sm, comp = M.summarize(samp, straight), M.components(samp, straight)
    rows.append({"label": label, "no_go": nogo, "scale": scale, "found": True,
                 "length_m": round(sm["length_m"]), "max_slope": round(sm["max_slope_deg"], 1),
                 "mean_slope": round(sm["mean_slope_deg"], 1), "steep_pct": round(sm["steep_share_pct"], 1),
                 "tdi": round(M.tdi(comp), 1)})
M.NO_GO_DEG, M.ROUTER_SLOPE_SCALE = base

a = M.sample_route(np.vstack([start, goal]), e3, s3, dx3, dy3)
tdi_a = round(M.tdi(M.components(a, straight)), 1)
found = [r for r in rows if r["found"]]
all_beat = all(r["tdi"] < tdi_a for r in found)
out = {"route_a_tdi": tdi_a, "cases": rows, "all_cases_beat_route_a": all_beat}
(OUT / "sensitivity.json").write_text(json.dumps(out, indent=1))

lines = ["# Sensitivity of Route B to router settings", "",
         f"Route A (direct) TDI at default weights: **{tdi_a}**. Each row re-runs the router with different "
         "settings, then scores the result with the same fixed method.", "",
         "| Case | No-go | Penalty scale | Length (m) | Max slope | Mean slope | Over 15° | TDI |",
         "|---|---|---|---|---|---|---|---|"]
for r in rows:
    if r["found"]:
        lines.append(f"| {r['label']} | {r['no_go']}° | {r['scale']}° | {r['length_m']} | {r['max_slope']}° | "
                     f"{r['mean_slope']}° | {r['steep_pct']}% | {r['tdi']} |")
    else:
        lines.append(f"| {r['label']} | {r['no_go']}° | {r['scale']}° | no path found | | | | |")
lines += ["", ("In every case where a path exists, the terrain-aware route scores lower than the direct route."
               if all_beat else
               "The terrain-aware route does **not** beat the direct route in every case; see the table.")]
(ROOT / "sensitivity-results.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
print("\n".join(lines))
