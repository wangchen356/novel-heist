"""Generate the game's vector art.

Everything is original SVG, built from simple comic shapes.  The game loads the
SVGs directly with Phaser (and as <img> elements in the DOM UI).
"""
from __future__ import annotations

import math
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "public" / "art"
ART.mkdir(parents=True, exist_ok=True)

INK = "#211d1a"
PAPER = "#f4ead8"
SKIN = "#f1c6a1"
SKIN_SHADE = "#d89a72"
WHITE = "#fbf6eb"
RED = "#c84938"
YELLOW = "#f0c04e"
BLUE = "#486b91"
GREEN = "#2e5547"
GREY = "#7a7f80"
DARK = "#34373a"


def save(name: str, width: int, height: int, body: str, defs: str = "") -> None:
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
        f'viewBox="0 0 {width} {height}" fill="none">'
        f"<defs>{defs}</defs>{body}</svg>"
    )
    (ART / name).write_text(svg, encoding="utf-8")


def outline(w: int = 4) -> str:
    return f'stroke="{INK}" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="round"'


# ---------------------------------------------------------------------------
# top-down characters
# ---------------------------------------------------------------------------
CHARACTERS = {
    "kanno": dict(
        skin=SKIN, shirt="#4d6d8f", pants="#2d3742", hair="#2a2422",
        style="messy", accessory="bandaid", scale=1.0,
    ),
    "houzi": dict(
        skin="#eec39e", shirt="#5b7254", pants="#3a3d3e", hair="#3a2b1e",
        style="messy", accessory="glasses", scale=0.94,
    ),
    "wangxin": dict(
        skin="#f3caa7", shirt="#e9e3d3", pants="#3e536a", hair="#2a2422",
        style="ponytail", accessory="armband", scale=1.0,
    ),
    "daoxiaowang": dict(
        skin="#e8b78e", shirt="#6e7b85", pants="#33373b", hair="#2b2420",
        style="slick", accessory="mop", scale=1.14,
    ),
    "youxiaotang": dict(
        skin="#f0c7a6", shirt="#7c6b57", pants="#4a4542", hair="#3c2a24",
        style="bob", accessory="book", scale=0.98,
    ),
    "shiyi": dict(
        skin="#e8c3a1", shirt="#3c4454", pants="#2c3038", hair="#2d2623",
        style="bun", accessory="glasses", scale=1.05,
    ),
}


def hair_shape(style: str, cx: float, cy: float, r: float) -> str:
    if style == "ponytail":
        return (
            f'<path d="M{cx-r} {cy-2} Q{cx-r+2} {cy-r-8} {cx} {cy-r-10} '
            f'Q{cx+r-1} {cy-r-7} {cx+r} {cy-1} Q{cx+10} {cy-r+2} {cx} {cy-r+3} '
            f'Q{cx-10} {cy-r+2} {cx-r} {cy-2}Z" fill="{INK}"/>'
            f'<path d="M{cx+r-5} {cy-3} q16 8 12 30 q-9 5 -13 -4 q7 -13 -4 -24Z" fill="{INK}"/>'
        )
    if style == "slick":
        return (
            f'<path d="M{cx-r} {cy-1} Q{cx-r+1} {cy-r-9} {cx} {cy-r-10} '
            f'Q{cx+r} {cy-r-8} {cx+r} {cy-1} Q{cx+8} {cy-r+4} {cx-2} {cy-r+1} '
            f'Q{cx-12} {cy-r+1} {cx-r} {cy-1}Z" fill="{INK}"/>'
        )
    if style == "bob":
        return (
            f'<path d="M{cx-r-2} {cy+8} Q{cx-r-2} {cy-r-10} {cx} {cy-r-11} '
            f'Q{cx+r+2} {cy-r-10} {cx+r+2} {cy+8} L{cx+r-4} {cy+10} '
            f'Q{cx+r-2} {cy-1} {cx} {cy-2} Q{cx-r+2} {cy-1} {cx-r+4} {cy+10}Z" fill="{INK}"/>'
        )
    if style == "bun":
        return (
            f'<circle cx="{cx}" cy="{cy-r-7}" r="8" fill="{INK}"/>'
            f'<path d="M{cx-r} {cy-1} Q{cx-r+1} {cy-r-7} {cx} {cy-r-9} '
            f'Q{cx+r-1} {cy-r-7} {cx+r} {cy-1} Q{cx+7} {cy-r+3} {cx-2} {cy-r+1} '
            f'Q{cx-10} {cy-r+1} {cx-r} {cy-1}Z" fill="{INK}"/>'
        )
    # messy
    return (
        f'<path d="M{cx-r} {cy-2} L{cx-r+1} {cy-r-5} L{cx-r+7} {cy-r-4} '
        f'L{cx-r+8} {cy-r-9} L{cx-1} {cy-r-7} L{cx+4} {cy-r-12} '
        f'L{cx+7} {cy-r-5} L{cx+r-1} {cy-r-4} L{cx+r} {cy-1} '
        f'Q{cx+8} {cy-r+3} {cx-1} {cy-r+1} Q{cx-10} {cy-r+2} {cx-r} {cy-2}Z" fill="{INK}"/>'
    )


