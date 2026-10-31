import Phaser from 'phaser';
import { audio } from './audio';
import { bus } from './events';
import { input } from './input';
import { BootScene } from './game/BootScene';
import { DebateController } from './game/DebateController';
import { StealthScene } from './game/StealthScene';
import { BOSS_ORDER, getBoss } from './data/bosses';
import { CARD_TYPES, CARDS, getCard } from './data/cards';
import { getLevel, LEVELS } from './data/levels';
import { ARCHIVE_ROWS, ENDING_FACE_TO_FACE, ENDING_SILENT, ENDING_TEXT, FORCED_INTRO } from './data/story';
import {
  addEnding,
  canUpgrade,
  clearSave,
  defaultSettings,
  endingLabel,
  hasSave,
  loadSave,
  loadSettings,
  resetRun,
  saveGame,
  saveSettings,
  staminaMax,
  STAT_META,
  upgradeCost,
  upgradeStat,
} from './state';
import { showSkillGuide } from './ui/skillGuide';
import type { BossDef, CardType, HudState, LevelConfig, SaveData, SceneLine, Settings, StatKey } from './types';

interface DialogueItem {
  lines: SceneLine[];
  onDone?: () => void;
}

interface LevelCompletePayload {
  levelIndex: number;
  levelId: string;
  method: 'stealth' | 'debate';
  faceCollected: number;
  bossId?: string;
}

interface DebateStartPayload {
  bossId: string;
  levelIndex: number;
  levelId: string;
  reason: string;
}

