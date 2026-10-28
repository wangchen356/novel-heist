import { audio } from '../audio';
import { bus } from '../events';
import { CARD_TYPES, TOPIC_BONUS, cardDamage, counterMultiplier, getCard, relationLabel, topicMatch } from '../data/cards';
import { getBoss } from '../data/bosses';
import { saveGame } from '../state';
import type { BossDef, BossLine, BossMechanic, CardDef, CardType, DebateTopic, SaveData } from '../types';

interface DebateCallbacks {
  onWin: () => void;
  onLose: () => void;
  onPersist: () => void;
}

interface LogEntry {
  text: string;
  kind?: 'good' | 'bad';
}

const MECHANIC_LABEL: Record<BossMechanic, string> = {
  heal: '点名册',
  summon: '地盘费',
  double: '双线提问',
  final: '倒计时',
};

export class DebateController {
  private root: HTMLElement;
  private save: SaveData;
  private boss: BossDef;
  private callbacks: DebateCallbacks;
  private hand: CardDef[] = [];
  private drawPile: CardDef[] = [];
  private discard: CardDef[] = [];
  private conviction: number;
  private maxConviction: number;
  private stepsLeft: number;
  private stepsTotal: number;
  private line: BossLine | null = null;
  private lines: BossLine[] = [];
  private mechanic: BossMechanic = 'heal';
  private roundDamage = 0;
  private totalDamage = 0;
  private awakened = false;
  private healRounds = 0;
  private healStartedTurn = 0;
  private shield = 0;
  private kaigeActive = false;
  private kaigeSummoned = false;
  private kaigeRounds = 0;
  private kaigeFlipped = false;
  private kaigeSecondShield = false;
  private playerDamageMod = 0;
  private sealedCardId: string | null = null;
  private responses: CardDef[] = [];
  private mentalState: 'arrogant' | 'panic' | 'afraid' | null = null;
  private mentalRounds = 0;
  private mentalTriggered = new Set<number>();
  private lastMental: 'arrogant' | 'panic' | 'afraid' | null = null;
  private pleaStacks = 0;
  private doubtRounds = 0;
  private phase: 1 | 2 | 3 = 1;
  private turn = 1;
  private combo = 0;
  private comboPending = 0;
  private usedLines = new Set<string>();
  private revealNext = false;
  private swapped = false;
  private active = false;
  private resolving = false;
  private finished = false;
  private log: LogEntry[] = [];
  private keyHandler: ((event: KeyboardEvent) => void) | null = null;
  private notebookOpen = false;
  private isTouch = false;

  constructor(root: HTMLElement, save: SaveData, bossId: string, callbacks: DebateCallbacks) {
    this.root = root;
    this.save = save;
    this.boss = getBoss(bossId);
    this.callbacks = callbacks;
    this.conviction = this.boss.conviction;
    this.maxConviction = this.boss.conviction;
    this.stepsLeft = this.boss.steps;
    this.stepsTotal = this.boss.steps;
  }

  start(): void {
    this.isTouch = Boolean(window.matchMedia?.('(pointer: coarse)').matches);
    this.root.classList.toggle('touch-mode', this.isTouch);
    this.active = true;
    this.finished = false;
    this.resolving = false;
    this.hand = [];
    this.drawPile = [...this.save.deck].map(getCard);
    this.discard = [];
    this.shuffle(this.drawPile);
    this.drawHand(3, true);
    this.boss = getBoss(this.boss.id);
    this.mechanic = this.boss.mechanic;
    this.line = null;
    this.lines = [];
    this.roundDamage = 0;
    this.totalDamage = 0;
    this.awakened = false;
    this.healRounds = 0;
    this.healStartedTurn = 0;
    this.shield = 0;
    this.kaigeActive = false;
    this.kaigeSummoned = false;
    this.kaigeRounds = 0;
    this.kaigeFlipped = false;
    this.kaigeSecondShield = false;
    this.playerDamageMod = 0;
    this.sealedCardId = null;
    this.responses = [];
    this.mentalState = null;
    this.mentalRounds = 0;
    this.mentalTriggered = new Set<number>();
    this.lastMental = null;
    this.pleaStacks = 0;
    this.doubtRounds = 0;
    this.log = [{ text: `第 1 回合，${this.boss.name}先开口了。` }];
    this.combo = 0;
    this.comboPending = 0;
    this.turn = 1;
    this.phase = this.getPhase();
    this.revealNext = false;
    this.swapped = false;
    this.notebookOpen = false;
    this.lines = this.pickRoundLines();
    this.line = this.lines[0] ?? null;
    this.chooseSeal();
    this.render();
    this.bindKeyboard();
    audio.debateStart();
    audio.startMusic('debate');
  }

