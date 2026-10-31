"""Pixel chibi sprites for 王心 / 岛小王 / 十一, matching their new outfits.

Draws at 45x55 (2x = 90x110, same grid as 右小唐's pixel sprite), writes the
SVG into public/art/<boss>.svg and a 4x preview into art_preview/.
"""

from PIL import Image, ImageDraw

W, H = 45, 55

BASE = {
    "outline": (24, 22, 26, 255),
    "skin": (242, 207, 185, 255),
    "skin2": (216, 166, 145, 255),
    "white": (247, 241, 229, 255),
    "white2": (214, 207, 194, 255),
    "shadow": (20, 18, 15, 60),
}

PALETTES = {
    "wangxin": {
        "hair": (26, 24, 30, 255),
        "hair2": (42, 39, 48, 255),
        "hair3": (60, 56, 66, 255),
        "shirt": (40, 58, 88, 255),
        "shirt2": (52, 74, 108, 255),
        "shirt3": (27, 39, 60, 255),
        "pants": (30, 40, 58, 255),
        "pants2": (22, 30, 44, 255),
        "belt": (22, 22, 26, 255),
        "buckle": (150, 148, 150, 255),
        "shoe": (226, 226, 228, 255),
        "shoe2": (168, 170, 176, 255),
        "eye": (60, 62, 70, 255),
        "glass": (32, 30, 34, 255),
        "pen": (36, 34, 40, 255),
    },
    "daoxiaowang": {
        "hair": (28, 26, 30, 255),
        "hair2": (45, 42, 46, 255),
        "hair3": (62, 58, 62, 255),
        "jacket": (34, 46, 66, 255),
        "jacket2": (46, 60, 84, 255),
        "jacket3": (24, 33, 48, 255),
        "shirt": (238, 234, 224, 255),
        "shirt2": (206, 200, 188, 255),
        "pants": (28, 38, 54, 255),
        "pants2": (20, 28, 40, 255),
        "belt": (22, 22, 26, 255),
        "buckle": (150, 148, 150, 255),
        "shoe": (228, 228, 230, 255),
        "shoe2": (170, 172, 178, 255),
        "eye": (44, 40, 42, 255),
        "mop": (176, 176, 182, 255),
        "mop2": (132, 132, 138, 255),
        "mophead": (168, 164, 152, 255),
        "mophead2": (128, 124, 114, 255),
    },
    "shiyi": {
        "hair": (58, 42, 36, 255),
        "hair2": (78, 58, 48, 255),
        "hair3": (98, 74, 60, 255),
        "cardigan": (228, 196, 140, 255),
        "cardigan2": (244, 216, 166, 255),
        "cardigan3": (196, 164, 112, 255),
        "shirt": (238, 230, 216, 255),
        "shirt2": (208, 198, 182, 255),
        "skirt": (96, 78, 68, 255),
        "skirt2": (74, 60, 52, 255),
        "belt": (70, 56, 48, 255),
        "shoe": (34, 30, 32, 255),
        "shoe2": (58, 52, 54, 255),
        "eye": (58, 44, 40, 255),
        "folder": (86, 62, 46, 255),
        "folder2": (118, 88, 66, 255),
    },
}


class Canvas:
    def __init__(self, palette):
        self.im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.im)
        self.c = {**BASE, **palette}

    def r(self, x0, y0, x1, y1, c):
        self.d.rectangle((x0, y0, x1, y1), fill=self.c[c])

    def p(self, x, y, c):
        self.d.point((x, y), fill=self.c[c])

    def poly(self, pts, c):
        self.d.polygon(pts, fill=self.c[c])

    def line(self, pts, c):
        self.d.line(pts, fill=self.c[c])

    def blob(self, x0, y0, x1, y1, c):
        self.d.ellipse((x0, y0, x1, y1), fill=self.c[c])


def shadow(cv):
    cv.d.ellipse((9, 51, 36, 54), fill=BASE["shadow"])


