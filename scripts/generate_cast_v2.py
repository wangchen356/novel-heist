"""Create the v2 2D cast: portraits, in-game sprites, and a design board.

The board is a discussion artifact.  The in-game assets live in
public/art/cast_v2 until approved, so the deployed build is untouched.
"""
from __future__ import annotations

import html
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "public" / "art" / "cast_v2"
ART.mkdir(parents=True, exist_ok=True)

INK = "#211d1a"
PAPER = "#f4ead8"
WHITE = "#fff9ec"
RED = "#c84938"
YELLOW = "#f0c04e"
BLUE = "#486b91"
NAVY = "#314356"
GREEN = "#2e5547"
BEIGE = "#c9aa7d"
SKIN = "#f1c6a1"
SKIN_SHADE = "#d99a72"
GREY = "#7a7f80"


def save(name: str, width: int, height: int, body: str) -> None:
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
        f'viewBox="0 0 {width} {height}" fill="none">'
        f"{body}</svg>"
    )
    (ART / name).write_text(svg, encoding="utf-8")


def o(width: int = 4) -> str:
    return f'stroke="{INK}" stroke-width="{width}" stroke-linejoin="round" stroke-linecap="round"'


CHARACTERS = {
    "kanno": dict(
        name="Kanno",
        role="主角 / 高二（3）班",
        gender="男",
        skin=SKIN,
        hair="#292321",
        hair_style="messy",
        eyes="#3a2b25",
        expression="tired",
        outfit="hoodie",
        shirt=NAVY,
        accent=BLUE,
        accessory="bandaid",
        palette=[NAVY, "#f1c6a1", "#292321", BLUE, RED],
        notes=[
            "爱凑热闹，嘴比脑子快；借《两仪道》的理由是“听说他写了小说”。",
            "看起来没心没肺，其实很怕欠人情，也很怕被人看穿。",
            "外形：乱发、连帽卫衣、脸颊创可贴；永远像刚跑完八百米。",
        ],
        props="空手 / 创可贴",
    ),
    "houzi": dict(
        name="猴子（侯子航）",
        role="同班同学 / 《两仪道》作者",
        gender="男",
        skin="#eec39e",
        hair="#3a2b1e",
        hair_style="short_messy",
        eyes="#4a3a2c",
        expression="nervous",
        outfit="hoodie",
        shirt="#5b7254",
        accent=GREEN,
        accessory="glasses",
        palette=["#5b7254", "#eec39e", "#3a2b1e", YELLOW, PAPER],
        notes=[
            "平时不声不响，写出来的东西中二到爆；被 Kanno 借走书后其实没催过。",
            "不擅长拒绝，也不擅长解释自己；把“没关系”说得像口头禅。",
            "外形：瘦、圆框眼镜、旧绿连帽衫，手里总有一本笔记。",
        ],
        props="笔记本",
    ),
    "wangxin": dict(
        name="王心",
        role="教室 Boss / 学霸·纪律委员",
        gender="男",
        skin="#f3caa7",
        hair="#24211f",
        hair_style="short_neat",
        eyes="#2f2a25",
        expression="calm",
        outfit="vest",
        shirt="#e9e3d3",
        accent=RED,
        accessory="glasses",
        palette=["#e9e3d3", "#314356", RED, "#f3caa7", "#24211f"],
        notes=[
            "班里有名的学霸，班主任十一让他今晚看守晚自习——第一关由此而来。",
            "讲规矩、讲证据、讲分数；不是坏，只是太习惯“正确”的答案。",
            "外形：侧分短发、矩形眼镜、白衬衫+藏蓝背心、红袖章、点名册。",
        ],
        props="点名册 / 红笔",
    ),
    "daoxiaowang": dict(
        name="岛小王",
        role="厕所门口 Boss / “所长”",
        gender="男",
        skin="#e8b78e",
        hair="#2b2420",
        hair_style="slick",
        eyes="#3a2c22",
        expression="smug",
        outfit="jacket",
        shirt="#6e7b85",
        accent=YELLOW,
        accessory="chain",
        palette=["#6e7b85", "#e8b78e", "#2b2420", YELLOW, "#3c474d"],
        notes=[
            "厕所门口的“所长”，也是整层楼最不想被教导主任看见的人。",
            "嘴硬、爱面子、消息灵通；跟王心不是一路人，但谁也不想惹十一。",
            "外形：壮、背头、外套敞开、金属链、拖把；笑的时候像在挑衅。",
        ],
        props="拖把 / 水桶",
    ),
    "youxiaotang": dict(
        name="右小唐",
        role="图书角 Boss / 临时管理员",
        gender="女",
        skin="#f2c9a8",
        hair="#2f2522",
        hair_style="long",
        eyes="#3e2d27",
        expression="soft",
        outfit="cardigan",
        shirt="#f0e2cd",
        accent=GREEN,
        accessory="hairclip",
        palette=["#c9aa7d", "#f2c9a8", "#2f2522", GREEN, RED],
        notes=[
            "班里长相好看但话很少的女生；今天十一让她临时看守图书角。",
            "不凶，只是安静得让人心虚；记性好，尤其记折角和逾期。",
            "外形：长黑发侧分、红色小发夹、米色开衫、白衬衫，手里总拿着一本书。",
        ],
        props="书 / 书签",
    ),
    "shiyi": dict(
        name="十一",
        role="办公室 Boss / 班主任",
        gender="女",
        skin="#e9c5a3",
        hair="#2d2623",
        hair_style="bun",
        eyes="#3a2e27",
        expression="stern",
        outfit="blazer",
        shirt="#ede6d8",
        accent=RED,
        accessory="glasses",
        palette=["#3c4454", "#e9c5a3", "#2d2623", RED, "#8a7a64"],
        notes=[
            "女班主任。没收《两仪道》只是因为 Kanno 晚自习看书，不是秘密粉丝。",
            "严格、准确、疲惫；她记得每个学生的名字，也记得每一次退步。",
            "外形：低发髻、细框眼镜、深色西装、米色衬衫、保温杯；站得很直。",
        ],
        props="保温杯 / 红笔",
    ),
}


