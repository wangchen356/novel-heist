"""You Xiaotang v5: a campus adaptation of the supplied 2D reference.

Keep the long black wavy hair, green eyes, cool angular face and navy/silver
palette.  Replace the fantasy armour with a school blazer / cardigan.
"""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "art" / "youxiaotang_v5"
OUT.mkdir(parents=True, exist_ok=True)

INK = "#1e1b1a"
PAPER = "#f4ead8"
WHITE = "#fffaf0"
RED = "#b85c55"
SILVER = "#c7cbd2"
SILVER_DARK = "#7f8792"
NAVY = "#26364d"
NAVY_DARK = "#1a2636"
SKIN = "#f0cdb2"
SKIN_SHADE = "#d7a586"
HAIR = "#211e21"
HAIR_HI = "#4f5368"
EYE = "#4c8a70"
GREEN = "#2e5547"
BOOK = "#324b4b"


def o(w: int = 5) -> str:
    return f'stroke="{INK}" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="round"'


def face() -> str:
    # Long, angular face with a pointed chin: not an egg / oval.
    return (
        f'<path d="M134 264 Q134 190 260 176 Q386 190 386 264 L380 348 '
        f'L352 410 L310 434 L260 452 L210 434 L168 410 L140 348Z" fill="{SKIN}" {o(6)}/>'
        f'<path d="M188 402 Q260 424 332 402" fill="none" stroke="{SKIN_SHADE}" stroke-width="4" opacity=".28"/>'
        # larger, cool green eyes
        f'<path d="M162 318 Q204 290 246 318 Q204 344 162 318Z" fill="{WHITE}" {o(3)}/>'
        f'<path d="M274 318 Q316 290 358 318 Q316 344 274 318Z" fill="{WHITE}" {o(3)}/>'
        f'<ellipse cx="204" cy="317" rx="15" ry="14" fill="{EYE}"/>'
        f'<ellipse cx="316" cy="317" rx="15" ry="14" fill="{EYE}"/>'
        f'<circle cx="204" cy="317" r="5" fill="{INK}"/><circle cx="316" cy="317" r="5" fill="{INK}"/>'
        f'<circle cx="209" cy="312" r="3.4" fill="{WHITE}"/><circle cx="321" cy="312" r="3.4" fill="{WHITE}"/>'
        f'<path d="M162 318 Q204 306 246 318" fill="none" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>'
        f'<path d="M274 318 Q316 306 358 318" fill="none" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>'
        f'<path d="M160 310 l-15 -7M360 310 l15 -7" stroke="{INK}" stroke-width="3" stroke-linecap="round"/>'
        f'<path d="M226 330 Q238 338 246 330M274 330 Q286 338 294 330" fill="none" stroke="{SKIN_SHADE}" stroke-width="2" opacity=".45"/>'
        # brows, straight and slightly severe
        f'<path d="M168 286 Q202 276 236 286" fill="none" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>'
        f'<path d="M284 286 Q318 276 352 286" fill="none" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>'
        # nose / mouth + subtle blush
        f'<path d="M260 338 Q268 352 278 340" fill="none" stroke="{INK}" stroke-width="3.5" stroke-linecap="round"/>'
        f'<path d="M230 382 Q260 392 290 382" fill="none" stroke="{RED}" stroke-width="4" stroke-linecap="round"/>'
        f'<path d="M244 391 Q260 397 276 391" fill="none" stroke="{SKIN_SHADE}" stroke-width="2" opacity=".55"/>'
        f'<ellipse cx="180" cy="372" rx="18" ry="8" fill="{RED}" opacity=".12"/>'
        f'<ellipse cx="340" cy="372" rx="18" ry="8" fill="{RED}" opacity=".12"/>'
        # subtle cheekbone line
        f'<path d="M180 366 Q198 378 204 394" fill="none" stroke="{SKIN_SHADE}" stroke-width="3" opacity=".3"/>'
        f'<path d="M340 366 Q322 378 316 394" fill="none" stroke="{SKIN_SHADE}" stroke-width="3" opacity=".3"/>'
    )


