import { officers } from '../data/officers';
import { policies } from '../data/policies';

export interface EdictInterpretation {
  sourceText: string;
  policyIds: string[];
  officerId: string | null;
  summary: string;
  warnings: string[];
}

const policyPatterns: Array<{ policyId: string; patterns: RegExp[] }> = [
  { policyId: 'green-sprouts-trial', patterns: [/青苗/, /常平仓/, /青黄不接/, /贷.*农/] },
  { policyId: 'service-reform-preparation', patterns: [/募役/, /免役/, /差役/, /以钱代役/, /役钱/] },
  { policyId: 'water-conservancy', patterns: [/水利/, /河渠/, /陂塘/, /灌溉/, /修堤/] },
  { policyId: 'curb-local-exactions', patterns: [/摊派/, /抑配/, /强征/, /胥吏/, /监司.*查/, /查禁/] },
  { policyId: 'reduce-redundant-spending', patterns: [/冗费/, /营造/, /宫观/, /裁减.*费/, /节用/, /虚冒/] },
  { policyId: 'northwest-defense', patterns: [/西北/, /陕西/, /边备/, /军粮/, /寨堡/, /西夏/] },
  { policyId: 'review-impeachments', patterns: [/弹章/, /弹劾/, /台谏.*复核/, /具名列证/, /查.*指控/] },
  { policyId: 'cross-check-ledgers', patterns: [/对勘/, /账簿/, /账册/, /查账/, /交叉核验/, /追查.*钱/] },
  { policyId: 'discipline-corrupt-officials', patterns: [/黜.*奸/, /罢免.*贪/, /追赃/, /惩治.*贪/, /依法.*黜/, /驱逐.*奸/] },
];

export function parseEdict(text: string): EdictInterpretation {
  const sourceText = text.trim();
  if (!sourceText) {
    return { sourceText, policyIds: [], officerId: null, summary: '', warnings: ['诏书尚未落笔。'] };
  }

  const matches = policyPatterns
    .map(({ policyId, patterns }) => ({ policyId, score: patterns.filter((pattern) => pattern.test(sourceText)).length }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);
  const warnings: string[] = [];
  const policyIds = matches.map(({ policyId }) => policyId);
  const officer = officers.find((item) => sourceText.includes(item.name)) ?? null;
  if (!policyIds.length) {
    policyIds.push('open-ended-directive');
    warnings.push('此诏超出现有政务规则，已按御前专项政务承接；补充对象、措施、期限和监督办法可降低执行变形。');
  }
  if (!officer) warnings.push('诏书未指名执行官，将沿用御前当前任命。');

  const policyNames = policyIds
    .map((id) => policies.find((policy) => policy.id === id)?.name)
    .filter((name): name is string => Boolean(name));

  return {
    sourceText,
    policyIds,
    officerId: officer?.id ?? null,
    summary: policyNames.length ? `中书拟将诏意落实为：${policyNames.join('、')}。` : '',
    warnings,
  };
}
