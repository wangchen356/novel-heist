import { audio } from '../audio';

export type GuideView = 'kanno' | 'boss';

let openLayer: HTMLElement | null = null;

export function isSkillGuideOpen(): boolean {
  return Boolean(openLayer);
}

const BOSS_NOTES = [
  {
    id: 'wangxin',
    name: '王心',
    title: '学霸 · 纪律委员',
    portrait: './art/portrait_wangxin.svg',
    meta: '128 坚定 / 10 步',
    skill: '学霸意识',
    desc:
      '前 3 回合没打掉他一半坚定值，他会先回 30 点，并进入 2 回合觉醒：非克制牌伤害归零并给他回血，克制牌伤害 -20%。',
    tip: '打法：前 3 回合尽量用克制牌压血线；觉醒后只用克制牌，别喂他。',
  },
  {
    id: 'daoxiaowang',
    name: '岛小王',
    title: '厕所门口 · 所长',
    portrait: './art/portrait_daoxiaowang.svg',
    meta: '150 坚定 / 10 步',
    skill: '召唤凯哥',
    desc:
      '第一次被克制牌命中后召唤凯哥：第一回合给 50% 已损生命护盾。再被克制牌命中，凯哥倒戈，下一张牌 +30%；若没再被克制，第二回合再给 20% 护盾并让你下一张牌 -20%。凯哥两回合后离场。',
    tip: '打法：要么连续压制让凯哥倒戈，要么先拆盾再打本体。',
  },
  {
    id: 'youxiaotang',
    name: '右小唐',
    title: '图书角 · 临时管理员',
    portrait: './art/portrait_youxiaotang.svg',
    meta: '172 坚定 / 10 步',
    skill: '双线提问',
    desc:
      '每回合说两句话，你要依次用两张牌回应 A / B。本轮伤害取较高的一张，不翻倍；两张都没克制时伤害 -40%，至少一张克制则正常。',
    tip: '打法：先保证至少一张克制，再用高伤害牌收尾。',
  },
  {
    id: 'shiyi',
    name: '十一',
    title: '办公室 · 女班主任',
    portrait: './art/portrait_shiyi.svg',
    meta: '198 坚定 / 10 步',
    skill: '倒计时',
    desc:
      '每 2 回合额外扣 1 步；坚定值高于 50% 时会封住一张手牌。最终战也会在第 2 / 4 / 6 / 8 回合额外逼近。',
    tip: '打法：留高伤害克制牌；封牌时先打没被封的那张。',
  },
];

const KANNO_HTML = `
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
`;

function bossCardHtml(note: (typeof BOSS_NOTES)[number], index: number, unlocked: number): string {
  if (index >= unlocked) {
    return `
      <article class="skill-boss-card is-locked">
        <div class="skill-boss-head">
          <div class="skill-boss-locked" aria-hidden="true">?</div>
          <div><b>？？？</b><small>尚未遭遇</small></div>
          <em>未解锁</em>
        </div>
        <h3>？？？</h3>
        <p>通关上一关之后，这里会更新这位 Boss 的情报。</p>
        <p class="skill-boss-tip">先专心对付眼前的人。</p>
      </article>
    `;
  }
  return `
    <article class="skill-boss-card">
      <div class="skill-boss-head">
        <img src="${note.portrait}" alt="${note.name}" />
        <div><b>${note.name}</b><small>${note.title}</small></div>
        <em>${note.meta}</em>
      </div>
      <h3>${note.skill}</h3>
      <p>${note.desc}</p>
      <p class="skill-boss-tip">${note.tip}</p>
    </article>
  `;
}

function bodyHtml(view: GuideView, unlocked: number): string {
  if (view === 'kanno') return KANNO_HTML;
  const cards = BOSS_NOTES.map((note, index) => bossCardHtml(note, index, unlocked)).join('');
  return `
    <section class="skill-guide-section">
      <div class="skill-guide-section-title">
        <span>02</span>
        <div><b>BOSS 情报</b><small>每过一关，多一条情报</small></div>
      </div>
      <div class="skill-boss-grid">${cards}</div>
      <div class="skill-note">
        <b>查阅方式：</b>右上角“BOSS 情报”随时打开；右上角“手册”在战斗里也能看。已遭遇 ${unlocked} / ${BOSS_NOTES.length}。
      </div>
    </section>
  `;
}

export function showSkillGuide(view: GuideView = 'boss', unlockedBosses = 1, onClose?: () => void): void {
  if (openLayer) return;
  audio.click();
  document.body.classList.add('skill-guide-open');
  let current = view;
  const unlocked = Math.max(1, Math.min(BOSS_NOTES.length, unlockedBosses));

  const layer = document.createElement('div');
  layer.className = 'skill-guide-layer';
  layer.innerHTML = `
    <div class="skill-guide-card" role="dialog" aria-modal="true" aria-labelledby="skill-guide-title">
      <header class="skill-guide-head">
        <div>
          <div class="modal-kicker">FIELD NOTES / 作战手册</div>
          <h2 id="skill-guide-title">先把规则说清楚。</h2>
          <p>Kanno 的状态和 Boss 的机制分开放。想找谁，就点谁。</p>
        </div>
        <button class="skill-guide-close" id="skill-guide-close" type="button" aria-label="关闭">×</button>
      </header>

      <div class="guide-tabs" role="tablist">
        <button class="guide-tab" data-view="kanno" type="button" role="tab">KANNO 技能</button>
        <button class="guide-tab" data-view="boss" type="button" role="tab">BOSS 情报 <em>${unlocked}/${BOSS_NOTES.length}</em></button>
      </div>

      <div class="skill-guide-body" id="skill-guide-body"></div>

      <footer class="skill-guide-foot">
        <span>作战手册 · 右上角“BOSS 情报”随时再看</span>
        <button class="comic-button primary" id="skill-guide-done" type="button">知道了</button>
      </footer>
    </div>
  `;
  document.body.appendChild(layer);
  openLayer = layer;

  const body = layer.querySelector('#skill-guide-body') as HTMLElement;
  const tabs = [...layer.querySelectorAll<HTMLButtonElement>('.guide-tab')];

  const paint = (next: GuideView) => {
    current = next;
    body.innerHTML = bodyHtml(current, unlocked);
    tabs.forEach((tab) => {
      const active = tab.dataset.view === current;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    body.scrollTop = 0;
  };
  tabs.forEach((tab) => tab.addEventListener('click', () => paint(tab.dataset.view as GuideView)));
  paint(current);

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
