"""Cut white backgrounds and align 右小唐's three debate portraits.

Source art lives in art_src/youxiaotang (1024x1536 AI renders on white).
Output goes to public/art/youxiaotang as 760x1240 transparent PNGs with a
shared framing: iris line at y=270, face centre at x=380, head height 372px.

Run with the bundled Python (numpy + Pillow):
    python scripts/prep_portrait_states.py
"""

from __future__ import annotations

import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT, "art_src", "youxiaotang")
OUT_DIR = os.path.join(ROOT, "public", "art", "youxiaotang")
PREVIEW_DIR = os.path.join(ROOT, "art_preview")

CANVAS_W, CANVAS_H = 760, 1240
IRIS_X, IRIS_Y = 380, 270
TARGET_HEAD_H = 372

# source name -> (face centre x, iris y, head top, chin)
ALIGN = {
    "state1_calm": dict(cx=505, iy=264, top=30, chin=395),
    "state3_tired": dict(cx=557, iy=298, top=35, chin=400),
    "state2_angry": dict(cx=485, iy=283, top=25, chin=400),
}
OUTPUT_NAME = {
    "state1_calm": "state_01_calm.png",
    "state3_tired": "state_02_tired.png",
    "state2_angry": "state_03_angry.png",
}


def cut_white(im: Image.Image) -> tuple[np.ndarray, np.ndarray]:
    """Return premultiplied RGB and alpha for a white-background render.

    Binary flood fill finds the background; a thin band along the silhouette
    gets a soft alpha derived from luminance so the white rim light of the
    render does not survive as a halo on dark panels.
    """
    arr = np.asarray(im.convert("RGB")).astype(np.int16)
    mn = arr.min(axis=2)
    mx = arr.max(axis=2)
    # neutral light pixels: white backdrop plus the pale fringe woven through
    # the hair. Skin is warm (max-min > 14) so it is never eaten.
    neutral = (mn >= 195) & ((mx - mn) <= 14)
    mask = Image.fromarray(np.where(neutral, 0, 128).astype(np.uint8), "L").copy()
    w, h = mask.size
    for xy in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)):
        ImageDraw.floodfill(mask, xy, 255, thresh=1)
    bg = np.asarray(mask) == 255

    alpha = np.where(bg, 0.0, 1.0).astype(np.float32)
    lum = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
    rgb = arr.astype(np.float32)

    # Backdrop trapped between hair strands stays fully enclosed, so the flood
    # fill cannot reach it. Thin neutral slivers inside the dark hair mass are
    # repainted with the surrounding hair colour instead of being cut out:
    # holes in a silhouette look worse than a touch of shadow.
    dark = lum < 90
    near_dark = np.asarray(
        Image.fromarray(np.where(dark, 255, 0).astype(np.uint8), "L").filter(ImageFilter.MaxFilter(13))
    ) > 0
    cand = neutral & ~bg
    near_bg = np.asarray(
        Image.fromarray(np.where(bg, 255, 0).astype(np.uint8), "L").filter(ImageFilter.MaxFilter(31))
    ) > 0
    seen = np.zeros_like(cand)
    for y0, x0 in zip(*np.nonzero(cand)):
        if seen[y0, x0]:
            continue
        stack = [(y0, x0)]
        seen[y0, x0] = True
        comp = []
        while stack:
            y, x = stack.pop()
            comp.append((y, x))
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and cand[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    stack.append((ny, nx))
        mean_y = float(np.mean([p[0] for p in comp]))
        edge_share = float(np.mean([near_bg[y, x] for y, x in comp]))
        if mean_y > 1150 or edge_share < 0.8:
            continue
        member = set(comp)
        ring_colors = []
        for y, x in comp[:: max(1, len(comp) // 200)]:
            for dy in range(-4, 5):
                for dx in range(-4, 5):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h and 0 <= nx < w and (ny, nx) not in member and lum[ny, nx] < 120:
                        ring_colors.append(arr[ny, nx])
        fill = np.median(np.array(ring_colors), axis=0) if ring_colors else np.array([24, 21, 24])
        for y, x in comp:
            rgb[y, x] = fill
    alpha[bg] = 0.0
    band = (np.asarray(mask.filter(ImageFilter.MaxFilter(9))) == 255) & ~bg
    lum = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
    soft = np.clip((235.0 - lum) / 200.0, 0.0, 1.0)
    alpha[band] = soft[band]

    premul = np.clip(rgb - 255.0 * (1.0 - alpha[..., None]), 0.0, 255.0)

    # Edge colour extension: borrow the colour of nearby opaque pixels so the
    # semi-transparent rim fades into hair instead of glowing white.
    pb = np.asarray(Image.fromarray(np.clip(premul, 0, 255).astype(np.uint8), "RGB").filter(ImageFilter.GaussianBlur(5))).astype(np.float32)
    ab = np.asarray(Image.fromarray(np.clip(alpha * 255, 0, 255).astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(5))).astype(np.float32) / 255.0
    ext = pb / np.maximum(ab[..., None], 1e-3)
    rim = alpha < 0.92
    rgb = np.where(rim[..., None], np.clip(ext, 0, 255), rgb)

    # Final pass: bright specks that survived along the silhouette (thin
    # strands, keying leftovers) borrow the local hair colour instead of
    # sparkling against the dark panel.
    trans = alpha < 0.15
    near_trans = np.asarray(
        Image.fromarray(np.where(trans, 255, 0).astype(np.uint8), "L").filter(ImageFilter.MaxFilter(7))
    ) > 0
    w_dark = ((alpha > 0.5) & (lum < 120)).astype(np.float32)
    num = np.asarray(Image.fromarray(np.clip(rgb * w_dark[..., None], 0, 255).astype(np.uint8), "RGB").filter(ImageFilter.GaussianBlur(4))).astype(np.float32)
    den = np.asarray(Image.fromarray((w_dark * 255).astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(4))).astype(np.float32) / 255.0
    darkcol = num / np.maximum(den[..., None], 1e-3)
    specks = near_trans & (alpha > 0.2) & (lum > 190)
    rgb = np.where(specks[..., None], np.clip(darkcol, 0, 255), rgb)
    premul = np.clip(rgb * alpha[..., None], 0.0, 255.0)
    return premul, alpha * 255.0


def resize_pair(premul: np.ndarray, alpha: np.ndarray, size: tuple[int, int]):
    p = Image.fromarray(np.clip(premul, 0, 255).astype(np.uint8), "RGB").resize(size, Image.LANCZOS)
    a = Image.fromarray(np.clip(alpha, 0, 255).astype(np.uint8), "L").resize(size, Image.LANCZOS)
    return np.asarray(p).astype(np.float32), np.asarray(a).astype(np.float32) / 255.0


def build(name: str) -> Image.Image:
    meta = ALIGN[name]
    head_h = meta["chin"] - meta["top"]
    scale = TARGET_HEAD_H / head_h
    src = Image.open(os.path.join(SRC_DIR, name + ".png")).convert("RGB")
    premul, alpha = cut_white(src)
    size = (round(src.width * scale), round(src.height * scale))
    premul, alpha = resize_pair(premul, alpha, size)

    left = round(meta["cx"] * scale - IRIS_X)
    top = round(meta["iy"] * scale - IRIS_Y)
    canvas_p = np.zeros((CANVAS_H, CANVAS_W, 3), np.float32)
    canvas_a = np.zeros((CANVAS_H, CANVAS_W), np.float32)

    sx0, sy0 = max(0, left), max(0, top)
    sx1, sy1 = min(size[0], left + CANVAS_W), min(size[1], top + CANVAS_H)
    dx0, dy0 = sx0 - left, sy0 - top
    canvas_p[dy0:dy0 + (sy1 - sy0), dx0:dx0 + (sx1 - sx0)] = premul[sy0:sy1, sx0:sx1]
    canvas_a[dy0:dy0 + (sy1 - sy0), dx0:dx0 + (sx1 - sx0)] = alpha[sy0:sy1, sx0:sx1]

    rgb = np.divide(canvas_p, np.maximum(canvas_a, 1e-4)[..., None])
    rgb = np.clip(rgb, 0, 255)
    a8 = np.clip(canvas_a * 255.0, 0, 255)
    a8[a8 < 3] = 0
    return Image.fromarray(np.dstack([rgb, a8]).astype(np.uint8), "RGBA")


def make_preview(images: dict[str, Image.Image]) -> None:
    tw, th = CANVAS_W // 2, CANVAS_H // 2
    bg = (24, 22, 20)
    names = ["state_01_calm", "state_02_tired", "state_03_angry"]

    def flatten(img: Image.Image) -> Image.Image:
        # composite at full size, then downscale: resizing RGBA directly would
        # blend un-premultiplied transparent pixels and fake a white fringe.
        layer = Image.new("RGBA", img.size, bg + (255,))
        layer.alpha_composite(img)
        return layer.convert("RGB").resize((tw, th), Image.LANCZOS)

    sheet = Image.new("RGB", (tw * 3 + 40, th + 20), bg)
    for i, n in enumerate(names):
        sheet.paste(flatten(images[n]), (10 + i * (tw + 10), 10))
    sheet.save(os.path.join(PREVIEW_DIR, "youxiaotang_states_sheet.png"))

    for a, b, label in ((names[0], names[1], "blend_1_2"), (names[1], names[2], "blend_2_3")):
        blend = Image.blend(images[a], images[b], 0.5)
        flatten(blend).save(os.path.join(PREVIEW_DIR, label + ".png"))


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    os.makedirs(PREVIEW_DIR, exist_ok=True)
    images: dict[str, Image.Image] = {}
    for src_name, out_name in OUTPUT_NAME.items():
        img = build(src_name)
        img.save(os.path.join(OUT_DIR, out_name), optimize=True)
        images[out_name.removesuffix(".png")] = img
        print("wrote", out_name, img.size)
    make_preview(images)


if __name__ == "__main__":
    main()
