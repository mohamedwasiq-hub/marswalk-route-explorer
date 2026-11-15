# AI-assisted: written with an AI coding assistant (Claude), directed and reviewed by the team. NASA Space Apps 2026 SI disclosure.
"""Route sampling, least-cost routing and the Terrain Difficulty Index.

Pure functions on numpy arrays, so they can be unit-tested on synthetic grids
(see test_method.py). All distances are horizontal ground metres.
"""
from __future__ import annotations

import heapq
import math

import numpy as np

# ---- Illustrative parameters (prototype choices, not NASA standards) ----
SLOPE_REF_DEG = 25.0      # slope at which the slope burden saturates to 1
STEEP_FLAG_DEG = 15.0     # "steep" flag used in summaries (illustrative)
NO_GO_DEG = 25.0          # least-cost router treats cells steeper than this as blocked
ROUTER_SLOPE_SCALE = 10.0 # router step cost = distance * (1 + (slope/scale)^2)
SAMPLE_STEP_M = 6.0       # route sampling interval
SEGMENT_M = 60.0          # length of an inspectable segment
DEFAULT_WEIGHTS = {"slope": 0.6, "length": 0.3, "coverage": 0.1}


def bilinear(grid: np.ndarray, y: np.ndarray, x: np.ndarray) -> np.ndarray:
    """Bilinear sample at fractional (row, col). NaN if outside or any corner is NaN."""
    h, w = grid.shape
    out = np.full(y.shape, np.nan, dtype=np.float64)
    inside = (y >= 0) & (x >= 0) & (y <= h - 1) & (x <= w - 1)
    yi, xi = y[inside], x[inside]
    y0 = np.clip(np.floor(yi).astype(int), 0, h - 2)
    x0 = np.clip(np.floor(xi).astype(int), 0, w - 2)
    fy, fx = yi - y0, xi - x0
    g00, g01 = grid[y0, x0], grid[y0, x0 + 1]
    g10, g11 = grid[y0 + 1, x0], grid[y0 + 1, x0 + 1]
    out[inside] = (g00 * (1 - fy) * (1 - fx) + g01 * (1 - fy) * fx
                   + g10 * fy * (1 - fx) + g11 * fy * fx)
    return out


def resample_polyline(pts_m: np.ndarray, step: float) -> tuple[np.ndarray, np.ndarray]:
    """Points every `step` metres along a polyline given in metres (x, y). Returns (points, chainage)."""
    seg = np.diff(pts_m, axis=0)
    seglen = np.hypot(seg[:, 0], seg[:, 1])
    cum = np.concatenate([[0.0], np.cumsum(seglen)])
    total = cum[-1]
    n = max(int(math.floor(total / step)), 1)
    s = np.concatenate([np.arange(n + 1) * step, [total]]) if n * step < total else np.arange(n + 1) * step
    x = np.interp(s, cum, pts_m[:, 0])
    y = np.interp(s, cum, pts_m[:, 1])
    return np.column_stack([x, y]), s


def sample_route(pts_m: np.ndarray, elev: np.ndarray, slope: np.ndarray, dx: float, dy: float,
                 step: float = SAMPLE_STEP_M) -> dict:
    """Sample elevation and terrain slope along a route. pts_m are (x_east_m, y_south_m)."""
    p, s = resample_polyline(pts_m, step)
    rows, cols = p[:, 1] / dy, p[:, 0] / dx
    z = bilinear(elev, rows, cols)
    sl = bilinear(slope, rows, cols)
    valid = ~np.isnan(z) & ~np.isnan(sl)
    dz = np.diff(z)
    dh = np.diff(s)
    with np.errstate(invalid="ignore", divide="ignore"):
        grade = np.degrees(np.arctan(np.abs(dz) / dh))
    return {"xy": p, "chainage": s, "elev": z, "slope": sl, "valid": valid, "grade": grade, "dz": dz}


def summarize(samp: dict, straight_m: float) -> dict:
    v = samp["valid"]
    sl = samp["slope"][v]
    dz = samp["dz"][~np.isnan(samp["dz"])]
    length = float(samp["chainage"][-1])
    return {
        "length_m": length,
        "straight_m": straight_m,
        "detour_pct": 100.0 * (length - straight_m) / straight_m if straight_m > 0 else 0.0,
        "ascent_m": float(dz[dz > 0].sum()),
        "descent_m": float(-dz[dz < 0].sum()),
        "max_slope_deg": float(sl.max()) if sl.size else float("nan"),
        "mean_slope_deg": float(sl.mean()) if sl.size else float("nan"),
        "p90_slope_deg": float(np.percentile(sl, 90)) if sl.size else float("nan"),
        "steep_share_pct": float(100.0 * (sl > STEEP_FLAG_DEG).mean()) if sl.size else float("nan"),
        "coverage_pct": float(100.0 * v.mean()),
        "n_samples": int(v.size),
    }


