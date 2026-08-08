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

export function localizeAdvisorAdvice(advice: AdvisorAdvice): AdvisorAdvice {
  return {
    situation: localizeDisplayText(advice.situation),
    priorities: advice.priorities.map(localizeDisplayText),
    options: advice.options.map((item) => ({
      title: localizeDisplayText(item.title),
      benefit: localizeDisplayText(item.benefit),
      risk: localizeDisplayText(item.risk),
    })),
    policyIds: advice.policyIds ?? [],
    draftEdict: localizeDisplayText(advice.draftEdict),
    cautions: advice.cautions.map(localizeDisplayText),
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
      text: localizeDisplayText(item.text),
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