def make_character(key: str, c: dict) -> None:
    w, h = 72, 88
    cx, cy = 36, 27
    r = 17
    sc = c["scale"]
    body = [
        f'<ellipse cx="36" cy="80" rx="22" ry="5" fill="rgba(20,18,15,.22)"/>',
        # legs
        f'<rect x="25" y="61" width="9" height="18" rx="4" fill="{c["pants"]}" {outline(3)}/>',
        f'<rect x="39" y="61" width="9" height="18" rx="4" fill="{c["pants"]}" {outline(3)}/>',
        # shoes
        f'<path d="M23 77 h13 q3 0 3 3 v2 h-19 v-2 q0 -3 3 -3Z" fill="{INK}"/>',
        f'<path d="M37 77 h13 q3 0 3 3 v2 h-19 v-2 q0 -3 3 -3Z" fill="{INK}"/>',
        # body
        f'<path d="M19 39 Q19 32 28 31 H45 Q54 32 54 39 L52 64 Q52 68 48 68 H24 Q20 68 20 64Z" '
        f'fill="{c["shirt"]}" {outline(4)}/>',
        # collar
        f'<path d="M29 33 L36 41 L43 33" fill="none" {outline(3)}/>',
        # arms
        f'<rect x="12" y="39" width="9" height="25" rx="4" fill="{c["shirt"]}" {outline(3)}/>',
        f'<rect x="51" y="39" width="9" height="25" rx="4" fill="{c["shirt"]}" {outline(3)}/>',
        f'<circle cx="16.5" cy="65" r="4.5" fill="{c["skin"]}" {outline(2.5)}/>',
        f'<circle cx="55.5" cy="65" r="4.5" fill="{c["skin"]}" {outline(2.5)}/>',
        # neck + head
        f'<rect x="31" y="28" width="10" height="8" fill="{c["skin"]}" {outline(2)}/>',
        f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{c["skin"]}" {outline(4)}/>',
        hair_shape(c["style"], cx, cy, r),
        # face
        f'<circle cx="30" cy="27" r="1.8" fill="{INK}"/>',
        f'<circle cx="42" cy="27" r="1.8" fill="{INK}"/>',
        f'<path d="M31 34 Q36 37 41 34" fill="none" stroke="{INK}" stroke-width="2" stroke-linecap="round"/>',
    ]
    acc = c["accessory"]
    if acc == "glasses":
        body.append(
            f'<g fill="none" stroke="{INK}" stroke-width="2">'
            f'<rect x="24" y="23" width="10" height="7" rx="2"/>'
            f'<rect x="38" y="23" width="10" height="7" rx="2"/>'
            f'<path d="M34 26h4M24 25l-3 -1M48 25l3 -1"/></g>'
        )
    elif acc == "bandaid":
        body.append(f'<g transform="rotate(-20 46 33)"><rect x="42" y="31" width="11" height="4" rx="2" fill="{PAPER}" stroke="{INK}" stroke-width="1.5"/><path d="M45 31v4M50 31v4" stroke="{INK}" stroke-width="1"/></g>')
    elif acc == "armband":
        body.append(f'<rect x="49" y="43" width="8" height="11" rx="2" fill="{RED}" {outline(2)}/><path d="M51 47h4" stroke="{PAPER}" stroke-width="1.5"/>')
    elif acc == "mop":
        body.append(f'<path d="M60 18 L53 67" stroke="{INK}" stroke-width="4" stroke-linecap="round"/><path d="M50 65 q7 -7 11 0 q2 7 -4 10 l-8 -5Z" fill="{YELLOW}" {outline(2.5)}/>')
    elif acc == "book":
        body.append(f'<g transform="rotate(-8 20 50)"><rect x="9" y="45" width="20" height="14" rx="2" fill="{BLUE}" {outline(2.5)}/><path d="M13 49h11M13 53h8" stroke="{PAPER}" stroke-width="1.5"/></g>')
    # scale around center for bosses
    if sc != 1:
        body.insert(0, f'<g transform="translate({36*(1-sc):.2f} {88*(1-sc):.2f}) scale({sc})">')
        body.append("</g>")
    save(f"{key}.svg", w, h, "".join(body))


