import type { BossDef, DebateTopic, SceneLine } from '../types';

const narrator = (text: string): SceneLine => ({ speaker: '旁白', text });
const kanno = (text: string): SceneLine => ({ speaker: 'Kanno', text, portrait: './art/portrait_kanno.svg' });

export const BOSSES: Record<string, BossDef> = {
  wangxin: {
    id: 'wangxin',
    name: '王心',
    title: '学霸 · 纪律委员',
    shortTitle: '点名册',
    portrait: './art/portrait_wangxin.svg',
    sprite: 'wangxin',
    accent: '#486b91',
    conviction: 128,
    steps: 9,
    mechanic: 'heal',
    intro: [
      narrator('王心从点名册后面抬起头。粉笔灰在灯下慢慢飘。'),
      { speaker: '王心', text: '十一让我今晚看着晚自习。你回座位，我可以不记。', portrait: './art/portrait_wangxin.svg' },
      { speaker: '王心', text: '现在去办公室。别让我站起来。', portrait: './art/portrait_wangxin.svg' },
      kanno('等等，我可以说两句。'),
      { speaker: '王心', text: '说。但每说错一句，我就多记一条。', portrait: './art/portrait_wangxin.svg' },
    ],
    stealIntro: [
      narrator('王心背对着你，正在黑板上补写明天的值日表。'),
      kanno('别回头，别回头，别回头。'),
    ],
    win: [
      { speaker: '王心', text: '……行。你过关。', portrait: './art/portrait_wangxin.svg' },
      { speaker: '王心', text: '明天早读，自己来交检讨。别让我去班里叫你。', portrait: './art/portrait_wangxin.svg' },
      kanno('知道了。谢谢王委员。'),
      narrator('他把点名册合上，侧过身，给你让出一条路。'),
    ],
    lose: [
      { speaker: '王心', text: '说完了？', portrait: './art/portrait_wangxin.svg' },
      { speaker: '王心', text: '那跟我走吧。教导主任在楼下。', portrait: './art/portrait_wangxin.svg' },
      narrator('你还没来得及解释，后门已经被人从外面推开了。'),
    ],
    lines: [
      { id: 'wx1', phase: 1, type: 'logic', text: '晚自习离开座位，按班规第 12 条，记一次。' },
      { id: 'wx2', phase: 1, type: 'logic', text: '书没收了就是没收了，别跟我讲条件。' },
      { id: 'wx3', phase: 1, type: 'emotion', text: '你现在回座位，我可以当没看见。' },
      { id: 'wx4', phase: 1, type: 'fact', text: '你从后门出去的时候，门轴响了三下。' },
      { id: 'wx5', phase: 2, type: 'fact', text: '你上次迟到，也是这个理由。' },
      { id: 'wx6', phase: 2, type: 'fact', text: '全班都在复习，只有你在动。' },
      { id: 'wx7', phase: 2, type: 'logic', text: '你以为我不知道你从后门走？我坐第一排。' },
      { id: 'wx8', phase: 2, type: 'emotion', text: '你别让我难做。' },
      { id: 'wx9', phase: 3, type: 'logic', text: '我不是针对你，但规矩就是规矩。' },
      { id: 'wx10', phase: 3, type: 'fact', text: '你连书是谁的都没说清楚，就敢往外跑。' },
      { id: 'wx11', phase: 3, type: 'emotion', text: '你要是真把书弄丢了，难过的又不是我。' },
      { id: 'wx12', phase: 3, type: 'logic', text: '现在回去，我只记你一次。再往前走，就是三次。' },
    ],
    idleLines: [
      '怎么又是我看晚自习……',
      '十一，你为什么不自己来。',
      '后门钥匙？我没拿。',
      '别以为我坐第一排就看不见。',
    ],
  },
  daoxiaowang: {
    id: 'daoxiaowang',
    name: '岛小王',
    title: '厕所“所长”',
    shortTitle: '所长',
    portrait: './art/portrait_daoxiaowang.svg',
    sprite: 'daoxiaowang',
    accent: '#c84938',
    conviction: 150,
    steps: 9,
    mechanic: 'summon',
    intro: [
      narrator('岛小王把拖把往地上一杵，水花溅到你的鞋上。'),
      { speaker: '岛小王', text: '哟，这不是三班的 Kanno 吗。晚自习也敢出来？', portrait: './art/portrait_daoxiaowang.svg' },
      kanno('我就路过。'),
      { speaker: '岛小王', text: '路过？你脚上这水，从教室一路滴过来的吧。', portrait: './art/portrait_daoxiaowang.svg' },
    ],
    stealIntro: [
      narrator('岛小王靠在厕所门口刷手机，拖把横在腿上。'),
      { speaker: '岛小王', text: '这层楼今晚归我管。谁也别想从这儿过。', portrait: './art/portrait_daoxiaowang.svg' },
    ],
    win: [
      { speaker: '岛小王', text: '……你小子，嘴挺硬。', portrait: './art/portrait_daoxiaowang.svg' },
      { speaker: '岛小王', text: '行，我让开。别把我说出去，听见没。', portrait: './art/portrait_daoxiaowang.svg' },
      kanno('我今晚谁都没见过。'),
      { speaker: '岛小王', text: '上道。', portrait: './art/portrait_daoxiaowang.svg' },
    ],
    lose: [
      { speaker: '岛小王', text: '行了行了，你话太多了。', portrait: './art/portrait_daoxiaowang.svg' },
      { speaker: '岛小王', text: '教导主任！这边有个晚自习逃课的！', portrait: './art/portrait_daoxiaowang.svg' },
      narrator('走廊尽头传来皮鞋声。你甚至没来得及转身。'),
    ],
    lines: [
      { id: 'dx1', phase: 1, type: 'emotion', text: '你信不信我喊一声，整层楼都知道你在这儿。' },
      { id: 'dx2', phase: 1, type: 'emotion', text: '厕所这块地，我说了算。' },
      { id: 'dx3', phase: 1, type: 'logic', text: '你拿什么跟我换？空着手就想过去？' },
      { id: 'dx4', phase: 1, type: 'fact', text: '你鞋上还有水，刚从教室拖地那边过来的吧。' },
      { id: 'dx5', phase: 2, type: 'emotion', text: '我可不是王心那种好说话的人。' },
      { id: 'dx6', phase: 2, type: 'fact', text: '别装了，你从后门溜出来的时候我都看见了。' },
      { id: 'dx7', phase: 2, type: 'logic', text: '你现在回去，我当没看见。怎么样，够意思吧？' },
      { id: 'dx8', phase: 2, type: 'emotion', text: '我在这儿站了三年，什么场面没见过。' },
      { id: 'dx9', phase: 3, type: 'fact', text: '你手里那串钥匙，是从教室拿的吧。' },
      { id: 'dx10', phase: 3, type: 'emotion', text: '你要真敢过去，我就喊。' },
      { id: 'dx11', phase: 3, type: 'logic', text: '大家各退一步。你把钥匙留下，我当没这回事。' },
      { id: 'dx12', phase: 3, type: 'fact', text: '你走错方向了。办公室在楼上，不在我身后。' },
    ],
    idleLines: [
      '这层楼今晚归我管。',
      '别踩我刚拖的地。',
      '谁在那边？',
      '王心自己怎么不下来。',
    ],
  },
  youxiaotang: {
    id: 'youxiaotang',
    name: '右小唐',
    title: '临时图书管理员',
    shortTitle: '书签',
    portrait: './art/portrait_youxiaotang.svg',
    sprite: 'youxiaotang',
    accent: '#2e5547',
    conviction: 172,
    steps: 9,
    mechanic: 'double',
    intro: [
      narrator('右小唐从书堆后面抬起头，绿色的眼睛在灯下很静。'),
      { speaker: '右小唐', text: '十一今天让我临时看着图书角。21:00 关门，你还有十分钟。', portrait: './art/portrait_youxiaotang.svg' },
      kanno('我不是来看书的。'),
      { speaker: '右小唐', text: '那你更不该进来。', portrait: './art/portrait_youxiaotang.svg' },
    ],
    stealIntro: [
      narrator('右小唐正在给一摞书贴标签，动作很慢，很轻。'),
      { speaker: '右小唐', text: '第 47 页的折角，是你折的吗。', portrait: './art/portrait_youxiaotang.svg' },
      kanno('……不是。'),
    ],
    win: [
      { speaker: '右小唐', text: '书卡给你。', portrait: './art/portrait_youxiaotang.svg' },
      { speaker: '右小唐', text: '书要是折了，我记你一辈子。', portrait: './art/portrait_youxiaotang.svg' },
      kanno('我会小心的。'),
      narrator('她把书卡推过来，又低头继续贴标签，像什么都没发生。'),
    ],
    lose: [
      { speaker: '右小唐', text: '安静。', portrait: './art/portrait_youxiaotang.svg' },
      { speaker: '右小唐', text: '你已经不安静很久了。', portrait: './art/portrait_youxiaotang.svg' },
      narrator('她拿起内线电话，按下了教导处。'),
    ],
    lines: [
      { id: 'yx1', phase: 1, type: 'fact', text: '这本书的借阅卡上没有你的名字。' },
      { id: 'yx2', phase: 1, type: 'fact', text: '第 47 页有折角，你打算怎么解释？' },
      { id: 'yx3', phase: 1, type: 'logic', text: '图书角的书，不是用来上课看的。' },
      { id: 'yx4', phase: 1, type: 'fact', text: '你每次来都只看不借，这次倒是很积极。' },
      { id: 'yx5', phase: 2, type: 'fact', text: '书脊坏了，你知道吗？' },
      { id: 'yx6', phase: 2, type: 'logic', text: '安静。' },
      { id: 'yx7', phase: 2, type: 'emotion', text: '在这里，书比人重要。' },
      { id: 'yx8', phase: 2, type: 'fact', text: '你弄丢过一本《百科全书》，还没赔。' },
      { id: 'yx9', phase: 3, type: 'logic', text: '我可以让你过去，但书要留下。' },
      { id: 'yx10', phase: 3, type: 'fact', text: '你手上有汗。别碰书脊。' },
      { id: 'yx11', phase: 3, type: 'emotion', text: '你根本不是来还书的。你只是想让自己心里好受一点。' },
      { id: 'yx12', phase: 3, type: 'logic', text: '现在转身，我还能当你是来还书的。' },
    ],
    idleLines: [
      '安静。',
      '这本书还没登记。',
      '折角……我记住了。',
      '十一说只看十分钟。',
    ],
  },
  shiyi: {
    id: 'shiyi',
    name: '十一',
    title: '女班主任',
    shortTitle: '十一',
    portrait: './art/portrait_shiyi.svg',
    sprite: 'shiyi',
    accent: '#f0c04e',
    conviction: 198,
    steps: 7,
    mechanic: 'final',
    final: true,
    intro: [
      narrator('十一放下红笔，看着你，像在看一道做错的题。'),
      { speaker: '十一', text: '晚自习离开教室，你知道这是什么性质吗。', portrait: './art/portrait_shiyi.svg' },
      kanno('我知道。'),
      { speaker: '十一', text: '那就说点我不知道的。', portrait: './art/portrait_shiyi.svg' },
    ],
    stealIntro: [
      narrator('十一背对着门，正在往保温杯里倒水。抽屉没有锁。'),
      { speaker: '十一', text: '……这孩子，书都看完了，还回来干什么。', portrait: './art/portrait_shiyi.svg' },
    ],
    win: [
      { speaker: '十一', text: '……你说得对，书应该还给他。', portrait: './art/portrait_shiyi.svg' },
      { speaker: '十一', text: '明天把检讨放我桌上。书你自己还给猴子。', portrait: './art/portrait_shiyi.svg' },
      kanno('谢谢老师。'),
      { speaker: '十一', text: '别谢。下次再让我在晚自习看见你，就没这么好说话了。', portrait: './art/portrait_shiyi.svg' },
      narrator('她把《两仪道》推到桌角。红笔在封面上留下了一道很轻的痕。'),
    ],
    lose: [
      { speaker: '十一', text: '说完了？', portrait: './art/portrait_shiyi.svg' },
      { speaker: '十一', text: '那就不用说了。教导主任就在楼下。', portrait: './art/portrait_shiyi.svg' },
      narrator('办公室的门被敲响。你手里的书还没捂热。'),
    ],
    lines: [
      { id: 'sy1', phase: 1, type: 'logic', text: '晚自习离开教室，按校规，至少要记一次。' },
      { id: 'sy2', phase: 1, type: 'fact', text: '书是猴子的，但违反纪律的是你。' },
      { id: 'sy3', phase: 1, type: 'emotion', text: '你现在回去，我可以只当没发生。' },
      { id: 'sy4', phase: 1, type: 'logic', text: '你从教室到办公室，经过了几个班？' },
      { id: 'sy5', phase: 2, type: 'emotion', text: '你以为我没收书是为了为难你？' },
      { id: 'sy6', phase: 2, type: 'emotion', text: '你有没有想过，猴子为什么把书借给你？' },
      { id: 'sy7', phase: 2, type: 'emotion', text: '你连一句实话都不肯说。' },
      { id: 'sy8', phase: 2, type: 'fact', text: '你上次月考退了多少名，自己心里清楚。' },
      { id: 'sy9', phase: 2, type: 'logic', text: '你总觉得全世界都在拦你。有没有一种可能，是你自己在躲。' },
      { id: 'sy10', phase: 3, type: 'fact', text: '这本书不是你的，但责任是你的。' },
      { id: 'sy11', phase: 3, type: 'logic', text: '你可以现在拿走，但明天怎么面对他？' },
      { id: 'sy12', phase: 3, type: 'emotion', text: 'Kanno，你打算一直这样躲下去吗。' },
      { id: 'sy13', phase: 3, type: 'emotion', text: '我看着你从高一走到现在。你不是坏孩子。' },
      { id: 'sy14', phase: 3, type: 'logic', text: '把书还给他，然后来办公室找我。这是最后一次。' },
      { id: 'sy15', phase: 3, type: 'fact', text: '你手里的书，封面已经卷了。你打算怎么还。' },
    ],
    idleLines: [
      '灯还亮着，你就还没回座位。',
      '别让我去班里找你。',
      '书的事，等会儿再说。',
      '这届学生，真不让人省心。',
    ],
  },
};

