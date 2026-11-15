# AI-assisted: written with an AI coding assistant (Claude), directed and reviewed by the team. NASA Space Apps 2026 SI disclosure.
"""Validation checks from the brief (section 9). Run: ..\\.venv\\Scripts\\python.exe test_method.py

Prints each check and writes the results table to ../validation-results.md.
"""
from __future__ import annotations

import math
from datetime import datetime

import numpy as np

import method as M
from dtm import ROOT, load_dtm, slope_degrees

results = []


def check(name, ok, detail):
    results.append((name, "PASS" if ok else "FAIL", detail))
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: {detail}")


# 1. Flat grid -> slope 0
flat = np.full((50, 60), -2500.0, np.float32)
s = slope_degrees(flat, 0.99, 1.01)
check("Flat grid slope", float(np.abs(s).max()) < 1e-6, f"max slope {float(np.abs(s).max()):.2e} deg (expect 0)")

# 2. Plane with known rise/run, unequal dx/dy
dx, dy = 0.9913, 1.0096
rows, cols = np.mgrid[0:80, 0:80]
plane = (0.5 * cols * dx).astype(np.float64)          # 0.5 m rise per m east -> 26.565 deg
s = slope_degrees(plane, dx, dy)
exp = math.degrees(math.atan(0.5))
check("East-facing plane", abs(float(s[10:-10, 10:-10].mean()) - exp) < 1e-3,
      f"got {float(s.mean()):.4f}, expected {exp:.4f} deg")
plane2 = 0.3 * rows * dy + 0.4 * cols * dx               # gradient magnitude 0.5 -> 26.565 deg
s2 = slope_degrees(plane2, dx, dy)
check("Diagonal plane (dx != dy)", abs(float(s2.mean()) - exp) < 1e-3,
      f"got {float(s2.mean()):.4f}, expected {exp:.4f} deg")
s_wrong = slope_degrees(plane2, 1.0096, 1.0096)
check("Ignoring dx/dy difference changes result", abs(float(s_wrong.mean()) - exp) > 0.05,
      f"with equal spacing {float(s_wrong.mean()):.4f} deg vs true {exp:.4f} deg: the correction matters")

# 3. Route length: straight vs detour
g = np.zeros((200, 200))
sl = np.zeros((200, 200))
straight = np.array([[10.0, 10.0], [110.0, 10.0]])
detour = np.array([[10.0, 10.0], [60.0, 60.0], [110.0, 10.0]])
a = M.sample_route(straight, g, sl, 1.0, 1.0)
b = M.sample_route(detour, g, sl, 1.0, 1.0)
exp_det = 2 * math.hypot(50, 50)
check("Straight route length", abs(a["chainage"][-1] - 100.0) < 1e-9, f"{a['chainage'][-1]:.3f} m (expect 100)")
check("Detour route length", abs(b["chainage"][-1] - exp_det) < 1e-9,
      f"{b['chainage'][-1]:.3f} m (expect {exp_det:.3f})")
check("Detour burden L > 0", M.components(b, 100.0)["L"] > 0 and M.components(a, 100.0)["L"] == 0,
      f"L straight {M.components(a, 100.0)['L']:.3f}, detour {M.components(b, 100.0)['L']:.3f}")

# 4. No-data route -> coverage drops, burden C rises
g2 = g.copy()
g2[:, 40:60] = np.nan
c = M.sample_route(straight, g2, sl, 1.0, 1.0)
cov = 100 * c["valid"].mean()
check("No-data lowers coverage", cov < 100 and M.components(c, 100.0)["C"] > 0,
      f"coverage {cov:.1f}%, C {M.components(c, 100.0)['C']:.3f}")

# 5. Weight change changes TDI but not raw measurements
comp = {"S": 0.3, "L": 0.1, "C": 0.0}
t1 = M.tdi(comp, {"slope": 0.6, "length": 0.3, "coverage": 0.1})
t2 = M.tdi(comp, {"slope": 0.2, "length": 0.7, "coverage": 0.1})
check("Weights change TDI only", t1 != t2 and comp == {"S": 0.3, "L": 0.1, "C": 0.0},
      f"TDI {t1:.1f} -> {t2:.1f}; components unchanged")