def wangxin():
    cv = Canvas(PALETTES["wangxin"])
    shadow(cv)

    # legs / trousers
    cv.r(18, 43, 21, 51, "pants")
    cv.r(24, 43, 27, 51, "pants")
    cv.r(18, 43, 18, 50, "pants2")
    cv.r(27, 43, 27, 50, "pants2")
    # shoes
    cv.r(16, 51, 22, 53, "shoe")
    cv.r(23, 51, 29, 53, "shoe")
    cv.r(16, 53, 22, 53, "shoe2")
    cv.r(23, 53, 29, 53, "shoe2")

    # torso: navy short-sleeve shirt
    cv.poly([(15, 25), (18, 24), (27, 24), (30, 25), (31, 41), (14, 41)], "outline")
    cv.poly([(16, 26), (18, 25), (27, 25), (29, 26), (30, 40), (15, 40)], "shirt")
    cv.poly([(15, 27), (17, 26), (18, 41), (14, 40)], "shirt3")
    cv.poly([(29, 26), (30, 27), (31, 40), (27, 41)], "shirt3")
    # placket & buttons
    cv.r(22, 26, 23, 40, "shirt3")
    for y in (29, 33, 37):
        cv.p(22, y, "buckle")
    # pocket line
    cv.r(24, 30, 27, 30, "shirt2")
    # collar
    cv.poly([(19, 24), (22, 25), (22, 28), (20, 27)], "white")
    cv.poly([(26, 24), (23, 25), (23, 28), (25, 27)], "white")
    cv.poly([(19, 24), (22, 26), (22, 28), (20, 27)], "white2")

    # belt
    cv.r(15, 41, 30, 42, "belt")
    cv.r(21, 41, 23, 42, "buckle")

    # arms: short sleeves + forearms
    cv.poly([(15, 26), (12, 27), (12, 31), (16, 31)], "shirt")
    cv.poly([(29, 26), (32, 27), (32, 31), (28, 31)], "shirt")
    cv.r(12, 31, 14, 36, "skin")
    cv.r(29, 31, 31, 36, "skin")
    cv.r(12, 31, 12, 35, "skin2")
    cv.r(31, 31, 31, 35, "skin2")
    # cuffs
    cv.r(12, 30, 15, 31, "white")
    cv.r(28, 30, 31, 31, "white")
    # hands
    cv.r(12, 36, 14, 38, "skin")
    cv.r(30, 36, 32, 38, "skin")
    # pen in right hand
    cv.line([(31, 37), (35, 33)], "pen")
    cv.p(35, 32, "buckle")

    # neck
    cv.r(21, 21, 24, 25, "skin2")
    cv.r(21, 21, 23, 24, "skin")

    # head
    cv.poly([(16, 9), (29, 9), (31, 13), (31, 19), (29, 23), (22, 25), (16, 23), (14, 19), (14, 13)], "outline")
    cv.poly([(17, 10), (28, 10), (30, 13), (30, 19), (28, 22), (22, 24), (17, 22), (15, 19), (15, 13)], "skin")
    # ears
    cv.r(14, 15, 15, 18, "skin2")
    cv.r(30, 15, 31, 18, "skin2")

    # hair: messy black
    cv.poly(
        [(16, 5), (20, 3), (24, 4), (28, 3), (31, 6), (33, 10), (32, 15), (30, 14), (30, 9), (26, 7), (22, 8), (18, 7), (15, 9), (14, 14), (12, 15), (12, 9)],
        "outline",
    )
    cv.poly(
        [(16, 6), (20, 4), (24, 5), (28, 4), (30, 7), (32, 10), (31, 13), (29, 12), (29, 8), (26, 8), (22, 9), (18, 8), (16, 10), (15, 13), (13, 13), (13, 9)],
        "hair",
    )
    # spikes
    cv.poly([(19, 4), (21, 1), (22, 5)], "hair")
    cv.poly([(25, 4), (27, 1), (28, 5)], "hair")
    cv.poly([(13, 9), (10, 8), (12, 12)], "hair")
    cv.poly([(32, 9), (35, 8), (33, 12)], "hair")
    # bangs
    cv.poly([(15, 10), (18, 7), (21, 8), (23, 12), (26, 8), (30, 10), (29, 14), (26, 12), (24, 14), (22, 11), (20, 15), (17, 12), (15, 14)], "hair")
    cv.poly([(17, 10), (20, 8), (21, 11), (19, 12)], "hair2")
    cv.poly([(25, 8), (29, 10), (28, 13), (25, 11)], "hair2")
    # side locks
    cv.poly([(14, 12), (16, 12), (16, 21), (14, 22), (13, 17)], "hair")
    cv.poly([(31, 12), (29, 12), (29, 21), (31, 22), (32, 17)], "hair")

    # glasses: thin frames, lenses stay skin-coloured
    for x0, x1 in ((16, 20), (24, 28)):
        cv.r(x0, 15, x1, 15, "glass")
        cv.r(x0, 18, x1, 18, "glass")
        cv.r(x0, 15, x0, 18, "glass")
        cv.r(x1, 15, x1, 18, "glass")
    cv.r(21, 16, 23, 16, "glass")
    cv.p(30, 16, "glass")
    # eyes behind the lenses
    cv.r(18, 16, 19, 17, "white")
    cv.r(25, 16, 26, 17, "white")
    cv.p(18, 17, "eye")
    cv.p(25, 17, "eye")
    # brows
    cv.line([(17, 13), (20, 13)], "hair")
    cv.line([(24, 13), (27, 13)], "hair")
    # nose / mouth
    cv.p(22, 19, "skin2")
    cv.line([(21, 21), (23, 21)], "skin2")
    cv.p(21, 21, "outline")
    cv.p(23, 21, "outline")

    return cv.im