def hair_back(style: str, cx: float, cy: float) -> str:
    if style == "long":
        return (
            f'<path d="M{cx-102} {cy-8} Q{cx-116} {cy+150} {cx-82} {cy+232} '
            f'Q{cx-18} {cy+262} {cx+8} {cy+224} L{cx+10} {cy+142} '
            f'Q{cx-24} {cy+158} {cx-78} {cy+142} Z" fill="{INK}"/>'
            f'<path d="M{cx+102} {cy-8} Q{cx+118} {cy+154} {cx+84} {cy+234} '
            f'Q{cx+20} {cy+262} {cx-4} {cy+222} L{cx-4} {cy+142} '
            f'Q{cx+34} {cy+158} {cx+78} {cy+142} Z" fill="{INK}"/>'
        )
    return ""


def hair_front(style: str, cx: float, cy: float, rx: float, ry: float) -> str:
    if style == "short_neat":
        return (
            f'<path d="M{cx-rx-2} {cy-4} Q{cx-rx+4} {cy-ry-12} {cx-8} {cy-ry-20} '
            f'Q{cx+34} {cy-ry-18} {cx+rx-2} {cy-ry+2} Q{cx+rx-8} {cy-ry+10} {cx+34} {cy-ry+8} '
            f'Q{cx-8} {cy-ry+4} {cx-42} {cy-ry+14} Q{cx-72} {cy-ry+22} {cx-rx-2} {cy-4}Z" fill="{INK}"/>'
            f'<path d="M{cx-40} {cy-ry-2} Q{cx-6} {cy-ry+16} {cx+38} {cy-ry+8}" fill="none" stroke="{WHITE}" stroke-width="4" opacity=".16"/>'
        )
    if style == "messy":
        return (
            f'<path d="M{cx-rx-2} {cy-2} L{cx-rx+2} {cy-ry-2} L{cx-rx+22} {cy-ry-4} '
            f'L{cx-24} {cy-ry-22} L{cx+0} {cy-ry-8} L{cx+26} {cy-ry-28} '
            f'L{cx+40} {cy-ry-5} L{cx+rx-2} {cy-ry-9} L{cx+rx+2} {cy+2} '
            f'Q{cx+30} {cy-ry+12} {cx-2} {cy-ry+9} Q{cx-40} {cy-ry+8} {cx-rx-2} {cy-2}Z" fill="{INK}"/>'
            f'<path d="M{cx-24} {cy-ry-2} L{cx-8} {cy-ry+12} L{cx+12} {cy-ry-2}" fill="none" stroke="{WHITE}" stroke-width="3" opacity=".12"/>'
        )
    if style == "short_messy":
        return (
            f'<path d="M{cx-rx-2} {cy-2} L{cx-rx+2} {cy-ry-4} L{cx-rx+22} {cy-ry-2} '
            f'L{cx-22} {cy-ry-22} L{cx+2} {cy-ry-8} L{cx+28} {cy-ry-26} '
            f'L{cx+40} {cy-ry-4} L{cx+rx-2} {cy-ry-8} L{cx+rx+2} {cy+2} '
            f'Q{cx+28} {cy-ry+10} {cx-2} {cy-ry+8} Q{cx-38} {cy-ry+8} {cx-rx-2} {cy-2}Z" fill="{INK}"/>'
        )
    if style == "slick":
        return (
            f'<path d="M{cx-rx-2} {cy-2} Q{cx-rx+6} {cy-ry-18} {cx-10} {cy-ry-22} '
            f'Q{cx+42} {cy-ry-18} {cx+rx+1} {cy-4} Q{cx+28} {cy-ry+16} {cx-2} {cy-ry+10} '
            f'Q{cx-36} {cy-ry+10} {cx-rx-2} {cy-2}Z" fill="{INK}"/>'
            f'<path d="M{cx-58} {cy-ry-4} Q{cx-4} {cy-ry-18} {cx+54} {cy-ry+2}" fill="none" stroke="{WHITE}" stroke-width="4" opacity=".18"/>'
        )
    if style == "long":
        return (
            f'<path d="M{cx-rx-2} {cy-2} Q{cx-rx+8} {cy-ry-18} {cx-10} {cy-ry-24} '
            f'Q{cx+46} {cy-ry-16} {cx+rx+2} {cy-2} Q{cx+60} {cy-ry+10} {cx+30} {cy-ry+10} '
            f'Q{cx-2} {cy-ry+20} {cx-36} {cy-ry+8} Q{cx-70} {cy-ry+18} {cx-rx-2} {cy-2}Z" fill="{INK}"/>'
            f'<path d="M{cx-90} {cy-22} Q{cx-108} {cy+42} {cx-94} {cy+126} '
            f'Q{cx-80} {cy+152} {cx-68} {cy+120} Q{cx-78} {cy+52} {cx-70} {cy-8}Z" fill="{INK}"/>'
            f'<path d="M{cx+90} {cy-22} Q{cx+108} {cy+42} {cx+94} {cy+126} '
            f'Q{cx+80} {cy+152} {cx+68} {cy+120} Q{cx+78} {cy+52} {cx+70} {cy-8}Z" fill="{INK}"/>'
            f'<path d="M{cx-48} {cy-ry+8} Q{cx-72} {cy+10} {cx-80} {cy+64} Q{cx-64} {cy+72} {cx-56} {cy+34}Z" fill="{INK}"/>'
            f'<path d="M{cx+44} {cy-ry+6} Q{cx+70} {cy+4} {cx+80} {cy+54} Q{cx+62} {cy+62} {cx+54} {cy+24}Z" fill="{INK}"/>'
        )
    if style == "bun":
        return (
            f'<circle cx="{cx}" cy="{cy-ry-18}" r="25" fill="{INK}"/>'
            f'<path d="M{cx-rx-2} {cy-2} Q{cx-rx+8} {cy-ry-18} {cx-10} {cy-ry-23} '
            f'Q{cx+44} {cy-ry-16} {cx+rx+2} {cy-2} Q{cx+54} {cy-ry+10} {cx+22} {cy-ry+10} '
            f'Q{cx-16} {cy-ry+18} {cx-56} {cy-ry+8} Q{cx-84} {cy-ry+16} {cx-rx-2} {cy-2}Z" fill="{INK}"/>'
            f'<path d="M{cx-88} {cy-8} Q{cx-118} {cy+40} {cx-98} {cy+92} Q{cx-78} {cy+78} {cx-72} {cy+44}" fill="none" stroke="{INK}" stroke-width="10" stroke-linecap="round"/>'
            f'<path d="M{cx+86} {cy-8} Q{cx+114} {cy+44} {cx+96} {cy+94} Q{cx+76} {cy+76} {cx+72} {cy+40}" fill="none" stroke="{INK}" stroke-width="10" stroke-linecap="round"/>'
        )
    return hair_back(style, cx, cy)