  private bindKeyboard(): void {
    this.keyHandler = (event: KeyboardEvent) => {
      if (!this.active) return;
      if (event.code === 'Digit1' || event.code === 'Numpad1') {
        event.preventDefault();
        this.playIndex(0);
      } else if (event.code === 'Digit2' || event.code === 'Numpad2') {
        event.preventDefault();
        this.playIndex(1);
      } else if (event.code === 'Digit3' || event.code === 'Numpad3') {
        event.preventDefault();
        this.playIndex(2);
      } else if (event.code === 'Digit4' || event.code === 'Numpad4') {
        event.preventDefault();
        this.playIndex(3);
      } else if (event.code === 'Space' || event.code === 'Enter') {
        if (this.finished) {
          event.preventDefault();
          this.confirmResult();
        }
      }
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  private drawHand(count: number, initial = false): void {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      while (this.hand.length < count) {
        if (this.drawPile.length === 0) {
          this.drawPile = [...this.discard];
          this.discard = [];
          this.shuffle(this.drawPile);
        }
        const card = this.drawPile.pop();
        if (!card) break;
        this.hand.push(card);
      }
      if (!initial || this.hand.length < 3) break;
      if (new Set(this.hand.map((card) => card.type)).size > 1) break;
      this.drawPile.push(...this.hand);
      this.hand = [];
      this.shuffle(this.drawPile);
    }
  }

  private shuffle(cards: CardDef[]): void {
    for (let i = cards.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
  }

  private getPhase(): 1 | 2 | 3 {
    const ratio = this.conviction / this.maxConviction;
    return ratio > 0.66 ? 1 : ratio > 0.33 ? 2 : 3;
  }

  private pickLine(): BossLine {
    const phase = this.getPhase();
    if (phase !== this.phase && this.log.length > 0) {
      this.log.push({ text: `${this.boss.shortTitle}的语气变了。`, kind: 'bad' });
    }
    this.phase = phase;
    let pool = this.boss.lines.filter((line) => line.phase === phase && !this.usedLines.has(line.id));
    if (pool.length === 0) pool = this.boss.lines.filter((line) => line.phase === phase);
    if (pool.length === 0) pool = this.boss.lines.filter((line) => !this.usedLines.has(line.id));
    if (pool.length === 0) pool = this.boss.lines;
    const previous = this.line?.id;
    const filtered = pool.filter((line) => line.id !== previous);
    const source = filtered.length > 0 ? filtered : pool;
    const line = source[Math.floor(Math.random() * source.length)];
    this.usedLines.add(line.id);
    return line;
  }

  private pickRoundLines(): BossLine[] {
    const first = this.pickLine();
    if (this.mechanic !== 'double') return [first];
    const used = new Set([first.id]);
    let pool = this.boss.lines.filter((line) => line.phase === first.phase && !used.has(line.id) && !this.usedLines.has(line.id));
    if (pool.length === 0) pool = this.boss.lines.filter((line) => line.phase === first.phase && !used.has(line.id));
    if (pool.length === 0) pool = this.boss.lines.filter((line) => !used.has(line.id));
    const second = pool[Math.floor(Math.random() * pool.length)] ?? first;
    this.usedLines.add(second.id);
    return [first, second];
  }

  private chooseSeal(): void {
    if (this.mechanic !== 'final') {
      this.sealedCardId = null;
      return;
    }
    if (this.conviction > this.maxConviction * 0.5) {
      if (!this.sealedCardId || !this.hand.some((card) => card.id === this.sealedCardId)) {
        this.sealedCardId = this.hand[Math.floor(Math.random() * this.hand.length)]?.id ?? null;
      }
    } else {
      this.sealedCardId = null;
    }
  }

  private isTwoCardMode(): boolean {
    return this.mechanic === 'double' || this.mentalState === 'arrogant';
  }

  private handTarget(): number {
    return this.mentalState === 'panic' ? 4 : 3;
  }

  private mentalName(): string {
    if (this.mentalState === 'arrogant') return '跋扈';
    if (this.mentalState === 'panic') return '慌乱';
    if (this.mentalState === 'afraid') return '害怕';
    return '';
  }

  private mentalLine(): string {
    if (this.mentalState === 'arrogant') return '行，今天谁也别想讲道理。';
    if (this.mentalState === 'panic') return '等等，我刚刚说到哪了？';
    if (this.mentalState === 'afraid') return '十一……不是，老师，我错了。';
    return '';
  }

  private mentalBannerHtml(): string {
    if (!this.mentalState) return '';
    const extras: string[] = [];
    if (this.doubtRounds > 0) extras.push(`疑虑 ${this.doubtRounds} 回合 · 克制伤害 +60%`);
    if (this.pleaStacks > 0) extras.push(`求饶 ${this.pleaStacks} 层`);
    return `
      <div class="mental-banner mental-${this.mentalState}">
        <div class="mental-title"><span>KANNO / 状态</span><b>${this.mentalName()}</b></div>
        <p>${this.mentalLine()}</p>
        <div class="mental-meta"><span>剩余 ${this.mentalRounds} 回合</span>${extras.map((text) => `<em>${text}</em>`).join('')}</div>
      </div>
    `;
  }

  private maybeTriggerMentalState(): void {
    if (this.mentalState) return;
    for (const threshold of [8, 6, 4]) {
      if (this.stepsLeft > threshold || this.mentalTriggered.has(threshold)) continue;
      this.mentalTriggered.add(threshold);
      const pool = (['arrogant', 'panic', 'afraid'] as const).filter((state) => state !== this.lastMental);
      const state = pool[Math.floor(Math.random() * pool.length)] ?? 'arrogant';
      this.mentalState = state;
      this.mentalRounds = 2;
      this.lastMental = state;
      this.log.push({ text: `Kanno 进入了【${this.mentalName()}】：${this.mentalLine()}`, kind: state === 'arrogant' ? 'good' : 'bad' });
      audio.alert(state === 'arrogant' ? 0.45 : 0.3);
      return;
    }
  }

  private tickMentalState(): void {
    if (this.doubtRounds > 0) {
      this.doubtRounds -= 1;
      if (this.doubtRounds === 0) this.log.push({ text: `${this.boss.name}皱了皱眉，疑虑散了。`, kind: 'good' });
    }
    if (this.mentalRounds > 0) {
      this.mentalRounds -= 1;
      if (this.mentalRounds === 0) {
        if (this.mentalState === 'afraid' && this.pleaStacks > 0) {
          this.stepsLeft += this.pleaStacks;
          this.log.push({ text: `Kanno 把 ${this.pleaStacks} 层求饶都说了出来。教导主任晚了 ${this.pleaStacks} 回合。`, kind: 'good' });
        }
        this.mentalState = null;
        this.pleaStacks = 0;
        audio.click();
      }
    }
  }

  private render(): void {
    this.root.classList.remove('hidden');
    this.root.innerHTML = `
      <div class="debate-shell ${this.mentalState ? `mental-active mental-${this.mentalState}` : ''} ${this.mentalState === 'panic' ? 'hand-four' : ''}">
        <div class="debate-top">
          <div class="debate-boss-meta">
            <div class="debate-boss-badge">${this.boss.name.slice(0, 1)}</div>
            <div>
              <div class="debate-boss-name">${this.boss.name}</div>
              <div class="debate-boss-sub">${this.boss.title} · ${MECHANIC_LABEL[this.mechanic]} · 嘴炮战</div>
            </div>
          </div>
          <div class="debate-bars">
            <div class="conviction">
              <div class="bar-label"><span>坚定值</span><span id="conviction-text">${Math.max(0, this.conviction)} / ${this.maxConviction}</span></div>
              <div class="bar-track"><div id="conviction-fill" class="conviction-fill" style="width:${Math.max(0, (this.conviction / this.maxConviction) * 100)}%"></div></div>
              <div id="shield-line" class="shield-line ${this.shield > 0 ? '' : 'hidden'}">护盾 <b id="shield-value">${this.shield}</b></div>
            </div>
            <div class="dean-steps" id="dean-steps"></div>
          </div>
          <div class="debate-actions">
            <button class="debate-small-btn" id="btn-notebook" type="button">错题本</button>
            <button class="debate-small-btn" id="btn-swap" type="button">换牌</button>
          </div>
        </div>
        ${this.mentalBannerHtml()}
        <div class="debate-main">
          <div class="boss-panel ${this.healRounds > 0 ? 'math-active' : ''}">
            <img id="boss-portrait" src="${this.boss.portrait}" alt="${this.boss.name}">
            ${this.healRounds > 0 ? '<div class="math-storm" aria-hidden="true"><span>∑</span><span>∫</span><span>π</span><span>≠</span><span>±</span><span>√</span><span>∞</span><span>Δ</span></div><div class="math-caption">学霸意识 · 非克制牌会给他回血</div>' : ''}
            ${this.kaigeActive ? `<div class="kaige-panel"><img src="./art/portrait_kaige.svg" alt="凯哥"><div><b>凯哥</b><span>${this.kaigeFlipped ? '已倒戈 · 帮你说话' : this.kaigeSecondShield ? '收第二次过路费' : '给岛小王撑腰'}</span></div></div>` : ''}
            ${this.mechanic === 'final' && this.sealedCardId ? '<div class="seal-banner">谈话中 · 一张牌被封</div>' : ''}
          </div>
          <div class="debate-conversation">
            ${this.mechanic === 'double' ? this.dualSpeechHtml() : `<div class="speech" id="speech-0">${this.speechHtmlFor(this.line)}</div>`}
            <div class="mechanic-line">${this.mechanicHint()}</div>
            <div class="debate-log" id="debate-log">${this.logHtml()}</div>
            <div class="combo-line">
              <span>气势</span>
              <div class="combo-pips" id="combo-pips"></div>
              <span class="combo-text" id="combo-text"></span>
            </div>
          </div>
        </div>
        <div class="debate-hand-wrap">
          ${this.isTwoCardMode() ? this.responseStripHtml() : ''}
          <div class="debate-hand-head">
            <span>第 <strong id="turn-number">${this.turn}</strong> 回合 · ${this.isTwoCardMode() ? (this.mechanic === 'double' ? '两张牌分别回应两句话' : '跋扈：选两张牌连打') : '选一张回应'}</span>
            <span>${this.isTouch ? '点牌回应' : this.isTwoCardMode() ? '依次点两张牌' : `按 <strong>1 / 2 / 3${this.mentalState === 'panic' ? ' / 4' : ''}</strong> 出牌`}</span>
          </div>
          <div class="debate-hand" id="debate-hand"></div>
        </div>
      </div>
      <div id="debate-result" class="debate-result hidden"></div>
    `;
    this.root.querySelector('#btn-notebook')?.addEventListener('click', () => this.toggleNotebook());
    this.root.querySelector('#btn-swap')?.addEventListener('click', () => this.swapHand());
    this.root.querySelectorAll<HTMLButtonElement>('.play-card').forEach((button, index) => {
      button.addEventListener('click', () => this.playIndex(index));
    });
    this.updateBars();
    this.renderHand();
    this.renderResponseStrip();
    this.renderSteps();
    this.renderCombo();
    this.updateNotebookButton();
    this.renderLog();
  }

  private lineTopic(): DebateTopic {
    return this.line?.topic ?? '规矩';
  }

  private speechHtmlFor(line: BossLine | null, label?: string): string {
    if (!line) return '';
    const known = this.save.notebook[line.id] || (this.revealNext && this.active ? line.type : undefined);
    const typeLabel = known
      ? `<span class="line-type">${CARD_TYPES[known].short}</span>`
      : `<span class="line-type unknown-type">？？</span>`;
    const marker = label ? `<span class="speech-marker">${label}</span>` : '';
    return `${marker}${this.escape(line.text)}<span class="speech-tags"><span class="line-topic">话题 · ${this.escape(line.topic ?? '规矩')}</span>${typeLabel}</span>`;
  }

  private dualSpeechHtml(): string {
    return `
      <div class="dual-speeches">
        <div class="speech speech-dual" id="speech-0">${this.speechHtmlFor(this.lines[0], 'A')}</div>
        <div class="speech speech-dual" id="speech-1">${this.speechHtmlFor(this.lines[1], 'B')}</div>
      </div>
    `;
  }

  private mechanicHint(): string {
    if (this.mechanic === 'heal') {
      if (this.healRounds > 0) return `王心正在觉醒：非克制牌会给他回血，克制牌伤害 -20%。还剩 ${this.healRounds} 回合。`;
      if (!this.awakened) return '王心的破绽：前 3 回合打掉他一半坚定值，可以阻止他进入学霸意识。';
      return '王心已经觉醒过。稳住节奏，别再用普通牌给他送血。';
    }
    if (this.mechanic === 'summon') {
      if (this.kaigeFlipped) return '凯哥已经倒戈，下一张牌伤害 +30%。';
      if (this.kaigeActive) return `凯哥在场，护盾会先吃掉伤害。${this.kaigeSecondShield ? '下一张牌 -20%。' : ''}`;
      if (this.kaigeSummoned) return '凯哥已经离场。岛小王只能靠自己。';
      return '岛小王的破绽：第一次被克制牌命中，他会恼羞成怒叫来凯哥。';
    }
    if (this.mechanic === 'double') {
      return '右小唐一次说两句。选两张牌分别回应 A / B；本轮伤害取较高的一张，不翻倍。两张都没克制时伤害 -40%。';
    }
    if (this.mechanic === 'final') {
      return `十一每 2 回合额外逼近一步；坚定值高于 50% 时会封住一张牌。当前 ${this.stepsLeft} 步。`;
    }
    return '';
  }

  private responseStripHtml(): string {
    const labels = this.mechanic === 'double' ? ['A', 'B'] : ['1', '2'];
    const slots = [0, 1].map((index) => {
      const card = this.responses[index];
      return `<div class="response-slot ${card ? 'filled' : ''}"><span>${labels[index]}</span><b>${card ? this.escape(card.name) : '等待出牌'}</b></div>`;
    });
    const tip =
      this.mechanic === 'double'
        ? this.responses.length === 0
          ? '点一张牌回应 A'
          : '再点一张牌回应 B'
        : this.responses.length === 0
          ? '点一张牌出牌'
          : '再点一张牌，触发跋扈连打';
    return `<div class="response-strip">${slots.join('')}<span class="response-tip">${tip}</span></div>`;
  }

  private logHtml(): string {
    return this.log
      .slice(-8)
      .map((entry) => `<div class="log-entry ${entry.kind ?? ''}">${this.escape(entry.text)}</div>`)
      .join('');
  }

  private renderHand(): void {
    const handEl = this.root.querySelector('#debate-hand');
    if (!handEl) return;
    handEl.innerHTML = this.hand
      .map((card, index) => {
        const meta = CARD_TYPES[card.type];
        const effect =
          card.role === 'reveal' ? '看穿下一句' : card.role === 'delay' ? '多拖一步' : '正面输出';
        const match =
          this.mechanic === 'double'
            ? this.lines.some((line) => topicMatch(card, line.topic ?? '规矩'))
            : this.line
              ? topicMatch(card, this.lineTopic())
              : false;
        const sealed = this.sealedCardId === card.id;
        return `
          <button class="play-card type-${card.type} ${match ? 'topic-match' : ''} ${sealed ? 'sealed' : ''}" data-card-id="${card.id}" type="button" ${sealed ? 'title="十一正在谈话，这张牌被封住了"' : ''}>
            <span class="play-card-top">
              <span class="play-card-type">${meta.label}</span>
              <span class="card-topic">${card.topic}</span>
              <span class="play-card-number">${sealed ? '封' : String(index + 1).padStart(2, '0')}</span>
            </span>
            <h4>${this.escape(card.name)}</h4>
            <p>“${this.escape(card.line)}”</p>
            <span class="play-card-foot">
              <span class="card-effect">${match ? `<b class="match-flag">切题 +${TOPIC_BONUS}</b> · ` : ''}${effect}</span>
              <span class="card-damage">${cardDamage(card, this.save.stats.oratory)} <small>伤害</small></span>
            </span>
            <span class="card-key">${index + 1}</span>
          </button>
        `;
      })
      .join('');
    handEl.querySelectorAll<HTMLButtonElement>('.play-card').forEach((button, index) => {
      const card = this.hand[index];
      button.disabled = this.resolving || this.finished || !card || card.id === this.sealedCardId;
      button.addEventListener('click', () => this.playIndex(index));
    });
  }

  private renderResponseStrip(): void {
    const el = this.root.querySelector<HTMLElement>('.response-strip');
    if (!el) return;
    el.outerHTML = this.responseStripHtml();
  }

  private renderSteps(): void {
    const el = this.root.querySelector('#dean-steps');
    if (!el) return;
    const count = Math.max(this.stepsLeft, 0);
    el.classList.toggle('danger', count <= 3);
    el.innerHTML = `
      <span class="dean-label">教导主任还有 ${count} 步</span>
      ${Array.from({ length: Math.max(count, 0) }, () => '<span class="step-dot used"></span>').join('')}
    `;
  }

  private renderCombo(): void {
    const pips = this.root.querySelector('#combo-pips');
    if (pips) {
      pips.innerHTML = Array.from({ length: 3 }, (_, i) => `<span class="combo-pip ${i < this.combo ? 'on' : ''}"></span>`).join('');
    }
    const text = this.root.querySelector('#combo-text');
    if (text) text.textContent = this.comboPending ? `下一张 +${this.comboPending}` : this.combo === 3 ? '总结陈词准备' : '';
  }

  private updateBars(): void {
    const fill = this.root.querySelector<HTMLElement>('#conviction-fill');
    const text = this.root.querySelector<HTMLElement>('#conviction-text');
    if (fill) fill.style.width = `${Math.max(0, (this.conviction / this.maxConviction) * 100)}%`;
    if (text) text.textContent = `${Math.max(0, this.conviction)} / ${this.maxConviction}`;
    const shieldLine = this.root.querySelector<HTMLElement>('#shield-line');
    const shieldValue = this.root.querySelector<HTMLElement>('#shield-value');
    if (shieldLine) shieldLine.classList.toggle('hidden', this.shield <= 0);
    if (shieldValue) shieldValue.textContent = String(this.shield);
    const turn = this.root.querySelector<HTMLElement>('#turn-number');
    if (turn) turn.textContent = String(this.turn);
    this.renderSteps();
    this.renderCombo();
  }

  private renderLog(): void {
    const el = this.root.querySelector('#debate-log');
    if (el) {
      el.innerHTML = this.logHtml();
      el.scrollTop = el.scrollHeight;
    }
  }

  private updateNotebookButton(): void {
    const button = this.root.querySelector<HTMLButtonElement>('#btn-notebook');
    if (button) button.textContent = this.notebookOpen ? '收起错题本' : '错题本';
    const swap = this.root.querySelector<HTMLButtonElement>('#btn-swap');
    if (swap) {
      swap.disabled = this.swapped || this.resolving || this.finished || this.stepsLeft <= 2 || this.responses.length > 0;
      swap.textContent = this.swapped ? '换过了' : '换牌';
    }
  }

  private playIndex(index: number): void {
    if (!this.active || this.resolving || this.finished) return;
    if (this.mentalState === 'arrogant' && this.mechanic !== 'double') {
      this.stageArrogant(index);
      return;
    }
    if (this.mechanic === 'double') {
      this.stageDouble(index);
      return;
    }
    const card = this.hand[index];
    if (!card || !this.line) return;
    this.resolving = true;
    this.updateNotebookButton();
    this.renderHand();
    const relation = relationLabel(card.type, this.line.type);
    const multiplier = counterMultiplier(card.type, this.line.type);
    const lineTopic = this.lineTopic();
    const matchedTopic = topicMatch(card, lineTopic);
    const raw = cardDamage(card, this.save.stats.oratory, this.comboPending) + (matchedTopic ? TOPIC_BONUS : 0);
    let damage = Math.max(1, Math.round(raw * multiplier));
    if (this.mentalState === 'panic') {
      this.doubtRounds = 2;
      if (relation === '克制') {
        damage = Math.round(damage * 1.6);
        this.log.push({ text: '十一被你说得起了疑心，克制伤害 +60%。', kind: 'good' });
      }
    }
    const activeMod = this.playerDamageMod;
    this.playerDamageMod = 0;
    if (activeMod !== 0) {
      damage = Math.max(1, Math.round(damage * (1 + activeMod)));
      this.log.push({
        text: activeMod > 0 ? `凯哥帮你说话，这张牌伤害 +30%。` : `凯哥收了过路费，这张牌伤害 -20%。`,
        kind: activeMod > 0 ? 'good' : 'bad',
      });
    }
    let dealt = damage;
    let healed = 0;
    let absorbed = 0;

    if (this.mechanic === 'summon' && this.shield > 0) {
      absorbed = Math.min(this.shield, damage);
      this.shield -= absorbed;
      damage -= absorbed;
      dealt = damage;
    }

    const bossType = CARD_TYPES[this.line.type];
    this.log.push({
      text: `${this.boss.name}说的是【${bossType.label}】“${this.line.text}” · 话题「${lineTopic}」`,
    });

    // Boss 1: once awakened, normal cards feed him instead of hurting him.
    if (this.mechanic === 'heal' && this.healRounds > 0) {
      if (relation !== '克制') {
        healed = dealt;
        damage = 0;
        this.conviction = Math.min(this.maxConviction, this.conviction + healed);
        this.log.push({ text: `学霸意识：普通牌没有造成伤害，反而让他回了 ${healed} 点坚定值。`, kind: 'bad' });
      } else {
        const reduced = Math.max(1, Math.round(damage * 0.8));
        this.log.push({ text: `学霸意识：克制牌伤害被压了 20%（${damage} → ${reduced}）。`, kind: 'bad' });
        damage = reduced;
      }
    }

    this.conviction = Math.max(0, this.conviction - damage);
    this.totalDamage += dealt;
    this.log.push({
      text: `你打出【${card.name}】${matchedTopic ? `切题「${lineTopic}」+${TOPIC_BONUS}` : `话题「${card.topic}」没接上`}，${relation === '克制' ? '克制' : relation === '被克' ? '被克' : '普通'}：${damage} 伤害${absorbed > 0 ? `（护盾吸收 ${absorbed}）` : ''}${healed > 0 ? `（回血 ${healed}）` : ''}。`,
      kind: relation === '克制' || matchedTopic ? 'good' : relation === '被克' ? 'bad' : undefined,
    });

    if (this.comboPending > 0) this.comboPending = 0;
    if (relation === '克制') {
      this.combo = Math.min(3, this.combo + 1);
      if (this.combo === 3) {
        this.combo = 0;
        this.comboPending = 8;
        this.log.push({ text: '抓住话柄了。下一张牌伤害 +8。', kind: 'good' });
      }
      audio.counter();
    } else if (relation === '被克') {
      this.combo = 0;
      audio.wrong();
    } else {
      this.combo = 0;
    }

    if (card.role === 'reveal') {
      this.revealNext = true;
      this.log.push({ text: `你摸清了下一句的题型：${bossType.label}。` });
      if (matchedTopic) this.log.push({ text: `而且你接住了「${lineTopic}」。`, kind: 'good' });
    }
    if (card.role === 'delay') {
      this.stepsLeft += 1;
      this.log.push({ text: '你多拖了一步。教导主任走得更慢了。' });
    }

    // Boss 2: first counter hit summons Kaige with a shield.
    if (this.mentalState === 'afraid') {
      const stacks = relation === '克制' ? 2 : 1;
      this.pleaStacks += stacks;
      this.log.push({ text: `害怕：你攒下 ${stacks} 层求饶（共 ${this.pleaStacks} 层）。`, kind: 'bad' });
    }

    if (this.mechanic === 'summon' && relation === '克制') {
      if (!this.kaigeSummoned) {
        this.kaigeSummoned = true;
        this.kaigeActive = true;
        this.kaigeRounds = 2;
        this.kaigeFlipped = false;
        this.kaigeSecondShield = false;
        const lost = Math.max(0, this.maxConviction - this.conviction);
        this.shield += Math.round(lost * 0.5);
        this.log.push({ text: `岛小王恼羞成怒，叫来了凯哥！凯哥给岛小王加了 ${Math.round(lost * 0.5)} 点护盾。`, kind: 'bad' });
        audio.counter();
      } else if (this.kaigeActive && !this.kaigeFlipped) {
        this.kaigeFlipped = true;
        this.playerDamageMod = 0.3;
        this.log.push({ text: '凯哥看不下去了：“岛小王，你这嘴也太碎了。”凯哥倒戈，你下一张牌伤害 +30%。', kind: 'good' });
        audio.counter();
      }
    }

    this.save.notebook[this.line.id] = this.line.type;
    this.save.cycleKnown = true;
    this.callbacks.onPersist();
    saveGame(this.save);
    this.discard.push(card);
    this.hand.splice(index, 1);
    this.addFloatingDamage(damage, relation);
    this.shakeBoss();
    this.updateBars();
    this.renderHand();
    this.renderLog();
    this.updateSpeechType();

    if (this.conviction <= 0) {
      window.setTimeout(() => this.finish(true), 700);
      return;
    }

    // Boss 1: not enough damage in the first three rounds ->学霸意识.
    if (
      this.mechanic === 'heal' &&
      !this.awakened &&
      this.turn === 3 &&
      this.totalDamage < this.maxConviction * 0.5
    ) {
      this.awakened = true;
      this.healStartedTurn = this.turn;
      this.healRounds = 2;
      this.conviction = Math.min(this.maxConviction, this.conviction + 30);
      this.log.push({ text: '王心觉醒了学霸意识。他先回了 30 点坚定值；接下来两张普通牌会给他回血。', kind: 'bad' });
      audio.alert(0.8);
    }
    if (this.mechanic === 'heal' && this.healRounds > 0 && this.turn > this.healStartedTurn) {
      this.healRounds -= 1;
      if (this.healRounds === 0) this.log.push({ text: '王心的学霸意识退了下去。', kind: 'good' });
    }

    if (this.kaigeActive) {
      this.kaigeRounds -= 1;
      if (this.kaigeRounds <= 0) {
        this.kaigeActive = false;
        this.shield = 0;
        this.log.push({ text: '凯哥走了。岛小王只能自己面对你。', kind: 'good' });
      }
    }

    // Boss 4: every second round the dean takes an extra step.
    this.stepsLeft -= 1;
    if (this.mechanic === 'final' && this.turn % 2 === 0) {
      this.stepsLeft -= 1;
      this.log.push({ text: '十一按了按太阳穴。教导主任又近了一步。', kind: 'bad' });
    }
    this.tickMentalState();
    this.renderSteps();
    if (this.stepsLeft <= 0) {
      window.setTimeout(() => this.finish(false), 700);
      return;
    }

    window.setTimeout(() => {
      if (!this.active) return;
      this.turn += 1;
      this.maybeTriggerMentalState();
      this.drawHand(this.handTarget());
      this.startKaigeRound();
      this.chooseSeal();
      this.phase = this.getPhase();
      this.lines = this.pickRoundLines();
      this.line = this.lines[0] ?? null;
      this.resolving = false;
      this.render();
      this.revealNext = false;
      this.root.querySelector('#debate-hand')?.classList.add('deal-in');
    }, 700);
  }

  private startKaigeRound(): void {
    if (!this.kaigeActive) return;
    if (this.kaigeFlipped) return;
    if (!this.kaigeSecondShield) {
      this.kaigeSecondShield = true;
      const lost = Math.max(0, this.maxConviction - this.conviction);
      this.shield += Math.round(lost * 0.2);
      this.playerDamageMod = -0.2;
      this.log.push({ text: `凯哥敲了敲岛小王的头：“第二回合，再收你 ${Math.round(lost * 0.2)} 护盾。你下一张牌 -20%。”`, kind: 'bad' });
    }
  }

  private stageDouble(index: number): void {
    if (this.responses.length >= 2) return;
    const card = this.hand[index];
    if (!card || card.id === this.sealedCardId) return;
    this.responses.push(card);
    this.hand.splice(index, 1);
    this.renderHand();
    this.renderResponseStrip();
    if (this.responses.length === 2) {
      window.setTimeout(() => this.resolveDouble(), 220);
    }
  }

  private stageArrogant(index: number): void {
    if (this.responses.length >= 2) return;
    const card = this.hand[index];
    if (!card || card.id === this.sealedCardId) return;
    this.responses.push(card);
    this.hand.splice(index, 1);
    this.renderHand();
    this.renderResponseStrip();
    if (this.responses.length === 2) {
      window.setTimeout(() => this.resolveArrogant(), 220);
    }
  }

  private resolveArrogant(): void {
    if (this.responses.length !== 2 || this.resolving || !this.line) return;
    this.resolving = true;
    const line = this.line;
    const rows = this.responses.map((card) => {
      const relation = relationLabel(card.type, line.type);
      const matchedTopic = topicMatch(card, line.topic ?? '规矩');
      const raw = cardDamage(card, this.save.stats.oratory) + (matchedTopic ? TOPIC_BONUS : 0);
      return {
        card,
        relation,
        matchedTopic,
        damage: Math.max(1, Math.round(raw * counterMultiplier(card.type, line.type))),
      };
    });
    const counters = rows.filter((row) => row.relation === '克制');
    const sorted = [...rows].sort((a, b) => b.damage - a.damage);
    let damage = sorted[0].damage;
    if (counters.length > 0) {
      damage += Math.round(sorted[1].damage * 0.5);
      this.log.push({ text: '跋扈：任意一张克制，另一张追加 50% 伤害。', kind: 'good' });
    }
    const activeMod = this.playerDamageMod;
    this.playerDamageMod = 0;
    if (activeMod !== 0) {
      damage = Math.max(1, Math.round(damage * (1 + activeMod)));
      this.log.push({ text: activeMod > 0 ? '凯哥帮你说话，连打伤害 +30%。' : '凯哥收了过路费，连打伤害 -20%。', kind: activeMod > 0 ? 'good' : 'bad' });
    }
    let dealt = damage;
    let healed = 0;
    let absorbed = 0;
    const relation = counters.length > 0 ? '克制' : rows.every((row) => row.relation === '被克') ? '被克' : '普通';

    if (this.mechanic === 'summon' && this.shield > 0) {
      absorbed = Math.min(this.shield, damage);
      this.shield -= absorbed;
      damage -= absorbed;
      dealt = damage;
    }

    if (this.mechanic === 'heal' && this.healRounds > 0) {
      if (relation !== '克制') {
        healed = dealt;
        damage = 0;
        this.conviction = Math.min(this.maxConviction, this.conviction + healed);
        this.log.push({ text: `学霸意识：连打没有克制，反而让他回了 ${healed} 点。`, kind: 'bad' });
      } else {
        damage = Math.max(1, Math.round(damage * 0.8));
        this.log.push({ text: '学霸意识：连打的克制伤害被压了 20%。', kind: 'bad' });
      }
    }

    this.conviction = Math.max(0, this.conviction - damage);
    this.totalDamage += dealt;
    rows.forEach((row) => {
      this.log.push({
        text: `你用【${row.card.name}】${row.matchedTopic ? '切题' : ''}${row.relation === '克制' ? '克制' : row.relation === '被克' ? '被克' : '普通'}。`,
        kind: row.relation === '克制' || row.matchedTopic ? 'good' : row.relation === '被克' ? 'bad' : undefined,
      });
      if (row.card.role === 'reveal') this.revealNext = true;
      if (row.card.role === 'delay') this.stepsLeft += 1;
      this.save.notebook[line.id] = line.type;
      this.discard.push(row.card);
    });
    this.save.cycleKnown = true;
    this.callbacks.onPersist();
    saveGame(this.save);
    this.responses = [];
    this.log.push({ text: `跋扈连打造成 ${damage} 伤害${absorbed > 0 ? `（护盾吸收 ${absorbed}）` : ''}${healed > 0 ? `（回血 ${healed}）` : ''}。`, kind: relation === '克制' ? 'good' : 'bad' });

    if (this.mechanic === 'summon' && relation === '克制') {
      if (!this.kaigeSummoned) {
        this.kaigeSummoned = true;
        this.kaigeActive = true;
        this.kaigeRounds = 2;
        this.kaigeFlipped = false;
        this.kaigeSecondShield = false;
        const lost = Math.max(0, this.maxConviction - this.conviction);
        this.shield += Math.round(lost * 0.5);
        this.log.push({ text: `凯哥来了，给岛小王加了 ${Math.round(lost * 0.5)} 护盾。`, kind: 'bad' });
      } else if (this.kaigeActive && !this.kaigeFlipped) {
        this.kaigeFlipped = true;
        this.playerDamageMod = 0.3;
        this.log.push({ text: '凯哥倒戈了。下一张牌伤害 +30%。', kind: 'good' });
      }
    }

    this.updateBars();
    this.renderHand();
    this.renderResponseStrip();
    this.renderLog();
    this.updateSpeechType();
    this.addFloatingDamage(damage, relation);
    this.shakeBoss();

    if (this.conviction <= 0) {
      window.setTimeout(() => this.finish(true), 700);
      return;
    }

    this.stepsLeft -= 1;
    if (this.mechanic === 'final' && this.turn % 2 === 0) {
      this.stepsLeft -= 1;
      this.log.push({ text: '十一按了按太阳穴。教导主任又近了一步。', kind: 'bad' });
    }
    this.tickMentalState();
    this.renderSteps();
    if (this.stepsLeft <= 0) {
      window.setTimeout(() => this.finish(false), 700);
      return;
    }

    window.setTimeout(() => {
      if (!this.active) return;
      this.turn += 1;
      this.maybeTriggerMentalState();
      this.drawHand(this.handTarget());
      this.startKaigeRound();
      this.chooseSeal();
      this.phase = this.getPhase();
      this.lines = this.pickRoundLines();
      this.line = this.lines[0] ?? null;
      this.resolving = false;
      this.render();
      this.revealNext = false;
      this.root.querySelector('#debate-hand')?.classList.add('deal-in');
    }, 700);
  }

  private resolveDouble(): void {
    if (this.responses.length !== 2 || this.resolving) return;
    this.resolving = true;
    const pairs = this.responses.map((card, index) => {
      const line = this.lines[index];
      const relation = relationLabel(card.type, line.type);
      const matchedTopic = topicMatch(card, line.topic ?? '规矩');
      const raw = cardDamage(card, this.save.stats.oratory) + (matchedTopic ? TOPIC_BONUS : 0);
      const damage = Math.max(1, Math.round(raw * counterMultiplier(card.type, line.type)));
      return { card, line, relation, matchedTopic, damage };
    });
    const counters = pairs.filter((pair) => pair.relation === '克制').length;
    let damage = Math.max(...pairs.map((pair) => pair.damage));
    if (this.mentalState === 'arrogant' && counters > 0) {
      damage += Math.round(Math.min(...pairs.map((pair) => pair.damage)) * 0.5);
      this.log.push({ text: '跋扈：双线回应里任意一张克制，另一张追加 50% 伤害。', kind: 'good' });
    }
    if (counters === 0) damage = Math.round(damage * 0.6);
    if (this.mentalState === 'panic') {
      this.doubtRounds = 2;
      if (counters > 0) {
        damage = Math.round(damage * 1.6);
        this.log.push({ text: '疑虑生效：克制伤害 +60%。', kind: 'good' });
      }
    }
    if (this.mentalState === 'afraid') {
      const stacks = pairs.reduce((sum, pair) => sum + (pair.relation === '克制' ? 2 : 1), 0);
      this.pleaStacks += stacks;
      this.log.push({ text: `害怕：你攒下 ${stacks} 层求饶（共 ${this.pleaStacks} 层）。`, kind: 'bad' });
    }
    this.conviction = Math.max(0, this.conviction - damage);
    this.totalDamage += damage;
    pairs.forEach((pair, index) => {
      this.log.push({
        text: `${index === 0 ? 'A' : 'B'} · ${this.boss.name}说的是【${CARD_TYPES[pair.line.type].label}】“${pair.line.text}” · 话题「${pair.line.topic ?? '规矩'}」`,
      });
      this.log.push({
        text: `你用【${pair.card.name}】回应，${pair.relation === '克制' ? '克制' : pair.relation === '被克' ? '被克' : '普通'}${pair.matchedTopic ? '且切题' : ''}。`,
        kind: pair.relation === '克制' || pair.matchedTopic ? 'good' : pair.relation === '被克' ? 'bad' : undefined,
      });
    });
    this.log.push({
      text:
        counters === 0
          ? `两张都没克制，本轮只造成 ${damage} 伤害（-40%）。`
          : `至少一张克制，本轮造成 ${damage} 伤害（取较高的一张，不翻倍）。`,
      kind: counters === 0 ? 'bad' : 'good',
    });
    if (pairs.some((pair) => pair.card.role === 'reveal')) {
      this.revealNext = true;
      this.log.push({ text: '你从两句话的缝隙里看出了下一轮题型。' });
    }
    if (pairs.some((pair) => pair.card.role === 'delay')) {
      this.stepsLeft += 1;
      this.log.push({ text: '你拖住了一句，教导主任慢了一步。' });
    }
    pairs.forEach((pair) => {
      this.save.notebook[pair.line.id] = pair.line.type;
      this.discard.push(pair.card);
    });
    this.save.cycleKnown = true;
    this.callbacks.onPersist();
    saveGame(this.save);
    this.responses = [];
    this.combo = counters > 0 ? Math.min(3, this.combo + 1) : 0;
    this.addFloatingDamage(damage, counters > 0 ? '克制' : '普通');
    this.shakeBoss();
    this.updateBars();
    this.renderHand();
    this.renderResponseStrip();
    this.renderLog();
    this.updateSpeechType();

    if (this.conviction <= 0) {
      window.setTimeout(() => this.finish(true), 700);
      return;
    }
    this.stepsLeft -= 1;
    this.tickMentalState();
    this.renderSteps();
    if (this.stepsLeft <= 0) {
      window.setTimeout(() => this.finish(false), 700);
      return;
    }
    window.setTimeout(() => {
      if (!this.active) return;
      this.turn += 1;
      this.maybeTriggerMentalState();
      this.drawHand(this.handTarget());
      this.chooseSeal();
      this.lines = this.pickRoundLines();
      this.line = this.lines[0] ?? null;
      this.phase = this.getPhase();
      this.resolving = false;
      this.render();
      this.revealNext = false;
      this.root.querySelector('#debate-hand')?.classList.add('deal-in');
    }, 700);
  }

  private updateSpeechType(): void {
    this.lines.forEach((line, index) => {
      const speech = this.root.querySelector(`#speech-${index}`);
      if (!speech) return;
      const known = this.save.notebook[line.id];
      if (!known) return;
      const unknown = speech.querySelector('.unknown-type');
      if (unknown) {
        const span = document.createElement('span');
        span.className = 'line-type';
        span.textContent = CARD_TYPES[known].short;
        unknown.replaceWith(span);
      }
    });
  }

  private addFloatingDamage(damage: number, relation: string): void {
    const panel = this.root.querySelector('.boss-panel');
    if (!panel) return;
    const float = document.createElement('span');
    float.className = 'damage-float';
    float.textContent = `-${damage}${relation === '克制' ? '!' : ''}`;
    float.style.left = `${44 + Math.random() * 20}%`;
    float.style.top = `${30 + Math.random() * 20}%`;
    panel.appendChild(float);
    window.setTimeout(() => float.remove(), 850);
  }

  private shakeBoss(): void {
    const img = this.root.querySelector('#boss-portrait');
    if (!img) return;
    img.classList.remove('boss-shake');
    void (img as HTMLElement).offsetWidth;
    img.classList.add('boss-shake');
  }

  private swapHand(): void {
    if (this.swapped || this.resolving || this.finished || this.stepsLeft <= 2) return;
    this.swapped = true;
    this.discard.push(...this.hand);
    this.hand = [];
    this.drawHand(this.handTarget());
    this.stepsLeft -= 1;
    this.log.push({ text: '你换了一口气，重新组织语言。教导主任又近了一步。', kind: 'bad' });
    this.updateBars();
    this.renderHand();
    this.renderLog();
    this.updateNotebookButton();
  }

  private toggleNotebook(): void {
    this.notebookOpen = !this.notebookOpen;
    this.updateNotebookButton();
    let panel = this.root.querySelector<HTMLElement>('#notebook-panel');
    if (!this.notebookOpen) {
      panel?.remove();
      return;
    }
    panel = document.createElement('div');
    panel.id = 'notebook-panel';
    panel.className = 'notebook-panel';
    const entries = Object.entries(this.save.notebook).filter(([id]) => id.startsWith(this.boss.id.slice(0, 2)) || this.boss.lines.some((line) => line.id === id));
    const knownLines = this.boss.lines.filter((line) => this.save.notebook[line.id]);
    panel.innerHTML = `
      <div class="notebook-head">
        <div>
          <div class="modal-kicker">KANNO'S NOTEBOOK</div>
          <h3>错题本 · ${this.boss.name}</h3>
        </div>
        <button class="modal-close" id="notebook-close" type="button">×</button>
      </div>
      <p class="notebook-hint">${this.save.cycleKnown ? '规律：讲道理克谈感情，谈感情克摆事实，摆事实克讲道理。' : '还没完全摸清规律。多打几张牌，或者用“试探”看穿下一句。'}</p>
      <div class="notebook-lines">
        ${
          knownLines.length
            ? knownLines
                .map(
                  (line) =>
                    `<div class="notebook-line"><span>${this.escape(line.text)}<small class="notebook-topic">话题 · ${line.topic ?? '规矩'}</small></span><b>${CARD_TYPES[line.type].short}</b></div>`,
                )
                .join('')
            : '<div class="notebook-empty">还没有记下任何一句。第一次打，先大胆试。</div>'
        }
      </div>
      <div class="notebook-count">已记录 ${entries.length} 条 · 退出后仍会保留</div>
    `;
    this.root.querySelector('.debate-conversation')?.appendChild(panel);
    panel.querySelector('#notebook-close')?.addEventListener('click', () => this.toggleNotebook());
  }

  private finish(win: boolean): void {
    if (this.finished) return;
    this.finished = true;
    this.resolving = true;
    this.active = false;
    audio.stopMusic();
    if (win) audio.bossWin();
    else audio.caught();
    const result = this.root.querySelector<HTMLElement>('#debate-result');
    if (!result) return;
    result.classList.remove('hidden');
    result.innerHTML = `
      <div class="debate-result-card">
        <span class="result-stamp">${win ? '说服' : '被抓'}</span>
        <h3>${win ? `${this.boss.name}让步了` : '教导主任到门口了'}</h3>
        <p>${
          win
            ? `第 ${this.turn} 回合，你把“${this.escape(this.boss.name)}”的坚定值打空了。对方沉默了一会儿，往旁边挪了半步。`
            : '你还没把话说完，走廊里的皮鞋声已经停在了门口。'
        }</p>
        <div class="result-actions">
          <button class="comic-button primary" id="btn-result-next" type="button">${win ? '听对方说完' : '回到座位'}</button>
        </div>
      </div>
    `;
    result.querySelector('#btn-result-next')?.addEventListener('click', () => this.confirmResult());
  }

  private confirmResult(): void {
    if (!this.finished) return;
    const win = this.conviction <= 0;
    this.destroy();
    if (win) this.callbacks.onWin();
    else this.callbacks.onLose();
  }

  destroy(): void {
    this.active = false;
    if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
    this.keyHandler = null;
    this.root.classList.add('hidden');
    this.root.innerHTML = '';
  }

  private escape(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}