def daoxiaowang():
    cv = Canvas(PALETTES["daoxiaowang"])
    shadow(cv)

    # legs (wide)
    cv.r(15, 43, 20, 51, "pants")
    cv.r(24, 43, 29, 51, "pants")
    cv.r(15, 43, 15, 50, "pants2")
    cv.r(29, 43, 29, 50, "pants2")
    # shoes
    cv.r(13, 51, 21, 53, "shoe")
    cv.r(23, 51, 31, 53, "shoe")
    cv.r(13, 53, 21, 53, "shoe2")
    cv.r(23, 53, 31, 53, "shoe2")

    # mop behind body
    cv.r(35, 24, 36, 49, "mop")
    cv.r(35, 24, 35, 48, "mop2")
    cv.r(32, 49, 40, 51, "mophead2")
    cv.r(31, 51, 41, 54, "mophead")
    cv.r(32, 53, 40, 54, "mophead2")

    # jacket body (wide, open)
    cv.poly([(10, 26), (18, 24), (27, 24), (35, 26), (36, 43), (9, 43)], "outline")
    cv.poly([(11, 27), (18, 25), (27, 25), (34, 27), (35, 42), (10, 42)], "jacket")
    # jacket shading + open front
    cv.poly([(11, 27), (15, 26), (16, 42), (10, 42)], "jacket2")
    cv.poly([(34, 27), (30, 26), (29, 42), (35, 42)], "jacket2")
    cv.poly([(17, 25), (27, 25), (28, 42), (16, 42)], "outline")
    cv.poly([(18, 26), (26, 26), (27, 41), (17, 41)], "shirt")
    # belly shading
    cv.poly([(17, 34), (27, 34), (27, 41), (17, 41)], "shirt2")
    cv.poly([(17, 37), (27, 37), (27, 40), (17, 40)], "white2")
    # buttons
    for y in (28, 31, 34, 37):
        cv.p(22, y, "shirt2")
    # jacket collar
    cv.poly([(17, 24), (22, 23), (22, 26), (18, 26)], "jacket3")
    cv.poly([(27, 24), (22, 23), (22, 26), (26, 26)], "jacket3")
    # jacket buttons
    for y in (29, 33, 37):
        cv.p(30, y, "buckle")
    # belt
    cv.r(15, 42, 29, 43, "belt")
    cv.r(21, 42, 23, 43, "buckle")

    # arms
    cv.poly([(11, 27), (9, 33), (12, 40), (15, 39), (14, 32), (14, 28)], "jacket")
    cv.poly([(34, 27), (36, 33), (33, 40), (30, 39), (31, 32), (31, 28)], "jacket")
    cv.r(9, 40, 12, 43, "skin")
    cv.r(30, 40, 33, 43, "skin")
    # hand gripping mop
    cv.r(33, 30, 36, 33, "skin")
    cv.r(36, 30, 36, 33, "skin2")

    # neck
    cv.r(20, 21, 25, 25, "skin2")
    cv.r(20, 21, 24, 24, "skin")

    # head (round, wide)
    cv.poly([(15, 8), (30, 8), (32, 12), (32, 19), (29, 24), (22, 26), (15, 24), (12, 19), (12, 12)], "outline")
    cv.poly([(16, 9), (29, 9), (31, 12), (31, 19), (28, 23), (22, 25), (16, 23), (13, 19), (13, 12)], "skin")
    cv.r(12, 15, 13, 18, "skin2")
    cv.r(31, 15, 32, 18, "skin2")

    # short black hair
    cv.poly([(14, 6), (19, 4), (25, 4), (31, 6), (33, 11), (32, 15), (30, 13), (30, 8), (28, 7), (17, 7), (15, 8), (15, 13), (12, 15), (11, 11)], "outline")
    cv.poly([(15, 7), (19, 5), (25, 5), (30, 7), (32, 11), (31, 13), (29, 11), (29, 8), (26, 8), (22, 9), (18, 8), (16, 9), (16, 12), (13, 13), (12, 11)], "hair")
    cv.poly([(17, 7), (22, 6), (24, 9), (20, 9)], "hair2")
    cv.poly([(26, 6), (30, 8), (30, 11), (27, 9)], "hair2")
    # sideburns
    cv.r(13, 12, 14, 16, "hair")
    cv.r(31, 12, 32, 16, "hair")

    # brows (thick)
    cv.r(16, 13, 20, 13, "hair")
    cv.r(24, 13, 28, 13, "hair")
    # eyes (small)
    cv.r(18, 16, 19, 17, "eye")
    cv.r(25, 16, 26, 17, "eye")
    # nose / mouth
    cv.p(22, 19, "skin2")
    cv.line([(21, 21), (24, 21)], "skin2")
    # cheeks
    cv.p(16, 19, "skin2")
    cv.p(29, 19, "skin2")

    return cv.im


