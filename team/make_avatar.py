# Draws the "Red Route Lab" team picture: a Mars disc with terrain contours and a
# dotted walking route between two waypoints. Hand-coded shapes, no AI imagery.
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

S = 4                      # supersampling factor for smooth edges
W = H = 1024
w, h = W * S, H * S
BG = (18, 16, 14)
RUST = (226, 115, 61)
SAND = (236, 229, 219)
GREEN = (94, 214, 160)

img = Image.new("RGB", (w, h), BG)
d = ImageDraw.Draw(img)

# planet disc with soft glow
cx, cy, r = w // 2, int(h * 0.42), int(w * 0.30)
glow = Image.new("RGB", (w, h), BG)
ImageDraw.Draw(glow).ellipse([cx - r - 60*S, cy - r - 60*S, cx + r + 60*S, cy + r + 60*S], fill=(70, 32, 18))
glow = glow.filter(ImageFilter.GaussianBlur(40 * S))
img.paste(glow)
d = ImageDraw.Draw(img)
d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(176, 78, 38))

# terrain contours clipped to the disc
mask = Image.new("L", (w, h), 0)
ImageDraw.Draw(mask).ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)
layer = Image.new("RGB", (w, h), (176, 78, 38))
ld = ImageDraw.Draw(layer)
for i in range(-6, 9):
    pts = []
    for x in range(cx - r - 40, cx + r + 40, 8 * S):
        t = (x - cx) / r
        y = cy + i * 34 * S + int(38 * S * math.sin(3.1 * t + i * 0.7) + 18 * S * math.sin(7.3 * t - i))
        pts.append((x, y))
    shade = (205, 98, 52) if i % 2 else (150, 64, 30)
    ld.line(pts, fill=shade, width=5 * S, joint="curve")
# a crater
ld.ellipse([cx - int(r*.62), cy - int(r*.52), cx - int(r*.30), cy - int(r*.20)], outline=(120, 50, 24), width=9*S)
img.paste(layer, (0, 0), mask)
d = ImageDraw.Draw(img)

# rim highlight
d.arc([cx - r, cy - r, cx + r, cy + r], start=200, end=320, fill=(240, 150, 95), width=6 * S)

# dotted walking route (a gentle S-curve across the disc)
route = []
for k in range(0, 101):
    t = k / 100
    x = cx - int(r * 0.66) + int(r * 1.32 * t)
    y = cy + int(r * 0.42) - int(r * 0.84 * t) + int(r * 0.22 * math.sin(2 * math.pi * t))
    route.append((x, y))
for k in range(0, len(route) - 1, 4):
    d.line([route[k], route[min(k + 2, len(route) - 1)]], fill=GREEN, width=14 * S)

# waypoints: start ring and destination diamond
sx, sy = route[0]
d.ellipse([sx - 30*S, sy - 30*S, sx + 30*S, sy + 30*S], fill=SAND)
d.ellipse([sx - 15*S, sy - 15*S, sx + 15*S, sy + 15*S], fill=BG)
ex, ey = route[-1]
q = 34 * S
d.polygon([(ex, ey - q), (ex + q, ey), (ex, ey + q), (ex - q, ey)], fill=(240, 196, 92), outline=BG)

# wordmark
big = ImageFont.truetype("C:/Windows/Fonts/bahnschrift.ttf", 118 * S)
big.set_variation_by_name("Bold")
small = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 40 * S)
title = "RED ROUTE LAB"
tw = d.textlength(title, font=big)
d.text(((w - tw) / 2, int(h * 0.775)), title, font=big, fill=SAND)
sub = "NASA SPACE APPS 2026  ·  ABU DHABI"
sw = d.textlength(sub, font=small)
d.text(((w - sw) / 2, int(h * 0.905)), sub, font=small, fill=RUST)

out = img.resize((W, H), Image.LANCZOS)
out.save("team/red-route-lab-avatar.png", optimize=True)
out.resize((400, 400), Image.LANCZOS).save("team/red-route-lab-avatar-400.png", optimize=True)
print("saved")
