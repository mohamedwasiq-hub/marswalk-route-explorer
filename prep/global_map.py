# AI-assisted: written with an AI coding assistant (Claude), directed and reviewed by the team. NASA Space Apps 2026 SI disclosure.
"""Build an offline whole-Mars base image from NASA Mars Trek tiles.

Stitches zoom-3 tiles (16 x 8) of the Viking MDIM 2.1 colour mosaic into one
4096 x 2048 equirectangular image: web/data/mars_global.jpg.
The app uses this offline and loads sharper Trek tiles on top when online.
Run: ..\\.venv\\Scripts\\python.exe global_map.py
"""
import io
import urllib.request
from concurrent.futures import ThreadPoolExecutor

from PIL import Image

from dtm import ROOT

LAYER = "Mars_Viking_MDIM21_ClrMosaic_global_232m"
URL = "https://trek.nasa.gov/tiles/Mars/EQ/" + LAYER + "/1.0.0/default/default028mm/{z}/{y}/{x}.jpg"
Z = 3
NX, NY = 2 ** (Z + 1), 2 ** Z


def fetch(xy):
    x, y = xy
    req = urllib.request.Request(URL.format(z=Z, x=x, y=y), headers={"User-Agent": "marswalk-build"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return xy, Image.open(io.BytesIO(r.read())).convert("RGB")
        except Exception as ex:  # retry transient network errors
            last = ex
    raise SystemExit(f"tile {xy} failed: {last}")


out = Image.new("RGB", (NX * 256, NY * 256))
with ThreadPoolExecutor(8) as pool:
    for (x, y), tile in pool.map(fetch, [(x, y) for y in range(NY) for x in range(NX)]):
        out.paste(tile, (x * 256, y * 256))
dest = ROOT / "web" / "data" / "mars_global.jpg"
out.save(dest, quality=84, optimize=True)
print("wrote", dest.name, out.size, f"{dest.stat().st_size / 1e6:.2f} MB")
