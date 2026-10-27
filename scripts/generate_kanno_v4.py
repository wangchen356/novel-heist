"""Kanno v4 study: big ears + a full head of curls.

Two curl volumes are shown for approval.  The rest of the cast is unchanged.
"""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "art" / "kanno_v4"
OUT.mkdir(parents=True, exist_ok=True)

INK = "#211d1a"
PAPER = "#f4ead8"
WHITE = "#fff9ec"
RED = "#c84938"
YELLOW = "#f0c04e"
SKIN = "#f1c6a1"
SKIN_SHADE = "#d99a72"
HAIR = "#2c2420"
HAIR_HI = "#4b382d"
HOOD = "#31485f"
HOOD_DARK = "#263847"
BLUE = "#486b91"


def o(w: int = 5) -> str:
    return f'stroke="{INK}" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="round"'


def curl(cx: float, cy: float, r: float) -> str:
    ring = (
        f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{HAIR}" {o(4)}/>'
        f'<path d="M{cx-r*0.6} {cy-r*0.15} Q{cx-r*0.1} {cy-r*0.75} {cx+r*0.55} {cy-r*0.35}" '
        f'fill="none" stroke="{HAIR_HI}" stroke-width="3" opacity=".45"/>'
        f'<path d="M{cx-r*0.45} {cy+r*0.35} Q{cx} {cy+r*0.75} {cx+r*0.55} {cy+r*0.3}" '
        f'fill="none" stroke="{INK}" stroke-width="2.5" opacity=".35"/>'
    )
    return ring


def ear(side: str) -> str:
    cx = 86 if side == "left" else 434
    return (
        f'<ellipse cx="{cx}" cy="338" rx="42" ry="58" fill="{SKIN}" {o(6)}/>'
        f'<path d="M{cx-17} 310 Q{cx+9} 334 {cx-3} 370 Q{cx-24} 358 {cx-20} 324" '
        f'fill="none" stroke="{SKIN_SHADE}" stroke-width="4" stroke-linecap="round"/>'
        f'<path d="M{cx-12} 352 Q{cx+3} 360 {cx+8} 348" fill="none" stroke="{INK}" stroke-width="3" opacity=".4"/>'
        f'<path d="M{cx-20} 290 Q{cx-36} 324 {cx-20} 372" fill="none" stroke="{INK}" stroke-width="3" opacity=".25"/>'
    )


def face() -> str:
    return (
        # head: short square, not an egg
        f'<path d="M110 278 L110 382 L154 446 H366 L410 382 L410 278 '
        f'Q410 188 340 174 H180 Q110 188 110 278Z" fill="{SKIN}" {o(6)}/>'
        f'<path d="M152 405 Q260 438 368 405" fill="none" stroke="{SKIN_SHADE}" stroke-width="4" opacity=".3"/>'
        # eyes (tired, slightly asymmetric)
        f'<ellipse cx="190" cy="306" rx="28" ry="14" fill="{WHITE}" {o(3)}/>'
        f'<ellipse cx="330" cy="306" rx="28" ry="14" fill="{WHITE}" {o(3)}/>'
        f'<circle cx="194" cy="308" r="9" fill="#3a2b25"/>'
        f'<circle cx="334" cy="308" r="9" fill="#3a2b25"/>'
        f'<circle cx="198" cy="304" r="3" fill="{WHITE}"/><circle cx="338" cy="304" r="3" fill="{WHITE}"/>'
        f'<path d="M162 299 Q190 292 218 300" fill="none" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>'
        f'<path d="M302 300 Q330 292 358 299" fill="none" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>'
        f'<path d="M165 296 Q190 286 215 296" fill="none" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>'
        f'<path d="M305 296 Q330 286 355 296" fill="none" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>'
        # eye bags / tired
        f'<path d="M165 331 Q190 340 216 330" fill="none" stroke="{SKIN_SHADE}" stroke-width="3" opacity=".55"/>'
        f'<path d="M304 330 Q330 340 355 331" fill="none" stroke="{SKIN_SHADE}" stroke-width="3" opacity=".55"/>'
        # nose
        f'<path d="M252 342 Q260 356 270 342" fill="none" stroke="{INK}" stroke-width="4" stroke-linecap="round"/>'
        # mouth, half smirk
        f'<path d="M224 378 Q256 394 292 372" fill="none" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>'
        f'<path d="M282 377 Q290 374 298 367" fill="none" stroke="{INK}" stroke-width="3" stroke-linecap="round"/>'
        # cheek band-aid
        f'<g transform="rotate(-12 368 365)"><rect x="346" y="358" width="44" height="14" rx="7" fill="{PAPER}" {o(4)}/>'
        f'<path d="M357 358v14M370 358v14M383 358v14" stroke="{SKIN_SHADE}" stroke-width="2.5"/></g>'
    )


