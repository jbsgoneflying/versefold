#!/usr/bin/env python3
"""Cut splash assets from the brand logos.

- Strips the white background by flood-filling from the image borders, so
  enclosed white shapes (the star inside the book) are preserved.
- Emits LaunchMark and SplashWordmark imagesets (1x/2x/3x) plus the
  LaunchBackground colorset into the app's asset catalog.
"""
import json
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "ios" / "Versefold" / "Assets.xcassets"

WHITE_THRESHOLD = 242  # r,g,b all above this counts as background white


def strip_background(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
    w, h = img.size
    px = img.load()

    def is_white(x, y):
        r, g, b, a = px[x, y]
        return a > 0 and r >= WHITE_THRESHOLD and g >= WHITE_THRESHOLD and b >= WHITE_THRESHOLD

    seen = [[False] * h for _ in range(w)]
    queue = deque()
    for x in range(w):
        for y in (0, h - 1):
            if is_white(x, y) and not seen[x][y]:
                seen[x][y] = True
                queue.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if is_white(x, y) and not seen[x][y]:
                seen[x][y] = True
                queue.append((x, y))

    while queue:
        x, y = queue.popleft()
        px[x, y] = (0, 0, 0, 0)
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not seen[nx][ny] and is_white(nx, ny):
                seen[nx][ny] = True
                queue.append((nx, ny))
    return img


def write_imageset(name: str, img: Image.Image, point_width: int):
    folder = ASSETS / f"{name}.imageset"
    folder.mkdir(parents=True, exist_ok=True)
    ratio = img.height / img.width
    images = []
    for scale in (1, 2, 3):
        target_w = point_width * scale
        target_h = round(target_w * ratio)
        resized = img.resize((target_w, target_h), Image.LANCZOS)
        filename = f"{name.lower()}@{scale}x.png"
        resized.save(folder / filename)
        images.append({"filename": filename, "idiom": "universal", "scale": f"{scale}x"})
    (folder / "Contents.json").write_text(json.dumps({
        "images": images,
        "info": {"author": "xcode", "version": 1},
    }, indent=2))
    print(f"{name}: {point_width}pt wide, source {img.size}")


def write_colorset(name: str, r: int, g: int, b: int):
    folder = ASSETS / f"{name}.colorset"
    folder.mkdir(parents=True, exist_ok=True)
    (folder / "Contents.json").write_text(json.dumps({
        "colors": [{
            "color": {
                "color-space": "srgb",
                "components": {
                    "alpha": "1.000",
                    "red": f"0x{r:02X}", "green": f"0x{g:02X}", "blue": f"0x{b:02X}",
                },
            },
            "idiom": "universal",
        }],
        "info": {"author": "xcode", "version": 1},
    }, indent=2))
    print(f"{name}: #{r:02X}{g:02X}{b:02X}")


# The book mark, from the square logo.
mark = strip_background(Image.open(ROOT / "versefold-sq-logo.png"))
mark = mark.crop(mark.getbbox())
write_imageset("LaunchMark", mark, point_width=88)

# The wordmark, cropped out of the full lockup (everything right of the mark).
full = strip_background(Image.open(ROOT / "Versefold-logo-full.png"))
bbox = full.getbbox()
# The mark occupies roughly the left third; cut safely to its right.
wordmark = full.crop((330, bbox[1], bbox[2], bbox[3]))
wordmark = wordmark.crop(wordmark.getbbox())
write_imageset("SplashWordmark", wordmark, point_width=168)

# Brand.ivory (#FAF8F1) — the reader's page color, so launch, splash, and
# app all share one continuous surface.
write_colorset("LaunchBackground", 0xFA, 0xF8, 0xF1)