# ---------------------------------------------------------------------------
# portraits
# ---------------------------------------------------------------------------
PORTRAITS = {
    "kanno": dict(
        skin=SKIN, hair="#2a2422", style="messy", expression="tired",
        shirt="#4d6d8f", accent=YELLOW, accessory="bandaid",
    ),
    "houzi": dict(
        skin="#eec39e", hair="#3a2b1e", style="messy", expression="nervous",
        shirt="#5b7254", accent=YELLOW, accessory="glasses",
    ),
    "wangxin": dict(
        skin="#f3caa7", hair="#2a2422", style="ponytail", expression="stern",
        shirt="#e9e3d3", accent=RED, accessory="armband",
    ),
    "daoxiaowang": dict(
        skin="#e8b78e", hair="#2b2420", style="slick", expression="smug",
        shirt="#6e7b85", accent=YELLOW, accessory="chain",
    ),
    "youxiaotang": dict(
        skin="#f0c7a6", hair="#3c2a24", style="bob", expression="deadpan",
        shirt="#7c6b57", accent=GREEN, accessory="glasses",
    ),
    "shiyi": dict(
        skin="#e8c3a1", hair="#2d2623", style="bun", expression="tired",
        shirt="#3c4454", accent=RED, accessory="glasses",
    ),
}


def portrait_hair(style: str, cx: float, cy: float, rx: float, ry: float) -> str:
    if style == "ponytail":
        return (
            f'<path d="M{cx-rx} {cy} Q{cx-rx+2} {cy-ry-18} {cx} {cy-ry-20} '
            f'Q{cx+rx-2} {cy-ry-16} {cx+rx} {cy} Q{cx+rx-4} {cy-ry+10} {cx+8} {cy-ry+12} '
            f'Q{cx-18} {cy-ry+12} {cx-rx} {cy}Z" fill="{INK}"/>'
            f'<path d="M{cx+rx-8} {cy-6} q28 22 16 72 q-18 10 -27 -4 q18 -30 -2 -56Z" fill="{INK}"/>'
        )
    if style == "slick":
        return (
            f'<path d="M{cx-rx} {cy} Q{cx-rx+4} {cy-ry-14} {cx} {cy-ry-18} '
            f'Q{cx+rx} {cy-ry-12} {cx+rx} {cy} Q{cx+22} {cy-ry+10} {cx-2} {cy-ry+8} '
            f'Q{cx-30} {cy-ry+8} {cx-rx} {cy}Z" fill="{INK}"/>'
        )
    if style == "bob":
        return (
            f'<path d="M{cx-rx-4} {cy+28} Q{cx-rx-6} {cy-ry-18} {cx} {cy-ry-22} '
            f'Q{cx+rx+6} {cy-ry-18} {cx+rx+4} {cy+28} L{cx+rx-6} {cy+34} '
            f'Q{cx+rx-2} {cy-2} {cx} {cy-6} Q{cx-rx+2} {cy-2} {cx-rx+6} {cy+34}Z" fill="{INK}"/>'
        )
    if style == "bun":
        return (
            f'<circle cx="{cx}" cy="{cy-ry-20}" r="18" fill="{INK}"/>'
            f'<path d="M{cx-rx} {cy} Q{cx-rx+4} {cy-ry-14} {cx} {cy-ry-18} '
            f'Q{cx+rx-4} {cy-ry-14} {cx+rx} {cy} Q{cx+22} {cy-ry+8} {cx-4} {cy-ry+9} '
            f'Q{cx-32} {cy-ry+9} {cx-rx} {cy}Z" fill="{INK}"/>'
        )
    # messy
    return (
        f'<path d="M{cx-rx} {cy} L{cx-rx+4} {cy-ry-6} L{cx-rx+18} {cy-ry-4} '
        f'L{cx-8} {cy-ry-20} L{cx+8} {cy-ry-8} L{cx+18} {cy-ry-24} '
        f'L{cx+26} {cy-ry-4} L{cx+rx} {cy-ry-10} L{cx+rx} {cy} '
        f'Q{cx+20} {cy-ry+10} {cx-4} {cy-ry+9} Q{cx-30} {cy-ry+9} {cx-rx} {cy}Z" fill="{INK}"/>'
    )