def hair(volume: str) -> str:
    """Hair behind the face; ears peek out from under the curls."""
    if volume == "a":
        base = (
            f'<path d="M100 282 C60 250 62 190 96 160 C92 108 132 78 176 92 '
            f'C196 50 250 40 282 66 C318 38 372 52 382 96 C432 112 446 178 414 220 '
            f'L394 300 C376 248 336 224 260 224 C184 224 144 250 128 310Z" fill="{HAIR}" {o(5)}/>'
        )
        curls = [(112, 186, 40), (146, 132, 44), (198, 106, 48), (258, 98, 50),
                 (316, 114, 45), (366, 152, 40), (394, 210, 35), (136, 246, 31), (388, 252, 31)]
    else:
        base = (
            f'<path d="M92 292 C42 252 48 176 92 148 C82 92 130 58 174 78 '
            f'C198 26 266 20 300 54 C342 22 402 44 408 98 C458 124 468 196 428 238 '
            f'L416 326 C396 258 344 224 260 224 C176 224 126 260 110 334Z" fill="{HAIR}" {o(5)}/>'
        )
        curls = [(94, 196, 46), (130, 132, 50), (184, 96, 54), (248, 84, 58),
                 (312, 98, 56), (370, 132, 48), (408, 198, 42), (418, 266, 37),
                 (112, 256, 36), (150, 288, 31)]
    body = [base]
    for cx, cy, r in curls:
        body.append(curl(cx, cy, r))
    return "".join(body)


def front_hair(volume: str) -> str:
    # A few curls break over the forehead; eyes stay clear.
    if volume == "a":
        return (
            f'<path d="M142 222 Q174 190 218 206 Q246 182 280 204 Q312 188 344 218 '
            f'Q318 236 286 226 Q258 246 226 228 Q190 250 158 230Z" fill="{HAIR}" {o(4)}/>'
            f'<path d="M176 218 Q190 206 204 220M246 216 Q260 202 276 218M310 218 Q324 206 338 220" '
            f'fill="none" stroke="{HAIR_HI}" stroke-width="4" opacity=".5"/>'
        )
    return (
        f'<path d="M136 226 Q166 182 214 202 Q246 170 286 198 Q322 180 352 222 '
        f'Q324 246 292 230 Q260 254 224 232 Q190 258 154 236Z" fill="{HAIR}" {o(4)}/>'
        f'<path d="M168 220 Q184 204 200 222M238 218 Q254 200 272 218M304 218 Q320 202 336 222" '
        f'fill="none" stroke="{HAIR_HI}" stroke-width="4" opacity=".5"/>'
    )


def portrait(volume: str) -> str:
    body = [
        # hoodie / shoulders
        f'<path d="M34 640 Q52 508 156 474 H364 Q468 508 486 640Z" fill="{HOOD}" {o(6)}/>',
        f'<path d="M146 486 Q170 520 260 528 Q350 520 374 486" fill="none" stroke="{INK}" stroke-width="5"/>',
        f'<path d="M168 486 Q196 506 260 512 Q324 506 352 486" fill="none" stroke="{PAPER}" stroke-width="4" opacity=".5"/>',
        # neck
        f'<rect x="226" y="418" width="68" height="86" rx="20" fill="{SKIN}" {o(5)}/>',
        f'<path d="M226 450 Q260 470 294 450" fill="none" stroke="{SKIN_SHADE}" stroke-width="4" opacity=".45"/>',
    ]
    body.append(hair(volume))
    body.append(ear("left"))
    body.append(ear("right"))
    body.append(face())
    body.append(front_hair(volume))
    # drawstrings
    body.append(f'<path d="M214 520 L202 640M306 520 L318 640" stroke="{PAPER}" stroke-width="5" stroke-linecap="round"/>')
    body.append(f'<circle cx="202" cy="640" r="5" fill="{INK}"/><circle cx="318" cy="640" r="5" fill="{INK}"/>')
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="520" height="640" viewBox="0 0 520 640" fill="none">'
        f'{"".join(body)}</svg>'
    )
    (OUT / f"kanno_{volume}.svg").write_text(svg, encoding="utf-8")


