"""Face-shape studies for the v2 cast.

This is a discussion sheet, not a game build.  It deliberately avoids the
oval / egg face used by the first version.
"""
from __future__ import annotations

import html
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "art" / "face_options"
OUT.mkdir(parents=True, exist_ok=True)

INK = "#211d1a"
PAPER = "#f4ead8"
WHITE = "#fff9ec"
RED = "#c84938"
YELLOW = "#f0c04e"
BLUE = "#486b91"
GREEN = "#2e5547"
SKIN = "#f1c6a1"
SKIN2 = "#e8b78e"
SKIN3 = "#f2c9a8"

# 320x360 head studies, centered on 160,170
SHAPES = {
    "square": dict(
        label="方脸",
        sub="宽下颌 / 平下巴 / 存在感",
        d="M58 120 L58 218 L94 258 H226 L262 218 L262 120 Q262 54 210 44 H110 Q58 54 58 120Z",
        mouth_y=240,
        chin="平下巴",
    ),
    "rectangle": dict(
        label="长方脸",
        sub="面部长 / 线条直 / 克制",
        d="M86 106 Q86 46 160 36 Q234 46 234 106 L232 236 Q228 276 194 284 H126 Q92 276 88 236Z",
        mouth_y=246,
        chin="窄长下颌",
    ),
    "heart": dict(
        label="心形脸",
        sub="宽额头 / 尖下巴 / 轻",
        d="M58 122 Q58 50 160 40 Q262 50 262 122 Q258 184 224 218 Q192 252 160 280 Q128 252 96 218 Q62 184 58 122Z",
        mouth_y=238,
        chin="尖下巴",
    ),
    "diamond": dict(
        label="菱形脸",
        sub="宽颧骨 / 窄额头与下巴 / 锐",
        d="M160 40 L234 142 L204 224 L160 272 L116 224 L86 142Z",
        mouth_y=238,
        chin="窄尖下巴",
    ),
    "round": dict(
        label="圆脸",
        sub="短下巴 / 宽脸颊 / 仅岛小王",
        d="M50 150 Q50 52 160 44 Q270 52 270 150 Q270 242 160 276 Q50 242 50 150Z",
        mouth_y=236,
        chin="短圆下巴",
    ),
    "trapezoid": dict(
        label="梯形脸",
        sub="窄额头 / 宽下颌 / 硬朗备选",
        d="M96 38 L224 38 L264 196 L222 262 L98 262 L56 196Z",
        mouth_y=242,
        chin="宽下巴",
    ),
}

CAST = [
    dict(key="kanno", name="Kanno", shape="square", hair="messy", skin=SKIN, shirt=BLUE, acc="bandaid", role="短方脸", note="少年感、下颌收一点；别太凶"),
    dict(key="houzi", name="猴子", shape="diamond", hair="short_messy", skin="#eec39e", shirt="#5b7254", acc="round_glasses", role="菱形脸", note="颧骨明显、下巴窄；适合戴圆框"),
    dict(key="wangxin", name="王心", shape="rectangle", hair="neat", skin="#f3caa7", shirt="#314356", acc="rect_glasses", role="长方脸", note="线条直、下颌窄；有“正确感”"),
    dict(key="daoxiaowang", name="岛小王", shape="round", hair="slick", skin=SKIN2, shirt="#6e7b85", acc="none", role="圆脸（唯一）", note="圆脸只给他；宽、壮、笑起来欠揍"),
    dict(key="youxiaotang", name="右小唐", shape="heart", hair="long", skin=SKIN3, shirt="#c9aa7d", acc="hairclip", role="心形脸", note="额头/颧骨宽、下巴收；漂亮但不甜腻"),
    dict(key="shiyi", name="十一", shape="rectangle", hair="bun", skin="#e9c5a3", shirt="#3c4454", acc="round_glasses", role="长脸/长方脸", note="比王心更窄、更成熟；眼镜压住疲惫"),
]