def eye(cx: float, cy: float, w: float = 22, h: float = 14, color: str = "#2f2a25", lid: float = 0.0) -> str:
    # lid: 0 normal, 0.3 tired half-lid, 0.6 deadpan
    top = cy - h * (1 - lid)
    return (
        f'<ellipse cx="{cx}" cy="{cy}" rx="{w}" ry="{h}" fill="{WHITE}" {o(3)}/>'
        f'<ellipse cx="{cx+1}" cy="{cy+1}" rx="{w*0.58}" ry="{h*0.72}" fill="{color}"/>'
        f'<circle cx="{cx+4}" cy="{cy-2}" r="2.2" fill="{WHITE}"/>'
        f'<path d="M{cx-w} {top} Q{cx} {top-h*0.5} {cx+w} {top}" fill="none" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>'
    )


def glasses(cx: float, cy: float, kind: str = "rect") -> str:
    if kind == "rect":
        return (
            f'<g fill="none" stroke="{INK}" stroke-width="5">'
            f'<rect x="{cx-59}" y="{cy-24}" width="44" height="34" rx="6"/>'
            f'<rect x="{cx+15}" y="{cy-24}" width="44" height="34" rx="6"/>'
            f'<path d="M{cx-15} {cy-8} H{cx+15}M{cx-59} {cy-12} L{cx-84} {cy-18}M{cx+59} {cy-12} L{cx+84} {cy-18}"/>'
            f"</g>"
        )
    return (
        f'<g fill="none" stroke="{INK}" stroke-width="4">'
        f'<circle cx="{cx-37}" cy="{cy-6}" r="23"/><circle cx="{cx+37}" cy="{cy-6}" r="23"/>'
        f'<path d="M{cx-14} {cy-6} H{cx+14}M{cx-60} {cy-10} L{cx-82} {cy-15}M{cx+60} {cy-10} L{cx+82} {cy-15}"/>'
        f"</g>"
    )


