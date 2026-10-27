"""You Xiaotang v6: bigger eyes, fuller hair coverage, outfit A."""
from __future__ import annotations

from pathlib import Path

import generate_youxiaotang_v5 as base

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "art" / "youxiaotang_v6"
OUT.mkdir(parents=True, exist_ok=True)
base.OUT = OUT


def face_v6() -> str:
    """Long heart face, much larger green eyes."""
    return (
        f'<path d="M134 264 Q134 190 260 176 Q386 190 386 264 L380 348 '
        f'L352 410 L310 434 L260 452 L210 434 L168 410 L140 348Z" fill="{base.SKIN}" {base.o(6)}/>'
        f'<path d="M188 402 Q260 424 332 402" fill="none" stroke="{base.SKIN_SHADE}" stroke-width="4" opacity=".28"/>'
        # big almond eyes
        f'<path d="M156 318 Q204 282 252 318 Q204 352 156 318Z" fill="{base.WHITE}" {base.o(3)}/>'
        f'<path d="M268 318 Q316 282 364 318 Q316 352 268 318Z" fill="{base.WHITE}" {base.o(3)}/>'
        f'<ellipse cx="204" cy="317" rx="18" ry="17" fill="{base.EYE}"/>'
        f'<ellipse cx="316" cy="317" rx="18" ry="17" fill="{base.EYE}"/>'
        f'<circle cx="204" cy="317" r="6" fill="{base.INK}"/><circle cx="316" cy="317" r="6" fill="{base.INK}"/>'
        f'<circle cx="210" cy="311" r="4.2" fill="{base.WHITE}"/><circle cx="322" cy="311" r="4.2" fill="{base.WHITE}"/>'
        f'<circle cx="198" cy="324" r="2" fill="{base.WHITE}" opacity=".75"/><circle cx="310" cy="324" r="2" fill="{base.WHITE}" opacity=".75"/>'
        # heavy upper lid + lashes
        f'<path d="M156 318 Q204 300 252 318" fill="none" stroke="{base.INK}" stroke-width="7" stroke-linecap="round"/>'
        f'<path d="M268 318 Q316 300 364 318" fill="none" stroke="{base.INK}" stroke-width="7" stroke-linecap="round"/>'
        f'<path d="M154 310 l-17 -8M254 310 l17 -8M266 310 l-17 -8M366 310 l17 -8" stroke="{base.INK}" stroke-width="3" stroke-linecap="round"/>'
        f'<path d="M167 321 Q204 332 241 321M279 321 Q316 332 353 321" fill="none" stroke="{base.SKIN_SHADE}" stroke-width="2" opacity=".4"/>'
        # brows
        f'<path d="M164 294 Q204 282 242 292" fill="none" stroke="{base.INK}" stroke-width="5" stroke-linecap="round"/>'
        f'<path d="M278 292 Q316 282 356 294" fill="none" stroke="{base.INK}" stroke-width="5" stroke-linecap="round"/>'
        # nose / lips / blush
        f'<path d="M260 338 Q268 352 278 340" fill="none" stroke="{base.INK}" stroke-width="3.5" stroke-linecap="round"/>'
        f'<path d="M232 382 Q260 392 288 382" fill="none" stroke="{base.RED}" stroke-width="4" stroke-linecap="round"/>'
        f'<path d="M246 391 Q260 397 274 391" fill="none" stroke="{base.SKIN_SHADE}" stroke-width="2" opacity=".55"/>'
        f'<ellipse cx="178" cy="370" rx="20" ry="9" fill="{base.RED}" opacity=".12"/>'
        f'<ellipse cx="342" cy="370" rx="20" ry="9" fill="{base.RED}" opacity=".12"/>'
    )


def hair_front_v6() -> str:
    """A fuller fringe and side masses: the head is covered, eyes stay clear."""
    return (
        # full fringe cap
        f'<path d="M146 274 Q146 190 260 178 Q374 190 374 274 '
        f'Q352 242 320 236 Q300 262 278 280 Q260 292 242 280 Q220 262 200 236 Q168 242 146 274Z" fill="{base.HAIR}" {base.o(4)}/>'
        # fuller left side mass
        f'<path d="M210 228 C174 292 150 370 154 438 C158 468 176 474 182 446 '
        f'C190 398 184 348 194 306 C200 278 220 250 240 238Z" fill="{base.HAIR}" {base.o(3)}/>'
        # fuller right side mass
        f'<path d="M310 228 C346 292 370 370 366 438 C362 468 344 474 338 446 '
        f'C330 398 336 348 326 306 C320 278 300 250 280 238Z" fill="{base.HAIR}" {base.o(3)}/>'
        # silver hairpin
        f'<g transform="rotate(-24 194 258)"><rect x="174" y="252" width="44" height="8" rx="4" fill="{base.SILVER}" {base.o(3)}/>'
        f'<path d="M184 252v8M206 252v8" stroke="{base.SILVER_DARK}" stroke-width="2"/></g>'
        # highlights
        f'<path d="M170 316 Q158 388 182 456M350 316 Q362 388 338 456" fill="none" stroke="{base.HAIR_HI}" stroke-width="4" opacity=".3"/>'
        f'<path d="M196 236 Q228 206 268 206M324 236 Q292 206 252 206" fill="none" stroke="{base.HAIR_HI}" stroke-width="4" opacity=".3"/>'
    )