def hair_back() -> str:
    return (
        f'<path d="M118 300 C76 238 92 164 146 148 C158 98 222 84 260 110 '
        f'C298 84 362 98 374 148 C428 164 444 238 402 300 L422 486 '
        f'C414 556 382 602 344 574 L326 414 Q292 438 260 438 Q228 438 194 414 '
        f'L176 574 C138 602 106 556 98 486Z" fill="{HAIR}" {o(5)}/>'
        # side waves
        f'<path d="M142 300 C118 358 124 450 150 512 C166 548 188 556 198 526 '
        f'C180 448 190 352 214 306Z" fill="{HAIR}" {o(4)}/>'
        f'<path d="M378 300 C402 358 396 450 370 512 C354 548 332 556 322 526 '
        f'C340 448 330 352 306 306Z" fill="{HAIR}" {o(4)}/>'
        # wavy ends
        f'<path d="M112 486 Q128 548 160 574 Q182 588 192 566" fill="none" stroke="{INK}" stroke-width="12" stroke-linecap="round"/>'
        f'<path d="M408 486 Q392 548 360 574 Q338 588 328 566" fill="none" stroke="{INK}" stroke-width="12" stroke-linecap="round"/>'
        f'<path d="M154 500 Q166 548 188 568M366 500 Q354 548 332 568" fill="none" stroke="{HAIR_HI}" stroke-width="4" opacity=".3"/>'
    )


def hair_front() -> str:
    return (
        # centre-part cap, lifted to keep the face readable
        f'<path d="M146 274 Q146 194 260 180 Q374 194 374 274 '
        f'Q338 236 302 230 Q280 242 260 256 Q240 242 218 230 Q180 236 146 274Z" fill="{HAIR}" {o(4)}/>'
        # thin outer locks only; the face and eyes stay clear
        f'<path d="M154 300 C142 350 146 408 166 450 C174 420 168 380 174 340Z" fill="{HAIR}" {o(2.5)}/>'
        f'<path d="M366 300 C378 350 374 408 354 450 C346 420 352 380 346 340Z" fill="{HAIR}" {o(2.5)}/>'
        # side highlights
        f'<path d="M160 320 Q152 388 178 456M360 320 Q368 388 342 456" fill="none" stroke="{HAIR_HI}" stroke-width="4" opacity=".3"/>'
        f'<path d="M206 238 Q232 208 272 206M314 238 Q288 208 248 206" fill="none" stroke="{HAIR_HI}" stroke-width="4" opacity=".32"/>'
        # silver hairpin
        f'<g transform="rotate(-24 194 258)"><rect x="174" y="252" width="44" height="8" rx="4" fill="{SILVER}" {o(3)}/>'
        f'<path d="M184 252v8M206 252v8" stroke="{SILVER_DARK}" stroke-width="2"/></g>'
        # highlights
        f'<path d="M176 214 Q208 186 246 190M344 224 Q316 196 282 190" fill="none" stroke="{HAIR_HI}" stroke-width="5" opacity=".4"/>'
    )


def blazer_body() -> str:
    return "".join([
        f'<path d="M30 640 Q48 520 150 486 H370 Q472 520 490 640Z" fill="{WHITE}" {o(6)}/>',
        f'<path d="M160 486 Q190 520 260 530 Q330 520 360 486" fill="none" stroke="{INK}" stroke-width="4"/>',
        # neck
        f'<rect x="232" y="440" width="56" height="82" rx="17" fill="{SKIN}" {o(4)}/>',
        f'<path d="M232 466 Q260 482 288 466" fill="none" stroke="{SKIN_SHADE}" stroke-width="3" opacity=".4"/>',
        # blazer left / right
        f'<path d="M104 506 L218 486 L240 640 H30 L36 556 Q48 520 104 506Z" fill="{NAVY}" {o(5)}/>',
        f'<path d="M416 506 L302 486 L280 640 H490 L484 556 Q472 520 416 506Z" fill="{NAVY}" {o(5)}/>',
        # lapels
        f'<path d="M218 486 L260 548 L238 640 H196 L206 520Z" fill="{NAVY_DARK}" {o(4)}/>',
        f'<path d="M302 486 L260 548 L282 640 H324 L314 520Z" fill="{NAVY_DARK}" {o(4)}/>',
        # white shirt V + ribbon
        f'<path d="M218 486 L260 548 L302 486Z" fill="{WHITE}" {o(3)}/>',
        f'<path d="M246 512 L260 532 L274 512 L282 548 L260 560 L238 548Z" fill="{NAVY_DARK}" {o(3)}/>',
        # silver buttons
        f'<circle cx="238" cy="574" r="5" fill="{SILVER}" {o(2)}/>'
        f'<circle cx="238" cy="604" r="5" fill="{SILVER}" {o(2)}/>'
        f'<circle cx="282" cy="574" r="5" fill="{SILVER}" {o(2)}/>'
        f'<circle cx="282" cy="604" r="5" fill="{SILVER}" {o(2)}/>',
        # silver library pin on lapel
        f'<path d="M214 550 l18 -8 l-4 16Z" fill="{SILVER}" {o(2)}/>',
        # hand + book, bottom left
        f'<g transform="rotate(-7 108 560)"><rect x="58" y="536" width="104" height="74" rx="4" fill="{BOOK}" {o(4)}/>'
        f'<path d="M72 552h66M72 566h52M72 580h58" stroke="{SILVER}" stroke-width="3" opacity=".75"/>'
        f'<path d="M148 536v74" stroke="{SILVER_DARK}" stroke-width="4"/></g>',
        f'<ellipse cx="170" cy="592" rx="22" ry="14" fill="{SKIN}" {o(3)}/>'
        f'<path d="M160 586 Q170 580 182 586" fill="none" stroke="{INK}" stroke-width="2"/>',
    ])