def make_portrait(key: str, p: dict) -> None:
    w, h = 360, 440
    cx, cy = 180, 190
    rx, ry = 105, 118
    body = [
        # shoulders
        f'<path d="M44 440 Q48 334 122 310 H238 Q312 334 316 440Z" fill="{p["shirt"]}" {outline(7)}/>',
        # neck
        f'<rect x="148" y="272" width="64" height="80" rx="20" fill="{p["skin"]}" {outline(6)}/>',
        # ears
        f'<ellipse cx="{cx-rx+4}" cy="{cy+8}" rx="20" ry="30" fill="{p["skin"]}" {outline(6)}/>',
        f'<ellipse cx="{cx+rx-4}" cy="{cy+8}" rx="20" ry="30" fill="{p["skin"]}" {outline(6)}/>',
        # head
        f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{p["skin"]}" {outline(7)}/>',
        portrait_hair(p["style"], cx, cy, rx, ry),
        # collar
        f'<path d="M126 350 L180 400 L234 350" fill="none" {outline(7)}/>',
        f'<path d="M180 400 L180 440" stroke="{INK}" stroke-width="5"/>',
    ]
    # eyes / eyebrows / mouth
    ex = 42
    ey = cy + 6
    if p["expression"] == "stern":
        body += [
            f'<path d="M{cx-ex-18} {ey-28} l30 6" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>',
            f'<path d="M{cx+ex-12} {ey-22} l30 -6" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>',
        ]
    elif p["expression"] == "nervous":
        body += [
            f'<path d="M{cx-ex-16} {ey-25} q16 -8 30 2" fill="none" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>',
            f'<path d="M{cx+ex-14} {ey-23} q16 -8 30 2" fill="none" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>',
        ]
    elif p["expression"] == "smug":
        body += [
            f'<path d="M{cx-ex-16} {ey-27} q18 -5 30 3" fill="none" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>',
            f'<path d="M{cx+ex-14} {ey-24} q18 -4 30 3" fill="none" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>',
        ]
    else:
        body += [
            f'<path d="M{cx-ex-15} {ey-26} q15 -4 28 1" fill="none" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>',
            f'<path d="M{cx+ex-13} {ey-25} q15 -4 28 1" fill="none" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>',
        ]
    # eye whites + pupils
    body += [
        f'<ellipse cx="{cx-ex}" cy="{ey}" rx="17" ry="12" fill="{WHITE}" {outline(3)}/>',
        f'<ellipse cx="{cx+ex}" cy="{ey}" rx="17" ry="12" fill="{WHITE}" {outline(3)}/>',
        f'<circle cx="{cx-ex+4}" cy="{ey}" r="5" fill="{INK}"/>',
        f'<circle cx="{cx+ex+4}" cy="{ey}" r="5" fill="{INK}"/>',
        f'<circle cx="{cx-ex+6}" cy="{ey-2}" r="1.6" fill="{WHITE}"/>',
        f'<circle cx="{cx+ex+6}" cy="{ey-2}" r="1.6" fill="{WHITE}"/>',
    ]
    # mouth
    if p["expression"] == "smug":
        body.append(f'<path d="M156 256 Q184 280 214 250" fill="none" {outline(6)}/>')
    elif p["expression"] == "nervous":
        body.append(f'<path d="M162 258 q18 -10 34 0" fill="none" {outline(5)}/>')
    elif p["expression"] == "tired":
        body.append(f'<path d="M160 262 q20 4 40 -2" fill="none" {outline(5)}/>')
    elif p["expression"] == "deadpan":
        body.append(f'<path d="M158 260 h44" {outline(5)}/>')
    else:
        body.append(f'<path d="M158 260 q22 -8 44 0" fill="none" {outline(5)}/>')
    # accessories
    acc = p["accessory"]
    if acc == "glasses":
        body += [
            f'<g fill="none" stroke="{INK}" stroke-width="5">'
            f'<rect x="{cx-ex-23}" y="{ey-20}" width="46" height="36" rx="9"/>'
            f'<rect x="{cx+ex-23}" y="{ey-20}" width="46" height="36" rx="9"/>'
            f'<path d="M{cx-ex+23} {ey-2} h{ex*2-46}M{cx-ex-23} {ey-6} l-22 -6M{cx+ex+23} {ey-6} l22 -6"/>'
            f'</g>'
        ]
    if acc == "bandaid":
        body.append(f'<g transform="rotate(-18 258 260)"><rect x="240" y="252" width="42" height="15" rx="7" fill="{PAPER}" {outline(4)}/><path d="M253 252v15M267 252v15" stroke="{INK}" stroke-width="3"/></g>')
    if acc == "armband":
        body.append(f'<rect x="54" y="352" width="42" height="58" rx="10" fill="{RED}" {outline(5)}/><path d="M66 370h18M66 382h14" stroke="{PAPER}" stroke-width="5"/>')
    if acc == "chain":
        body.append(f'<path d="M142 338 q38 30 76 0" fill="none" stroke="{YELLOW}" stroke-width="5" stroke-dasharray="8 6"/>')
    # hair shadow / highlight
    body.append(f'<path d="M92 158 Q118 118 180 116" fill="none" stroke="{WHITE}" stroke-width="6" opacity=".25" stroke-linecap="round"/>')
    save(f"portrait_{key}.svg", w, h, "".join(body))


