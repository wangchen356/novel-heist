"""Cut white backgrounds and align the debate portraits of every boss.

Source art lives in art_src/<boss>/ (1024x1536 renders on white).
Output goes to public/art/<boss>/ as 760x1240 transparent PNGs with a shared
framing: face centred at x=380, hair top at y=24, head height ~330px.

Run with the bundled Python (numpy + Pillow):
    python scripts/prep_portrait_states.py [boss ...]
"""

from __future__ import annotations

import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT, "art_src")
OUT_DIR = os.path.join(ROOT, "public", "art")
PREVIEW_DIR = os.path.join(ROOT, "art_preview")

CANVAS_W, CANVAS_H = 760, 1240
FACE_X, HEAD_TOP = 380, 24
TARGET_HEAD_H = 330

# top = hair top, cx = hair/face centre on the source image.
BOSSES: dict[str, dict] = {
    "youxiaotang": {
        "head_target": True,
        "states": [
            ("state1_calm", "state_01_calm.png", dict(cx=505, top=25, chin=370)),
            ("state3_tired", "state_02_tired.png", dict(cx=557, top=30, chin=400)),
            ("state2_angry", "state_03_angry.png", dict(cx=485, top=20, chin=390)),
        ],
    },
    "wangxin": {
        "scale": 1.20,
        "states": [
            ("state1_pen", "state_01_calm.png", dict(cx=514, top=29)),
            ("state2_shout", "state_02_shout.png", dict(cx=497, top=92)),
            ("state3_flustered", "state_03_flustered.png", dict(cx=465, top=139)),
        ],
    },
    "daoxiaowang": {
        "scale": 1.08,
        "states": [
            ("state1_mop", "state_01_calm.png", dict(cx=511, top=21)),
            ("state2_angry", "state_02_angry.png", dict(cx=501, top=16)),
            ("state3_placate", "state_03_placate.png", dict(cx=503, top=39)),
        ],
    },
    "shiyi": {
        "scale": 1.22,
        "states": [
            ("state1_book", "state_01_calm.png", dict(cx=510, top=36)),
            ("state2_hips", "state_02_stern.png", dict(cx=504, top=61)),
            ("state3_tired", "state_03_tired.png", dict(cx=477, top=41)),
        ],
    },
}


def cut_white(im: Image.Image) -> tuple[np.ndarray, np.ndarray]:
    """Return premultiplied RGB and alpha for a white-background render."""
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
    # fill cannot reach it. Neutral islands hugging the silhouette are
    # repainted with the surrounding dark colour instead of being cut out.
    near_bg = np.asarray(
        Image.fromarray(np.where(bg, 255, 0).astype(np.uint8), "L").filter(ImageFilter.MaxFilter(31))
    ) > 0
    cand = neutral & ~bg
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
    soft = np.clip((235.0 - lum) / 200.0, 0.0, 1.0)
    alpha[band] = soft[band]

    # Choke the matte by ~2px: the renders carry a pale keyline that would
    # otherwise read as a white outline on the dark battle panel.
    choked = Image.fromarray((alpha * 255).astype(np.uint8), "L").filter(ImageFilter.MinFilter(5))
    alpha = np.asarray(choked.filter(ImageFilter.GaussianBlur(0.7))).astype(np.float32) / 255.0

    premul = np.clip(rgb - 255.0 * (1.0 - alpha[..., None]), 0.0, 255.0)

    # Edge colour extension: borrow the colour of nearby opaque pixels so the
    # semi-transparent rim fades into hair instead of glowing white.
    pb = np.asarray(Image.fromarray(np.clip(premul, 0, 255).astype(np.uint8), "RGB").filter(ImageFilter.GaussianBlur(5))).astype(np.float32)
    ab = np.asarray(Image.fromarray(np.clip(alpha * 255, 0, 255).astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(5))).astype(np.float32) / 255.0
    ext = pb / np.maximum(ab[..., None], 1e-3)
    rim = alpha < 0.92
    rgb = np.where(rim[..., None], np.clip(ext, 0, 255), rgb)

    # Bright specks that survived along the silhouette borrow the local hair
    # colour instead of sparkling against the dark panel.
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


def build(boss: str, src_name: str, cfg: dict, scale: float) -> Image.Image:
    src = Image.open(os.path.join(SRC_DIR, boss, src_name + ".png")).convert("RGB")
    premul, alpha = cut_white(src)
    size = (round(src.width * scale), round(src.height * scale))
    premul, alpha = resize_pair(premul, alpha, size)

    left = round(cfg["cx"] * scale - FACE_X)
    top = round(cfg["top"] * scale - HEAD_TOP)
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


def make_preview(boss: str, images: list[tuple[str, Image.Image]]) -> None:
    tw, th = CANVAS_W // 2, CANVAS_H // 2
    bg = (24, 22, 20)

    def flatten(img: Image.Image) -> Image.Image:
        layer = Image.new("RGBA", img.size, bg + (255,))
        layer.alpha_composite(img)
        return layer.convert("RGB").resize((tw, th), Image.LANCZOS)

    sheet = Image.new("RGB", (tw * len(images) + 10 * (len(images) + 1), th + 20), bg)
    for i, (_, img) in enumerate(images):
        sheet.paste(flatten(img), (10 + i * (tw + 10), 10))
    sheet.save(os.path.join(PREVIEW_DIR, f"{boss}_states_sheet.png"))


def main(targets: list[str]) -> None:
    os.makedirs(PREVIEW_DIR, exist_ok=True)
    for boss, spec in BOSSES.items():
        if targets and boss not in targets:
            continue
        out_dir = os.path.join(OUT_DIR, boss)
        os.makedirs(out_dir, exist_ok=True)
        images = []
        for src_name, out_name, cfg in spec["states"]:
            scale = TARGET_HEAD_H / (cfg["chin"] - cfg["top"]) if spec.get("head_target") else spec["scale"]
            img = build(boss, src_name, cfg, scale)
            img.save(os.path.join(out_dir, out_name), optimize=True)
            images.append((out_name, img))
            print("wrote", boss, out_name, img.size)
        make_preview(boss, images)


if __name__ == "__main__":
    main(sys.argv[1:])