def mouth(expr: str, x: float, y: float) -> str:
    if expr == "smug":
        return f'<path d="M{x-20} {y} Q{x+2} {y+16} {x+24} {y-6}" fill="none" {o(5)}/>'
    if expr == "nervous":
        return f'<path d="M{x-20} {y} Q{x-8} {y-8} {x+4} {y} Q{x+16} {y+8} {x+26} {y-2}" fill="none" {o(4)}/>'
    if expr == "tired":
        return f'<path d="M{x-22} {y} Q{x} {y+4} {x+22} {y-2}" fill="none" {o(4)}/>'
    if expr == "deadpan":
        return f'<path d="M{x-18} {y} H{x+18}" fill="none" {o(4)}/>'
    if expr == "soft":
        return f'<path d="M{x-20} {y+1} Q{x} {y-8} {x+20} {y+1}" fill="none" {o(4)}/>'
    if expr == "stern":
        return f'<path d="M{x-20} {y+2} Q{x} {y-6} {x+20} {y+2}" fill="none" {o(4)}/>'
    return f'<path d="M{x-22} {y} Q{x} {y-6} {x+22} {y}" fill="none" {o(4)}/>'


def brows(expr: str, x: float, y: float) -> str:
    if expr == "stern":
        return (
            f'<path d="M{x-52} {y-30} L{x-18} {y-22}" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>'
            f'<path d="M{x+18} {y-22} L{x+52} {y-30}" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>'
        )
    if expr == "nervous":
        return (
            f'<path d="M{x-54} {y-26} Q{x-36} {y-33} {x-18} {y-25}" fill="none" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>'
            f'<path d="M{x+18} {y-25} Q{x+36} {y-33} {x+54} {y-26}" fill="none" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>'
        )
    if expr == "tired":
        return (
            f'<path d="M{x-54} {y-24} Q{x-36} {y-28} {x-18} {y-24}" fill="none" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>'
            f'<path d="M{x+18} {y-24} Q{x+36} {y-27} {x+54} {y-25}" fill="none" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>'
        )
    if expr == "smug":
        return (
            f'<path d="M{x-54} {y-27} Q{x-34} {y-32} {x-18} {y-26}" fill="none" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>'
            f'<path d="M{x+18} {y-24} Q{x+36} {y-26} {x+54} {y-29}" fill="none" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>'
        )
    if expr == "deadpan":
        return (
            f'<path d="M{x-54} {y-25} Q{x-36} {y-28} {x-18} {y-26}" fill="none" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>'
            f'<path d="M{x+18} {y-26} Q{x+36} {y-28} {x+54} {y-25}" fill="none" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>'
        )
    return (
        f'<path d="M{x-54} {y-27} Q{x-36} {y-32} {x-18} {y-27}" fill="none" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>'
        f'<path d="M{x+18} {y-27} Q{x+36} {y-32} {x+54} {y-27}" fill="none" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>'
    )