def components(samp: dict, straight_m: float) -> dict:
    """Normalised 0..1 burdens used by the TDI."""
    v = samp["valid"]
    sl = samp["slope"][v]
    S = float(np.clip(sl / SLOPE_REF_DEG, 0, 1).mean()) if sl.size else 1.0
    length = float(samp["chainage"][-1])
    L = float(np.clip((length - straight_m) / straight_m, 0, 1)) if straight_m > 0 else 0.0
    C = float(1.0 - v.mean())
    return {"S": S, "L": L, "C": C}


def tdi(comp: dict, w: dict = DEFAULT_WEIGHTS) -> float:
    tot = w["slope"] + w["length"] + w["coverage"]
    return 100.0 * (w["slope"] * comp["S"] + w["length"] * comp["L"] + w["coverage"] * comp["C"]) / tot


def segments(samp: dict, seg_m: float = SEGMENT_M) -> list[dict]:
    s = samp["chainage"]
    out = []
    edges = np.arange(0, s[-1] + seg_m, seg_m)
    for i in range(len(edges) - 1):
        m = (s >= edges[i]) & (s <= min(edges[i + 1], s[-1]))
        if m.sum() < 2:
            continue
        idx = np.where(m)[0]
        v = samp["valid"][idx]
        sl = samp["slope"][idx][v]
        z = samp["elev"][idx]
        out.append({
            "i": len(out),
            "from_m": float(s[idx[0]]), "to_m": float(s[idx[-1]]),
            "i0": int(idx[0]), "i1": int(idx[-1]),
            "elev_start": float(z[0]) if not np.isnan(z[0]) else None,
            "elev_end": float(z[-1]) if not np.isnan(z[-1]) else None,
            "max_slope": float(sl.max()) if sl.size else None,
            "mean_slope": float(sl.mean()) if sl.size else None,
            "burden": float(np.clip(sl / SLOPE_REF_DEG, 0, 1).mean()) if sl.size else None,
            "coverage_pct": float(100 * v.mean()),
        })
    return out


def least_cost_path(slope: np.ndarray, start: tuple[int, int], goal: tuple[int, int],
                    cell_dx: float, cell_dy: float) -> list[tuple[int, int]]:
    """A* on an 8-connected grid. Step cost = ground distance * (1 + (slope/scale)^2).

    Cells with slope > NO_GO_DEG or NaN are blocked. Returns list of (row, col).
    """
    h, w = slope.shape
    blocked = np.isnan(slope) | (slope > NO_GO_DEG)
    pen = 1.0 + (np.nan_to_num(slope) / ROUTER_SLOPE_SCALE) ** 2
    moves = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]
    mdist = [math.hypot(dr * cell_dy, dc * cell_dx) for dr, dc in moves]
    gr, gc = goal
    best = np.full((h, w), np.inf)
    parent = np.full((h, w), -1, dtype=np.int64)
    sr, sc = start
    if blocked[sr, sc] or blocked[gr, gc]:
        raise ValueError("start or goal is on a blocked cell")
    best[sr, sc] = 0.0
    heap = [(0.0, 0.0, sr, sc)]
    while heap:
        f, g, r, c = heapq.heappop(heap)
        if (r, c) == goal:
            break
        if g > best[r, c]:
            continue
        for (dr, dc), md in zip(moves, mdist):
            nr, nc = r + dr, c + dc
            if nr < 0 or nc < 0 or nr >= h or nc >= w or blocked[nr, nc]:
                continue
            ng = g + md * 0.5 * (pen[r, c] + pen[nr, nc])
            if ng < best[nr, nc]:
                best[nr, nc] = ng
                parent[nr, nc] = r * w + c
                hcost = math.hypot((gr - nr) * cell_dy, (gc - nc) * cell_dx)
                heapq.heappush(heap, (ng + hcost, ng, nr, nc))
    if not np.isfinite(best[gr, gc]):
        raise ValueError("no path found")
    path = [(gr, gc)]
    cur = gr * w + gc
    while parent.flat[cur] != -1:
        cur = int(parent.flat[cur])
        path.append((cur // w, cur % w))
    return path[::-1]


def simplify(pts: np.ndarray, tol: float) -> np.ndarray:
    """Ramer-Douglas-Peucker polyline simplification (metres)."""
    if len(pts) < 3:
        return pts
    a, b = pts[0], pts[-1]
    ab = b - a
    n = np.hypot(*ab)
    if n == 0:
        d = np.hypot(*(pts - a).T)
    else:
        d = np.abs(ab[0] * (pts[:, 1] - a[1]) - ab[1] * (pts[:, 0] - a[0])) / n
    i = int(np.argmax(d))
    if d[i] > tol:
        left = simplify(pts[: i + 1], tol)
        right = simplify(pts[i:], tol)
        return np.vstack([left[:-1], right])
    return np.vstack([a, b])
