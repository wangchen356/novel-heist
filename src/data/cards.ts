import type { CardDef, CardType } from '../types';

export const CARD_TYPES: Record<
  CardType,
  { label: string; short: string; color: string; paper: string; beats: CardType; losesTo: CardType; blurb: string }
> = {
  logic: {
    label: '讲道理',
    short: '道理',
    color: '#486b91',
    paper: '#e4edf5',
    beats: 'emotion',
    losesTo: 'fact',
    blurb: '冷静拆解，专治情绪输出。',
  },
  emotion: {
    label: '谈感情',
    short: '感情',
    color: '#c84938',
    paper: '#f7e3dd',
    beats: 'fact',
    losesTo: 'logic',
    blurb: '先接住情绪，再讲别的。',
  },
  fact: {
    label: '摆事实',
    short: '事实',
    color: '#2e5547',
    paper: '#e4eee7',
    beats: 'logic',
    losesTo: 'emotion',
    blurb: '事实胜于雄辩，但不一定胜于共情。',
  },
};

export const CARDS: CardDef[] = [
  {
    id: 'logic_damage',
    type: 'logic',
    role: 'damage',
    name: '讲道理',
    line: '你这话，逻辑上站不住。',
    desc: '稳定的正面输出。',
    base: 13,
  },
  {
    id: 'logic_reveal',
    type: 'logic',
    role: 'reveal',
    name: '反问',
    line: '那你先回答我一个问题。',
    desc: '伤害偏低，但能看穿对方下一句的类型。',
    base: 8,
  },
  {
    id: 'logic_delay',
    type: 'logic',
    role: 'delay',
    name: '先别急',
    line: '你先让我把话说完。',
    desc: '伤害不高，但能多拖教导主任一步。',
    base: 9,
  },
  {
    id: 'emotion_damage',
    type: 'emotion',
    role: 'damage',
    name: '谈感情',
    line: '我知道你是为我好。',
    desc: '正面接住对方的情绪。',
    base: 12,
  },
  {
    id: 'emotion_reveal',
    type: 'emotion',
    role: 'reveal',
    name: '试探',
    line: '你是不是也有过这种时候？',
    desc: '伤害偏低，但能看穿对方下一句的类型。',
    base: 7,
  },
  {
    id: 'emotion_delay',
    type: 'emotion',
    role: 'delay',
    name: '卖惨',
    line: '我今天真的已经很惨了。',
    desc: '伤害不高，但能多拖教导主任一步。',
    base: 8,
  },
  {
    id: 'fact_damage',
    type: 'fact',
    role: 'damage',
    name: '摆事实',
    line: '这本小说不是我的。',
    desc: '高伤害的正面举证。',
    base: 14,
  },
  {
    id: 'fact_reveal',
    type: 'fact',
    role: 'reveal',
    name: '翻笔记',
    line: '你上次说的可不是这样。',
    desc: '伤害偏低，但能看穿对方下一句的类型。',
    base: 7,
  },
  {
    id: 'fact_delay',
    type: 'fact',
    role: 'delay',
    name: '举个例子',
    line: '我给你讲个具体的事。',
    desc: '伤害不高，但能多拖教导主任一步。',
    base: 9,
  },
];

export const CARD_MAP = new Map(CARDS.map((card) => [card.id, card]));

export const DEFAULT_DECK = [
  'logic_damage',
  'logic_reveal',
  'emotion_damage',
  'emotion_reveal',
  'fact_damage',
  'fact_reveal',
];

export function getCard(id: string): CardDef {
  const card = CARD_MAP.get(id);
  if (!card) throw new Error(`Unknown card ${id}`);
  return card;
}

export function counterMultiplier(playerType: CardType, bossType: CardType): 1.5 | 1 | 0.5 {
  if (CARD_TYPES[playerType].beats === bossType) return 1.5;
  if (playerType === bossType) return 1;
  return 0.5;
}

export function relationLabel(playerType: CardType, bossType: CardType): '克制' | '普通' | '被克' {
  if (CARD_TYPES[playerType].beats === bossType) return '克制';
  if (playerType === bossType) return '普通';
  return '被克';
}

export function oratoryScale(level: number): number {
  return 1 + Math.max(0, level - 1) * 0.12;
}

export function cardDamage(card: CardDef, oratoryLevel: number, comboBonus = 0): number {
  return Math.round(card.base * oratoryScale(oratoryLevel) + comboBonus);
}