def cardigan_body() -> str:
    return "".join([
        f'<path d="M30 640 Q48 520 150 486 H370 Q472 520 490 640Z" fill="{WHITE}" {o(6)}/>',
        f'<path d="M160 486 Q190 520 260 530 Q330 520 360 486" fill="none" stroke="{INK}" stroke-width="4"/>',
        f'<rect x="232" y="440" width="56" height="82" rx="17" fill="{SKIN}" {o(4)}/>',
        f'<path d="M232 466 Q260 482 288 466" fill="none" stroke="{SKIN_SHADE}" stroke-width="3" opacity=".4"/>',
        # open cardigan
        f'<path d="M98 508 L222 486 L236 640 H28 L34 558 Q46 520 98 508Z" fill="{NAVY}" {o(5)}/>',
        f'<path d="M422 508 L298 486 L284 640 H492 L486 558 Q474 520 422 508Z" fill="{NAVY}" {o(5)}/>',
        # white shirt front and collar
        f'<path d="M222 486 Q260 528 298 486 L286 640 H234Z" fill="{WHITE}" {o(3)}/>',
        f'<path d="M230 486 L260 526 L290 486" fill="{WHITE}" {o(3)}/>',
        f'<path d="M246 520 L260 538 L274 520" fill="none" stroke="{NAVY_DARK}" stroke-width="3"/>',
        # silver buttons on one side
        f'<circle cx="238" cy="566" r="5" fill="{SILVER}" {o(2)}/>'
        f'<circle cx="238" cy="594" r="5" fill="{SILVER}" {o(2)}/>'
        f'<circle cx="238" cy="622" r="5" fill="{SILVER}" {o(2)}/>',
        # silver book pin
        f'<path d="M286 548 l18 -8 l-4 16Z" fill="{SILVER}" {o(2)}/>',
        # book card / stack at bottom right
        f'<g transform="rotate(8 390 568)"><rect x="342" y="536" width="98" height="64" rx="3" fill="{PAPER}" {o(3)}/>'
        f'<rect x="350" y="544" width="82" height="48" fill="none" stroke="{SILVER_DARK}" stroke-width="2"/>'
        f'<path d="M360 558h54M360 570h38M360 582h46" stroke="{NAVY}" stroke-width="2.5" opacity=".7"/></g>',
        f'<ellipse cx="344" cy="594" rx="21" ry="13" fill="{SKIN}" {o(3)}/>'
        f'<path d="M334 590 Q344 584 356 590" fill="none" stroke="{INK}" stroke-width="2"/>',
    ])


def portrait(outfit: str) -> str:
    body = [blazer_body() if outfit == "a" else cardigan_body()]
    body.append(hair_back())
    body.append(face())
    body.append(hair_front())
    # ears (small, behind hair / visible at the edges)
    body.insert(0, f'<ellipse cx="136" cy="338" rx="16" ry="27" fill="{SKIN}" {o(4)}/>')
    body.insert(0, f'<ellipse cx="384" cy="338" rx="16" ry="27" fill="{SKIN}" {o(4)}/>')
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="520" height="640" viewBox="0 0 520 640" fill="none">'
        f'{"".join(body)}</svg>'
    )
    (OUT / f"youxiaotang_{outfit}.svg").write_text(svg, encoding="utf-8")