# ---------------------------------------------------------------------------
# props
# ---------------------------------------------------------------------------
def prop(name: str, w: int, h: int, body: str) -> None:
    save(f"prop_{name}.svg", w, h, body)


prop("floor", 64, 64, f'<rect width="64" height="64" fill="#dfd6c3"/><path d="M0 0h64v64H0Z" fill="none" stroke="#c9bea8" stroke-width="1"/><path d="M8 52l10-3M42 18l8-2M26 30l4-1" stroke="#cfc3ad" stroke-width="1.5"/>')
prop("wall", 64, 64, f'<rect width="64" height="64" fill="#394956"/><path d="M0 20h64M0 44h64M16 0v20M48 20v24M16 44v20" stroke="#2a3741" stroke-width="3"/><path d="M0 0h64v6H0Z" fill="#54646d"/>')
prop("desk", 128, 84, f'<ellipse cx="64" cy="78" rx="54" ry="7" fill="rgba(20,18,15,.18)"/><rect x="8" y="18" width="112" height="44" rx="5" fill="#b98352" {outline(4)}/><path d="M16 30h96" stroke="#d6a26d" stroke-width="3"/><rect x="18" y="60" width="8" height="20" fill="#7c5839" {outline(3)}/><rect x="102" y="60" width="8" height="20" fill="#7c5839" {outline(3)}/><rect x="78" y="8" width="30" height="22" rx="2" fill="{PAPER}" {outline(2.5)} transform="rotate(-6 93 19)"/><path d="M84 15h16M84 20h12" stroke="#9d8d75" stroke-width="1.5"/><path d="M28 48h22" stroke="{INK}" stroke-width="3"/>')
prop("chair", 48, 52, f'<ellipse cx="24" cy="47" rx="18" ry="4" fill="rgba(20,18,15,.18)"/><rect x="12" y="8" width="24" height="30" rx="4" fill="#6f8b9a" {outline(3)}/><rect x="8" y="34" width="32" height="8" rx="3" fill="#526e7d" {outline(3)}/><path d="M14 42v8M34 42v8" stroke="{INK}" stroke-width="3"/>')
prop("podium", 104, 76, f'<path d="M12 70 L20 18 H84 L92 70Z" fill="#8b6d4f" {outline(4)}/><rect x="20" y="8" width="64" height="16" rx="4" fill="#a9845e" {outline(3)}/><rect x="38" y="28" width="28" height="18" fill="{PAPER}" {outline(2)}/><path d="M44 34h16M44 39h11" stroke="#9d8d75" stroke-width="1.5"/>')
prop("blackboard", 264, 100, f'<rect x="4" y="4" width="256" height="92" rx="5" fill="#2c4b3e" {outline(5)}/><rect x="12" y="12" width="240" height="76" fill="#315546"/><path d="M24 30h90M24 42h60M24 66h120M150 28q30 20 60 0" stroke="#d8e0cc" stroke-width="3" opacity=".8" stroke-linecap="round"/><rect x="20" y="88" width="50" height="5" rx="2" fill="#b98352"/><rect x="196" y="88" width="30" height="5" rx="2" fill="#b98352"/>')
prop("bookshelf", 132, 184, f'<rect x="6" y="4" width="120" height="176" rx="4" fill="#8b6b4b" {outline(5)}/><path d="M12 48h108M12 94h108M12 140h108" stroke="{INK}" stroke-width="4"/><g stroke="{INK}" stroke-width="2">{''.join(f'<rect x="{18+i*12}" y="{18+((i*7)%15)}" width="9" height="28" fill="{ [BLUE, RED, YELLOW, GREEN, PAPER][i%5] }"/>' for i in range(8))}</g><g stroke="{INK}" stroke-width="2">{''.join(f'<rect x="{18+i*12}" y="{60+((i*5)%12)}" width="9" height="30" fill="{ [PAPER, GREEN, BLUE, RED, YELLOW][i%5] }"/>' for i in range(8))}</g><rect x="18" y="112" width="22" height="24" fill="{PAPER}" {outline(2)}/><rect x="48" y="118" width="30" height="18" fill="{BLUE}" {outline(2)}/>')
prop("stall", 136, 166, f'<rect x="6" y="4" width="124" height="158" rx="3" fill="#7c9b8c" {outline(5)}/><rect x="14" y="12" width="50" height="142" fill="#6d8b7d"/><rect x="70" y="12" width="52" height="142" fill="#87a596"/><path d="M74 78h44" stroke="{INK}" stroke-width="4"/><rect x="80" y="72" width="10" height="16" rx="2" fill="{YELLOW}" {outline(2)}/><circle cx="26" cy="128" r="4" fill="{INK}"/><path d="M14 4h124" stroke="{INK}" stroke-width="6"/>')
prop("sink", 104, 72, f'<rect x="4" y="8" width="96" height="46" rx="8" fill="#d8d4c7" {outline(4)}/><ellipse cx="52" cy="28" rx="28" ry="14" fill="#9eb3b4" {outline(3)}/><path d="M52 26v-14 q0 -8 10 -8" fill="none" stroke="{INK}" stroke-width="4"/><rect x="14" y="54" width="76" height="12" fill="#b9b3a3" {outline(3)}/>')
prop("office_desk", 188, 104, f'<ellipse cx="94" cy="96" rx="82" ry="7" fill="rgba(20,18,15,.18)"/><rect x="8" y="20" width="172" height="54" rx="6" fill="#986b48" {outline(5)}/><path d="M16 34h156" stroke="#c08d5f" stroke-width="3"/><rect x="22" y="74" width="10" height="24" fill="#6f4b32" {outline(3)}/><rect x="156" y="74" width="10" height="24" fill="#6f4b32" {outline(3)}/><rect x="30" y="8" width="46" height="28" rx="2" fill="{PAPER}" {outline(2.5)} transform="rotate(-4 53 22)"/><rect x="112" y="12" width="36" height="22" rx="2" fill="{RED}" {outline(2.5)} transform="rotate(5 130 23)"/><path d="M38 16h20M38 22h14" stroke="#9d8d75" stroke-width="1.5"/><path d="M120 19h20" stroke="{PAPER}" stroke-width="1.5"/>')
prop("cabinet", 100, 148, f'<rect x="6" y="4" width="88" height="140" rx="4" fill="#798b8a" {outline(5)}/><path d="M12 48h76M12 94h76" stroke="{INK}" stroke-width="4"/><rect x="20" y="16" width="30" height="26" fill="#b9c7bf" {outline(2.5)}/><rect x="56" y="16" width="26" height="26" fill="#b9c7bf" {outline(2.5)}/><circle cx="50" cy="70" r="4" fill="{YELLOW}" {outline(2)}/><circle cx="50" cy="116" r="4" fill="{YELLOW}" {outline(2)}/>')
prop("sofa", 172, 88, f'<ellipse cx="86" cy="82" rx="74" ry="6" fill="rgba(20,18,15,.2)"/><rect x="8" y="26" width="156" height="50" rx="14" fill="#5c7485" {outline(5)}/><rect x="18" y="16" width="136" height="28" rx="14" fill="#6d899b" {outline(4)}/><path d="M58 34v36M114 34v36" stroke="{INK}" stroke-width="3"/><rect x="14" y="72" width="12" height="12" fill="#3d4e58" {outline(2)}/><rect x="146" y="72" width="12" height="12" fill="#3d4e58" {outline(2)}/>')
prop("plant", 68, 100, f'<ellipse cx="34" cy="94" rx="24" ry="5" fill="rgba(20,18,15,.2)"/><path d="M22 92 L26 62 H42 L46 92Z" fill="#a56543" {outline(4)}/><path d="M34 62 q-4 -28 -20 -34 q-2 22 14 32M34 62 q2 -22 22 -30 q2 20 -16 30M34 60 q-10 -20 0 -40 q14 20 4 40" fill="{GREEN}" {outline(3)}/>')
prop("mop_bucket", 70, 64, f'<ellipse cx="35" cy="58" rx="26" ry="5" fill="rgba(20,18,15,.2)"/><path d="M12 24 H58 L52 58 H18Z" fill="#d3a33c" {outline(4)}/><ellipse cx="35" cy="24" rx="23" ry="8" fill="#e7bd5b" {outline(3)}/><path d="M28 24 l6 -26M36 24 l8 -24" stroke="{INK}" stroke-width="4"/><path d="M30 4 q8 2 10 -2" stroke="{INK}" stroke-width="4" stroke-linecap="round"/>')
prop("door", 80, 124, f'<rect x="8" y="4" width="64" height="114" rx="3" fill="#73533d" {outline(5)}/><rect x="16" y="14" width="48" height="38" fill="#97745a" {outline(3)}/><rect x="16" y="62" width="48" height="46" fill="#97745a" {outline(3)}/><circle cx="61" cy="66" r="4" fill="{YELLOW}" {outline(2)}/><rect x="72" y="4" width="4" height="114" fill="{INK}"/>')
prop("window", 132, 100, f'<rect x="4" y="4" width="124" height="92" fill="#8aa9b5" {outline(5)}/><path d="M66 4v92M4 50h124" stroke="{INK}" stroke-width="4"/><path d="M14 16 q20 14 42 0 v24 q-20 10 -42 0Z" fill="#b8d1d7" opacity=".8"/><path d="M80 58 q20 -12 36 0 v28 q-18 8 -36 0Z" fill="#b8d1d7" opacity=".6"/>')
prop("cart", 132, 92, f'<ellipse cx="66" cy="86" rx="54" ry="5" fill="rgba(20,18,15,.2)"/><rect x="8" y="24" width="116" height="44" rx="4" fill="#8a9b9d" {outline(4)}/><circle cx="28" cy="76" r="10" fill="#3c474d" {outline(3)}/><circle cx="104" cy="76" r="10" fill="#3c474d" {outline(3)}/><path d="M40 24v-14h52v14" fill="none" {outline(3)}/><rect x="28" y="12" width="20" height="12" fill="{BLUE}" {outline(2)}/><rect x="54" y="8" width="16" height="16" fill="{RED}" {outline(2)}/><rect x="76" y="14" width="18" height="10" fill="{YELLOW}" {outline(2)}/>')
prop("cooler", 64, 100, f'<rect x="12" y="30" width="40" height="62" rx="4" fill="#d4d5cd" {outline(4)}/><path d="M20 30 q0 -22 12 -22 q12 0 12 22Z" fill="#9fc6ce" {outline(3)}/><rect x="22" y="52" width="20" height="8" rx="2" fill="{RED}" {outline(2)}/><path d="M14 92h36" stroke="{INK}" stroke-width="3"/>')
prop("curtain", 104, 176, f'<path d="M8 4 H96 V170 Q78 154 66 170 Q52 152 38 170 Q24 154 8 170Z" fill="#6f7d91" {outline(4)}/><path d="M24 16 Q32 80 24 158M52 12 Q44 84 54 164M80 16 Q70 86 82 158" stroke="#536274" stroke-width="4" opacity=".75"/><rect x="2" y="2" width="100" height="8" rx="3" fill="{INK}"/>')
prop("clock", 82, 82, f'<circle cx="41" cy="41" r="36" fill="{PAPER}" {outline(4)}/><circle cx="41" cy="41" r="30" fill="none" stroke="{INK}" stroke-width="2"/><path d="M41 17v4M65 41h-4M41 65v-4M17 41h4" stroke="{INK}" stroke-width="3"/><path d="M41 41 L30 28M41 41 L57 48" stroke="{INK}" stroke-width="4" stroke-linecap="round"/><circle cx="41" cy="41" r="3" fill="{RED}"/>')
prop("noticeboard", 172, 104, f'<rect x="4" y="4" width="164" height="96" rx="4" fill="#b88452" {outline(4)}/><rect x="12" y="12" width="148" height="80" fill="#c99b68"/><rect x="20" y="18" width="50" height="34" fill="{PAPER}" {outline(2)} transform="rotate(-4 45 35)"/><rect x="78" y="22" width="58" height="40" fill="#f4e3a7" {outline(2)} transform="rotate(3 107 42)"/><rect x="34" y="58" width="72" height="24" fill="#e5efe9" {outline(2)} transform="rotate(-1 70 70)"/><circle cx="27" cy="23" r="3" fill="{RED}"/><circle cx="86" cy="27" r="3" fill="{BLUE}"/><circle cx="100" cy="66" r="3" fill="{RED}"/><path d="M124 78h22M124 85h16" stroke="{INK}" stroke-width="2"/>')
prop("wet_sign", 62, 84, f'<path d="M31 4 L58 78 H4Z" fill="{YELLOW}" {outline(3)}/><rect x="27" y="24" width="8" height="25" rx="3" fill="{INK}"/><circle cx="31" cy="58" r="4" fill="{INK}"/><path d="M10 80h42" stroke="{INK}" stroke-width="3"/>')
prop("objective_key", 48, 48, f'<circle cx="24" cy="24" r="18" fill="{YELLOW}" {outline(3)}/><circle cx="18" cy="22" r="5" fill="{INK}"/><path d="M24 24l10 -8M30 18l5 4M28 15l5 4" stroke="{INK}" stroke-width="3" stroke-linecap="round"/>')
prop("objective_book", 56, 64, f'<rect x="6" y="8" width="44" height="50" rx="3" fill="{RED}" {outline(3)}/><rect x="12" y="8" width="8" height="50" fill="#8f332a"/><path d="M26 22h18M26 30h12" stroke="{PAPER}" stroke-width="2.5"/>')
prop("face_token", 40, 40, f'<circle cx="20" cy="20" r="16" fill="{YELLOW}" {outline(3)}/><path d="M12 18q2 -6 6 0M24 18q2 -6 6 0M13 27q7 5 14 0" fill="none" stroke="{INK}" stroke-width="2.5" stroke-linecap="round"/>')
prop("chalk", 26, 16, f'<rect x="3" y="5" width="20" height="6" rx="3" fill="{PAPER}" {outline(2)}/><path d="M8 5v6M17 5v6" stroke="#b9a88f" stroke-width="1"/>')
prop("exclamation", 64, 80, f'<path d="M32 4 L58 68 H6Z" fill="{RED}" {outline(4)}/><rect x="28" y="24" width="8" height="24" rx="4" fill="{PAPER}"/><circle cx="32" cy="57" r="4" fill="{PAPER}"/>')
prop("question", 64, 80, f'<path d="M32 4 L58 68 H6Z" fill="{YELLOW}" {outline(4)}/><path d="M24 28 q0 -10 9 -10 q10 0 10 9 q0 7 -9 11 v6" fill="none" stroke="{INK}" stroke-width="5" stroke-linecap="round"/><circle cx="34" cy="55" r="4" fill="{INK}"/>')
prop("stamp", 132, 132, f'<g transform="rotate(-12 66 66)"><rect x="10" y="10" width="112" height="112" rx="8" fill="none" stroke="{RED}" stroke-width="8"/><path d="M34 50h64M34 66h64M34 82h44" stroke="{RED}" stroke-width="7" stroke-linecap="round"/></g>')
prop("vignette", 1280, 720, '<defs><radialGradient id="v" cx="50%" cy="50%" r="72%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#05070a" stop-opacity=".55"/></radialGradient></defs><rect width="1280" height="720" fill="url(#v)"/>')
prop("lightpool", 240, 140, '<defs><radialGradient id="l" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffe6a8" stop-opacity=".22"/><stop offset="100%" stop-color="#ffe6a8" stop-opacity="0"/></radialGradient></defs><ellipse cx="120" cy="70" rx="120" ry="70" fill="url(#l)"/>')


