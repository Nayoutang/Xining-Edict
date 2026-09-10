import type { EdictInterpretation } from './edict-parser';
import type { GameState, HistoricalEvent, Officer, Policy, TurnRecord } from '../game/types';

export interface AIConfig {
  provider: 'deepseek' | 'openai' | 'anthropic' | 'qwen' | 'kimi' | 'zhipu' | 'custom';
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface HistoricalNarrative {
  report: string;
  situationUpdate: string;
  implementation: Array<{ stage: string; text: string }>;
  reactions: Array<{ label: string; text: string }>;
  nominations: Array<{ name: string; role: string; stance: string; assessment: string }>;
  institutionalChanges: string[];
  nextWarnings: string[];
  historicalNote: string;
}

export interface AdvisorAdvice {
  outline: string;
  dimensions: Array<{
    name: '财政' | '民生' | '军事' | '吏治';
    scope: string;
    role: '主' | '辅' | '暂缓';
    advice: string;
    policyId: string;
  }>;
  personnel: string;
  policyIds: string[];
}

interface LegacyAdvisorAdvice {
  policyIds?: unknown;
}

const advisorDimensionDefaults = [
  { name: '财政', scope: '国库与岁入', advice: '核对三司账簿，限一月具报岁入实数。', policyId: 'cross-check-ledgers' },
  { name: '民生', scope: '百姓负担', advice: '核查民户实负，灾伤户暂缓催征。', policyId: 'curb-local-exactions' },
  { name: '军事', scope: '边备与军储', advice: '军储底数未清，暂不增兵。', policyId: 'northwest-defense' },
  { name: '吏治', scope: '诏令能否落到州县', advice: '逐级核验州县执行，限一月复奏。', policyId: 'curb-local-exactions' },
] as const;

const policyDimension: Record<string, AdvisorAdvice['dimensions'][number]['name']> = {
  'green-sprouts-trial': '财政',
  'service-reform-preparation': '民生',
  'water-conservancy': '民生',
  'curb-local-exactions': '吏治',
  'reduce-redundant-spending': '财政',
  'northwest-defense': '军事',
  'review-impeachments': '吏治',
  'cross-check-ledgers': '财政',
  'discipline-corrupt-officials': '吏治',
};

export function adaptAdvisorAdvice(value: unknown, administration: number): AdvisorAdvice {
  const advice = value as Partial<AdvisorAdvice> & LegacyAdvisorAdvice;
  if (typeof advice?.outline === 'string' && Array.isArray(advice.dimensions)) return advice as AdvisorAdvice;

  const legacyPolicyIds = Array.isArray(advice?.policyIds) ? advice.policyIds.filter((item): item is string => typeof item === 'string') : [];
  const selectedNames = legacyPolicyIds.map((id) => policyDimension[id]).filter((name, index, names) => Boolean(name) && names.indexOf(name) === index).slice(0, 2);
  if (!selectedNames.length) selectedNames.push('财政');
  if (selectedNames.length < 2) selectedNames.push(advisorDimensionDefaults.find((item) => !selectedNames.includes(item.name))?.name ?? '民生');
  const dimensions: AdvisorAdvice['dimensions'] = advisorDimensionDefaults.map((item) => ({
    ...item,
    role: item.name === selectedNames[0] ? '主' : item.name === selectedNames[1] ? '辅' : '暂缓',
  }));
  const personnel = '暂无调任建议。';
  const outline = [
    `行政余量:${Math.max(0, Math.round(administration || 0))}/50`,
    '',
    ...dimensions.map((item) => `${item.name}|(${item.scope})【${item.role}】${item.advice}`),
    '',
    `人事:${personnel}`,
  ].join('\n');
  return {
    outline,
    dimensions,
    personnel,
    policyIds: dimensions.filter((item) => item.role !== '暂缓').map((item) => item.policyId),
  };
}

const hostedApiBase = 'https://xining-api.nayoutang3.workers.dev';
const apiPort = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('apiPort');
const apiBase = import.meta.env.PROD
  ? hostedApiBase
  : typeof window !== 'undefined' && window.location.protocol === 'file:' && apiPort
    ? `http://127.0.0.1:${apiPort}`
    : '';
const apiUrl = (path: string) => `${apiBase}${path}`;

export const providerDefaults: Record<AIConfig['provider'], Omit<AIConfig, 'provider' | 'apiKey'>> = {
  deepseek: { baseUrl: 'https://api.deepseek.com', model: 'deepseek-v4-flash' },
  openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  anthropic: { baseUrl: 'https://api.anthropic.com/v1', model: 'claude-3-5-sonnet-latest' },
  qwen: { baseUrl: 'https://ws-esx5vi3vpbs2mg95.cn-beijing.maas.aliyuncs.com/compatible-mode/v1', model: 'qwen3.7-plus' },
  kimi: { baseUrl: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-32k' },
  zhipu: { baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-plus' },
  custom: { baseUrl: '', model: '' },
};

export async function interpretEdictRemote(edict: string, context: unknown, config: AIConfig): Promise<EdictInterpretation> {
  const response = await fetch(apiUrl('/api/interpret'), {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ edict, context, config }),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.error || '诏书解析失败');
  return data.interpretation;
}

export async function narrateSettlementRemote(input: {
  edict: string;
  stateBefore: GameState;
  stateAfter: GameState;
  event: HistoricalEvent;
  officer: Officer;
  policies: Policy[];
  record: TurnRecord;
  history: TurnRecord[];
  config: AIConfig;
}): Promise<HistoricalNarrative> {
  const response = await fetch(apiUrl('/api/narrate'), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.error || '史实推演失败');
  return data.narrative;
}

export async function consultAdvisorRemote(input: {
  question: string;
  currentEdict: string;
  state: GameState;
  event: HistoricalEvent;
  officer: Officer;
  policies: Policy[];
  config: AIConfig;
}): Promise<AdvisorAdvice> {
  const response = await fetch(apiUrl('/api/advise'), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.error || '辅政官未能完成参详');
  return adaptAdvisorAdvice(data.advice, input.state.resources.administration);
}

export async function testAIConnectionRemote(config: AIConfig): Promise<string> {
  const response = await fetch(apiUrl('/api/test'), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ config }),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.error || '推演连接测试失败');
  return String(data.message || '连接成功');
}
