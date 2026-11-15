# AI-assisted: written with an AI coding assistant (Claude), directed and reviewed by the team. NASA Space Apps 2026 SI disclosure.
"""Overview images used once to choose the study clip. Output goes to data/explore/."""
import numpy as np
from PIL import Image, ImageDraw

from dtm import ROOT, load_dtm, hillshade, slope_degrees

OUT = ROOT / "data" / "explore"
OUT.mkdir(parents=True, exist_ok=True)

d = load_dtm()
k = 8  # downsample factor for the overview
e = d.elev[::k, ::k]
dx, dy = d.dx * k, d.dy * k
print("grid", d.elev.shape, "dx %.4f dy %.4f m  site lat %.4f" % (d.dx, d.dy, d.site_lat))

hs = hillshade(e, dx, dy, z=3.0)
sl = slope_degrees(e, dx, dy)
valid = ~np.isnan(e)

img = np.where(valid, (hs * 255), 40).astype(np.uint8)
im = Image.fromarray(img).convert("RGB")
dr = ImageDraw.Draw(im)
step = 1000 // k
for r in range(0, e.shape[0], step):
    dr.line([(0, r), (e.shape[1], r)], fill=(255, 80, 80))
    dr.text((2, r + 1), f"r{r*k}", fill=(255, 255, 0))
for c in range(0, e.shape[1], step):
    dr.line([(c, 0), (c, e.shape[0])], fill=(255, 80, 80))
    dr.text((c + 1, 2), f"c{c*k}", fill=(255, 255, 0))
im.save(OUT / "overview_hillshade.png")

# elevation colour + slope stats per 1 km block
lo, hi = np.nanpercentile(e, [1, 99])
el = np.where(valid, np.clip((e - lo) / (hi - lo), 0, 1) * 255, 0).astype(np.uint8)
Image.fromarray(el).save(OUT / "overview_elev.png")

print("block stats (1 km): row col valid% meanSlope p95Slope relief")
for r in range(0, d.elev.shape[0], 1000):
    for c in range(0, d.elev.shape[1], 1000):
        blk = d.elev[r:r + 1000:4, c:c + 1000:4]
        v = ~np.isnan(blk)
        if v.mean() < 0.95:
            continue
        s = slope_degrees(blk, d.dx * 4, d.dy * 4)
        s = s[~np.isnan(s)]
        print(f"{r:5d} {c:5d} {100*v.mean():5.1f} {s.mean():5.1f} {np.percentile(s,95):5.1f} {np.nanmax(blk)-np.nanmin(blk):6.1f}")