def sprite(volume: str) -> None:
    body = [
        f'<ellipse cx="45" cy="104" rx="26" ry="5" fill="rgba(20,18,15,.25)"/>',
        f'<rect x="31" y="78" width="11" height="20" rx="4" fill="#263847" {o(3)}/>',
        f'<rect x="48" y="78" width="11" height="20" rx="4" fill="#263847" {o(3)}/>',
        f'<path d="M27 96h16q3 0 3 3v2H25v-2q0-3 2-3Z" fill="{INK}"/>',
        f'<path d="M47 96h16q3 0 3 3v2H45v-2q0-3 2-3Z" fill="{INK}"/>',
        f'<path d="M21 52 Q21 43 32 42 H58 Q69 43 69 52 L67 82 Q67 87 62 87 H28 Q23 87 23 82Z" fill="{HOOD}" {o(4)}/>',
        f'<rect x="13" y="52" width="10" height="28" rx="4" fill="{HOOD}" {o(3)}/>',
        f'<rect x="67" y="52" width="10" height="28" rx="4" fill="{HOOD}" {o(3)}/>',
        f'<circle cx="17" cy="82" r="5" fill="{SKIN}" {o(2.5)}/>',
        f'<circle cx="73" cy="82" r="5" fill="{SKIN}" {o(2.5)}/>',
        f'<rect x="38" y="38" width="14" height="8" fill="{SKIN}" {o(2)}/>',
        f'<circle cx="45" cy="34" r="22" fill="{SKIN}" {o(4)}/>',
    ]
    # ears
    body.append(f'<ellipse cx="20" cy="36" rx="7" ry="11" fill="{SKIN}" {o(3)}/>')
    body.append(f'<ellipse cx="70" cy="36" rx="7" ry="11" fill="{SKIN}" {o(3)}/>')
    # curly hair: overlapping circles
    for cx, cy, r in [(28, 24, 10), (38, 14, 11), (51, 11, 11), (62, 18, 10), (68, 28, 8), (22, 31, 8)]:
        body.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{HAIR}" {o(2.5)}/>')
    body.append(f'<path d="M28 17 Q36 11 43 18M52 11 Q60 11 64 20" fill="none" stroke="{HAIR_HI}" stroke-width="2" opacity=".55"/>')
    # face
    body.append(f'<circle cx="37" cy="34" r="2" fill="{INK}"/><circle cx="53" cy="34" r="2" fill="{INK}"/>')
    body.append(f'<path d="M39 43 Q45 47 52 41" fill="none" stroke="{INK}" stroke-width="2" stroke-linecap="round"/>')
    body.append(f'<g transform="rotate(-18 59 42)"><rect x="53" y="39" width="13" height="5" rx="2" fill="{PAPER}" {o(1.5)}/></g>')
    # hoodie front / strings
    body.append(f'<path d="M31 52 Q45 61 59 52" fill="none" stroke="{PAPER}" stroke-width="2" opacity=".55"/>')
    body.append(f'<path d="M33 56 L29 82M57 56 L61 82" stroke="{PAPER}" stroke-width="3" stroke-linecap="round"/>')
    body.append(f'<path d="M55 61 L65 61" stroke="{YELLOW}" stroke-width="3" opacity=".8"/>')
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="90" height="110" viewBox="0 0 90 110" fill="none">'
        f'{"".join(body)}</svg>'
    )
    (OUT / f"sprite_{volume}.svg").write_text(svg, encoding="utf-8")