base.face = face_v6
base.hair_front = hair_front_v6

base.portrait("a")
base.sprite("a")

page = f"""<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><style>
  *{{box-sizing:border-box}} body{{margin:0;background:#171513;color:#f4ead8;font-family:"Microsoft YaHei","PingFang SC",sans-serif;padding:30px}}
  header{{display:flex;align-items:flex-end;justify-content:space-between;border-bottom:2px solid rgba(244,234,216,.2);padding-bottom:14px;margin-bottom:18px}}
  .kicker{{font-family:monospace;font-size:10px;letter-spacing:.2em;color:#b85c55}} h1{{font-family:"KaiTi","STKaiti",serif;font-size:48px;font-weight:400;margin:8px 0 0}}
  header p{{max-width:560px;margin:0;color:#b9aa94;font-size:11px;line-height:1.8;text-align:right}}
  main{{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(360px,.75fr);gap:18px}}
  .portrait{{background:#f4ead8;border:3px solid #211d1a;box-shadow:7px 7px 0 rgba(0,0,0,.45);padding:12px;display:flex;align-items:flex-end;justify-content:center;min-height:690px;overflow:hidden}}
  .portrait img{{width:100%;height:680px;object-fit:contain;object-position:center bottom}}
  aside{{background:#f4ead8;color:#211d1a;border:3px solid #211d1a;box-shadow:7px 7px 0 rgba(0,0,0,.45);padding:16px;display:flex;flex-direction:column;gap:10px}}
  .tag{{font-family:monospace;font-size:9px;color:#b85c55;letter-spacing:.08em}}
  h2{{font-family:"KaiTi","STKaiti",serif;font-size:34px;font-weight:400;margin:0}}
  p.sub{{margin:0;color:#7c6b56;font-size:10px;line-height:1.6}}
  .closeup{{height:230px;background-image:url(public/art/youxiaotang_v6/youxiaotang_a.svg);background-size:230%;background-position:50% 52%;background-repeat:no-repeat;border:1px solid rgba(33,29,26,.25);background-color:#eadfc9}}
  .closeup-label{{font-size:8px;color:#8a7a64;margin-top:-6px}}
  .sprite-row{{display:flex;align-items:center;gap:12px;border-top:1px solid rgba(33,29,26,.2);padding-top:9px}}
  .sprite-row img{{width:90px;height:110px;background:#eadfc9;border:1px solid rgba(33,29,26,.16)}}
  .sprite-row span{{font-size:9px;line-height:1.6;color:#7c6b56}}
  ul{{margin:0;padding-left:15px}} li{{font-size:10px;line-height:1.6;color:#5f503f;margin-bottom:3px}}
  footer{{margin-top:14px;display:flex;justify-content:space-between;color:#8f816e;font-size:9px;border-top:1px solid rgba(244,234,216,.12);padding-top:9px}}
  .red{{color:#b85c55}}
</style></head><body>
<header><div><div class="kicker">YOU XIAOTANG / v6 / OUTFIT A</div><h1>右小唐：眼睛加大 + 整头覆盖</h1></div>
<p>黑长卷发、绿眼、长心形脸。<br>这次把眼睛继续放大，前额和两侧都用头发包住；眼睛保持露出。</p></header>
<main>
  <div class="portrait"><img src="public/art/youxiaotang_v6/youxiaotang_a.svg" alt="You Xiaotang v6"></div>
  <aside>
    <div><div class="tag">FINAL LOOK / A · BLAZER</div><h2>方案 A · 校服西装</h2><p class="sub">深蓝西装 / 白衬衫 / 银扣 / 银色胸针 / 书与书卡</p></div>
    <div class="closeup"></div><div class="closeup-label">眼睛与刘海细节 / 绿色虹膜 + 睫毛 + 整头包覆</div>
    <div class="sprite-row"><img src="public/art/youxiaotang_v6/sprite_a.svg" alt="sprite v6"><span>游戏内小人<br>同步加大眼睛、加深刘海</span></div>
    <ul>
      <li><b>眼睛</b>：眼型加宽，绿色虹膜和瞳孔放大；上眼睑、睫毛更明确。</li>
      <li><b>头发</b>：刘海压到眉毛上方，两侧长发包住头侧；仍然露出眼睛和脸。</li>
      <li><b>脸型</b>：长心形脸，颧骨和下颌线保留；不是鸭蛋脸。</li>
      <li><b>服装</b>：方案 A 校服西装，银色细节呼应参考图。</li>
    </ul>
  </aside>
</main>
<footer><span>YOU XIAOTANG / MODEL SHEET v6 / 2026</span><span class="red">参考图只提取特征，不直接贴图或描图</span></footer>
</body></html>"""
(ROOT / "tools_youxiaotang_v6.html").write_text(page, encoding="utf-8")
print("wrote You Xiaotang v6")