def outfit(c: dict, cx: float) -> str:
    shirt = c["shirt"]
    accent = c["accent"]
    kind = c["outfit"]
    body = [
        f'<path d="M28 520 Q36 420 118 392 H{cx-92} Q{cx+92} 392 392 520Z" fill="{shirt}" {o(6)}/>',
        # neck
        f'<rect x="{cx-29}" y="326" width="58" height="82" rx="18" fill="{c["skin"]}" {o(5)}/>',
        f'<path d="M{cx-29} 356 Q{cx} 374 {cx+29} 356" fill="none" stroke="{SKIN_SHADE}" stroke-width="3" opacity=".5"/>',
    ]
    if kind == "hoodie":
        body += [
            f'<path d="M92 404 Q{cx-92} 374 {cx-122} 438 Q{cx-118} 520 {cx-104} 520 H{cx+104} Q{cx+118} 520 {cx+122} 438 Q{cx+92} 374 {cx+92} 404Z" fill="{c["accent"]}" {o(5)}/>',
            f'<path d="M{cx-46} 404 L{cx} 470 L{cx+46} 404" fill="none" {o(5)}/>',
            f'<path d="M{cx-26} 470 L{cx-36} 520M{cx+26} 470 L{cx+36} 520" stroke="{PAPER}" stroke-width="5" stroke-linecap="round"/>',
            f'<circle cx="{cx-36}" cy="520" r="4" fill="{INK}"/><circle cx="{cx+36}" cy="520" r="4" fill="{INK}"/>',
        ]
    elif kind == "vest":
        body += [
            f'<path d="M110 408 L{cx-42} 438 L{cx-26} 520 H{cx+26} L{cx+42} 438 L310 408" fill="none" {o(4)}/>',
            f'<path d="M{cx-64} 396 L{cx-90} 520 H{cx-28} L{cx-10} 450 L{cx} 520 H{cx+28} L{cx+90} 520" fill="{c["shirt"]}" opacity="0"/>',
            f'<path d="M102 400 Q{cx-74} 390 {cx-78} 440 L{cx-70} 520 H{cx-24} L{cx-12} 452 L{cx} 520 H{cx+24} L{cx+70} 520 L{cx+78} 440 Q{cx+74} 390 318 400Z" fill="{NAVY}" {o(5)}/>',
            f'<path d="M{cx-78} 438 Q{cx-44} 468 {cx-30} 520 M{cx+78} 438 Q{cx+44} 468 {cx+30} 520" fill="none" stroke="{INK}" stroke-width="3" opacity=".55"/>',
            f'<path d="M{cx-46} 394 L{cx} 448 L{cx+46} 394" fill="{PAPER}" {o(4)}/>',
            f'<path d="M{cx} 448 L{cx} 520" stroke="{RED}" stroke-width="6"/>',
        ]
    elif kind == "cardigan":
        body += [
            f'<path d="M96 404 Q{cx-78} 386 {cx-82} 446 L{cx-58} 520 H{cx-22} L{cx-8} 430 L{cx+8} 430 L{cx+22} 520 H{cx+58} L{cx+82} 446 Q{cx+78} 386 324 404Z" fill="{BEIGE}" {o(5)}/>',
            f'<path d="M{cx-8} 430 L{cx-20} 520M{cx+8} 430 L{cx+20} 520" stroke="{INK}" stroke-width="3" opacity=".55"/>',
            f'<path d="M{cx-30} 398 L{cx} 442 L{cx+30} 398" fill="{PAPER}" {o(4)}/>',
            f'<circle cx="{cx-40}" cy="494" r="4" fill="{INK}" opacity=".6"/><circle cx="{cx-40}" cy="514" r="4" fill="{INK}" opacity=".6"/>',
        ]
    elif kind == "blazer":
        body += [
            f'<path d="M98 402 Q{cx-84} 384 {cx-88} 452 L{cx-60} 520 H{cx-24} L{cx-10} 430 L{cx+10} 430 L{cx+24} 520 H{cx+60} L{cx+88} 452 Q{cx+84} 384 322 402Z" fill="{c["shirt"]}" {o(5)}/>',
            f'<path d="M112 402 L{cx-38} 438 L{cx-24} 520 L{cx-96} 520 L{cx-92} 448 Q{cx-82} 392 {cx-62} 386Z" fill="{NAVY}" {o(5)}/>',
            f'<path d="M308 402 L{cx+38} 438 L{cx+24} 520 L{cx+96} 520 L{cx+92} 448 Q{cx+82} 392 {cx+62} 386Z" fill="{NAVY}" {o(5)}/>',
            f'<path d="M{cx-38} 404 L{cx} 454 L{cx+38} 404" fill="none" {o(4)}/>',
            f'<path d="M{cx-22} 426 L{cx} 448 L{cx+22} 426 L{cx+30} 520 L{cx-30} 520Z" fill="{RED}" {o(3)}/>',
            f'<path d="M{cx} 454 L{cx} 520" stroke="{INK}" stroke-width="3"/>',
        ]
    else:  # jacket
        body += [
            f'<path d="M92 404 Q{cx-82} 384 {cx-86} 450 L{cx-60} 520 H{cx-18} L{cx-4} 440 L{cx+4} 440 L{cx+18} 520 H{cx+60} L{cx+86} 450 Q{cx+82} 384 328 404Z" fill="{c["shirt"]}" {o(5)}/>',
            f'<path d="M100 402 L{cx-40} 432 L{cx-28} 520 L{cx-94} 520 L{cx-90} 444 Q{cx-64} 396 {cx-40} 394Z" fill="#4b5960" {o(5)}/>',
            f'<path d="M320 402 L{cx+40} 432 L{cx+28} 520 L{cx+94} 520 L{cx+90} 444 Q{cx+64} 396 {cx+40} 394Z" fill="#4b5960" {o(5)}/>',
            f'<path d="M{cx-40} 432 L{cx-26} 520M{cx+40} 432 L{cx+26} 520" stroke="{INK}" stroke-width="3" opacity=".5"/>',
            f'<path d="M{cx-54} 458 Q{cx} 490 {cx+54} 458" fill="none" stroke="{YELLOW}" stroke-width="5" stroke-dasharray="7 5"/>',
            f'<path d="M{cx-24} 394 L{cx} 432 L{cx+24} 394" fill="none" {o(4)}/>',
        ]
    return "".join(body)