# 6. Router avoids a wall it can go around
wall = np.zeros((60, 60))
wall[10:50, 30] = 40.0  # steep wall with gaps at top and bottom
path = M.least_cost_path(wall, (30, 5), (30, 55), 1.0, 1.0)
crosses = any(c == 30 and 10 <= r < 50 for r, c in path)
check("Router goes around no-go wall", not crosses, f"{len(path)} steps, crosses wall: {crosses}")

# 7. Real data: bilinear sample at a grid node equals the grid value
d = load_dtm()
clip = d.elev[4600:4700, 2200:2300].astype(np.float64)
z = M.bilinear(clip, np.array([10.0, 55.0]), np.array([20.0, 70.0]))
check("Sampler matches DTM at grid nodes", np.allclose(z, [clip[10, 20], clip[55, 70]]),
      f"sampled {z.round(3).tolist()} vs DTM {[round(float(clip[10, 20]), 3), round(float(clip[55, 70]), 3)]}")

# 8. Real data: DTM range matches label
v = d.elev[~np.isnan(d.elev)]
check("DTM range matches label", abs(v.min() - (-2600.51)) < 0.01 and abs(v.max() - (-2298.75)) < 0.01,
      f"min {v.min():.2f}, max {v.max():.2f} (label -2600.51 / -2298.75)")

# 9. Independent cross-check: slope from numpy.gradient vs hand-computed finite difference
r0, c0 = 2000 + 4600, 2000 + 2200
e = d.elev
gx = (e[r0, c0 + 1] - e[r0, c0 - 1]) / (2 * d.dx)
gy = (e[r0 + 1, c0] - e[r0 - 1, c0]) / (2 * d.dy)
hand = math.degrees(math.atan(math.hypot(gx, gy)))
lib = float(slope_degrees(e[r0 - 2:r0 + 3, c0 - 2:c0 + 3], d.dx, d.dy)[2, 2])
check("Slope vs hand calculation (real pixel)", abs(hand - lib) < 1e-4, f"numpy {lib:.4f} deg, by hand {hand:.4f} deg")

# 10. Cross-check with a different algorithm: Horn (1981) 3x3 slope, as used by GDAL/QGIS/ArcGIS.
# (GDAL itself is blocked on the build machine, so Horn's formula is implemented here directly.)
z = d.elev[5600:6600, 3200:4200].astype(np.float64)
zb = z.reshape(333, 3, 333, 3).mean(axis=(1, 3)) if z.shape[0] % 3 == 0 else z[:999, :999].reshape(333, 3, 333, 3).mean(axis=(1, 3))
cx, cy = d.dx * 3, d.dy * 3
a_, b_, c_ = zb[:-2, :-2], zb[:-2, 1:-1], zb[:-2, 2:]
d_, f_ = zb[1:-1, :-2], zb[1:-1, 2:]
g_, h_, i_ = zb[2:, :-2], zb[2:, 1:-1], zb[2:, 2:]
dzdx = ((c_ + 2 * f_ + i_) - (a_ + 2 * d_ + g_)) / (8 * cx)
dzdy = ((g_ + 2 * h_ + i_) - (a_ + 2 * b_ + c_)) / (8 * cy)
horn = np.degrees(np.arctan(np.hypot(dzdx, dzdy)))
ours = slope_degrees(zb, cx, cy)[1:-1, 1:-1]
diff = np.abs(horn - ours)
check("Slope vs Horn 3x3 method (1 km2 of real terrain)",
      float(np.median(diff)) < 0.5 and abs(float(horn.mean() - ours.mean())) < 0.5,
      f"mean slope ours {ours.mean():.2f} deg vs Horn {horn.mean():.2f} deg; median abs difference {np.median(diff):.2f} deg, "
      f"95th percentile {np.percentile(diff, 95):.2f} deg (Horn smooths more, so small differences are expected)")

n_fail = sum(1 for r in results if r[1] == "FAIL")
lines = [
    "# Validation results",
    "",
    f"Generated by `prep/test_method.py` on {datetime.now():%Y-%m-%d %H:%M}. "
    f"**{len(results) - n_fail} of {len(results)} checks passed.**",
    "",
    "These are software and data-integrity checks. They are **not** field validation on Mars.",
    "",
    "| Check | Result | Detail |",
    "|---|---|---|",
] + [f"| {n} | {r} | {dtl} |" for n, r, dtl in results]
(ROOT / "validation-results.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"\n{len(results) - n_fail}/{len(results)} passed")
raise SystemExit(1 if n_fail else 0)