def shiyi():
    cv = Canvas(PALETTES["shiyi"])
    shadow(cv)

    # legs + heels
    cv.r(19, 46, 21, 50, "skin")
    cv.r(24, 46, 26, 50, "skin")
    cv.r(19, 46, 19, 49, "skin2")
    cv.r(26, 46, 26, 49, "skin2")
    cv.r(17, 50, 21, 52, "shoe")
    cv.r(24, 50, 28, 52, "shoe")
    cv.r(17, 52, 18, 53, "shoe2")
    cv.r(27, 52, 28, 53, "shoe2")

    # pencil skirt
    cv.poly([(15, 38), (30, 38), (32, 47), (13, 47)], "outline")
    cv.poly([(16, 39), (29, 39), (31, 46), (14, 46)], "skirt")
    cv.line([(22, 39), (22, 46)], "skirt2")
    cv.r(14, 46, 31, 46, "skirt2")

    # cardigan body
    cv.poly([(12, 26), (18, 24), (27, 24), (33, 26), (34, 41), (11, 41)], "outline")
    cv.poly([(13, 27), (18, 25), (27, 25), (32, 27), (33, 40), (12, 40)], "cardigan")
    # open front: shirt
    cv.poly([(18, 25), (27, 25), (28, 40), (17, 40)], "outline")
    cv.poly([(19, 26), (26, 26), (27, 39), (18, 39)], "shirt")
    cv.r(22, 27, 23, 39, "shirt2")
    # cardigan edges
    cv.poly([(13, 27), (16, 26), (17, 40), (12, 40)], "cardigan2")
    cv.poly([(32, 27), (29, 26), (28, 40), (33, 40)], "cardigan3")
    # collar
    cv.poly([(19, 24), (22, 25), (22, 28), (19, 27)], "shirt")
    cv.poly([(26, 24), (23, 25), (23, 28), (26, 27)], "shirt")
    # buttons
    for y in (28, 32, 36):
        cv.p(17, y, "cardigan3")
    cv.p(28, y, "cardigan3")

    # arms
    cv.poly([(13, 27), (10, 29), (10, 38), (14, 39), (15, 33)], "cardigan")
    cv.poly([(32, 27), (35, 29), (35, 38), (31, 39), (30, 33)], "cardigan")
    cv.r(10, 38, 13, 40, "skin")
    cv.r(32, 38, 35, 40, "skin")

    # folder in left hand
    cv.poly([(7, 31), (13, 30), (14, 37), (8, 38)], "outline")
    cv.poly([(8, 32), (12, 31), (13, 36), (9, 37)], "folder")
    cv.r(8, 33, 12, 33, "folder2")
    # gripping fingers
    cv.r(12, 34, 14, 36, "skin")

    # neck
    cv.r(21, 21, 24, 25, "skin2")
    cv.r(21, 21, 23, 24, "skin")

    # head
    cv.poly([(16, 9), (29, 9), (31, 13), (31, 19), (28, 23), (22, 24), (16, 23), (14, 19), (14, 13)], "outline")
    cv.poly([(17, 10), (28, 10), (30, 13), (30, 19), (27, 22), (22, 23), (17, 22), (15, 19), (15, 13)], "skin")
    cv.r(14, 15, 15, 18, "skin2")
    cv.r(30, 15, 31, 18, "skin2")

    # bob hair
    cv.poly([(15, 5), (30, 5), (33, 9), (34, 17), (32, 21), (30, 21), (30, 8), (28, 7), (17, 8), (15, 15), (14, 21), (12, 21), (11, 17), (12, 9)], "outline")
    cv.poly([(16, 6), (29, 6), (32, 9), (33, 17), (31, 20), (29, 20), (29, 8), (28, 6), (17, 7), (16, 14), (15, 20), (13, 20), (12, 17), (13, 9)], "hair")
    cv.poly([(15, 6), (20, 5), (22, 8), (18, 8)], "hair2")
    cv.poly([(25, 5), (30, 7), (30, 10), (26, 8)], "hair2")
    # bangs
    cv.poly([(16, 8), (20, 6), (23, 8), (25, 6), (29, 8), (28, 12), (25, 10), (22, 12), (19, 10), (17, 12)], "hair")
    # side hair
    cv.r(13, 12, 14, 20, "hair")
    cv.r(30, 12, 31, 20, "hair")

    # brows
    cv.line([(17, 13), (20, 13)], "hair")
    cv.line([(24, 13), (27, 13)], "hair")
    # eyes
    cv.r(18, 16, 19, 17, "eye")
    cv.r(25, 16, 26, 17, "eye")
    cv.p(18, 16, "white")
    cv.p(25, 16, "white")
    # nose / mouth
    cv.p(22, 19, "skin2")
    cv.line([(21, 21), (23, 21)], "skin2")
    cv.p(16, 19, "skin2")
    cv.p(29, 19, "skin2")

    return cv.im