def portrait(c: dict) -> None:
    cx, cy = 210, 224
    rx, ry = 94, 112
    body = []
    if c["hair_style"] == "long":
        body.append(hair_back(c["hair_style"], cx, cy))
    body.append(outfit(c, cx))
    # ears
    body.append(f'<ellipse cx="{cx-rx+2}" cy="{cy+16}" rx="18" ry="27" fill="{c["skin"]}" {o(5)}/>')
    body.append(f'<ellipse cx="{cx+rx-2}" cy="{cy+16}" rx="18" ry="27" fill="{c["skin"]}" {o(5)}/>')
    # head
    body.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{c["skin"]}" {o(6)}/>')
    body.append(f'<path d="M{cx-rx+16} 296 Q{cx} 330 {cx+rx-16} 296" fill="none" stroke="{SKIN_SHADE}" stroke-width="3" opacity=".35"/>')
    body.append(hair_front(c["hair_style"], cx, cy, rx, ry))
    body.append(brows(c["expression"], cx, cy))
    lid = 0.55 if c["expression"] in ("tired", "deadpan") else 0.1 if c["expression"] == "soft" else 0.2
    body.append(eye(cx-42, cy+8, 25 if c["expression"] == "soft" else 24, 16 if c["expression"] == "soft" else 15, c["eyes"], lid))
    body.append(eye(cx+42, cy+8, 25 if c["expression"] == "soft" else 24, 16 if c["expression"] == "soft" else 15, c["eyes"], lid))
    if c["expression"] == "soft":
        body.append(f'<path d="M{cx-74} {cy+22} l-7 -4M{cx+74} {cy+22} l7 -4" stroke="{INK}" stroke-width="3" stroke-linecap="round"/>')
        body.append(f'<ellipse cx="{cx-58}" cy="{cy+48}" rx="15" ry="7" fill="{RED}" opacity=".14"/><ellipse cx="{cx+58}" cy="{cy+48}" rx="15" ry="7" fill="{RED}" opacity=".14"/>')
    body.append(f'<path d="M{cx-6} {cy+30} Q{cx+2} {cy+37} {cx+8} {cy+28}" fill="none" stroke="{SKIN_SHADE}" stroke-width="3" stroke-linecap="round"/>')
    body.append(mouth(c["expression"], cx, cy+62))
    if c["accessory"] == "glasses":
        body.append(glasses(cx, cy+8, "round" if c["name"] in ("猴子（侯子航）", "十一") else "rect"))
    if c["accessory"] == "bandaid":
        body.append(f'<g transform="rotate(-18 300 280)"><rect x="280" y="272" width="44" height="15" rx="7" fill="{PAPER}" {o(4)}/><path d="M294 272v15M308 272v15" stroke="{INK}" stroke-width="2.5"/></g>')
    if c["accessory"] == "hairclip":
        body.append(f'<g transform="rotate(-18 118 178)"><rect x="102" y="170" width="30" height="14" rx="6" fill="{RED}" {o(3)}/><path d="M111 170v14M122 170v14" stroke="{PAPER}" stroke-width="2"/></g>')
    if c["accessory"] == "armband":
        body.append(f'<rect x="44" y="432" width="38" height="56" rx="8" fill="{RED}" {o(4)}/><path d="M54 450h17M54 462h13" stroke="{PAPER}" stroke-width="4"/>')
    if c["accessory"] == "chain":
        body.append(f'<path d="M150 410 Q210 446 270 410" fill="none" stroke="{YELLOW}" stroke-width="4" stroke-dasharray="7 5"/>')
    # props
    prop = c["props"]
    if "点名册" in prop or "红笔" in prop:
        body.append(f'<g transform="rotate(-7 74 440)"><rect x="30" y="400" width="88" height="104" rx="5" fill="{PAPER}" {o(4)}/><rect x="38" y="408" width="72" height="18" fill="{NAVY}" {o(2)}/><path d="M44 444h54M44 458h42M44 472h50" stroke="{INK}" stroke-width="3" opacity=".55"/><path d="M102 456l16 -28" stroke="{RED}" stroke-width="5" stroke-linecap="round"/></g>')
    elif "书" in prop and "书签" in prop:
        body.append(f'<g transform="rotate(7 344 430)"><rect x="312" y="396" width="70" height="98" rx="5" fill="{GREEN}" {o(4)}/><path d="M324 414h46M324 430h36M324 446h44" stroke="{PAPER}" stroke-width="3" opacity=".8"/><path d="M350 396v24l-8 -8 -8 8v-24" fill="{RED}" {o(2)}/></g>')
    elif "拖把" in prop:
        body.append(f'<path d="M348 384 L376 520" stroke="{INK}" stroke-width="5" stroke-linecap="round"/><path d="M356 512 q20 -14 32 4 q-4 22 -26 24Z" fill="{YELLOW}" {o(4)}/>')
    elif "保温杯" in prop:
        body.append(f'<g transform="rotate(-4 352 454)"><rect x="330" y="408" width="46" height="86" rx="12" fill="{PAPER}" {o(4)}/><rect x="336" y="398" width="34" height="16" rx="6" fill="{GREY}" {o(3)}/><rect x="338" y="430" width="30" height="8" fill="{RED}" opacity=".8"/></g>')
    elif "笔记本" in prop:
        body.append(f'<g transform="rotate(8 70 444)"><rect x="36" y="402" width="74" height="94" rx="4" fill="{PAPER}" {o(4)}/><path d="M46 422h50M46 438h40M46 454h46" stroke="{GREY}" stroke-width="3"/><path d="M98 402v94" stroke="{GREEN}" stroke-width="6"/></g>')
    save(f"portrait_{c['key']}.svg", 420, 520, "".join(body))