def build() -> None:
    for volume in ("a", "b"):
        portrait(volume)
        sprite(volume)
    page = f"""<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><style>
  *{{box-sizing:border-box}} body{{margin:0;background:#171513;color:#f4ead8;font-family:"Microsoft YaHei","PingFang SC",sans-serif;padding:32px}}
  header{{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid rgba(244,234,216,.2);padding-bottom:16px;margin-bottom:20px}}
  .kicker{{font-family:monospace;font-size:10px;letter-spacing:.2em;color:#c84938}} h1{{font-family:"KaiTi","STKaiti",serif;font-size:50px;font-weight:400;margin:8px 0 0}}
  header p{{max-width:560px;margin:0;color:#b9aa94;font-size:11px;line-height:1.8;text-align:right}}
  .grid{{display:grid;grid-template-columns:1fr 1fr;gap:20px}}
  .card{{background:#f4ead8;color:#211d1a;border:3px solid #211d1a;box-shadow:7px 7px 0 rgba(0,0,0,.45);padding:16px;display:grid;grid-template-columns:1fr 110px;gap:12px}}
  .visual{{min-height:580px;background:linear-gradient(145deg,#e9ddc7,#f8efdf);border:1px solid rgba(33,29,26,.18);display:flex;align-items:flex-end;justify-content:center;overflow:hidden}}
  .visual img{{width:100%;height:580px;object-fit:contain;object-position:center bottom}}
  .side{{display:flex;flex-direction:column;align-items:center;gap:6px;padding-top:8px}}
  .side img{{width:90px;height:110px}} .side span{{font-size:8px;color:#8a7a64;text-align:center;line-height:1.4}}
  .meta{{grid-column:1/-1;border-top:1px solid rgba(33,29,26,.2);padding-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:8px}}
  h2{{font-family:"KaiTi","STKaiti",serif;font-size:30px;font-weight:400;margin:0}} .tag{{font-family:monospace;font-size:9px;color:#c84938}}
  ul{{margin:6px 0 0;padding-left:15px}} li{{font-size:10px;line-height:1.65;color:#5f503f;margin-bottom:3px}}
  .callout{{font-size:9px;line-height:1.65;color:#7c6b56;grid-column:1/-1;border-top:1px dashed rgba(33,29,26,.2);padding-top:8px}}
  footer{{margin-top:16px;display:flex;justify-content:space-between;color:#8f816e;font-size:9px;border-top:1px solid rgba(244,234,216,.12);padding-top:10px}}
  .red{{color:#c84938}}
</style></head><body>
<header><div><div class="kicker">KANNO / MODEL SHEET v4 / 2D</div><h1>Kanno：大耳朵 + 整头卷发</h1></div>
<p>两种卷发体积：A 短卷云朵，B 蓬松中长卷。<br>耳朵都要从卷发里露出来，不做贴头皮短刺。</p></header>
<div class="grid">
  <article class="card">
    <div class="visual"><img src="public/art/kanno_v4/kanno_a.svg" alt="Kanno A"></div>
    <div class="side"><span class="tag">A / SHORT CURLS</span><img src="public/art/kanno_v4/sprite_a.svg" alt="sprite A"><span>游戏内小人<br>卷度：短·云朵</span></div>
    <div class="meta"><div><h2>方案 A · 短卷云朵</h2><p class="tag">BIG EARS / CURLY CLOUD</p></div><ul><li>整头覆盖，卷发在耳上收住。</li><li>大耳朵完整露出，正面能看到耳窝。</li><li>发际线压到眉毛上方，眼睛不被遮。</li></ul></div>
  </article>
  <article class="card">
    <div class="visual"><img src="public/art/kanno_v4/kanno_b.svg" alt="Kanno B"></div>
    <div class="side"><span class="tag">B / FLUFFY CURLS</span><img src="public/art/kanno_v4/sprite_b.svg" alt="sprite B"><span>游戏内小人<br>卷度：蓬松·中长</span></div>
    <div class="meta"><div><h2>方案 B · 蓬松中长卷</h2><p class="tag">BIG EARS / FLUFFY CURLS</p></div><ul><li>卷发体积更大，盖到耳根和太阳穴。</li><li>耳朵仍从卷发两侧戳出来。</li><li>比 A 更“刚睡醒”，更像 Kanno。</li></ul></div>
  </article>
  <div class="callout"><span class="red">固定特征：</span>大耳朵（耳廓外扩、耳窝可见）· 卷发覆盖整个头（不是短刺/贴头皮）· 左脸颊创可贴 · 深蓝连帽卫衣 · 疲惫的半眯眼。<br>这轮只改 Kanno；右小唐等你的描述。五官、卷发纹理和服装细节确认后再精修。</div>
</div>
<footer><span>KANNO MODEL SHEET / v4 / 2026</span><span>方案 A 与 B 只差卷发体积，脸和耳朵一致</span></footer>
</body></html>"""
    (ROOT / "tools_kanno_v4.html").write_text(page, encoding="utf-8")
    print("wrote Kanno v4 study")


if __name__ == "__main__":
    build()
