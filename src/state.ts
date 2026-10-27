import { DEFAULT_DECK } from './data/cards';
import type { SaveData, Settings, StatKey, TouchLayout } from './types';

const SAVE_KEY = 'give-me-back-my-novel.save.v1';
const SETTINGS_KEY = 'give-me-back-my-novel.settings.v1';
const LAYOUT_KEY = 'give-me-back-my-novel.touch-layout.v1';
const SAVE_VERSION = 1;

export const STAT_META: Record<
  StatKey,
  { label: string; desc: string; effect: string }
> = {
  stamina: {
    label: '体力',
    desc: '冲刺和屏息的耐力。耗尽后会喘气，更容易被听见。',
    effect: '体力上限',
  },
  speed: {
    label: '速度',
    desc: '走得快一点，蹲得也快一点。',
    effect: '移动速度',
  },
  stealth: {
    label: '潜行',
    desc: '脚步更轻，警觉条涨得更慢。',
    effect: '隐蔽性',
  },
  oratory: {
    label: '口才',
    desc: '嘴炮牌的基础伤害更高。',
    effect: '卡牌伤害',
  },
};

export function makeNewSave(): SaveData {
  return {
    version: SAVE_VERSION,
    started: false,
    completed: false,
    levelIndex: 0,
    face: 0,
    stats: { stamina: 1, speed: 1, stealth: 1, oratory: 1 },
    deck: [...DEFAULT_DECK],
    combatOccurred: false,
    deckUnlocked: false,
    notebook: {},
    cycleKnown: false,
    endings: [],
    caughtCount: 0,
    stealthClears: 0,
    bossWins: 0,
    startedAt: 0,
    updatedAt: 0,
  };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return makeNewSave();
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    if (!parsed || parsed.version !== SAVE_VERSION) return makeNewSave();
    const base = makeNewSave();
    return {
      ...base,
      ...parsed,
      stats: { ...base.stats, ...(parsed.stats ?? {}) },
      deck: Array.isArray(parsed.deck) && parsed.deck.length === 6 ? parsed.deck : [...DEFAULT_DECK],
      notebook: { ...(parsed.notebook ?? {}) },
      endings: Array.isArray(parsed.endings) ? parsed.endings : [],
    };
  } catch {
    return makeNewSave();
  }
}

export function saveGame(data: SaveData): void {
  try {
    data.version = SAVE_VERSION;
    data.updatedAt = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // The game is still playable if storage is unavailable.
  }
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}

export function hasSave(): boolean {
  const data = loadSave();
  return data.started && !data.completed;
}

export function defaultSettings(): Settings {
  const coarse = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
  return {
    volume: 0.65,
    muted: false,
    showTouchControls: Boolean(coarse),
    buttonScale: 1,
    reduceMotion: false,
  };
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings();
    return { ...defaultSettings(), ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* noop */
  }
}

export function loadTouchLayout(): Record<string, TouchLayout> {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, TouchLayout>;
  } catch {
    return {};
  }
}

export function saveTouchLayout(layout: Record<string, TouchLayout>): void {
  try {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
  } catch {
    /* noop */
  }
}

export function clearTouchLayout(): void {
  localStorage.removeItem(LAYOUT_KEY);
}

export function staminaMax(stats: SaveData['stats']): number {
  return 100 + (stats.stamina - 1) * 18;
}

export function speedScale(stats: SaveData['stats']): number {
  return 1 + (stats.speed - 1) * 0.08;
}

export function stealthScale(stats: SaveData['stats']): number {
  return 1 - (stats.stealth - 1) * 0.08;
}

export function upgradeCost(level: number): number {
  return 25 + (level - 1) * 20;
}

export function canUpgrade(data: SaveData, key: StatKey): boolean {
  return data.stats[key] < 5 && data.face >= upgradeCost(data.stats[key]);
}

export function upgradeStat(data: SaveData, key: StatKey): boolean {
  const cost = upgradeCost(data.stats[key]);
  if (data.stats[key] >= 5 || data.face < cost) return false;
  data.face -= cost;
  data.stats[key] += 1;
  saveGame(data);
  return true;
}

export function addEnding(data: SaveData, ending: 'silent' | 'face-to-face'): void {
  if (!data.endings.includes(ending)) data.endings.push(ending);
  data.completed = true;
  data.started = false;
  data.currentRunEnding = ending;
  saveGame(data);
}

export function resetRun(data: SaveData): void {
  data.started = true;
  data.completed = false;
  data.levelIndex = 0;
  data.face = 0;
  data.stats = { stamina: 1, speed: 1, stealth: 1, oratory: 1 };
  data.deck = [...DEFAULT_DECK];
  data.combatOccurred = false;
  data.deckUnlocked = false;
  data.notebook = {};
  data.cycleKnown = false;
  data.caughtCount = 0;
  data.stealthClears = 0;
  data.bossWins = 0;
  data.startedAt = Date.now();
  data.currentRunEnding = undefined;
}

export function endingLabel(id: string): string {
  if (id === 'silent') return '结局一 · 无声归还';
  if (id === 'face-to-face') return '结局二 · 当面归还';
  return id;
}