def sprite(c: dict) -> None:
    w, h = 80, 96
    cx = 40
    body = [
        f'<ellipse cx="40" cy="88" rx="23" ry="5" fill="rgba(20,18,15,.22)"/>',
        f'<rect x="27" y="68" width="10" height="18" rx="4" fill="{NAVY}" {o(3)}/>',
        f'<rect x="43" y="68" width="10" height="18" rx="4" fill="{NAVY}" {o(3)}/>',
        f'<path d="M24 84h15q3 0 3 3v2H22v-2q0-3 2-3Z" fill="{INK}"/>',
        f'<path d="M41 84h15q3 0 3 3v2H38v-2q0-3 3-3Z" fill="{INK}"/>',
        f'<path d="M19 43 Q19 36 28 35 H52 Q61 36 61 43 L59 70 Q59 74 55 74 H25 Q21 74 21 70Z" fill="{c["shirt"]}" {o(4)}/>',
        f'<rect x="12" y="43" width="9" height="25" rx="4" fill="{c["shirt"]}" {o(3)}/>',
        f'<rect x="59" y="43" width="9" height="25" rx="4" fill="{c["shirt"]}" {o(3)}/>',
        f'<circle cx="15.5" cy="70" r="4.5" fill="{c["skin"]}" {o(2.5)}/>',
        f'<circle cx="64.5" cy="70" r="4.5" fill="{c["skin"]}" {o(2.5)}/>',
        f'<rect x="34" y="32" width="12" height="8" fill="{c["skin"]}" {o(2)}/>',
        f'<circle cx="40" cy="28" r="19" fill="{c["skin"]}" {o(4)}/>',
    ]
    style = c["hair_style"]
    if style == "short_neat":
        body.append(f'<path d="M21 27 Q23 6 40 6 Q57 6 59 27 Q48 15 40 17 Q30 15 21 27Z" fill="{c["hair"]}" {o(3)}/>')
        body.append(f'<path d="M31 8 Q40 18 51 9" fill="none" stroke="{WHITE}" stroke-width="2" opacity=".2"/>')
    elif style == "short_messy":
        body.append(f'<path d="M20 27 L24 8 L31 14 L38 4 L43 13 L53 6 L56 16 L61 27 Q50 17 40 20 Q30 16 20 27Z" fill="{c["hair"]}" {o(3)}/>')
    elif style == "slick":
        body.append(f'<path d="M20 26 Q22 6 40 5 Q58 7 60 26 Q48 16 40 18 Q30 15 20 26Z" fill="{c["hair"]}" {o(3)}/>')
    elif style == "long":
        body.append(f'<path d="M20 26 Q20 6 40 5 Q60 6 60 26 L63 62 Q54 72 47 60 L46 38 Q40 34 34 38 L33 60 Q26 72 17 62Z" fill="{c["hair"]}" {o(3)}/>')
        body.append(f'<path d="M25 20 Q33 30 40 26 Q48 30 55 20" fill="none" stroke="{WHITE}" stroke-width="2" opacity=".15"/>')
    elif style == "bun":
        body.append(f'<circle cx="40" cy="7" r="9" fill="{c["hair"]}" {o(3)}/><path d="M21 27 Q23 7 40 6 Q57 7 59 27 Q48 16 40 18 Q30 15 21 27Z" fill="{c["hair"]}" {o(3)}/>')
    # face
    body.append(f'<circle cx="33" cy="28" r="1.8" fill="{INK}"/><circle cx="47" cy="28" r="1.8" fill="{INK}"/>')
    if c["accessory"] == "glasses":
        body.append(f'<g fill="none" stroke="{INK}" stroke-width="2"><rect x="27" y="24" width="10" height="7" rx="2"/><rect x="43" y="24" width="10" height="7" rx="2"/><path d="M37 27h6M27 26l-3 -1M53 26l3 -1"/></g>')
    body.append(f'<path d="M35 35 Q40 38 45 34" fill="none" stroke="{INK}" stroke-width="2" stroke-linecap="round"/>')
    if c["accessory"] == "bandaid":
        body.append(f'<g transform="rotate(-20 52 35)"><rect x="47" y="33" width="12" height="4" rx="2" fill="{PAPER}" {o(1.5)}/></g>')
    if c["accessory"] == "armband":
        body.append(f'<rect x="55" y="47" width="8" height="11" rx="2" fill="{RED}" {o(2)}/>')
    if c["accessory"] == "hairclip":
        body.append(f'<rect x="22" y="20" width="6" height="3" rx="1" fill="{RED}" {o(1)}/>')
    if c["accessory"] == "chain":
        body.append(f'<path d="M28 42 Q40 50 52 42" fill="none" stroke="{YELLOW}" stroke-width="2" stroke-dasharray="3 2"/>')
    if "点名册" in c["props"]:
        body.append(f'<g transform="rotate(-8 20 52)"><rect x="8" y="46" width="18" height="22" rx="2" fill="{PAPER}" {o(2)}/><path d="M12 52h10M12 56h8" stroke="{INK}" stroke-width="1.5"/></g>')
    if "书" in c["props"]:
        body.append(f'<g transform="rotate(-7 20 52)"><rect x="8" y="47" width="20" height="15" rx="2" fill="{GREEN}" {o(2)}/></g>')
    if "拖把" in c["props"]:
        body.append(f'<path d="M65 18 L57 74" stroke="{INK}" stroke-width="4" stroke-linecap="round"/><path d="M52 70 q8 -7 13 1 q2 8 -5 11 l-8 -5Z" fill="{YELLOW}" {o(2.5)}/>')
    if "保温杯" in c["props"]:
        body.append(f'<rect x="66" y="48" width="11" height="20" rx="3" fill="{PAPER}" {o(2)}/>')
    if "笔记本" in c["props"]:
        body.append(f'<g transform="rotate(8 18 54)"><rect x="6" y="48" width="16" height="19" rx="2" fill="{PAPER}" {o(2)}/></g>')
    save(f"sprite_{c['key']}.svg", w, h, "".join(body))


