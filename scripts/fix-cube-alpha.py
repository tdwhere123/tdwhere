"""Knock out JPEG flat backdrops and write real PNG alpha for cube faces."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

CUBE = Path(__file__).resolve().parents[1] / "public" / "cube"


def knock_out_backdrop(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            mx, mn = max(r, g, b), min(r, g, b)
            # flat near-white / light gray JPEG backdrop (no chroma)
            if mn >= 218 and (mx - mn) <= 14:
                px[x, y] = (r, g, b, 0)
            elif mn >= 200 and (mx - mn) <= 10:
                edge = min(x, y, w - 1 - x, h - 1 - y)
                if edge < int(0.12 * w):
                    px[x, y] = (r, g, b, 0)
    return im


def punch_shell_hole(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    x0, y0 = int(w * 0.15), int(h * 0.15)
    x1, y1 = int(w * 0.85), int(h * 0.85)
    chamfer = int(w * 0.035)
    for y in range(y0, y1):
        for x in range(x0, x1):
            dx = min(x - x0, x1 - 1 - x)
            dy = min(y - y0, y1 - 1 - y)
            interior = x0 + chamfer <= x < x1 - chamfer and y0 + chamfer <= y < y1 - chamfer
            if interior or dx + dy >= chamfer:
                r, g, b, _ = px[x, y]
                px[x, y] = (r, g, b, 0)
    return im


def main() -> None:
    faces = [
        "home.png",
        "alaya.png",
        "do-it.png",
        "write-right.png",
        "sentinel.png",
        "vegetarian.png",
    ]
    for name in faces:
        path = CUBE / name
        out = knock_out_backdrop(Image.open(path))
        out.save(path, "PNG", optimize=True)
        magic = path.read_bytes()[:4].hex()
        print(f"{name}: {path.stat().st_size} bytes magic={magic}")

    shell_path = CUBE / "shell.png"
    shell = punch_shell_hole(knock_out_backdrop(Image.open(shell_path)))
    shell.save(shell_path, "PNG", optimize=True)
    print(f"shell.png: {shell_path.stat().st_size} bytes magic={shell_path.read_bytes()[:4].hex()}")


if __name__ == "__main__":
    main()
