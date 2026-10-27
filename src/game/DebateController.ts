import { audio } from '../audio';
import { bus } from '../events';
import { CARD_TYPES, cardDamage, counterMultiplier, getCard, relationLabel } from '../data/cards';
import { getBoss } from '../data/bosses';
import { saveGame } from '../state';
import type { BossDef, BossLine, CardDef, CardType, SaveData } from '../types';

interface DebateCallbacks {
  onWin: () => void;
  onLose: () => void;
  onPersist: () => void;
}

interface LogEntry {
  text: string;
  kind?: 'good' | 'bad';
}

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
    this.line = this.pickLine();
    this.log = [{ text: `第 1 回合，${this.boss.name}先开口了。` }];
    this.combo = 0;
    this.comboPending = 0;
    this.turn = 1;
    this.phase = this.getPhase();
    this.revealNext = false;
    this.swapped = false;
    this.notebookOpen = false;
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

  private render(): void {
    this.root.classList.remove('hidden');
    this.root.innerHTML = `
      <div class="debate-shell">
        <div class="debate-top">
          <div class="debate-boss-meta">
            <div class="debate-boss-badge">${this.boss.name.slice(0, 1)}</div>
            <div>
              <div class="debate-boss-name">${this.boss.name}</div>
              <div class="debate-boss-sub">${this.boss.title} · 嘴炮战</div>
            </div>
          </div>
          <div class="debate-bars">
            <div class="conviction">
              <div class="bar-label"><span>坚定值</span><span id="conviction-text">${Math.max(0, this.conviction)} / ${this.maxConviction}</span></div>
              <div class="bar-track"><div id="conviction-fill" class="conviction-fill" style="width:${Math.max(0, (this.conviction / this.maxConviction) * 100)}%"></div></div>
            </div>
            <div class="dean-steps" id="dean-steps"></div>
          </div>
          <div class="debate-actions">
            <button class="debate-small-btn" id="btn-notebook" type="button">错题本</button>
            <button class="debate-small-btn" id="btn-swap" type="button">换牌</button>
          </div>
        </div>
        <div class="debate-main">
          <div class="boss-panel">
            <img id="boss-portrait" src="${this.boss.portrait}" alt="${this.boss.name}">
          </div>
          <div class="debate-conversation">
            <div class="speech" id="speech">${this.speechHtml()}</div>
            <div class="debate-log" id="debate-log">${this.logHtml()}</div>
            <div class="combo-line">
              <span>气势</span>
              <div class="combo-pips" id="combo-pips"></div>
              <span class="combo-text" id="combo-text"></span>
            </div>
          </div>
        </div>
        <div class="debate-hand-wrap">
          <div class="debate-hand-head">
            <span>第 <strong id="turn-number">${this.turn}</strong> 回合 · 选一张回应</span>
            <span>${this.isTouch ? '点一张牌' : '按 <strong>1 / 2 / 3</strong> 出牌'}</span>
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
    this.renderSteps();
    this.renderCombo();
    this.updateNotebookButton();
    this.renderLog();
  }

  private speechHtml(): string {
    if (!this.line) return '';
    const known = this.save.notebook[this.line.id] || (this.revealNext && this.active ? this.line.type : undefined);
    const typeLabel = known
      ? `<span class="line-type">${CARD_TYPES[known].short}</span>`
      : `<span class="line-type unknown-type">？？</span>`;
    return `${this.escape(this.line.text)}${typeLabel}`;
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
        return `
          <button class="play-card type-${card.type}" data-card-id="${card.id}" type="button">
            <span class="play-card-top">
              <span class="play-card-type">${meta.label}</span>
              <span class="play-card-number">${String(index + 1).padStart(2, '0')}</span>
            </span>
            <h4>${this.escape(card.name)}</h4>
            <p>“${this.escape(card.line)}”</p>
            <span class="play-card-foot">
              <span class="card-effect">${effect}</span>
              <span class="card-damage">${cardDamage(card, this.save.stats.oratory)} <small>伤害</small></span>
            </span>
            <span class="card-key">${index + 1}</span>
          </button>
        `;
      })
      .join('');
    handEl.querySelectorAll<HTMLButtonElement>('.play-card').forEach((button, index) => {
      button.disabled = this.resolving || this.finished;
      button.addEventListener('click', () => this.playIndex(index));
    });
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
      swap.disabled = this.swapped || this.resolving || this.finished || this.stepsLeft <= 2;
      swap.textContent = this.swapped ? '换过了' : '换牌';
    }
  }

  private playIndex(index: number): void {
    if (!this.active || this.resolving || this.finished) return;
    const card = this.hand[index];
    if (!card || !this.line) return;
    this.resolving = true;
    this.updateNotebookButton();
    this.renderHand();
    const relation = relationLabel(card.type, this.line.type);
    const multiplier = counterMultiplier(card.type, this.line.type);
    const bonus = this.comboPending;
    const raw = cardDamage(card, this.save.stats.oratory, bonus);
    const damage = Math.max(1, Math.round(raw * multiplier));
    this.conviction = Math.max(0, this.conviction - damage);
    const meta = CARD_TYPES[card.type];
    const bossType = CARD_TYPES[this.line.type];
    this.log.push({
      text: `${this.boss.name}说的是【${bossType.label}】“${this.line.text}”`,
    });
    this.log.push({
      text: `你打出【${card.name}】${relation === '克制' ? '克制' : relation === '被克' ? '被克' : '普通'}：${damage} 伤害。`,
      kind: relation === '克制' ? 'good' : relation === '被克' ? 'bad' : undefined,
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
    }
    if (card.role === 'delay') {
      this.stepsLeft += 1;
      this.log.push({ text: '你多拖了一步。教导主任走得更慢了。' });
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
    this.stepsLeft -= 1;
    this.renderSteps();
    if (this.stepsLeft <= 0) {
      window.setTimeout(() => this.finish(false), 700);
      return;
    }
    window.setTimeout(() => {
      if (!this.active) return;
      this.turn += 1;
      this.drawHand(3);
      this.line = this.pickLine();
      this.phase = this.getPhase();
      this.resolving = false;
      this.render();
      this.revealNext = false;
      this.root.querySelector('#debate-hand')?.classList.add('deal-in');
    }, 700);
  }

  private updateSpeechType(): void {
    if (!this.line) return;
    const speech = this.root.querySelector('#speech');
    if (speech) {
      const known = this.save.notebook[this.line.id];
      if (known) {
        const unknown = speech.querySelector('.unknown-type');
        if (unknown) {
          const span = document.createElement('span');
          span.className = 'line-type';
          span.textContent = CARD_TYPES[known].short;
          unknown.replaceWith(span);
        }
      }
    }
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
    this.drawHand(3);
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
                    `<div class="notebook-line"><span>${this.escape(line.text)}</span><b>${CARD_TYPES[line.type].short}</b></div>`,
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
            ? `第 ${this.turn} 回合，你把“${this.escape(this.boss.name)}”的坚定值打空了。她沉默了一会儿，往旁边挪了半步。`
            : '你还没把话说完，走廊里的皮鞋声已经停在了门口。'
        }</p>
        <div class="result-actions">
          <button class="comic-button primary" id="btn-result-next" type="button">${win ? '听她说完' : '回到座位'}</button>
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