def build() -> None:
    for key, c in CHARACTERS.items():
        c["key"] = key
        portrait(c)
        sprite(c)
    # contact sheet html
    cards = []
    for i, (key, c) in enumerate(CHARACTERS.items(), start=1):
        pal = "".join(f'<span class="swatch" style="background:{color}"></span>' for color in c["palette"])
        notes = "".join(f"<li>{html.escape(n)}</li>" for n in c["notes"])
        cards.append(
            f"""
            <article class="card">
              <div class="card-top"><span class="num">{i:02d}</span><span class="gender">{c['gender']}</span></div>
              <div class="visual">
                <img class="portrait" src="public/art/cast_v2/portrait_{key}.svg" alt="{html.escape(c['name'])} portrait">
                <div class="sprite-wrap"><img class="sprite" src="public/art/cast_v2/sprite_{key}.svg" alt="{html.escape(c['name'])} sprite"><span>游戏内小人</span></div>
              </div>
              <h2>{html.escape(c['name'])}</h2>
              <div class="role">{html.escape(c['role'])}</div>
              <ul>{notes}</ul>
              <div class="palette">{pal}<span class="prop">{html.escape(c['props'])}</span></div>
            </article>
            """
        )
    page = f"""<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><style>
  *{{box-sizing:border-box}} body{{margin:0;background:#171513;color:#f4ead8;font-family:"Microsoft YaHei","PingFang SC",sans-serif;padding:34px}}
  header{{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid rgba(244,234,216,.2);padding-bottom:18px;margin-bottom:24px}}
  .kicker{{font-family:monospace;font-size:11px;letter-spacing:.2em;color:#c84938}} h1{{font-family:"KaiTi","STKaiti",serif;font-size:54px;font-weight:400;margin:8px 0 0}}
  header p{{max-width:540px;color:#b9aa94;font-size:12px;line-height:1.8;margin:0;text-align:right}}
  .grid{{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}}
  .card{{background:#f4ead8;color:#211d1a;border:3px solid #211d1a;box-shadow:6px 6px 0 rgba(0,0,0,.45);padding:14px;position:relative}}
  .card-top{{display:flex;justify-content:space-between;font-family:monospace;font-size:10px;letter-spacing:.1em;color:#8a7a64}}
  .gender{{border:1px solid #c84938;color:#c84938;padding:1px 6px}}
  .visual{{display:grid;grid-template-columns:1fr 92px;gap:8px;align-items:end;margin-top:8px;background:linear-gradient(145deg,#e8dcc6,#f9f0df);border:1px solid rgba(33,29,26,.2);min-height:250px;overflow:hidden}}
  .portrait{{width:100%;height:245px;object-fit:contain;object-position:center bottom}}
  .sprite-wrap{{display:flex;flex-direction:column;align-items:center;gap:3px;padding-bottom:8px}}
  .sprite{{width:76px;height:92px;object-fit:contain;image-rendering:auto}}
  .sprite-wrap span{{font-size:8px;color:#8a7a64;writing-mode:horizontal-tb}}
  h2{{font-family:"KaiTi","STKaiti",serif;font-size:28px;font-weight:400;margin:12px 0 2px}}
  .role{{font-family:monospace;font-size:10px;color:#8a7a64;letter-spacing:.05em;border-bottom:1px dashed rgba(33,29,26,.25);padding-bottom:7px}}
  ul{{margin:9px 0 8px;padding-left:15px;min-height:88px}} li{{font-size:10px;line-height:1.65;color:#61523f;margin-bottom:3px}}
  .palette{{display:flex;align-items:center;gap:4px;border-top:1px solid rgba(33,29,26,.16);padding-top:7px}}
  .swatch{{width:16px;height:16px;border:1px solid #211d1a}} .prop{{margin-left:auto;font-size:9px;color:#8a7a64}}
</style></head><body>
<header><div><div class="kicker">CAST / CHARACTER DESIGN v2 / 2D</div><h1>《还我小说！》人物设定</h1></div>
<p>纯 2D 手绘 SVG：立绘 + 游戏内小人两套资产。<br>角色气质、性别、身份先定稿，再进入玩法整改。</p></header>
<div class="grid">{''.join(cards)}</div>
</body></html>"""
    (ROOT / "tools_cast_v2.html").write_text(page, encoding="utf-8")
    print(f"wrote portraits/sprites and {ROOT / 'tools_cast_v2.html'}")


if __name__ == "__main__":
    build()