export const BOSS_ORDER: Array<keyof typeof BOSSES> = ['wangxin', 'daoxiaowang', 'youxiaotang', 'shiyi'];

export function getBoss(id: string): BossDef {
  const boss = BOSSES[id];
  if (!boss) throw new Error(`Unknown boss ${id}`);
  return boss;
}

const LINE_TOPICS: Record<string, DebateTopic> = {
  wx1: '规矩', wx2: '规矩', wx3: '面子', wx4: '证据', wx5: '双标', wx6: '证据',
  wx7: '逻辑', wx8: '关系', wx9: '规矩', wx10: '责任', wx11: '责任', wx12: '时间',
  dx1: '面子', dx2: '面子', dx3: '关系', dx4: '证据', dx5: '关系', dx6: '证据',
  dx7: '面子', dx8: '面子', dx9: '证据', dx10: '情绪', dx11: '关系', dx12: '细节',
  yx1: '证据', yx2: '细节', yx3: '规矩', yx4: '细节', yx5: '证据', yx6: '规矩',
  yx7: '责任', yx8: '证据', yx9: '规矩', yx10: '细节', yx11: '情绪', yx12: '时间',
  sy1: '规矩', sy2: '责任', sy3: '面子', sy4: '细节', sy5: '关系', sy6: '关系',
  sy7: '情绪', sy8: '证据', sy9: '责任', sy10: '责任', sy11: '责任', sy12: '情绪',
  sy13: '关系', sy14: '时间', sy15: '细节',
};

Object.values(BOSSES).forEach((boss) => {
  boss.lines.forEach((line) => {
    line.topic = LINE_TOPICS[line.id] ?? '规矩';
  });
});
