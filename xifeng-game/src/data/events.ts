import type { HistoricalEvent } from '../game/types';

export const historicalEvents: HistoricalEvent[] = [
  { turn: 1, title: '三司财政告急', description: '边费、官俸与赈济并至，岁入不敷。', effects: { finance: -3 }, resourceEffects: { treasury: -180 } },
  { turn: 2, title: '青苗议起', description: '常平仓本钱如何给散，朝议分歧渐深。', effects: { courtSupport: -3 } },
  { turn: 3, title: '州县强制抑配', description: '部分州县以户等定额，强令百姓领取青苗钱。', effects: { livelihood: -5, execution: -2 } },
  { turn: 4, title: '台谏交章', description: '御史与谏官集中攻击新法扰民并要求罢黜主事者；弹章中既有实据，也夹杂传闻与政见攻讦。', effects: { courtSupport: -6 } },
  { turn: 5, title: '京东灾伤', description: '旱情影响秋成，流民与逃户开始增加。', effects: { livelihood: -6, finance: -2 }, resourceEffects: { treasury: -220 } },
  { turn: 6, title: '陕西军储不足', description: '沿边寨堡请求追加军粮与器械。', effects: { defense: -6 }, resourceEffects: { treasury: -160 } },
  { turn: 7, title: '官署账案上闻', description: '市易息钱、河工夫役与地方新法账册互有抵牾，御史请求追究主事官吏。', effects: { courtSupport: -5, execution: -2 } },
  { turn: 8, title: '新法初政总评', description: '两府、三司与诸路汇总四年施政得失。', effects: {} },
];

export function getHistoricalEvent(turn: number): HistoricalEvent {
  const event = historicalEvents.find((item) => item.turn === turn);
  if (!event) throw new Error(`缺少第 ${turn} 回合的历史事件。`);
  return event;
}