def export(im, boss, title):
    W2, H2 = im.size
    px = im.load()

    def css(c):
        r, g, b, a = c
        return f"#{r:02x}{g:02x}{b:02x}" if a == 255 else f"rgba({r},{g},{b},{a / 255:.3f})"

    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W2 * 2}" height="{H2 * 2}" viewBox="0 0 {W2 * 2} {H2 * 2}" shape-rendering="crispEdges">']
    parts.append(f"<title>{title}</title>")
    for y in range(H2):
        x = 0
        while x < W2:
            c = px[x, y]
            if c[3] == 0:
                x += 1
                continue
            x2 = x + 1
            while x2 < W2 and px[x2, y] == c:
                x2 += 1
            parts.append(f'<rect x="{x * 2}" y="{y * 2}" width="{(x2 - x) * 2}" height="2" fill="{css(c)}"/>')
            x = x2
    parts.append("</svg>")
    svg = "\n".join(parts)
    out = rf"C:\Users\q4421\Documents\deepseek-harness\default-workspace\projects\novel-heist\public\art\{boss}.svg"
    open(out, "w", encoding="utf-8").write(svg)
    print("wrote", out, len(svg))


if __name__ == "__main__":
    import os

    base = r"C:\Users\q4421\Documents\deepseek-harness\default-workspace\projects\novel-heist\art_preview"
    for boss, fn, title in (
        ("wangxin", wangxin, "王心 · 像素校服"),
        ("daoxiaowang", daoxiaowang, "岛小王 · 像素校服"),
        ("shiyi", shiyi, "十一 · 像素便装"),
    ):
        im = fn()
        im.resize((W * 8, H * 8), Image.Resampling.NEAREST).save(os.path.join(base, f"{boss}_pixel_preview.png"))
        export(im, boss, title)
