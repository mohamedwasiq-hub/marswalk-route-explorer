# AI-assisted: written with an AI coding assistant (Claude), directed and reviewed by the team. NASA Space Apps 2026 SI disclosure.
"""Static check image: ortho + slope + routes. Used to eyeball alignment (data/explore/preview.png)."""
import json

from PIL import Image, ImageDraw

from dtm import ROOT

W = ROOT / "web" / "data"
meta = json.loads((W / "meta.json").read_text())
routes = json.loads((W / "routes.json").read_text())
ortho = Image.open(W / "ortho.jpg").convert("RGBA")
slope = Image.open(W / "slope.png").resize(ortho.size)
img = Image.alpha_composite(ortho, slope)
sx = ortho.width / meta["width_m"]
sy = ortho.height / meta["height_m"]
dr = ImageDraw.Draw(img)
colors = {"A": (80, 170, 255, 255), "B": (60, 230, 120, 255)}
for rt in routes:
    pts = [(x * sx, y * sy) for x, y in rt["vertices_m"]]
    dr.line(pts, fill=colors[rt["id"]], width=5)
for key, col in [("start", (255, 255, 255, 255)), ("goal", (255, 220, 0, 255))]:
    p = meta[key]
    dr.ellipse([p["x"] * sx - 9, p["y"] * sy - 9, p["x"] * sx + 9, p["y"] * sy + 9], fill=col)
img = img.resize((img.width // 2, img.height // 2))
(ROOT / "data" / "explore").mkdir(parents=True, exist_ok=True)
img.convert("RGB").save(ROOT / "data" / "explore" / "preview.png")
print("ok", img.size)