def svg_head(shape: str, hair: str, skin: str, shirt: str, acc: str, *, diagram: bool = False) -> str:
    s = SHAPES[shape]
    path = s["d"]
    body = [
        # shoulders / neck
        f'<path d="M24 360 Q32 286 98 266 H222 Q288 286 296 360Z" fill="{shirt}" {stroke(5)}/>',
        f'<rect x="136" y="238" width="48" height="62" rx="15" fill="{skin}" {stroke(4)}/>',
        # ears
        f'<ellipse cx="68" cy="180" rx="17" ry="25" fill="{skin}" {stroke(4)}/>',
        f'<ellipse cx="252" cy="180" rx="17" ry="25" fill="{skin}" {stroke(4)}/>',
        # head
        f'<path d="{path}" fill="{skin}" {stroke(5 if diagram else 6)}/>',
    ]
    if hair == "neat":
        body.append(f'<path d="M84 110 Q88 42 160 32 Q232 42 236 110 Q208 66 160 62 Q118 66 92 118Z" fill="{INK}" {stroke(3)}/>')
        body.append(f'<path d="M104 104 Q140 66 196 78" fill="none" stroke="{WHITE}" stroke-width="3" opacity=".16"/>')
    elif hair == "messy":
        body.append(f'<path d="M80 118 L88 58 L108 80 L124 42 L150 76 L176 36 L192 78 L218 54 L234 118 Q204 78 160 78 Q112 82 80 118Z" fill="{INK}" {stroke(3)}/>')
    elif hair == "short_messy":
        body.append(f'<path d="M84 116 L90 62 L108 78 L124 44 L148 74 L172 42 L190 78 L214 60 L232 116 Q206 80 160 80 Q112 82 84 116Z" fill="{INK}" {stroke(3)}/>')
    elif hair == "slick":
        body.append(f'<path d="M84 112 Q90 48 160 38 Q230 48 236 112 Q202 72 160 76 Q114 72 84 112Z" fill="{INK}" {stroke(3)}/>')
        body.append(f'<path d="M108 102 Q150 70 206 84" fill="none" stroke="{WHITE}" stroke-width="4" opacity=".18"/>')
    elif hair == "long":
        body.append(f'<path d="M80 118 Q78 40 160 32 Q242 40 240 118 L250 254 Q228 280 208 248 L210 142 Q186 120 160 122 Q134 120 110 142 L112 248 Q92 280 70 254Z" fill="{INK}" {stroke(3)}/>')
        body.append(f'<path d="M96 112 Q114 78 160 72 Q208 78 224 108 Q190 94 160 100 Q128 94 96 112Z" fill="{INK}"/>')
    elif hair == "bun":
        body.append(f'<circle cx="160" cy="42" r="24" fill="{INK}" {stroke(3)}/>')
        body.append(f'<path d="M82 116 Q86 42 160 32 Q234 42 238 116 Q208 70 160 74 Q112 70 82 116Z" fill="{INK}" {stroke(3)}/>')
    # features
    eye_y = 176 if shape != "rectangle" else 182
    body.append(brow(120, eye_y - 40, "left"))
    body.append(brow(200, eye_y - 40, "right"))
    body.append(eye(120, eye_y))
    body.append(eye(200, eye_y))
    body.append(f'<path d="M156 {eye_y+24} Q160 {eye_y+32} 166 {eye_y+24}" fill="none" stroke="{INK}" stroke-width="3" stroke-linecap="round"/>')
    body.append(f'<path d="M146 {s["mouth_y"]} Q160 {s["mouth_y"]+8} 174 {s["mouth_y"]}" fill="none" stroke="{INK}" stroke-width="4" stroke-linecap="round"/>')
    if hair == "long":
        body.append(f'<rect x="104" y="128" width="22" height="10" rx="4" fill="{RED}" {stroke(2)} transform="rotate(-18 115 133)"/>')
    if acc == "bandaid":
        body.append(f'<g transform="rotate(-18 238 222)"><rect x="222" y="216" width="36" height="12" rx="6" fill="{PAPER}" {stroke(3)}/><path d="M235 216v12M247 216v12" stroke="{INK}" stroke-width="2"/></g>')
    if acc in ("rect_glasses", "round_glasses"):
        if acc == "rect_glasses":
            body.append(f'<g fill="none" stroke="{INK}" stroke-width="4"><rect x="94" y="{eye_y-20}" width="50" height="34" rx="5"/><rect x="176" y="{eye_y-20}" width="50" height="34" rx="5"/><path d="M144 {eye_y-4} H176M94 {eye_y-10} L72 {eye_y-14}M226 {eye_y-10} L248 {eye_y-14}"/></g>')
        else:
            body.append(f'<g fill="none" stroke="{INK}" stroke-width="3"><circle cx="120" cy="{eye_y-4}" r="25"/><circle cx="200" cy="{eye_y-4}" r="25"/><path d="M145 {eye_y-4} H175M95 {eye_y-8} L74 {eye_y-12}M225 {eye_y-8} L246 {eye_y-12}"/></g>')
    if diagram:
        body.append(f'<path d="{path}" fill="none" stroke="{RED}" stroke-width="2" stroke-dasharray="5 5"/>')
    return "".join(body)


def stroke(width: int) -> str:
    return f'stroke="{INK}" stroke-width="{width}" stroke-linejoin="round" stroke-linecap="round"'


def eye(x: int, y: int) -> str:
    return (
        f'<ellipse cx="{x}" cy="{y}" rx="18" ry="11" fill="{WHITE}" {stroke(2.5)}/>'
        f'<circle cx="{x+2}" cy="{y}" r="6" fill="#3a2b25"/>'
        f'<circle cx="{x+4}" cy="{y-3}" r="1.8" fill="{WHITE}"/>'
    )


def brow(x: int, y: int, side: str) -> str:
    dx = -18 if side == "left" else 18
    return f'<path d="M{x-dx} {y+4} Q{x} {y-3} {x+dx} {y+2}" fill="none" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>'