def sprite(outfit: str) -> None:
    body = [
        f'<ellipse cx="45" cy="105" rx="24" ry="5" fill="rgba(20,18,15,.25)"/>',
        f'<rect x="32" y="78" width="10" height="20" rx="4" fill="{NAVY_DARK}" {o(3)}/>',
        f'<rect x="48" y="78" width="10" height="20" rx="4" fill="{NAVY_DARK}" {o(3)}/>',
        f'<path d="M27 96h16q3 0 3 3v2H25v-2q0-3 2-3Z" fill="{INK}"/>',
        f'<path d="M47 96h16q3 0 3 3v2H45v-2q0-3 2-3Z" fill="{INK}"/>',
        # long hair back
        f'<path d="M23 34 Q18 65 21 96 Q30 104 37 96 L38 50 Q45 40 52 50 L53 96 Q60 104 69 96 Q72 62 67 34Z" fill="{HAIR}" {o(3)}/>',
        # body
        f'<path d="M22 52 Q22 43 33 42 H57 Q68 43 68 52 L66 82 Q66 87 61 87 H29 Q24 87 24 82Z" fill="{NAVY}" {o(4)}/>',
        f'<rect x="14" y="52" width="10" height="28" rx="4" fill="{NAVY}" {o(3)}/>',
        f'<rect x="66" y="52" width="10" height="28" rx="4" fill="{NAVY}" {o(3)}/>',
        f'<circle cx="18" cy="82" r="5" fill="{SKIN}" {o(2.5)}/>',
        f'<circle cx="72" cy="82" r="5" fill="{SKIN}" {o(2.5)}/>',
        # white collar
        f'<path d="M33 42 L45 55 L57 42" fill="{WHITE}" {o(2)}/>',
        f'<path d="M45 55 L45 82" stroke="{SILVER}" stroke-width="2"/>',
        f'<circle cx="41" cy="64" r="2.5" fill="{SILVER}" {o(1)}/>',
        f'<circle cx="49" cy="72" r="2.5" fill="{SILVER}" {o(1)}/>',
        # head
        f'<rect x="38" y="37" width="14" height="8" fill="{SKIN}" {o(2)}/>',
        f'<circle cx="45" cy="33" r="22" fill="{SKIN}" {o(4)}/>',
        # long front hair
        f'<path d="M23 32 Q24 9 45 8 Q66 9 67 32 Q57 20 45 24 Q33 20 23 32Z" fill="{HAIR}" {o(3)}/>',
        f'<path d="M25 24 Q21 58 27 82 Q35 84 35 66 L36 38Z" fill="{HAIR}" {o(2.5)}/>',
        f'<path d="M65 24 Q69 58 63 82 Q55 84 55 66 L54 38Z" fill="{HAIR}" {o(2.5)}/>',
        # silver hairpin
        f'<rect x="24" y="22" width="10" height="3" rx="1.5" fill="{SILVER}" {o(1)} transform="rotate(-20 29 23)"/>',
        # green eyes
        f'<ellipse cx="36" cy="33" rx="3" ry="2" fill="{EYE}"/><ellipse cx="54" cy="33" rx="3" ry="2" fill="{EYE}"/>',
        f'<circle cx="36" cy="33" r="1" fill="{INK}"/><circle cx="54" cy="33" r="1" fill="{INK}"/>',
        f'<path d="M33 27h7M50 27h7" stroke="{INK}" stroke-width="2" stroke-linecap="round"/>',
        f'<path d="M39 43 Q45 44 51 42" fill="none" stroke="{RED}" stroke-width="2" stroke-linecap="round"/>',
    ]
    if outfit == "a":
        body.append(f'<rect x="58" y="54" width="8" height="10" rx="1" fill="{SILVER}" {o(1.5)}/>')
    else:
        body.append(f'<rect x="60" y="52" width="9" height="12" rx="1" fill="{PAPER}" {o(1.5)}/>')
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="90" height="110" viewBox="0 0 90 110" fill="none">'
        f'{"".join(body)}</svg>'
    )
    (OUT / f"sprite_{outfit}.svg").write_text(svg, encoding="utf-8")


