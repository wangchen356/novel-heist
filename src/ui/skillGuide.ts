import { audio } from '../audio';

let openLayer: HTMLElement | null = null;

export function isSkillGuideOpen(): boolean {
  return Boolean(openLayer);
}

export function showSkillGuide(onClose?: () => void): void {
  if (openLayer) return;
  audio.click();
  document.body.classList.add('skill-guide-open');

  const layer = document.createElement('div');
  layer.className = 'skill-guide-layer';
  layer.innerHTML = `
    <div class="skill-guide-card" role="dialog" aria-modal="true" aria-labelledby="skill-guide-title">
      <header class="skill-guide-head">
        <div>
          <div class="modal-kicker">FIELD NOTES / 作战手册</div>
          <h2 id="skill-guide-title">先把规则说清楚。</h2>
          <p>嘴炮不是乱出牌。看懂 Kanno 的状态，再拆每个 Boss 的机制。</p>
        </div>
        <button class="skill-guide-close" id="skill-guide-close" type="button" aria-label="关闭">×</button>
      </header>

      <div class="skill-guide-body">
        <section class="skill-guide-section">
          <div class="skill-guide-section-title">
            <span>01</span>
            <div><b>KANNO</b><small>主角 · 嘴比脑子快</small></div>
          </div>
          <div class="skill-basics">
            <p><b>基础嘴炮</b> 讲道理克谈感情，谈感情克摆事实，摆事实克讲道理。克制 ×1.5，同类型 ×1，被克 ×0.5；牌面话题与 Boss 当前话题一致时伤害 +6。</p>
            <p><b>牌组</b> 牌池 24 张，每场带 6 张，三种类型至少各一张。</p>
          </div>

          <div class="skill-state-grid">
            <article class="skill-state skill-state-arrogant">
              <div class="skill-state-tag">状态 01 · 8 / 6 / 4 步随机触发</div>
              <h3>跋扈</h3>
              <p class="skill-state-line">“行，今天谁也别想讲道理。”</p>
              <p>持续 2 回合。每回合可以同时选两张手牌连打；任意一张克制，就视为本轮克制。伤害取较高的一张，再追加另一张伤害的 50%。</p>
            </article>
            <article class="skill-state skill-state-panic">
              <div class="skill-state-tag">状态 02 · 8 / 6 / 4 步随机触发</div>
              <h3>慌乱</h3>
              <p class="skill-state-line">“等等，我刚刚说到哪了？”</p>
              <p>持续 2 回合。每回合抽到 4 张牌；打出的牌会让 Boss 挂上【疑虑】。Boss 有疑虑时，你的克制牌伤害 +60%。</p>
            </article>
            <article class="skill-state skill-state-afraid">
              <div class="skill-state-tag">状态 03 · 8 / 6 / 4 步随机触发</div>
              <h3>害怕</h3>
              <p class="skill-state-line">“十一……不是，老师，我错了。”</p>
              <p>持续 2 回合。每打一张牌叠 1 层【求饶】，克制牌叠 2 层。状态结束时按层数把教导主任往后推；3 层就多 3 回合。</p>
            </article>
          </div>

          <div class="skill-note">
            <b>状态规则：</b>三种状态不会叠加，同一时间只会存在一种。每场战斗在剩 8、6、4 步时各检查一次；状态结束后才会进入下一次检查。
          </div>
        </section>

        <section class="skill-guide-section">
          <div class="skill-guide-section-title">
            <span>02</span>
            <div><b>FOUR BOSSES</b><small>四个把门的人</small></div>
          </div>

          <div class="skill-boss-grid">
            <article class="skill-boss-card">
              <div class="skill-boss-head">
                <img src="./art/portrait_wangxin.svg" alt="王心" />
                <div><b>王心</b><small>学霸 · 纪律委员</small></div>
                <em>128 / 10 步</em>
              </div>
              <h3>学霸意识</h3>
              <p>前 3 回合没打掉他一半坚定值，他会先回 30 点，并进入 2 回合觉醒：非克制牌伤害归零并给他回血，克制牌伤害 -20%。</p>
              <p class="skill-boss-tip">打法：前 3 回合尽量用克制牌压血线；觉醒后只用克制牌，别喂他。</p>
            </article>

            <article class="skill-boss-card">
              <div class="skill-boss-head">
                <img src="./art/portrait_daoxiaowang.svg" alt="岛小王" />
                <div><b>岛小王</b><small>厕所门口 · 所长</small></div>
                <em>150 / 10 步</em>
              </div>
              <h3>召唤凯哥</h3>
              <p>第一次被克制牌命中后召唤凯哥：第一回合给 50% 已损生命护盾。再被克制牌命中，凯哥倒戈，下一张牌 +30%；若没再被克制，第二回合再给 20% 护盾并让你下一张牌 -20%。凯哥两回合后离场。</p>
              <p class="skill-boss-tip">打法：要么连续压制让凯哥倒戈，要么先拆盾再打本体。</p>
            </article>

            <article class="skill-boss-card">
              <div class="skill-boss-head">
                <img src="./art/portrait_youxiaotang.svg" alt="右小唐" />
                <div><b>右小唐</b><small>图书角 · 临时管理员</small></div>
                <em>172 / 10 步</em>
              </div>
              <h3>双线提问</h3>
              <p>每回合说两句话，你要依次用两张牌回应 A / B。本轮伤害取较高的一张，不翻倍；两张都没克制时伤害 -40%，至少一张克制则正常。</p>
              <p class="skill-boss-tip">打法：先保证至少一张克制，再用高伤害牌收尾。</p>
            </article>

            <article class="skill-boss-card">
              <div class="skill-boss-head">
                <img src="./art/portrait_shiyi.svg" alt="十一" />
                <div><b>十一</b><small>办公室 · 女班主任</small></div>
                <em>198 / 10 步</em>
              </div>
              <h3>倒计时</h3>
              <p>每 2 回合额外扣 1 步；坚定值高于 50% 时会封住一张手牌。最终战也会在第 2 / 4 / 6 / 8 回合额外逼近。</p>
              <p class="skill-boss-tip">打法：留高伤害克制牌；封牌时先打没被封的那张。</p>
            </article>
          </div>
        </section>

        <section class="skill-guide-section skill-guide-keys">
          <div class="skill-guide-section-title">
            <span>03</span>
            <div><b>SCENE NOTES</b><small>四关的钥匙不一样</small></div>
          </div>
          <ul>
            <li><b>教室：</b>红 / 白 / 黄三把钥匙里只有一把对。讲台有极淡的高亮，按 E 读纸条；纸条说白色。</li>
            <li><b>厕所：</b>钥匙藏在五个隔间之一。听岛小王的气泡，找对隔间。</li>
            <li><b>图书角：</b>门禁卡每 5 秒传送到地图另一处。</li>
            <li><b>办公室：</b>Kanno 移速 -40%。</li>
          </ul>
        </section>
      </div>

      <footer class="skill-guide-foot">
        <span>作战手册 · 随时按右上角“手册”再看</span>
        <button class="comic-button primary" id="skill-guide-done" type="button">知道了</button>
      </footer>
    </div>
  `;
  document.body.appendChild(layer);
  openLayer = layer;

  const close = () => {
    if (openLayer !== layer) return;
    openLayer = null;
    document.body.classList.remove('skill-guide-open');
    layer.remove();
    document.removeEventListener('keydown', onKey);
    audio.click();
    onClose?.();
  };

  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') close();
  };

  layer.addEventListener('click', (event) => {
    if (event.target === layer) close();
  });
  layer.querySelector('#skill-guide-close')?.addEventListener('click', close);
  layer.querySelector('#skill-guide-done')?.addEventListener('click', close);
  document.addEventListener('keydown', onKey);
}
