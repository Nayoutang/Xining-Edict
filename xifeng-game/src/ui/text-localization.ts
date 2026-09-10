import type { AdvisorAdvice, HistoricalNarrative } from '../ai/client';

const internalLabels = [
  ['politicalCostModifier', '政略消耗修正'],
  ['administrativeOverload', '行政超载'],
  ['politicalOverdraft', '政略透支'],
  ['politicalCapital', '政略'],
  ['executionBonus', '执行修正'],
  ['indicatorChanges', '国势变化'],
  ['resourceChanges', '资源变化'],
  ['courtSupport', '士论'],
  ['activePolicies', '施行中的政务'],
  ['livelihood', '民生'],
  ['administration', '行政'],
  ['policyIds', '政务'],
  ['officerId', '承办官'],
  ['treasury', '国库'],
  ['execution', '执行'],
  ['severity', '严重度'],
  ['indicators', '国势'],
  ['resources', '资源'],
  ['dilemmas', '困境'],
  ['defense', '边备'],
  ['finance', '财用'],
  ['polity', '朝廷官制'],
  ['flags', '施政记录'],
  ['censorial-dossier', '台谏弹章复核'],
  ['verified-misconduct', '账证核实'],
  ['disciplined-corruption', '奸蠹处置'],
  ['fiscal-imbalance', '国用匮乏'],
  ['weak-administration', '政令壅滞'],
  ['border-pressure', '西北边备空虚'],
  ['livelihood-strain', '民力困敝'],
  ['forced-loans', '青苗抑配'],
  ['factional-politics', '新旧党议'],
  ['concealed-corruption', '簿籍真伪难明'],
  ['administrative-overload', '有司壅滞'],
  ['political-overdraft', '朝议强推'],
] as const;

const debugValueLabels = '财用|民生|边备|士论|执行|国库|政略|行政|严重度|执行修正|政略消耗修正';

export function localizeDisplayText(value: unknown): string {
  let text = String(value ?? '');
  for (const [internal, label] of internalLabels) {
    text = text.replace(new RegExp(internal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), label);
  }
  return text
    .replace(new RegExp(`\\((${debugValueLabels})\\s*=\\s*([+-]?\\d+)\\)`, 'g'), '（$1 $2）')
    .replace(new RegExp(`(${debugValueLabels})\\s*=\\s*([+-]?\\d+)`, 'g'), '$1 $2')
    .replace(/\bID\b/g, '标识')
    .trim();
}

const plainReactionLeads: Record<string, string> = {
  朝议: '朝臣最关心新法会不会失控。',
  三司: '三司先看钱从哪里来、够不够花。',
  台谏: '台谏最怕政令扰民又无人担责。',
  州县: '州县在意人手和期限能否撑住。',
  豪强: '地方豪强先算自己损失多少。',
  百姓: '百姓只看负担是否真的减轻。',
};

export function addPlainReactionLead(labelValue: unknown, textValue: unknown): string {
  const label = localizeDisplayText(labelValue);
  const text = localizeDisplayText(textValue).replace(/^(?:直白说|简单说|说白了)[，,:：]?\s*/, '');
  const lead = plainReactionLeads[label] ?? `${label}先看这道政令如何影响自身。`;
  if (text.startsWith(lead)) return text;
  return `${lead}${text}`;
}

export function localizeAdvisorAdvice(advice: AdvisorAdvice): AdvisorAdvice {
  return {
    outline: localizeDisplayText(advice.outline),
    situation: localizeDisplayText(advice.situation),
    dimensions: advice.dimensions.map((item) => ({
      ...item,
      scope: localizeDisplayText(item.scope),
      advice: localizeDisplayText(item.advice),
      decision: item.decision ? localizeDisplayText(item.decision) : undefined,
    })),
    personnel: localizeDisplayText(advice.personnel),
    personnelRecommendation: advice.personnelRecommendation ? {
      ...advice.personnelRecommendation,
      officeName: localizeDisplayText(advice.personnelRecommendation.officeName),
      postTitle: localizeDisplayText(advice.personnelRecommendation.postTitle),
      officerName: localizeDisplayText(advice.personnelRecommendation.officerName),
      reason: localizeDisplayText(advice.personnelRecommendation.reason),
      risk: localizeDisplayText(advice.personnelRecommendation.risk),
    } : undefined,
    policyIds: advice.policyIds ?? [],
  };
}

export function localizeHistoricalNarrative(narrative: HistoricalNarrative): HistoricalNarrative {
  return {
    report: localizeDisplayText(narrative.report),
    situationUpdate: localizeDisplayText(narrative.situationUpdate),
    implementation: narrative.implementation.map((item) => ({
      stage: localizeDisplayText(item.stage),
      text: localizeDisplayText(item.text),
    })),
    reactions: narrative.reactions.map((item) => ({
      label: localizeDisplayText(item.label),
      text: addPlainReactionLead(item.label, item.text),
    })),
    nominations: narrative.nominations.map((item) => ({
      name: localizeDisplayText(item.name),
      role: localizeDisplayText(item.role),
      stance: localizeDisplayText(item.stance),
      assessment: localizeDisplayText(item.assessment),
    })),
    institutionalChanges: narrative.institutionalChanges.map(localizeDisplayText),
    nextWarnings: narrative.nextWarnings.map(localizeDisplayText),
    historicalNote: localizeDisplayText(narrative.historicalNote),
  };
}