def build() -> None:
    for outfit in ("a", "b"):
        portrait(outfit)
        sprite(outfit)
    page = f"""<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><style>
  *{{box-sizing:border-box}} body{{margin:0;background:#171513;color:#f4ead8;font-family:"Microsoft YaHei","PingFang SC",sans-serif;padding:30px}}
  header{{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid rgba(244,234,216,.2);padding-bottom:15px;margin-bottom:18px}}
  .kicker{{font-family:monospace;font-size:10px;letter-spacing:.2em;color:#b85c55}} h1{{font-family:"KaiTi","STKaiti",serif;font-size:48px;font-weight:400;margin:8px 0 0}}
  header p{{max-width:590px;margin:0;color:#b9aa94;font-size:11px;line-height:1.8;text-align:right}}
  .grid{{display:grid;grid-template-columns:1fr 1fr;gap:18px}}
  .card{{background:#f4ead8;color:#211d1a;border:3px solid #211d1a;box-shadow:7px 7px 0 rgba(0,0,0,.45);padding:15px;display:grid;grid-template-columns:1fr 106px;gap:12px}}
  .visual{{min-height:590px;background:linear-gradient(145deg,#e9ddc7,#f8efdf);border:1px solid rgba(33,29,26,.18);display:flex;align-items:flex-end;justify-content:center;overflow:hidden}}
  .visual img{{width:100%;height:590px;object-fit:contain;object-position:center bottom}}
  .side{{display:flex;flex-direction:column;align-items:center;gap:6px;padding-top:8px}}
  .side img{{width:90px;height:110px}} .side span{{font-size:8px;color:#8a7a64;text-align:center;line-height:1.4}}
  .meta{{grid-column:1/-1;border-top:1px solid rgba(33,29,26,.2);padding-top:9px;display:grid;grid-template-columns:1fr 1fr;gap:8px}}
  h2{{font-family:"KaiTi","STKaiti",serif;font-size:29px;font-weight:400;margin:0}} .tag{{font-family:monospace;font-size:9px;color:#b85c55}}
  ul{{margin:5px 0 0;padding-left:15px}} li{{font-size:10px;line-height:1.6;color:#5f503f;margin-bottom:3px}}
  .logic{{grid-column:1/-1;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;border-top:1px dashed rgba(33,29,26,.2);padding-top:8px;margin-top:2px}}
  .logic div{{font-size:9px;line-height:1.5;color:#6d5c47}} .logic b{{display:block;color:#b85c55;font-size:8px;font-family:monospace;letter-spacing:.08em;margin-bottom:2px}}
  footer{{margin-top:14px;display:flex;justify-content:space-between;color:#8f816e;font-size:9px;border-top:1px solid rgba(244,234,216,.12);padding-top:9px}}
  .red{{color:#b85c55}}
</style></head><body>
<header><div><div class="kicker">YOU XIAOTANG / MODEL SHEET v5 / 2D</div><h1>右小唐：从参考图到校园版</h1></div>
<p>保留参考图的黑长卷发、绿眼、冷感长脸和深蓝/银配色。<br>把奇幻铠甲改成校服；两套校园服装供选择。</p></header>
<div class="grid">
  <article class="card">
    <div class="visual"><img src="public/art/youxiaotang_v5/youxiaotang_a.svg" alt="You Xiaotang blazer"></div>
    <div class="side"><span class="tag">A / BLAZER</span><img src="public/art/youxiaotang_v5/sprite_a.svg" alt="sprite A"><span>游戏内小人<br>校服西装版</span></div>
    <div class="meta"><div><h2>方案 A · 校服西装</h2><p class="tag">NAVY BLAZER / SILVER BUTTONS</p></div><ul><li>深蓝西装+白衬衫+暗色领结，银扣和银色胸针呼应参考图的铠甲配色。</li><li>长心形脸、绿眼、长黑卷发；冷感但不凶。</li><li>手里拿书，另一只手拿书卡；临时图书管理员身份明确。</li></ul></div>
    <div class="logic"><div><b>KEEP</b>黑长卷发<br>绿眼 / 冷感</div><div><b>ADAPT</b>银甲 → 银扣<br>高领 → 衬衫领</div><div><b>SCHOOL</b>深蓝西装<br>图书管理员</div><div><b>FACE</b>长心形脸<br>不是鸭蛋脸</div></div>
  </article>
  <article class="card">
    <div class="visual"><img src="public/art/youxiaotang_v5/youxiaotang_b.svg" alt="You Xiaotang cardigan"></div>
    <div class="side"><span class="tag">B / CARDIGAN</span><img src="public/art/youxiaotang_v5/sprite_b.svg" alt="sprite B"><span>游戏内小人<br>开衫管理员版</span></div>
    <div class="meta"><div><h2>方案 B · 开衫管理员</h2><p class="tag">NAVY CARDIGAN / SILVER PIN</p></div><ul><li>深蓝开衫+白衬衫，银扣和银色书签夹；比西装更日常、更安静。</li><li>同样保留黑长卷发、绿眼、长心形脸。</li><li>手里拿借书卡/书卡；适合图书角场景。</li></ul></div>
    <div class="logic"><div><b>KEEP</b>黑长卷发<br>绿眼 / 冷感</div><div><b>ADAPT</b>铠甲 → 开衫<br>银甲 → 银扣</div><div><b>SCHOOL</b>深蓝开衫<br>图书角</div><div><b>FACE</b>长心形脸<br>不是鸭蛋脸</div></div>
  </article>
</div>
<footer><span>YOU XIAOTANG MODEL SHEET / v5 / 2026</span><span class="red">参考图只提取特征，不直接贴图或描图</span></footer>
</body></html>"""
    (ROOT / "tools_youxiaotang_v5.html").write_text(page, encoding="utf-8")
    print("wrote You Xiaotang v5 study")


if __name__ == "__main__":
    build()
