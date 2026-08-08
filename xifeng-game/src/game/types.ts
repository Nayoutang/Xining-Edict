export type IndicatorKey =
  | 'finance'
  | 'livelihood'
  | 'defense'
  | 'courtSupport'
  | 'execution';

export type ResourceKey = 'treasury' | 'politicalCapital' | 'administration';

export type Indicators = Record<IndicatorKey, number>;
export type Resources = Record<ResourceKey, number>;
export type NumericChanges<T extends string> = Partial<Record<T, number>>;

export interface GameDate {
  reignYear: number;
  half: 1 | 2;
}

export type PolicyTag = 'finance' | 'relief' | 'military' | 'administration' | 'reform';

export interface PolicyRisk {
  id: string;
  description: string;
  whenIndicatorBelow?: Partial<Record<IndicatorKey, number>>;
  effects: NumericChanges<IndicatorKey>;
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  tags: PolicyTag[];
  duration: number;
  cost: NumericChanges<ResourceKey>;
  immediateEffects: NumericChanges<IndicatorKey>;
  perTurnEffects: NumericChanges<IndicatorKey>;
  risks: PolicyRisk[];
  requirements: string[];
  grants: string[];
}

export interface HistoricalSourceExcerpt {
  type: '本人文章' | '同时代记载' | '后世史书' | '说法存疑';
  title: string;
  context: string;
  excerpt: string;
  fullText: string;
  translation: string;
  significance: string;
  citation: string;
}

export interface OfficerTimelineEntry {
  year: string;
  event: string;
}

export interface Officer {
  id: string;
  name: string;
  role: string;
  stance: string;
  specialtyTags: PolicyTag[];
  executionBonus: number;
  politicalCostModifier: number;
  description: string;
  personality: string;
  governingStyle: string;
  priorities: string[];
  redLines: string[];
  voice: string;
  courtesyName: string;
  lifespan: string;
  origin: string;
  group: 'reform' | 'critic' | 'moderate' | 'statecraft' | 'contested';
  biography: string;
  publicReputation: string;
  historiography: string;
  sourceNote: string;
  verdict: string;
  historicalSignificance: string;
  whyImportant: string[];
  majorContributions: string[];
  timeline: OfficerTimelineEntry[];
  sources: HistoricalSourceExcerpt[];
}

export type CourtOfficeKey = 'secretariat' | 'military' | 'finance' | 'censorate' | 'transport';

export type CourtPostKey =
  | 'secretariat-chancellor'
  | 'secretariat-councillor'
  | 'military-commissioner'
  | 'military-deputy'
  | 'finance-commissioner'
  | 'finance-deputy'
  | 'censor-in-chief'
  | 'remonstrance-chief'
  | 'transport-commissioner'
  | 'transport-deputy';

export interface CourtPost {
  key: CourtPostKey;
  title: string;
  appointeeId: string | null;
}

export interface CourtOffice {
  key: CourtOfficeKey;
  name: string;
  scope: string;
  posts: CourtPost[];
  reform: '旧制未改' | '御前直达' | '考课审计' | '中枢复核';
}

export interface PolityState {
  offices: CourtOffice[];
}

export interface HistoricalEvent {
  turn: number;
  title: string;
  description: string;
  effects: NumericChanges<IndicatorKey>;
  resourceEffects?: NumericChanges<ResourceKey>;
}

export interface ActivePolicy {
  policyId: string;
  officerId: string;
  remainingTurns: number;
}

export interface ObjectiveProgress {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  completed: boolean;
}

export type DilemmaCategory = 'structural' | 'urgent' | 'reform';

export interface DilemmaProgress {
  id: string;
  title: string;
  description: string;
  category: DilemmaCategory;
  severity: number;
  reformDirection: string;
}

export interface TurnRecord {
  turn: number;
  date: GameDate;
  eventTitle: string;
  policyIds: string[];
  officerId: string;
  indicatorChanges: NumericChanges<IndicatorKey>;
  resourceChanges: NumericChanges<ResourceKey>;
  administrativeOverload: number;
  politicalOverdraft: number;
  edictText?: string;
  aiSummary?: string;
}

export interface Ending {
  id: string;
  title: string;
  description: string;
  score: number;
}

export interface GameState {
  turn: number;
  maxTurns: number;
  date: GameDate;
  indicators: Indicators;
  resources: Resources;
  flags: string[];
  activePolicies: ActivePolicy[];
  objectives: ObjectiveProgress[];
  dilemmas: DilemmaProgress[];
  polity: PolityState;
  history: TurnRecord[];
  ended: boolean;
  ending: Ending | null;
}

export interface TurnDecision {
  policyIds: string[];
  officerId: string;
  edictNote?: string;
}

export interface TurnResult {
  state: GameState;
  event: HistoricalEvent;
  record: TurnRecord;
}