def build() -> None:
    cards = []
    for i, (key, s) in enumerate(SHAPES.items(), start=1):
        cards.append(
            f"""
            <div class="shape">
              <div class="shape-top"><span>{i:02d}</span><span>{s['chin']}</span></div>
              <div class="head"><svg viewBox="0 0 320 360" xmlns="http://www.w3.org/2000/svg">{svg_head(key, 'none', SKIN, BLUE, 'none', diagram=True)}</svg></div>
              <h3>{s['label']}</h3><p>{s['sub']}</p>
            </div>
            """
        )
    cast = []
    for c in CAST:
        cast.append(
            f"""
            <div class="person">
              <div class="mini-head"><svg viewBox="0 0 320 360" xmlns="http://www.w3.org/2000/svg">{svg_head(c['shape'], c['hair'], c['skin'], c['shirt'], c['acc'])}</svg></div>
              <div class="person-meta"><b>{html.escape(c['name'])}</b><span>{c['role']}</span></div>
              <p>{c['note']}</p>
            </div>
            """
        )
    page = f"""<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><style>
  *{{box-sizing:border-box}} body{{margin:0;background:#171513;color:#f4ead8;font-family:"Microsoft YaHei","PingFang SC",sans-serif;padding:30px}}
  header{{display:flex;align-items:flex-end;justify-content:space-between;border-bottom:2px solid rgba(244,234,216,.2);padding-bottom:16px;margin-bottom:20px}}
  .kicker{{font-family:monospace;font-size:10px;letter-spacing:.2em;color:#c84938}} h1{{font-family:"KaiTi","STKaiti",serif;font-size:48px;font-weight:400;margin:8px 0 0}} header p{{max-width:540px;margin:0;color:#b9aa94;font-size:11px;line-height:1.8;text-align:right}}
  h2{{font-family:"KaiTi","STKaiti",serif;font-weight:400;font-size:24px;margin:18px 0 10px;color:#f0c04e}} h2 small{{font-family:"Microsoft YaHei",sans-serif;font-size:10px;color:#9f907b;margin-left:10px}}
  .shapes{{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}}
  .shape{{background:#f4ead8;color:#211d1a;border:2px solid #211d1a;padding:9px;box-shadow:3px 3px 0 rgba(0,0,0,.35)}}
  .shape-top{{display:flex;justify-content:space-between;font-family:monospace;font-size:8px;color:#8a7a64}} .shape-top span:last-child{{color:#c84938}}
  .head{{height:240px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#eadfc9;border:1px solid rgba(33,29,26,.16);margin:6px 0}}
  .head svg{{width:100%;height:100%}}
  h3{{font-family:"KaiTi","STKaiti",serif;font-size:22px;font-weight:400;margin:4px 0 2px}} .shape p{{margin:0;color:#7c6b56;font-size:9px;line-height:1.5}}
  .cast{{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}}
  .person{{background:#f4ead8;color:#211d1a;border:2px solid #211d1a;padding:8px;box-shadow:3px 3px 0 rgba(0,0,0,.35)}}
  .mini-head{{height:230px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#eadfc9;border:1px solid rgba(33,29,26,.16)}} .mini-head svg{{width:100%;height:100%}}
  .person-meta{{display:flex;align-items:baseline;gap:6px;margin-top:7px;border-bottom:1px solid rgba(33,29,26,.18);padding-bottom:4px}} .person-meta b{{font-family:"KaiTi","STKaiti",serif;font-size:21px;font-weight:400}} .person-meta span{{font-family:monospace;font-size:9px;color:#c84938}}
  .person p{{margin:5px 0 0;color:#74634e;font-size:8px;line-height:1.45;min-height:34px}}
  footer{{margin-top:16px;display:flex;justify-content:space-between;color:#8f816e;font-size:9px;border-top:1px solid rgba(244,234,216,.12);padding-top:10px}}
  .note{{color:#c84938}}
</style></head><body>
<header><div><div class="kicker">FACE SHAPES / v3 / 2D CHARACTER STUDY</div><h1>《还我小说！》脸型方案</h1></div>
<p>已排除鸭蛋脸/椭圆脸。圆脸只保留给岛小王。<br>下面先选脸型，再讨论眼睛、鼻子、发型和服装细节。</p></header>
<h2>脸型库 <small>FACE SHAPE LIBRARY / 下颌与颧骨是主要区分</small></h2>
<div class="shapes">{''.join(cards)}</div>
<h2>推荐分配 A <small>RECOMMENDED CAST MAP / 可以单独更换其中任何一个</small></h2>
<div class="cast">{''.join(cast)}</div>
<footer><span>方案 A：Kanno 短方 / 猴子 菱形 / 王心 长方 / 岛小王 圆 / 右小唐 心形 / 十一 长方</span><span class="note">圆脸仅岛小王 · 无鸭蛋脸</span></footer>
</body></html>"""
    (ROOT / "tools_face_options.html").write_text(page, encoding="utf-8")
    print("wrote face options sheet")


if __name__ == "__main__":
    build()