if __name__ == "__main__":
    for key, c in CHARACTERS.items():
        make_character(key, c)
    for key, p in PORTRAITS.items():
        make_portrait(key, p)
    # simple title doodle
    save(
        "title_doodle.svg", 560, 260,
        f'<path d="M22 208 Q120 150 220 190 T520 168" fill="none" stroke="{INK}" stroke-width="4" stroke-linecap="round" opacity=".35"/>'
        f'<g transform="rotate(-7 180 120)"><rect x="46" y="42" width="250" height="142" rx="8" fill="{PAPER}" {outline(5)}/>'
        f'<path d="M68 72h170M68 96h120M68 120h150M68 144h90" stroke="#9b8c76" stroke-width="4" stroke-linecap="round"/>'
        f'<path d="M212 38 q70 8 84 54 q-52 -6 -84 -54Z" fill="{RED}" opacity=".85"/></g>'
        f'<g transform="translate(360 38) rotate(6)"><rect x="0" y="0" width="160" height="100" rx="6" fill="{YELLOW}" {outline(5)}/><path d="M18 30h120M18 50h90M18 70h110" stroke="{INK}" stroke-width="5" stroke-linecap="round"/></g>',
    )
    print(f"wrote {len(list(ART.glob('*.svg')))} svg files to {ART}")
