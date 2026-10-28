import type { CardDef, CardType, DebateTopic } from '../types';

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

export const TOPIC_HINTS: Record<DebateTopic, string> = {
  规矩: '班规、校规、点名册',
  逻辑: '前后矛盾、前提站不站得住',
  时间: '拖一步、晚自习还剩多久',
  关系: '你和对方、你和猴子',
  情绪: '害怕、委屈、心软',
  同情: '卖惨、共情、示弱',
  证据: '借阅卡、钥匙、监控',
  细节: '折角、门轴、书脊',
  责任: '谁弄坏的、谁该还',
  双标: '上次也这样、只许州官放火',
  面子: '给台阶、别当众拆穿',
  人证: '走廊上还有谁看见',
};

export const TOPIC_BONUS = 6;

export const CARDS: CardDef[] = [
  // 讲道理
  { id: 'logic_damage', type: 'logic', role: 'damage', name: '讲道理', line: '你这话，逻辑上站不住。', desc: '稳定输出，回应“规矩”。', base: 13, topic: '规矩' },
  { id: 'logic_reveal', type: 'logic', role: 'reveal', name: '反问', line: '那你先回答我一个问题。', desc: '看穿下一句；回应“逻辑”。', base: 8, topic: '逻辑' },
  { id: 'logic_delay', type: 'logic', role: 'delay', name: '先别急', line: '你先让我把话说完。', desc: '多拖一步；回应“时间”。', base: 9, topic: '时间' },
  { id: 'logic_oldscore', type: 'logic', role: 'damage', name: '翻旧账', line: '上次你也是这么说的。', desc: '抓住双标；回应“双标”。', base: 11, topic: '双标' },
  { id: 'logic_outline', type: 'logic', role: 'damage', name: '列提纲', line: '我先说三点。第一，你双标；第二，你心虚；第三，让我过去。', desc: '结构清晰的一击；回应“逻辑”。', base: 10, topic: '逻辑' },
  { id: 'logic_switch', type: 'logic', role: 'reveal', name: '偷换概念', line: '你这不叫讲道理，叫偷换概念。', desc: '看穿下一句；回应“责任”。', base: 8, topic: '责任' },
  { id: 'logic_syllogism', type: 'logic', role: 'damage', name: '三段论', line: '大前提：晚自习不能出教室；小前提：书在办公室；结论：我得去。', desc: '大前提、小前提、结论；回应“规矩”。', base: 12, topic: '规矩' },
  { id: 'logic_summary', type: 'logic', role: 'damage', name: '总结陈词', line: '所以，问题不在我，在流程。', desc: '高伤害收束；回应“责任”。', base: 15, topic: '责任' },

  // 谈感情
  { id: 'emotion_damage', type: 'emotion', role: 'damage', name: '谈感情', line: '我知道你是为我好。', desc: '正面接住情绪；回应“关系”。', base: 12, topic: '关系' },
  { id: 'emotion_reveal', type: 'emotion', role: 'reveal', name: '试探', line: '你是不是也有过这种时候？', desc: '看穿下一句；回应“情绪”。', base: 7, topic: '情绪' },
  { id: 'emotion_delay', type: 'emotion', role: 'delay', name: '卖惨', line: '我今天真的已经很惨了。', desc: '多拖一步；回应“同情”。', base: 8, topic: '同情' },
  { id: 'emotion_step', type: 'emotion', role: 'delay', name: '给台阶', line: '你先回去，我当没看见。', desc: '给对方面子；回应“面子”。', base: 7, topic: '面子' },
  { id: 'emotion_empathy', type: 'emotion', role: 'damage', name: '共情', line: '我知道你也不容易。', desc: '接住情绪；回应“情绪”。', base: 10, topic: '情绪' },
  { id: 'emotion_pretend', type: 'emotion', role: 'delay', name: '装可怜', line: '老师，我低血糖……', desc: '示弱拖一步；回应“同情”。', base: 6, topic: '同情' },
  { id: 'emotion_flatter', type: 'emotion', role: 'damage', name: '拍马屁', line: '十一老师，你今晚特别好看。', desc: '给面子；回应“面子”。', base: 9, topic: '面子' },
  { id: 'emotion_heart', type: 'emotion', role: 'damage', name: '掏心窝', line: '我说句实话，你别生气。', desc: '把关系摊开；回应“关系”。', base: 13, topic: '关系' },

  // 摆事实
  { id: 'fact_damage', type: 'fact', role: 'damage', name: '摆事实', line: '这本小说不是我的。', desc: '高伤害举证；回应“证据”。', base: 14, topic: '证据' },
  { id: 'fact_reveal', type: 'fact', role: 'reveal', name: '翻笔记', line: '你上次说的可不是这样。', desc: '看穿下一句；回应“细节”。', base: 7, topic: '细节' },
  { id: 'fact_delay', type: 'fact', role: 'delay', name: '举个例子', line: '我给你讲个具体的事。', desc: '多拖一步；回应“责任”。', base: 9, topic: '责任' },
  { id: 'fact_witness', type: 'fact', role: 'reveal', name: '找证人', line: '走廊上不止我一个人。', desc: '看穿下一句；回应“人证”。', base: 9, topic: '人证' },
  { id: 'fact_timeline', type: 'fact', role: 'damage', name: '对时间线', line: '19:47 我在教室，20:03 我在厕所，时间对得上。', desc: '用时间线压住场面；回应“细节”。', base: 11, topic: '细节' },
  { id: 'fact_evidence', type: 'fact', role: 'damage', name: '拿证据', line: '钥匙上有粉笔灰，讲台边上还有一截。', desc: '把证据拍在桌上；回应“证据”。', base: 13, topic: '证据' },
  { id: 'fact_rebuild', type: 'fact', role: 'delay', name: '现场还原', line: '我们还原一下：你坐第一排，我走后门，门轴响三下。', desc: '拖一步并还原现场；回应“人证”。', base: 10, topic: '人证' },
  { id: 'fact_reverse', type: 'fact', role: 'reveal', name: '反问事实', line: '你说你看见了，那你坐第几排？', desc: '看穿下一句；回应“逻辑”。', base: 8, topic: '逻辑' },
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

export function topicMatch(card: CardDef, lineTopic: DebateTopic | undefined): boolean {
  return Boolean(lineTopic && card.topic === lineTopic);
}

export function oratoryScale(level: number): number {
  return 1 + Math.max(0, level - 1) * 0.12;
}

export function cardDamage(card: CardDef, oratoryLevel: number, comboBonus = 0): number {
  return Math.round(card.base * oratoryScale(oratoryLevel) + comboBonus);
}
