#!/usr/bin/env python3
"""Convert generated PNGs to webp for the site and build the share card."""
import os, glob, re
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SRC = os.path.expanduser("~/code/sillage-demo/assets/img")
OUT = os.path.expanduser("~/code/sillage-demo/static/img")
os.makedirs(OUT, exist_ok=True)

for png in sorted(glob.glob(os.path.join(SRC, "*.png"))):
    name = os.path.splitext(os.path.basename(png))[0]
    dest = os.path.join(OUT, name + ".webp")
    im = Image.open(png).convert("RGB")
    im.save(dest, "WEBP", quality=82, method=6)
    print("webp", name, os.path.getsize(dest))

# share card 1200x630 from the hero
hero = os.path.join(SRC, "hero.png")
if os.path.exists(hero):
    im = Image.open(hero).convert("RGB")
    w, h = im.size
    target = 1200 / 630
    if w / h >= target:
        nw = int(h * target); im = im.crop(((w - nw) // 2, 0, (w + nw) // 2, h))
    else:
        nh = int(w / target); im = im.crop((0, (h - nh) // 2, w, (h + nh) // 2))
    im = im.resize((1200, 630), Image.LANCZOS)
    veil = Image.new("RGB", im.size, (11, 11, 12))
    im = Image.blend(im, veil, 0.35)
    grad = Image.new("L", (1200, 1))
    for x in range(1200):
        grad.putpixel((x, 0), int(238 * max(0.0, 1 - x / 760)))
    grad = grad.resize(im.size)
    im = Image.composite(Image.new("RGB", im.size, (8, 8, 9)), im, grad)
    d = ImageDraw.Draw(im)
    try:
        big = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf", 96)
        small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 26)
    except Exception:
        big = small = ImageFont.load_default()
    d.text((70, 250), "TOP SHELF", font=big, fill=(244, 240, 232))
    d.text((72, 360), "FRAGRANCES", font=small, fill=(244, 240, 232))
    d.text((74, 430), "Fragrance, by the millilitre.  5ml / 10ml / 15ml", font=small, fill=(201, 168, 106))
    im.save(os.path.join(OUT, "og.jpg"), "JPEG", quality=86)
    print("og", os.path.getsize(os.path.join(OUT, "og.jpg")))

# point front matter at the webp files
for md in glob.glob(os.path.expanduser("~/code/sillage-demo/content/fragrances/*.md")):
    s = open(md).read()
    s2 = s.replace('.jpg"', '.webp"')
    if s != s2:
        open(md, "w").write(s2)
        print("patched", os.path.basename(md))