const $ = <T extends HTMLElement = HTMLElement>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element ${selector}`);
  return element;
};

const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export class GameApp {
  private save: SaveData;
  private settings: Settings;
  private phaserGame: Phaser.Game | null = null;
  private currentScene: StealthScene | null = null;
  private debate: DebateController | null = null;
  private assetsReady = false;
  private bootStarted = false;
  private assetCallbacks: Array<() => void> = [];
  private loadingVisible = false;
  private currentLevelIndex = 0;
  private levelCompleting = false;
  private deckAdjustAvailable = false;
  private pauseOpen = false;
  private modalOpen = false;
  private seenLevels = new Set<string | number>();
  private seenBosses = new Set<string>();
  private pendingLevelIntro: SceneLine[] | null = null;
  private dialogueQueue: DialogueItem[] = [];
  private dialogueActive = false;
  private dialogueLines: SceneLine[] = [];
  private dialogueIndex = 0;
  private dialogueTypeTimer: number | null = null;
  private dialogueFullText = '';
  private dialogueTyping = false;
  private dialogueOnDone: (() => void) | null = null;
  private dialogueKeyHandler: ((event: KeyboardEvent) => void) | null = null;
  private audioActivated = false;
  private toastTimer: number | null = null;
  private controlHintShown = false;

  private landing = $('#landing');
  private gameScreen = $('#game-screen');
  private landingOverlay = $('#landing-overlay');
  private gameModal = $('#overlay-layer-game');
  private dialogueLayer = $('#dialogue-layer');
  private debateLayer = $('#debate-layer');
  private promptEl = $('#prompt');
  private toastEl = $('#toast');
  private hudAlert = $('#hud-alert');
  private alertFill = $('#alert-fill');
  private alertLabel = $('#alert-label');
  private staminaFill = $('#stamina-fill');
  private faceCounter = $('#face-counter');
  private objectiveText = $('#objective-text');
  private areaName = $('#area-name');
  private areaKicker = $('#area-kicker');
  private gameRoot = $('#game-root');

  constructor() {
    this.save = loadSave();
    this.settings = loadSettings();
  }

  init(): void {
    input.init();
    input.applySettings(this.settings);
    this.applyReducedMotion();
    this.bindLanding();
    this.bindGameChrome();
    this.bindBus();
    this.bindGlobalAudioUnlock();
    this.updateLanding();
    this.updateSoundButton();
    (window as unknown as { __NOVEL_GAME__?: GameApp }).__NOVEL_GAME__ = this;
    this.bindDevBossLink();
  }

  /**
   * Dev-only shortcut for reviewing a boss fight: `?boss=youxiaotang` boots
   * straight into that level with the debate open. Stripped from production.
   */
  private bindDevBossLink(): void {
    if (!import.meta.env.DEV) return;
    const bossId = new URLSearchParams(window.location.search).get('boss');
    if (!bossId) return;
    const index = BOSS_ORDER.indexOf(bossId as (typeof BOSS_ORDER)[number]);
    if (index < 0) return;
    window.setTimeout(() => {
      this.seenBosses.add(bossId);
      this.showGameScreen();
      this.ensureAssets(() => {
        this.startLevel(index, { intro: false, retry: true });
        window.setTimeout(() => this.currentScene?.debugTriggerDebate(), 900);
      });
    }, 250);
  }

  private bindGlobalAudioUnlock(): void {
    document.addEventListener(
      'pointerdown',
      () => {
        this.activateAudio();
      },
      { once: true },
    );
  }

  private activateAudio(): void {
    if (this.audioActivated) return;
    this.audioActivated = true;
    audio.init(this.settings);
    audio.setSettings(this.settings);
    audio.unlock();
  }

  private bindLanding(): void {
    $('#btn-start').addEventListener('click', () => {
      this.activateAudio();
      audio.click();
      if (this.save.started && !this.save.completed) {
        this.showNewGameConfirm();
      } else {
        this.beginNewGame();
      }
    });
    $('#btn-continue').addEventListener('click', () => {
      this.activateAudio();
      audio.click();
      this.continueGame();
    });
    $('#btn-how').addEventListener('click', () => {
      this.activateAudio();
      this.showLandingModal(this.controlsHtml(), true);
    });
    $('#btn-skill-guide').addEventListener('click', () => {
      this.activateAudio();
      showSkillGuide();
    });
    $('#btn-archive').addEventListener('click', () => {
      this.activateAudio();
      this.showArchive();
    });
    $('#btn-reset').addEventListener('click', () => {
      this.activateAudio();
      this.showResetConfirm();
    });
    $('#btn-landing-sound').addEventListener('click', () => {
      this.activateAudio();
      this.settings.muted = !this.settings.muted;
      saveSettings(this.settings);
      audio.setSettings(this.settings);
      this.updateSoundButton();
    });
    this.landingOverlay.addEventListener('click', (event) => {
      if (event.target === this.landingOverlay) this.closeLandingModal();
    });
  }

  private bindGameChrome(): void {
    $('#btn-pause').addEventListener('click', () => {
      audio.click();
      this.openPause();
    });
    $('#btn-hud-help').addEventListener('click', () => {
      audio.click();
      this.openSkillGuide();
    });
    this.dialogueLayer.addEventListener('click', (event) => {
      if ((event.target as HTMLElement).closest('.dialogue-skip')) return;
      this.advanceDialogue();
    });
    this.gameModal.addEventListener('click', (event) => {
      if (event.target === this.gameModal && this.modalOpen && this.gameModal.dataset.dismissible === 'true') {
        this.closeGameModal();
      }
    });
  }

  private bindBus(): void {
    bus.on('assets:ready', () => {
      this.assetsReady = true;
      this.hideLoading();
      const callbacks = [...this.assetCallbacks];
      this.assetCallbacks = [];
      callbacks.forEach((callback) => callback());
    });
    bus.on('hud:update', (payload) => this.handleHud(payload as HudState));
    bus.on('ui:prompt', (payload) => this.handlePrompt(payload as string | null));
    bus.on('ui:toast', (payload) => this.toast(String(payload)));
    bus.on('face:collect', (payload) => this.collectFace(Number(payload)));
    bus.on('level:complete', (payload) => this.handleLevelComplete(payload as LevelCompletePayload));
    bus.on('level:failed', (payload) => this.handleLevelFailed(payload as { levelIndex: number }));
    bus.on('debate:start', (payload) => this.handleDebateStart(payload as DebateStartPayload));
    bus.on('scene:forced-ready', () => {
      this.currentScene?.startForcedDebate();
    });
    bus.on('scene:intro-ready', () => {
      if (!this.pendingLevelIntro) return;
      const lines = this.pendingLevelIntro;
      this.pendingLevelIntro = null;
      this.showDialogue(lines, () => {
        this.currentScene?.resumeGameplay();
        window.setTimeout(() => this.showControlHint(), 350);
      });
    });
    bus.on('ui:pause', () => {
      if (this.debate || this.dialogueActive) return;
      this.openPause();
    });
  }

  private updateSoundButton(): void {
    const button = document.getElementById('btn-landing-sound');
    if (button) button.textContent = this.settings.muted ? '声音：关' : '声音：开';
  }

  private updateLanding(): void {
    const save = this.save;
    const continueButton = document.getElementById('btn-continue') as HTMLButtonElement;
    const startButton = document.getElementById('btn-start') as HTMLButtonElement;
    const canContinue = save.started && !save.completed;
    continueButton.disabled = !canContinue;
    continueButton.textContent = canContinue ? `继续上回 · ${getLevel(save.levelIndex).name}` : '继续上回';
    startButton.innerHTML = save.started && !save.completed
      ? '<span class="button-kicker">重开</span>重新开始'
      : save.completed
        ? '<span class="button-kicker">再走一次</span>重新开始'
        : '<span class="button-kicker">开始</span>开始晚自习';
    this.updateSoundButton();
  }

  private applyReducedMotion(): void {
    document.documentElement.classList.toggle('reduce-motion', this.settings.reduceMotion);
  }

  private updateTouchControls(): void {
    const show =
      this.settings.showTouchControls &&
      this.landing.classList.contains('hidden') &&
      !this.gameScreen.classList.contains('hidden') &&
      !this.modalOpen &&
      !this.dialogueActive &&
      !this.debate;
    input.showTouchControls(show);
    document.getElementById('btn-edit-layout')?.classList.toggle('hidden', !show);
  }

  private showGameScreen(): void {
    this.landing.classList.add('hidden');
    this.gameScreen.classList.remove('hidden');
    this.landingOverlay.classList.add('hidden');
    this.updateTouchControls();
  }

  private showLandingScreen(): void {
    this.gameScreen.classList.add('hidden');
    this.landing.classList.remove('hidden');
    this.updateTouchControls();
    this.updateLanding();
  }

  private ensureAssets(callback: () => void): void {
    this.showGameScreen();
    if (this.assetsReady) {
      callback();
      return;
    }
    this.assetCallbacks.push(callback);
    if (!this.phaserGame) {
      this.createPhaser();
    }
    if (!this.assetsReady) this.showLoading();
  }

  private createPhaser(): void {
    if (this.phaserGame) return;
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.CANVAS,
      parent: 'game-root',
      width: 1280,
      height: 720,
      backgroundColor: '#0d0e10',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      physics: {
        default: 'arcade',
        arcade: { gravity: { x: 0, y: 0 }, debug: false },
      },
      scene: [BootScene],
      audio: { noAudio: true },
      render: { antialias: true, roundPixels: false, transparent: false },
      disableContextMenu: true,
    };
    try {
      this.phaserGame = new Phaser.Game(config);
      this.phaserGame.scene.add('StealthScene', StealthScene, false);
      this.bootStarted = true;
    } catch (error) {
      console.error(error);
      this.showLoadingError();
    }
  }

  private showLoading(): void {
    if (this.loadingVisible) return;
    this.loadingVisible = true;
    this.showGameModal(
      `<div class="modal-card loading-card">
        <div class="loading-chalk">正在布置教室<span>...</span></div>
        <p class="modal-sub">把课桌摆好，把灯关掉，把门虚掩上。</p>
      </div>`,
      { close: false, dismissible: false },
    );
  }

  private hideLoading(): void {
    if (!this.loadingVisible) return;
    this.loadingVisible = false;
    if (this.modalOpen) this.closeGameModal();
  }

  private showLoadingError(): void {
    this.loadingVisible = false;
    this.showGameModal(
      `<div class="modal-card"><h2>教室没布置好</h2><p class="modal-sub">资源加载失败。请刷新页面再试一次。</p><div class="modal-actions"><button class="comic-button" id="btn-reload" type="button">刷新页面</button></div></div>`,
      { close: false, dismissible: false, onMount: () => {
        document.getElementById('btn-reload')?.addEventListener('click', () => window.location.reload());
      } },
    );
  }

  private beginNewGame(): void {
    this.activateAudio();
    resetRun(this.save);
    this.save.started = true;
    this.save.completed = false;
    saveGame(this.save);
    this.seenLevels.clear();
    this.seenBosses.clear();
    this.controlHintShown = false;
    this.currentLevelIndex = 0;
    this.levelCompleting = false;
    this.deckAdjustAvailable = false;
    this.updateFace();
    this.showGameScreen();
    this.ensureAssets(() => {
      this.startLevel(0, { intro: true });
    });
  }

  private continueGame(): void {
    this.save = loadSave();
    if (!this.save.started || this.save.completed) {
      this.updateLanding();
      return;
    }
    this.showGameScreen();
    this.updateFace();
    this.ensureAssets(() => {
      this.startLevel(this.save.levelIndex, { resume: true });
    });
  }

  private startLevel(index: number, options: { intro?: boolean; retry?: boolean; resume?: boolean } = {}): void {
    if (index >= LEVELS.length) {
      this.showEndingCard(this.save.combatOccurred ? 'face-to-face' : 'silent');
      return;
    }
    const level = getLevel(index);
    this.currentLevelIndex = index;
    this.save.levelIndex = index;
    saveGame(this.save);
    this.levelCompleting = false;
    this.updateArea(level);
    this.showGameScreen();
    this.hideDialogueImmediate();
    this.hideGameModal();
    this.hidePrompt();
    this.updateTouchControls();
    this.ensureAssets(() => {
      if (index === 3 && this.save.combatOccurred) {
        if (options.retry || this.seenLevels.has('office-forced')) {
          this.startForcedFinal();
        } else {
          this.seenLevels.add('office-forced');
          this.showDialogue(FORCED_INTRO, () => this.startForcedFinal());
        }
        return;
      }
      const showIntro = options.intro !== false && !options.retry && !this.seenLevels.has(index);
      if (showIntro) {
        this.seenLevels.add(index);
        this.pendingLevelIntro = level.intro;
        this.startScene(index, false, true);
      } else {
        this.startScene(index, false, false);
      }
    });
  }

  private startForcedFinal(): void {
    this.startScene(3, true);
  }

  private startScene(index: number, forced: boolean, startPaused = false): void {
    if (!this.phaserGame) return;
    this.hideGameModal();
    this.hideDialogueImmediate();
    this.hidePrompt();
    this.inputOff();
    this.gameScreen.classList.remove('no-topbar');
    if (!startPaused) this.pendingLevelIntro = null;
    try {
      this.phaserGame.scene.stop('StealthScene');
      this.phaserGame.scene.start('StealthScene', {
        levelIndex: index,
        save: this.save,
        forcedDebate: forced,
        startPaused,
      });
      this.currentScene = this.phaserGame.scene.getScene('StealthScene') as StealthScene;
    } catch (error) {
      console.error(error);
      this.toast('场景启动失败，请刷新页面。');
    }
    this.currentLevelIndex = index;
    this.updateTouchControls();
    if (!startPaused) window.setTimeout(() => this.showControlHint(), 600);
  }

  private showControlHint(): void {
    if (this.controlHintShown || this.settings.showTouchControls) return;
    this.controlHintShown = true;
    const hint = document.getElementById('control-hint');
    if (!hint) return;
    hint.textContent = 'WASD / 方向键移动 · Ctrl 蹲伏 · Shift 冲刺 · Space 闪避 · E 互动 · F 扔橡皮';
    hint.classList.remove('hidden');
    window.setTimeout(() => hint.classList.add('hidden'), 6500);
  }

  private inputOff(): void {
    input.setEnabled(false);
    input.clearActions();
  }

  private updateArea(level: LevelConfig): void {
    this.areaName.textContent = level.name;
    this.areaKicker.textContent = level.kicker;
    this.objectiveText.textContent = level.objective.label;
    this.updateFace();
  }

  private updateFace(): void {
    this.faceCounter.innerHTML = `面子 <b>${this.save.face}</b>`;
  }

  private collectFace(amount: number): void {
    this.save.face += amount;
    saveGame(this.save);
    this.updateFace();
  }

  private handleHud(payload: HudState): void {
    if (!payload) return;
    this.objectiveText.textContent = payload.objective;
    this.areaName.textContent = payload.area;
    this.areaKicker.textContent = `${payload.time} · 晚自习`;
    const alert = Math.max(0, Math.min(100, payload.alert));
    const show = alert > 1;
    this.hudAlert.classList.toggle('hidden', !show);
    this.hudAlert.classList.toggle('danger', alert >= 60);
    this.alertFill.style.width = `${alert}%`;
    this.alertLabel.textContent = alert >= 60 ? '要发现了' : alert >= 25 ? '快躲起来' : '被注意';
    const staminaPercent = payload.maxStamina > 0 ? (payload.stamina / payload.maxStamina) * 100 : 0;
    this.staminaFill.style.width = `${Math.max(0, Math.min(100, staminaPercent))}%`;
    this.staminaFill.style.background = staminaPercent < 20 ? '#c84938' : '';
  }

  private handlePrompt(text: string | null): void {
    if (!text) {
      this.hidePrompt();
      return;
    }
    const coarse = window.matchMedia?.('(pointer: coarse)').matches;
    this.promptEl.textContent = coarse ? text.replace(/^E\s*/, '互动 · ') : text;
    this.promptEl.classList.remove('hidden');
  }

  private hidePrompt(): void {
    this.promptEl.classList.add('hidden');
  }

  private toast(text: string): void {
    this.toastEl.textContent = text;
    this.toastEl.classList.remove('hidden');
    if (this.toastTimer !== null) window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toastEl.classList.add('hidden'), 2800);
  }

  // ---------------------------------------------------------------------
  // dialogue
  // ---------------------------------------------------------------------

  private showDialogue(lines: SceneLine[], onDone?: () => void): void {
    if (!lines.length) {
      onDone?.();
      return;
    }
    this.dialogueQueue.push({ lines, onDone });
    this.pumpDialogue();
  }

  private pumpDialogue(): void {
    if (this.dialogueActive || this.dialogueQueue.length === 0) return;
    const item = this.dialogueQueue.shift();
    if (!item) return;
    this.dialogueActive = true;
    this.dialogueLines = item.lines;
    this.dialogueIndex = 0;
    this.dialogueOnDone = item.onDone ?? null;
    this.currentScene?.pauseGameplay();
    this.inputOff();
    this.updateTouchControls();
    this.hidePrompt();
    this.dialogueLayer.classList.remove('hidden');
    this.dialogueKeyHandler = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault();
        this.advanceDialogue();
      }
    };
    window.addEventListener('keydown', this.dialogueKeyHandler);
    this.renderDialogueLine();
  }

  private renderDialogueLine(): void {
    const line = this.dialogueLines[this.dialogueIndex];
    if (!line) {
      this.finishDialogue();
      return;
    }
    if (this.dialogueTypeTimer !== null) window.clearTimeout(this.dialogueTypeTimer);
    this.dialogueLayer.innerHTML = `
      <div class="dialogue-box ${line.style ?? ''}">
        <div class="dialogue-speaker">${escapeHtml(line.speaker)}</div>
        ${line.portrait ? `<img class="dialogue-portrait" src="${line.portrait}" alt="${escapeHtml(line.speaker)}">` : ''}
        <div class="dialogue-text" id="dialogue-text"></div>
        <div class="dialogue-next" id="dialogue-next">${this.dialogueIndex === this.dialogueLines.length - 1 ? '点击结束' : '点击继续'}</div>
        <button class="dialogue-skip" type="button">跳过</button>
      </div>
    `;
    this.dialogueLayer.querySelector('.dialogue-skip')?.addEventListener('click', (event) => {
      event.stopPropagation();
      this.skipDialogue();
    });
    const textEl = this.dialogueLayer.querySelector<HTMLElement>('#dialogue-text');
    if (!textEl) return;
    this.dialogueFullText = line.text;
    this.dialogueTyping = true;
    let cursor = 0;
    const tick = () => {
      cursor += 1;
      textEl.textContent = this.dialogueFullText.slice(0, cursor);
      if (cursor >= this.dialogueFullText.length) {
        this.dialogueTyping = false;
        this.dialogueTypeTimer = null;
        return;
      }
      this.dialogueTypeTimer = window.setTimeout(tick, 22);
    };
    tick();
  }

  private advanceDialogue(): void {
    if (!this.dialogueActive) return;
    if (this.dialogueTyping) {
      if (this.dialogueTypeTimer !== null) window.clearTimeout(this.dialogueTypeTimer);
      this.dialogueTypeTimer = null;
      this.dialogueTyping = false;
      const textEl = this.dialogueLayer.querySelector<HTMLElement>('#dialogue-text');
      if (textEl) textEl.textContent = this.dialogueFullText;
      return;
    }
    if (this.dialogueIndex + 1 < this.dialogueLines.length) {
      this.dialogueIndex += 1;
      audio.click();
      this.renderDialogueLine();
    } else {
      this.finishDialogue();
    }
  }

  private skipDialogue(): void {
    if (!this.dialogueActive) return;
    audio.click();
    this.finishDialogue();
  }

  private finishDialogue(): void {
    if (!this.dialogueActive) return;
    this.dialogueActive = false;
    if (this.dialogueTypeTimer !== null) window.clearTimeout(this.dialogueTypeTimer);
    this.dialogueTypeTimer = null;
    this.dialogueTyping = false;
    if (this.dialogueKeyHandler) window.removeEventListener('keydown', this.dialogueKeyHandler);
    this.dialogueKeyHandler = null;
    this.dialogueLayer.classList.add('hidden');
    this.dialogueLayer.innerHTML = '';
    const callback = this.dialogueOnDone;
    this.dialogueOnDone = null;
    this.dialogueLines = [];
    this.dialogueIndex = 0;
    this.updateTouchControls();
    if (callback) callback();
    if (!this.dialogueActive) this.pumpDialogue();
  }

  private hideDialogueImmediate(): void {
    if (this.dialogueTypeTimer !== null) window.clearTimeout(this.dialogueTypeTimer);
    this.dialogueTypeTimer = null;
    this.dialogueTyping = false;
    this.dialogueActive = false;
    this.dialogueLines = [];
    this.dialogueIndex = 0;
    this.dialogueOnDone = null;
    this.dialogueQueue = [];
    if (this.dialogueKeyHandler) window.removeEventListener('keydown', this.dialogueKeyHandler);
    this.dialogueKeyHandler = null;
    this.dialogueLayer.classList.add('hidden');
    this.dialogueLayer.innerHTML = '';
  }

  // ---------------------------------------------------------------------
  // debate
  // ---------------------------------------------------------------------

  private handleDebateStart(payload: DebateStartPayload): void {
    if (this.debate) return;
    this.save.combatOccurred = true;
    this.save.caughtCount += 1;
    saveGame(this.save);
    this.inputOff();
    this.updateTouchControls();
    this.hidePrompt();
    const boss = getBoss(payload.bossId);
    boss.portraits?.forEach((src) => {
      const img = new Image();
      img.decoding = 'async';
      img.src = src;
    });
    if (!this.seenBosses.has(payload.bossId)) {
      this.seenBosses.add(payload.bossId);
      this.showDialogue(boss.intro, () => this.openDebate(payload.bossId));
    } else {
      this.openDebate(payload.bossId);
    }
  }

  private openDebate(bossId: string): void {
    if (this.debate) return;
    this.inputOff();
    this.hidePrompt();
    this.gameScreen.classList.add('debate-active');
    this.updateTouchControls();
    this.debateLayer.classList.remove('hidden');
    this.debate = new DebateController(this.debateLayer, this.save, bossId, {
      onWin: () => {
        this.debate = null;
        this.gameScreen.classList.remove('debate-active');
        this.updateTouchControls();
        this.currentScene?.resolveDebate(true);
      },
      onLose: () => {
        this.debate = null;
        this.gameScreen.classList.remove('debate-active');
        this.updateTouchControls();
        this.currentScene?.resolveDebate(false);
      },
      onPersist: () => {
        saveGame(this.save);
      },
      onHelp: () => {
        showSkillGuide();
      },
    });
    this.debate.start();
    this.updateTouchControls();
  }

  // ---------------------------------------------------------------------
  // level end / retry
  // ---------------------------------------------------------------------

  private handleLevelComplete(payload: LevelCompletePayload): void {
    if (this.levelCompleting) return;
    this.levelCompleting = true;
    this.inputOff();
    this.updateTouchControls();
    this.hidePrompt();
    this.currentScene?.pauseGameplay();
    const level = getLevel(payload.levelIndex);
    const boss = getBoss(level.bossId);
    const baseReward = payload.method === 'debate' ? 45 : 30;
    this.save.face += baseReward;
    if (payload.method === 'debate') {
      this.save.bossWins += 1;
      this.save.deckUnlocked = true;
      this.deckAdjustAvailable = true;
    } else {
      this.save.stealthClears += 1;
    }
    saveGame(this.save);
    this.updateFace();
    this.toast(`+${baseReward} 面子`);

    const nextIndex = payload.levelIndex + 1;
    this.save.levelIndex = Math.min(nextIndex, LEVELS.length - 1);
    saveGame(this.save);

    if (payload.method === 'debate') {
      this.showDialogue(boss.win, () => {
        if (level.index === 3) {
          this.showDialogue(ENDING_FACE_TO_FACE, () => this.showEndingCard('face-to-face'));
        } else {
          this.showCheckpoint(nextIndex, true);
        }
      });
    } else {
      this.showDialogue(level.complete, () => {
        if (level.index === 3) {
          this.showDialogue(ENDING_SILENT, () => this.showEndingCard('silent'));
        } else {
          this.showCheckpoint(nextIndex, false);
        }
      });
    }
  }

  private handleLevelFailed(payload: { levelIndex: number }): void {
    const level = getLevel(payload.levelIndex);
    const boss = getBoss(level.bossId);
    this.inputOff();
    this.updateTouchControls();
    this.hidePrompt();
    this.showDialogue(boss.lose, () => {
      const lost = Math.max(0, Math.round(this.save.face * 0.2));
      this.save.face = Math.max(0, this.save.face - lost);
      saveGame(this.save);
      this.updateFace();
      this.gameScreen.classList.add('no-topbar');
      this.phaserGame?.scene.stop('StealthScene');
      this.currentScene = null;
      this.showGameModal(
        `<div class="modal-card defeat-card">
          <div class="modal-kicker">CAUGHT / 教导主任</div>
          <h2>你被拎回了座位</h2>
          <p class="modal-sub">${lost > 0 ? `走廊里那双皮鞋不是装饰。你损失了 <b>${lost}</b> 点面子，但错题本还在。` : '面子还没赚到，但错题本还在。下一次别让他走到门口。'}</p>
          <div class="defeat-stamp">检讨 ×1</div>
          <div class="modal-actions">
            <button class="comic-button primary" id="btn-retry" type="button">再试一次</button>
            <button class="comic-button" id="btn-defeat-title" type="button">回到校园网</button>
          </div>
        </div>`,
        { close: false, dismissible: false, onMount: () => {
          document.getElementById('btn-retry')?.addEventListener('click', () => {
            this.hideGameModal();
            this.levelCompleting = false;
            this.startLevel(this.currentLevelIndex, { retry: true });
          });
          document.getElementById('btn-defeat-title')?.addEventListener('click', () => this.returnToLanding());
        } },
      );
    });
  }

  // ---------------------------------------------------------------------
  // checkpoint / deck / notebook
  // ---------------------------------------------------------------------

  private showCheckpoint(nextIndex: number, bossWin: boolean): void {
    const scene = this.phaserGame?.scene.getScene('StealthScene');
    if (scene?.scene.isActive() && !scene.scene.isPaused()) scene.scene.pause();
    this.levelCompleting = false;
    this.currentLevelIndex = nextIndex;
    const level = getLevel(nextIndex);
    this.updateArea(level);
    const rows = (Object.keys(STAT_META) as StatKey[])
      .map((key) => {
        const meta = STAT_META[key];
        const value = this.save.stats[key];
        const cost = upgradeCost(value);
        const disabled = !canUpgrade(this.save, key) ? 'disabled' : '';
        const maxed = value >= 4;
        return `<div class="stat-row">
          <div class="stat-name">${meta.label}</div>
          <div><div class="stat-desc">${meta.desc}</div><div class="stat-level">Lv.${value} / 4</div></div>
          <button class="upgrade-button" data-upgrade="${key}" ${disabled} type="button">${maxed ? '已满' : `${cost} 面子`}</button>
        </div>`;
      })
      .join('');
    const deckButton = this.save.deckUnlocked
      ? '<button class="comic-button" id="btn-checkpoint-deck" type="button">调整牌组</button>'
      : '';
    this.showGameModal(
      `<div class="modal-card desk-card">
        <div class="desk-head">
          <div>
            <div class="modal-kicker">YOUR DESK / 课桌</div>
            <h2>${bossWin ? '这一关，过关了。' : '回到座位，喘口气。'}</h2>
            <p class="modal-sub">${bossWin ? '打赢了嘴炮，也拿到了继续往前走的资格。' : '没有人看见你。至少现在没有。'}</p>
          </div>
          <div class="desk-time">${level.kicker}</div>
        </div>
        <div class="stats-grid">${rows}</div>
        <div class="desk-footer">
          <div class="desk-footnote">用“面子”升级。体力=耐力，速度=移动，潜行=警觉与脚步，口才=牌面伤害。<br>下一站：${level.name} · ${level.objective.label}</div>
          <div class="modal-actions">
            ${deckButton}
            <button class="comic-button" id="btn-checkpoint-notebook" type="button">错题本</button>
            <button class="comic-button primary" id="btn-checkpoint-continue" type="button">继续晚自习</button>
          </div>
        </div>
      </div>`,
      { close: false, dismissible: false, onMount: () => {
        this.gameModal.querySelectorAll<HTMLButtonElement>('[data-upgrade]').forEach((button) => {
          button.addEventListener('click', () => {
            const key = button.dataset.upgrade as StatKey;
            if (upgradeStat(this.save, key)) {
              audio.pickup();
              this.updateFace();
              this.showCheckpoint(nextIndex, bossWin);
            }
          });
        });
        document.getElementById('btn-checkpoint-deck')?.addEventListener('click', () => {
          this.showDeckEditor(() => this.showCheckpoint(nextIndex, bossWin));
        });
        document.getElementById('btn-checkpoint-notebook')?.addEventListener('click', () => {
          this.showNotebook(() => this.showCheckpoint(nextIndex, bossWin));
        });
        document.getElementById('btn-checkpoint-continue')?.addEventListener('click', () => {
          this.deckAdjustAvailable = false;
          this.hideGameModal();
          this.startLevel(nextIndex, { intro: false });
        });
      } },
    );
  }

  private showDeckEditor(onDone: () => void): void {
    let selected = new Set(this.save.deck);
    const render = () => {
      const counts: Record<CardType, number> = { logic: 0, emotion: 0, fact: 0 };
      selected.forEach((id) => {
        counts[getCard(id).type] += 1;
      });
      const valid = selected.size === 6 && counts.logic > 0 && counts.emotion > 0 && counts.fact > 0;
      const cards = CARDS.map((card) => {
        const selectedClass = selected.has(card.id) ? 'selected' : '';
        return `<button class="deck-card ${selectedClass}" data-card-id="${card.id}" type="button">
          <span class="mini-type">${CARD_TYPES[card.type].label} · ${card.role === 'damage' ? '输出' : card.role === 'reveal' ? '情报' : '拖延'} · 话题「${card.topic}」</span>
          <h4>${escapeHtml(card.name)}</h4>
          <p>${escapeHtml(card.desc)}</p>
          <span class="deck-dmg">${card.base} 伤害</span>
        </button>`;
      }).join('');
      const warning = selected.size !== 6
        ? `还需要选择 ${6 - selected.size} 张牌。`
        : counts.logic === 0 || counts.emotion === 0 || counts.fact === 0
          ? '三种类型至少各一张。'
          : '可以出发。';
      this.showGameModal(
        `<div class="modal-card">
          <div class="modal-kicker">DECK / 牌组</div>
          <h2>把嘴里的牌，重新排一遍。</h2>
          <p class="modal-sub">只能在击败 Boss 后调整。从 24 张牌里选 6 张；三种类型至少各一张。卡牌话题与 Boss 当前话题一致时，伤害 +6。</p>
          <div class="deck-layout">
            <div class="deck-grid">${cards}</div>
            <aside class="deck-side">
              <div class="deck-count">${selected.size} / 6</div>
              <p>道理 ${counts.logic} · 感情 ${counts.emotion} · 事实 ${counts.fact}</p>
              <div class="deck-warning">${warning}</div>
              <button class="comic-button primary" id="btn-deck-save" type="button" ${valid ? '' : 'disabled'}>用这套牌</button>
              <button class="comic-button" id="btn-deck-back" type="button">返回课桌</button>
            </aside>
          </div>
        </div>`,
        { close: false, dismissible: false, onMount: () => {
          this.gameModal.querySelectorAll<HTMLButtonElement>('.deck-card').forEach((button) => {
            button.addEventListener('click', () => {
              const id = button.dataset.cardId;
              if (!id) return;
              if (selected.has(id)) selected.delete(id);
              else if (selected.size < 6) selected.add(id);
              else this.toast('最多只能带 6 张。');
              audio.click();
              render();
            });
          });
          document.getElementById('btn-deck-save')?.addEventListener('click', () => {
            if (selected.size !== 6) return;
            this.save.deck = [...selected];
            saveGame(this.save);
            audio.pickup();
            this.hideGameModal();
            onDone();
          });
          document.getElementById('btn-deck-back')?.addEventListener('click', () => {
            this.hideGameModal();
            onDone();
          });
        } },
      );
    };
    render();
  }

  private showNotebook(onClose?: () => void): void {
    const rows: string[] = [];
    const allBosses = new Set([...this.seenBosses, 'wangxin', 'daoxiaowang', 'youxiaotang', 'shiyi']);
    allBosses.forEach((bossId) => {
      const boss = getBoss(bossId);
      const known = boss.lines.filter((line) => this.save.notebook[line.id]);
      if (!known.length) return;
      rows.push(`<div class="notebook-boss"><b>${boss.name}</b><span>${boss.title}</span></div>`);
      known.forEach((line) => {
        rows.push(`<div class="notebook-line"><span>${escapeHtml(line.text)}<small class="notebook-topic">话题 · ${line.topic ?? '规矩'}</small></span><b>${CARD_TYPES[line.type].short}</b></div>`);
      });
    });
    const html = `<div class="modal-card">
      <div class="modal-kicker">KANNO'S NOTEBOOK</div>
      <h2>错题本</h2>
      <p class="modal-sub">${this.save.cycleKnown ? '你摸清了规律：讲道理克谈感情，谈感情克摆事实，摆事实克讲道理。' : '还没完全摸清。打几张牌，看看对方吃哪一套。'}</p>
      <div class="notebook-lines">${rows.length ? rows.join('') : '<div class="notebook-empty">还没有记录。第一次被打被抓，不丢人。</div>'}</div>
      <div class="modal-actions"><button class="comic-button primary" id="btn-notebook-back" type="button">合上本子</button></div>
    </div>`;
    this.showGameModal(html, { close: true, dismissible: true, onClose, onMount: () => {
      document.getElementById('btn-notebook-back')?.addEventListener('click', () => {
        this.hideGameModal();
        onClose?.();
      });
    } });
  }

  // ---------------------------------------------------------------------
  // ending
  // ---------------------------------------------------------------------

  private showEndingCard(ending: 'silent' | 'face-to-face'): void {
    this.levelCompleting = false;
    this.gameScreen.classList.remove('debate-active');
    this.gameScreen.classList.add('no-topbar');
    this.phaserGame?.scene.stop('StealthScene');
    this.currentScene = null;
    addEnding(this.save, ending);
    saveGame(this.save);
    this.updateFace();
    this.updateTouchControls();
    audio.stopMusic();
    audio.ending();
    const text = ENDING_TEXT[ending];
    this.showGameModal(
      `<div class="ending-card">
        <div class="ending-kicker">${text.kicker}</div>
        <h1 class="ending-title">${text.title}</h1>
        <p class="ending-text">${text.subtitle}<br><br>${text.body}</p>
        <div class="ending-rule"></div>
        <div class="ending-stats">
          <div><b>${this.save.bossWins}</b>Boss 胜利</div>
          <div><b>${this.save.stealthClears}</b>无声通关</div>
          <div><b>${this.save.caughtCount}</b>次被抓</div>
          <div><b>${this.save.endings.length} / 2</b>结局收集</div>
        </div>
        <div class="modal-actions" style="justify-content:center">
          <button class="comic-button primary" id="btn-ending-again" type="button">再走一次</button>
          <button class="comic-button" id="btn-ending-home" type="button">回到校园网</button>
        </div>
      </div>`,
      { close: false, dismissible: false, onMount: () => {
        document.getElementById('btn-ending-again')?.addEventListener('click', () => {
          this.hideGameModal();
          this.beginNewGame();
        });
        document.getElementById('btn-ending-home')?.addEventListener('click', () => {
          this.hideGameModal();
          this.returnToLanding();
        });
      } },
    );
  }

  // ---------------------------------------------------------------------
  // pause / settings / controls / archive
  // ---------------------------------------------------------------------

  private openSkillGuide(): void {
    if (!this.currentScene || this.modalOpen || this.dialogueActive || this.debate) {
      showSkillGuide();
      return;
    }
    this.currentScene.pauseGameplay();
    this.inputOff();
    this.updateTouchControls();
    showSkillGuide(() => {
      if (this.debate || this.pauseOpen || !this.currentScene) return;
      this.currentScene.resumeGameplay();
      input.setEnabled(true);
      this.updateTouchControls();
    });
  }

  private openPause(): void {
    if (!this.currentScene || this.modalOpen || this.dialogueActive || this.debate) return;
    this.pauseOpen = true;
    this.currentScene.pauseGameplay();
    this.inputOff();
    this.updateTouchControls();
    this.showGameModal(
      `<div class="modal-card pause-card">
        <div class="modal-kicker">PAUSE / 晚自习暂停</div>
        <h2>先停一下。</h2>
        <p class="modal-sub">走廊里没有脚步声。至少现在没有。</p>
        <div class="modal-actions">
          <button class="comic-button primary" id="btn-pause-resume" type="button">继续潜行</button>
          <button class="comic-button" id="btn-pause-skill" type="button">战斗手册</button>
          <button class="comic-button" id="btn-pause-controls" type="button">操作说明</button>
          <button class="comic-button" id="btn-pause-settings" type="button">设置</button>
          <button class="comic-button" id="btn-pause-title" type="button">回到校园网</button>
        </div>
      </div>`,
      { close: false, dismissible: false, onMount: () => {
        document.getElementById('btn-pause-resume')?.addEventListener('click', () => this.resumeFromPause());
        document.getElementById('btn-pause-skill')?.addEventListener('click', () => {
          showSkillGuide();
        });
        document.getElementById('btn-pause-controls')?.addEventListener('click', () => {
          this.showGameModal(this.controlsHtml(), { close: true, dismissible: true, onClose: () => this.openPause() });
        });
        document.getElementById('btn-pause-settings')?.addEventListener('click', () => {
          this.showSettings(() => this.openPause());
        });
        document.getElementById('btn-pause-title')?.addEventListener('click', () => {
          this.pauseOpen = false;
          this.hideGameModal();
          this.returnToLanding();
        });
      } },
    );
  }

  private resumeFromPause(): void {
    this.pauseOpen = false;
    this.hideGameModal();
    this.currentScene?.resumeGameplay();
    const sceneActive = this.currentScene !== null;
    input.setEnabled(sceneActive);
    this.updateTouchControls();
  }

  private showSettings(onClose?: () => void): void {
    const s = this.settings;
    this.showGameModal(
      `<div class="modal-card settings-card">
        <div class="modal-kicker">SETTINGS / 设置</div>
        <h2>把声音和按键调好。</h2>
        <div class="settings-grid">
          <label class="setting-row"><span>音量</span><input id="setting-volume" type="range" min="0" max="100" value="${Math.round(s.volume * 100)}"><b id="setting-volume-label">${Math.round(s.volume * 100)}</b></label>
          <label class="setting-row"><span>静音</span><input id="setting-muted" type="checkbox" ${s.muted ? 'checked' : ''}></label>
          <label class="setting-row"><span>显示触屏按键</span><input id="setting-touch" type="checkbox" ${s.showTouchControls ? 'checked' : ''}></label>
          <label class="setting-row"><span>按键大小</span><input id="setting-scale" type="range" min="80" max="125" value="${Math.round(s.buttonScale * 100)}"><b id="setting-scale-label">${Math.round(s.buttonScale * 100)}%</b></label>
          <label class="setting-row"><span>减少动态效果</span><input id="setting-reduce" type="checkbox" ${s.reduceMotion ? 'checked' : ''}></label>
        </div>
        <div class="modal-actions">
          <button class="comic-button" id="btn-settings-fullscreen" type="button">全屏</button>
          <button class="comic-button primary" id="btn-settings-save" type="button">保存</button>
        </div>
      </div>`,
      { close: true, dismissible: true, onClose, onMount: () => {
        const volume = document.getElementById('setting-volume') as HTMLInputElement;
        const volumeLabel = document.getElementById('setting-volume-label');
        volume?.addEventListener('input', () => {
          if (volumeLabel) volumeLabel.textContent = volume.value;
        });
        const scale = document.getElementById('setting-scale') as HTMLInputElement;
        const scaleLabel = document.getElementById('setting-scale-label');
        scale?.addEventListener('input', () => {
          if (scaleLabel) scaleLabel.textContent = `${scale.value}%`;
        });
        document.getElementById('btn-settings-fullscreen')?.addEventListener('click', () => {
          if (!document.fullscreenElement) void document.documentElement.requestFullscreen?.().catch(() => this.toast('这个浏览器不支持全屏。'));
          else void document.exitFullscreen?.();
        });
        document.getElementById('btn-settings-save')?.addEventListener('click', () => {
          this.settings.volume = Number(volume.value) / 100;
          this.settings.muted = (document.getElementById('setting-muted') as HTMLInputElement).checked;
          this.settings.showTouchControls = (document.getElementById('setting-touch') as HTMLInputElement).checked;
          this.settings.buttonScale = Number(scale.value) / 100;
          this.settings.reduceMotion = (document.getElementById('setting-reduce') as HTMLInputElement).checked;
          saveSettings(this.settings);
          audio.setSettings(this.settings);
          input.applySettings(this.settings);
          this.applyReducedMotion();
          this.updateSoundButton();
          this.hideGameModal();
          this.updateTouchControls();
          onClose?.();
        });
      } },
    );
  }

  private controlsHtml(): string {
    return `<div class="modal-card">
      <div class="modal-kicker">CONTROLS / 操作说明</div>
      <h2>电脑与手机都能玩。</h2>
      <p class="modal-sub">潜行时别跑太快。跑动会发出声音，声音会把 Boss 引过来。</p>
      <div class="modal-grid">
        <div class="info-block">
          <h3>电脑</h3>
          <div class="key-list">
            <div><span>移动</span><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / 方向键</span></div>
            <div><span>蹲伏</span><kbd>Ctrl</kbd> / <kbd>C</kbd></div>
            <div><span>冲刺</span><kbd>Shift</kbd></div>
            <div><span>闪避</span><kbd>Space</kbd></div>
            <div><span>互动 / 藏</span><kbd>E</kbd></div>
            <div><span>扔橡皮</span><kbd>F</kbd></div>
            <div><span>嘴炮选牌</span><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd></div>
            <div><span>暂停</span><kbd>Esc</kbd></div>
          </div>
        </div>
        <div class="info-block">
          <h3>手机</h3>
          <ul>
            <li>左侧虚拟摇杆移动，右侧点按动作键。</li>
            <li>蹲伏是开关；冲刺要按住；闪避是短距离突进。</li>
            <li>被 Boss 看到或听到声音，都会累积上方警觉条。</li>
            <li>嘴炮战直接点卡牌，或按 1 / 2 / 3。</li>
            <li>暂停菜单里可以调整触屏按键的位置和大小。</li>
            <li>横屏体验最好。</li>
          </ul>
        </div>
        <div class="info-block">
          <h3>潜行规则</h3>
          <p>被看到、跑动、扔东西都会让 Boss 警觉。躲进课桌、隔间、书架后面可以断开视线。警觉条满，进入嘴炮战；被发现就必须打到赢或者被抓。</p>
        </div>
        <div class="info-block">
          <h3>嘴炮规则</h3>
          <p>讲道理克谈感情，谈感情克摆事实，摆事实克讲道理。克制 ×1.5，同类型 ×1，被克 ×0.5。清空坚定值就赢，教导主任的脚步走完就输。</p>
        </div>
      </div>
      <div class="modal-actions"><button class="comic-button primary" id="btn-controls-close" type="button">知道了</button></div>
    </div>`;
  }

  private showArchive(): void {
    const cast = ARCHIVE_ROWS.map(
      (row) => `<div class="archive-row"><div><b>${row.name}</b><span>${row.role}</span></div><p>${row.note}</p></div>`,
    ).join('');
    const endings = ['silent', 'face-to-face']
      .map((id) => {
        const unlocked = this.save.endings.includes(id);
        return `<div class="archive-ending ${unlocked ? 'unlocked' : ''}"><span>${unlocked ? '已解锁' : '未解锁'}</span><b>${endingLabel(id)}</b></div>`;
      })
      .join('');
    this.showLandingModal(
      `<div class="modal-card archive-card">
        <div class="modal-kicker">ARCHIVE / 制作档案</div>
        <h2>《还我小说！》</h2>
        <p class="modal-sub">一个发生在晚自习的 2D 校园潜行 + 回合制嘴炮卡牌游戏。4 个场景，4 个 Boss，两种结局。</p>
        <div class="archive-cast">${cast}</div>
        <div class="archive-endings">${endings}</div>
        <div class="info-block"><h3>制作与技术</h3><p>纯 2D 手绘 SVG 美术 · Phaser 3 + Vite + TypeScript · 无运行时 AI · 所有台词预写 · 无付费素材 · GitHub Pages 部署。</p></div>
        <div class="modal-actions"><button class="comic-button primary" id="btn-archive-close" type="button">合上档案</button></div>
      </div>`,
      true,
    );
  }

  private showNewGameConfirm(): void {
    this.showLandingModal(
      `<div class="modal-card">
        <div class="modal-kicker">NEW RUN / 重新开始</div>
        <h2>要重新走一次吗？</h2>
        <p class="modal-sub">当前进度会丢失。已经解锁的结局会保留。</p>
        <div class="modal-actions">
          <button class="comic-button" id="btn-newgame-cancel" type="button">继续上回</button>
          <button class="comic-button primary" id="btn-newgame-confirm" type="button">重新开始</button>
        </div>
      </div>`,
      true,
    );
    document.getElementById('btn-newgame-cancel')?.addEventListener('click', () => {
      this.closeLandingModal();
      this.continueGame();
    });
    document.getElementById('btn-newgame-confirm')?.addEventListener('click', () => {
      this.closeLandingModal();
      this.beginNewGame();
    });
  }

  private showResetConfirm(): void {
    this.showLandingModal(
      `<div class="modal-card">
        <div class="modal-kicker">RESET / 清除存档</div>
        <h2>连错题本也一起扔掉？</h2>
        <p class="modal-sub">进度、面子、牌组、错题本、结局解锁都会清空。</p>
        <div class="modal-actions">
          <button class="comic-button" id="btn-reset-cancel" type="button">算了</button>
          <button class="comic-button primary" id="btn-reset-confirm" type="button">全部清空</button>
        </div>
      </div>`,
      true,
    );
    document.getElementById('btn-reset-cancel')?.addEventListener('click', () => this.closeLandingModal());
    document.getElementById('btn-reset-confirm')?.addEventListener('click', () => {
      clearSave();
      this.save = loadSave();
      this.settings = loadSettings();
      this.closeLandingModal();
      this.updateLanding();
      this.toastOnLanding('存档已清空。晚自习重新开始。');
    });
  }

  private toastOnLanding(text: string): void {
    this.showLandingModal(`<div class="modal-card"><h2>${escapeHtml(text)}</h2><div class="modal-actions"><button class="comic-button primary" id="btn-toast-close" type="button">好</button></div></div>`, true);
    document.getElementById('btn-toast-close')?.addEventListener('click', () => this.closeLandingModal());
  }

  private showLandingModal(html: string, closeable: boolean): void {
    this.landingOverlay.classList.remove('hidden');
    this.landingOverlay.innerHTML = html;
    this.landingOverlay.querySelectorAll<HTMLButtonElement>('.modal-close').forEach((button) => {
      button.addEventListener('click', () => this.closeLandingModal());
    });
    if (!closeable) {
      this.landingOverlay.querySelectorAll<HTMLButtonElement>('.modal-close').forEach((button) => button.remove());
    }
    this.landingOverlay.querySelector('#btn-controls-close')?.addEventListener('click', () => this.closeLandingModal());
    this.landingOverlay.querySelector('#btn-archive-close')?.addEventListener('click', () => this.closeLandingModal());
    this.landingOverlay.querySelectorAll<HTMLButtonElement>('[data-close]').forEach((button) => {
      button.addEventListener('click', () => this.closeLandingModal());
    });
  }

  private closeLandingModal(): void {
    this.landingOverlay.classList.add('hidden');
    this.landingOverlay.innerHTML = '';
  }

  private showGameModal(
    html: string,
    options: { close?: boolean; dismissible?: boolean; onClose?: () => void; onMount?: () => void } = {},
  ): void {
    this.modalOpen = true;
    this.inputOff();
    this.updateTouchControls();
    this.gameModal.dataset.dismissible = options.dismissible ? 'true' : 'false';
    this.gameModal.classList.remove('hidden');
    this.gameModal.innerHTML = html;
    if (options.close !== false) {
      const close = document.createElement('button');
      close.className = 'modal-close';
      close.type = 'button';
      close.setAttribute('aria-label', '关闭');
      close.textContent = '×';
      close.addEventListener('click', () => {
        this.hideGameModal();
        options.onClose?.();
      });
      this.gameModal.querySelector('.modal-card')?.appendChild(close);
    }
    this.gameModal.querySelector('#btn-controls-close')?.addEventListener('click', () => {
      this.hideGameModal();
      options.onClose?.();
    });
    options.onMount?.();
  }

  private hideGameModal(): void {
    this.gameModal.classList.add('hidden');
    this.gameModal.innerHTML = '';
    this.gameModal.dataset.dismissible = 'false';
    this.modalOpen = false;
    this.loadingVisible = false;
    this.updateTouchControls();
  }

  private closeGameModal(): void {
    this.hideGameModal();
  }

  private returnToLanding(): void {
    this.hideGameModal();
    this.hideDialogueImmediate();
    this.debate?.destroy();
    this.debate = null;
    this.gameScreen.classList.remove('debate-active');
    this.debateLayer.classList.add('hidden');
    this.phaserGame?.scene.stop('StealthScene');
    this.currentScene = null;
    this.inputOff();
    audio.stopMusic();
    this.pauseOpen = false;
    this.levelCompleting = false;
    this.gameScreen.classList.remove('no-topbar');
    this.updateTouchControls();
    this.showLandingScreen();
  }

  // ---------------------------------------------------------------------
  // debug
  // ---------------------------------------------------------------------

  debugTriggerDebate(): void {
    this.currentScene?.debugTriggerDebate();
  }

  debugTeleport(x: number, y: number): void {
    this.currentScene?.debugTeleport(x, y);
  }

  getDebugState(): {
    save: SaveData;
    levelIndex: number;
    sceneActive: boolean;
    debate: boolean;
    dialogue: boolean;
    scene: Record<string, unknown> | null;
  } {
    return {
      save: this.save,
      levelIndex: this.currentLevelIndex,
      sceneActive: Boolean(this.currentScene),
      debate: Boolean(this.debate),
      dialogue: this.dialogueActive,
      scene: this.currentScene?.getDebugInfo?.() ?? null,
    };
  }
}
