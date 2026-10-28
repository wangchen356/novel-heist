export type CardType = 'logic' | 'emotion' | 'fact';
export type CardRole = 'damage' | 'reveal' | 'delay';
export type DebateTopic =
  | '规矩'
  | '逻辑'
  | '时间'
  | '关系'
  | '情绪'
  | '同情'
  | '证据'
  | '细节'
  | '责任'
  | '双标'
  | '面子'
  | '人证';
export type StatKey = 'stamina' | 'speed' | 'stealth' | 'oratory';
export type BossId = 'wangxin' | 'daoxiaowang' | 'youxiaotang' | 'shiyi';
export type EndingId = 'silent' | 'face-to-face';

export interface CardDef {
  id: string;
  type: CardType;
  role: CardRole;
  name: string;
  line: string;
  desc: string;
  base: number;
  topic: DebateTopic;
}

export interface Stats {
  stamina: number;
  speed: number;
  stealth: number;
  oratory: number;
}

export interface BossLine {
  id: string;
  text: string;
  type: CardType;
  topic?: DebateTopic;
  phase: 1 | 2 | 3;
}

export type BossMechanic = 'heal' | 'summon' | 'double' | 'final';

export interface BossDef {
  id: BossId;
  name: string;
  title: string;
  shortTitle: string;
  portrait: string;
  sprite: string;
  accent: string;
  conviction: number;
  steps: number;
  mechanic: BossMechanic;
  final?: boolean;
  intro: SceneLine[];
  stealIntro: SceneLine[];
  win: SceneLine[];
  lose: SceneLine[];
  lines: BossLine[];
  idleLines?: string[];
}

export interface SceneLine {
  speaker: string;
  text: string;
  portrait?: string;
  style?: 'normal' | 'novel' | 'whisper' | 'shout';
  action?: 'ending-silent' | 'ending-faceto-face';
}

export interface PropDef {
  key: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  solid?: boolean;
  blocksVision?: boolean;
  alpha?: number;
}

export interface HideSpotDef {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  prompt: string;
}

export interface FacePickupDef {
  x: number;
  y: number;
  value: number;
}

export interface BossSpawn {
  x: number;
  y: number;
  patrol: Array<{ x: number; y: number; wait?: number }>;
  visionRange: number;
  visionAngle: number;
  hearingRange: number;
  speed: number;
}

export interface ObjectiveDef {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  prompt: string;
  texture: string;
}

export interface ExitDef {
  x: number;
  y: number;
  w: number;
  h: number;
  prompt: string;
  texture: string;
}

export interface RoomBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export type KeyColor = 'red' | 'white' | 'yellow';

export interface ColorKeyDef {
  id: string;
  x: number;
  y: number;
  color: KeyColor;
  correct?: boolean;
}

export interface KeySetup {
  mode: 'color' | 'stall' | 'teleport' | 'normal';
  note?: { x: number; y: number; text: string };
  colorKeys?: ColorKeyDef[];
  stallSpots?: Array<{ x: number; y: number }>;
  teleportSpots?: Array<{ x: number; y: number }>;
  teleportInterval?: number;
}

export interface LevelConfig {
  id: string;
  index: number;
  name: string;
  kicker: string;
  time: string;
  bossId: BossId;
  playerStart: { x: number; y: number };
  objective: ObjectiveDef;
  objectiveSpots?: Array<{ x: number; y: number }>;
  keySetup?: KeySetup;
  speedMultiplier?: number;
  exit: ExitDef;
  boss: BossSpawn;
  props: PropDef[];
  hideSpots: HideSpotDef[];
  facePickups: FacePickupDef[];
  lightPools: Array<{ x: number; y: number; scale?: number }>;
  wetZones?: Array<{ x: number; y: number; w: number; h: number }>;
  room: RoomBounds;
  zoom: number;
  intro: SceneLine[];
  complete: SceneLine[];
  objectiveAfter: string;
  finalStealthOnly?: boolean;
}

export interface Settings {
  volume: number;
  muted: boolean;
  showTouchControls: boolean;
  buttonScale: number;
  reduceMotion: boolean;
}

export interface TouchLayout {
  x: number;
  y: number;
}

export interface SaveData {
  version: number;
  started: boolean;
  completed: boolean;
  levelIndex: number;
  face: number;
  stats: Stats;
  deck: string[];
  combatOccurred: boolean;
  deckUnlocked: boolean;
  notebook: Record<string, CardType>;
  cycleKnown: boolean;
  endings: string[];
  caughtCount: number;
  stealthClears: number;
  bossWins: number;
  startedAt: number;
  updatedAt: number;
  currentRunEnding?: string;
}

export interface RunRewards {
  face: number;
  method: 'stealth' | 'debate';
  bossId?: BossId;
}

export interface HudState {
  area: string;
  time: string;
  objective: string;
  face: number;
  alert: number;
  stamina: number;
  maxStamina: number;
  hidden?: boolean;
}
