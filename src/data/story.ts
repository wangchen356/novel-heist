import type { SceneLine } from '../types';

const n = (text: string): SceneLine => ({ speaker: '旁白', text });
const k = (text: string): SceneLine => ({ speaker: 'Kanno', text, portrait: './art/portrait_kanno.svg' });
const houzi = (text: string): SceneLine => ({ speaker: '猴子', text, portrait: './art/portrait_houzi.svg' });
const shiyi = (text: string): SceneLine => ({ speaker: '十一', text, portrait: './art/portrait_shiyi.svg' });
const novel = (text: string): SceneLine => ({ speaker: '《两仪道》', text, style: 'novel' });

export const FORCED_INTRO: SceneLine[] = [
  n('20:39。办公室的门虚掩着。十一坐在桌前，面前摊着《两仪道》。'),
  shiyi('进来。门关上。'),
  k('……你都知道了。'),
  shiyi('王心、岛小王、右小唐。整栋楼都在说。'),
  k('书是猴子的。'),
  shiyi('那就坐下，把话说清楚。'),
];

export const ENDING_SILENT: SceneLine[] = [
  n('21:02。Kanno 从后门溜回教室。十一办公室的灯还亮着。'),
  k('……还了。'),
  n('他把《两仪道》放在猴子桌上。书角有一道新的折痕。'),
  houzi('哦，谢了。你看完了？'),
  k('……还差一点。'),
  houzi('那明天还我。'),
  n('猴子低头继续写题。Kanno 想说点什么，最后什么也没说。'),
  novel('沈夜把剑谱还给了那个人。他们没有成为朋友。'),
  n('窗外的操场很黑。晚自习还没有结束。'),
];

export const ENDING_FACE_TO_FACE: SceneLine[] = [
  n('21:02。Kanno 从办公室出来，手里攥着《两仪道》。'),
  n('十一让他明天把检讨放桌上。她还说：“书你自己还给猴子。”'),
  n('猴子坐在座位上，看见他，挑了挑眉。'),
  houzi('你被十一抓了？'),
  k('……算吧。'),
  houzi('书呢？'),
  k('在这儿。'),
  n('猴子接过书，翻了两页，忽然笑了。'),
  houzi('你早说啊。这书本来就是借你看的。'),
  k('……我不想欠你。'),
  houzi('一本小说，算什么人情。'),
  n('Kanno 站了一会儿，忽然发现自己一直不知道对方叫什么。'),
  k('……你叫什么来着。'),
  houzi('侯子航。猴子是外号。'),
  k('侯子航。'),
  houzi('嗯。明天还我。'),
  novel('沈夜终于明白，有些东西不是抢回来的，是别人愿意给你的。'),
  n('晚自习结束的铃声响了。十一办公室的灯终于灭了。'),
];

export const ENDING_TEXT = {
  silent: {
    kicker: 'ENDING 01 / 阴',
    title: '无声归还',
    subtitle: '书回到了猴子桌上。面子保住了。人情没有欠。',
    body: 'Kanno 没有学会怎么把“谢谢”说出口。但至少，他记住了后门门轴响三下，记住了十一办公室灯灭的时间。',
  },
  'face-to-face': {
    kicker: 'ENDING 02 / 阳',
    title: '当面归还',
    subtitle: '书回到了猴子手里。Kanno 也第一次记住了他的名字。',
    body: '有些人不是在等你把东西还回去，而是在等你开口。晚自习结束的铃声响了很久，Kanno 第一次觉得它不算太难听。',
  },
} as const;

export const ARCHIVE_ROWS = [
  { name: 'Kanno', role: '主角', note: '爱凑热闹，嘴比脑子快。借了猴子的《两仪道》，然后在晚自习把自己活成了一本小说。' },
  { name: '猴子', role: '《两仪道》作者', note: '普通同班同学。平时不声不响，写出来的东西中二到爆。' },
  { name: '王心', role: '教室 Boss', note: '纪律委员。点名册随时在手，班规第 12 条倒背如流。' },
  { name: '岛小王', role: '厕所门口 Boss', note: '厕所“所长”。拖把是他的权杖，水桶是他的王座。' },
  { name: '右小唐', role: '图书角 Boss', note: '图书管理员。说话很轻，记仇很重，尤其记折角。' },
  { name: '十一', role: '办公室 Boss / 班主任', note: '她没收了《两仪道》。她没有看过。她只是知道规则，并且真的会执行。' },
];
