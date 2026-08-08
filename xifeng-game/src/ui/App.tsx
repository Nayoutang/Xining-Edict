import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArchiveRestore, BookOpenText, CircleDollarSign, Landmark, LibraryBig, LoaderCircle, RotateCcw, Save, Scale, ScrollText, Search, Shield, Trash2, Users, X } from 'lucide-react';
import { appointCourtOfficer, createInitialState, dismissCourtOfficer, historicalEvents, isCourtOfficerAppointed, officers, officerTagLabels, parseEdict, policies, settleTurn } from '..';
import { consultAdvisorRemote, interpretEdictRemote, narrateSettlementRemote, providerDefaults, testAIConnectionRemote } from '../ai/client';
import type { AdvisorAdvice, AIConfig, CourtOfficeKey, CourtPostKey, DilemmaProgress, EdictInterpretation, GameState, HistoricalEvent, HistoricalNarrative, IndicatorKey, Officer, TurnRecord } from '..';
import { GameScreen } from './GameScreen';
import { paginate } from './pagination';
import { localizeAdvisorAdvice, localizeDisplayText, localizeHistoricalNarrative } from './text-localization';

type PanelName = 'dilemmas' | 'court' | 'archive' | 'records' | 'saves' | 'edict' | null;
type DilemmaChange = 'new' | 'worse' | 'eased' | 'resolved';

const indicatorMeta = {
  finance: { label: '财用', icon: CircleDollarSign },
  livelihood: { label: '民生', icon: Users },
  defense: { label: '边备', icon: Shield },
  courtSupport: { label: '士论', icon: Scale },
  execution: { label: '执行', icon: Landmark },
} satisfies Record<IndicatorKey, { label: string; icon: typeof Landmark }>;

const endingVisuals = {
  collapse: { mark: '断', kicker: '国势倾颓', verdict: '诏令未尽，而朝局已无力承载新政。' },
  'balanced-reform': { mark: '成', kicker: '新法立基', verdict: '法度有所立，财计与民生尚能相持。' },
  'wealth-at-a-cost': { mark: '赋', kicker: '国富民困', verdict: '仓廪渐实，却有催科之声出于闾巷。' },
  'factional-rift': { mark: '裂', kicker: '朝议离析', verdict: '新旧各执一端，国是遂裂为党议。' },
  'unfinished-history': { mark: '续', kicker: '史有余章', verdict: '制度已启其端，后世仍将检验得失。' },
} as const;

const panelTitles = { dilemmas: '北宋当前困境', court: '铨选 · 朝廷官制', archive: '秘阁 · 熙丰人物志', records: '起居注', saves: '御前存档', edict: '御前拟诏' };
const tagLabels = { finance: '理财', relief: '恤民', military: '边务', administration: '吏治', reform: '变法' };
const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;
const officerPortraitUrl = (name: string) => assetUrl(`assets/portraits/${encodeURIComponent(name)}.png`);
const numerals = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const formatGameDate = (date: GameState['date']) => `熙宁${numerals[date.reignYear] ?? date.reignYear}年${date.half === 1 ? '上半年' : '下半年'}`;
const formatDate = (state: GameState) => formatGameDate(state.date);
const effectText = (changes: Partial<Record<IndicatorKey, number>>) => Object.entries(changes).map(([key, value]) => `${indicatorMeta[key as IndicatorKey].label} ${Number(value) > 0 ? '+' : ''}${value}`);
const emptyAIConfig: AIConfig = { provider: 'deepseek', apiKey: '', ...providerDefaults.deepseek };

function readAIConfig(key: string): AIConfig {
  try {
    const config = { ...emptyAIConfig, ...JSON.parse(localStorage.getItem(key) || '{}') } as AIConfig;
    if (config.provider !== 'deepseek') config.apiKey = '';
    config.provider = 'deepseek';
    config.baseUrl = providerDefaults.deepseek.baseUrl;
    config.model = providerDefaults.deepseek.model;
    localStorage.setItem(key, JSON.stringify(config));
    return config;
  }
  catch { return emptyAIConfig; }
}

export function App() {
  const [state, setState] = useState(createInitialState);
  const [policyIds, setPolicyIds] = useState<string[]>([]);
  const [edictText, setEdictText] = useState('');
  const [advisorPolicyIds, setAdvisorPolicyIds] = useState<string[] | null>(null);
  const [advisorDraftActive, setAdvisorDraftActive] = useState(false);
  const [interpretation, setInterpretation] = useState<EdictInterpretation | null>(null);
  const [officerId, setOfficerId] = useState(officers[0]?.id ?? '');
  const [panel, setPanel] = useState<PanelName>(null);
  const [archiveReturnsToEdict, setArchiveReturnsToEdict] = useState(false);
  const [dilemmaBaseline, setDilemmaBaseline] = useState<DilemmaProgress[] | null>(null);
  const [focusedDilemmaId, setFocusedDilemmaId] = useState<string | null>(null);
  const [result, setResult] = useState<{ event: HistoricalEvent; record: TurnRecord; narrative?: HistoricalNarrative; aiError?: string } | null>(null);
  const [error, setError] = useState('');
  const [inferenceConfig, setInferenceConfig] = useState(() => readAIConfig('xifeng-ai-config'));
  const [aiBusy, setAIBusy] = useState('');
  const advisorConfig: AIConfig = { ...inferenceConfig };
  const event = historicalEvents.find((item) => item.turn === state.turn) ?? historicalEvents.at(-1)!;
  const officer = officers.find((item) => item.id === officerId) ?? officers[0]!;

  function showDilemmas(baseline: DilemmaProgress[] | null = null) {
    setDilemmaBaseline(baseline);
    setPanel('dilemmas');
  }

  function updateEdict(text: string) {
    setEdictText(text);
    setAdvisorPolicyIds(null);
    setInterpretation(null);
    setPolicyIds([]);
    setError('');
  }

  function adoptAdvisorEdict(text: string, advisedPolicyIds: string[]) {
    setEdictText(text);
    setAdvisorPolicyIds(advisedPolicyIds.length ? advisedPolicyIds.slice(0, 2) : null);
    setAdvisorDraftActive(true);
    setInterpretation(null);
    setPolicyIds([]);
    setError('');
  }

  async function interpretEdict(showBusy = true) {
    if (showBusy) setAIBusy(inferenceConfig.apiKey ? '推演模型正在理解诏书' : '中书正在核对诏令');
    let parsed: EdictInterpretation;
    try {
      parsed = inferenceConfig.apiKey
        ? await interpretEdictRemote(edictText, { date: formatDate(state), event, indicators: state.indicators, resources: state.resources, polity: state.polity }, inferenceConfig)
        : parseEdict(edictText);
    } catch (caught) {
      parsed = parseEdict(edictText);
      parsed.warnings.unshift(`诏书解析未完成，已改用本地规则：${caught instanceof Error ? caught.message : '连接失败'}`);
    } finally {
      if (showBusy) setAIBusy('');
    }
    parsed.summary = localizeDisplayText(parsed.summary);
    parsed.warnings = parsed.warnings.map(localizeDisplayText);
    setInterpretation(parsed);
    setPolicyIds(parsed.policyIds);
    if (parsed.officerId) setOfficerId(parsed.officerId);
    setError(parsed.policyIds.length ? '' : parsed.warnings[0] ?? '中书未能理解诏意。');
    return parsed;
  }

  async function settle(preparedInterpretation = interpretation, preparedPolicyIds = policyIds, preparedOfficerId = officerId, showBusy = true) {
    setError('');
    try {
      if (!preparedInterpretation || preparedInterpretation.sourceText !== edictText.trim()) {
        throw new Error('诏书尚未经中书拟旨，请先确认系统理解。');
      }
      const preparedPolicies = preparedPolicyIds.map((id) => policies.find((item) => item.id === id)!).filter(Boolean);
      const preparedOfficer = officers.find((item) => item.id === preparedOfficerId) ?? officer;
      const next = settleTurn(state, { policyIds: preparedPolicyIds, officerId: preparedOfficerId, edictNote: edictText });
      let narrative: HistoricalNarrative | undefined;
      let aiError: string | undefined;
      if (inferenceConfig.apiKey) {
        if (showBusy) setAIBusy('史官正在推演朝廷、州县与民间反应');
        try {
          narrative = localizeHistoricalNarrative(await narrateSettlementRemote({
            edict: edictText, stateBefore: state, stateAfter: next.state, event: next.event, officer: preparedOfficer,
            policies: preparedPolicies, record: next.record, history: state.history, config: inferenceConfig,
          }));
        } catch (caught) {
          aiError = caught instanceof Error ? caught.message : '史实推演连接失败';
        } finally {
          if (showBusy) setAIBusy('');
        }
      }
      if (narrative) next.record.aiSummary = narrative.situationUpdate || narrative.report.slice(0, 240);
      setDilemmaBaseline(state.dilemmas);
      setState(next.state);
      setResult({ event: next.event, record: next.record, ...(narrative ? { narrative } : {}), ...(aiError ? { aiError } : {}) });
      setPolicyIds([]);
      setAdvisorPolicyIds(null);
      setAdvisorDraftActive(false);
      setEdictText('');
      setInterpretation(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '本回合无法结算。');
    }
  }

  async function issueEdict() {
    setAIBusy('正在拟旨、用玺并推演半年施政');
    try {
      let parsed = advisorPolicyIds?.length
        ? {
            sourceText: edictText.trim(),
            policyIds: advisorPolicyIds,
            officerId: null,
            summary: `辅政官已将诏意限定为：${advisorPolicyIds.map((id) => policies.find((item) => item.id === id)?.name).filter(Boolean).join('、')}。`,
            warnings: [],
          }
        : await interpretEdict(false);
      if (advisorDraftActive && parsed.policyIds.length > 2) {
        parsed = {
          ...parsed,
          policyIds: parsed.policyIds.slice(0, 2),
          warnings: [...parsed.warnings, '辅政草诏本回合只保留一项主政务与一项配套政务，其余措施留待后续回合。'],
        };
      }
      if (advisorPolicyIds?.length) {
        setInterpretation(parsed);
        setPolicyIds(parsed.policyIds);
      }
      if (!parsed.policyIds.length) return;
      await settle(parsed, parsed.policyIds, parsed.officerId ?? officerId, false);
    } finally {
      setAIBusy('');
    }
  }

  function restart() {
    setState(createInitialState()); setPolicyIds([]); setEdictText(''); setAdvisorPolicyIds(null); setAdvisorDraftActive(false); setInterpretation(null); setOfficerId(officers[0]?.id ?? '');
    setDilemmaBaseline(null); setFocusedDilemmaId(null); setPanel(null); setResult(null); setError('');
  }

  return <main className="game-root">
    <GameScreen
      state={state}
      selectedCrisisId={focusedDilemmaId}
      onSelectCrisis={setFocusedDilemmaId}
      onOpenDilemmas={() => showDilemmas()}
      onOpenEdict={() => setPanel('edict')}
      onOpenCourt={() => setPanel('court')}
      onOpenArchive={() => { setArchiveReturnsToEdict(false); setPanel('archive'); }}
      onOpenRecords={() => setPanel('records')}
      onOpenSaves={() => setPanel('saves')}
    />

    {panel && <Drawer title={panelTitles[panel]} kind={panel} variant="workspace" onClose={() => { if (panel === 'dilemmas') setDilemmaBaseline(null); if (panel === 'archive' && archiveReturnsToEdict) { setArchiveReturnsToEdict(false); setPanel('edict'); } else setPanel(null); }}>
      {panel === 'dilemmas' && <Dilemmas state={state} baseline={dilemmaBaseline} onDraft={() => { setDilemmaBaseline(null); setPanel('edict'); }} />}
      {panel === 'court' && <CourtAppointments state={state} onAppoint={(officeKey, postKey, appointeeId) => setState((current) => appointCourtOfficer(current, officeKey, postKey, appointeeId))} onDismiss={(officeKey, postKey) => setState((current) => dismissCourtOfficer(current, officeKey, postKey))} />}
      {panel === 'archive' && <OfficerArchive selectedOfficerId={officerId} onAppoint={(id) => { setOfficerId(id); setArchiveReturnsToEdict(false); setPanel('edict'); }} />}
      {panel === 'records' && <Records state={state} />}
      {panel === 'saves' && <SaveArchive state={state} officerId={officerId} onLoad={(savedState, savedOfficerId) => {
        setState(savedState); setOfficerId(savedOfficerId); setPolicyIds([]); setEdictText(''); setAdvisorPolicyIds(null); setAdvisorDraftActive(false);
        setInterpretation(null); setDilemmaBaseline(null); setFocusedDilemmaId(null); setResult(null); setError(''); setPanel(null);
      }} />}
      {panel === 'edict' && <div className="edict-stage">
        <div className="edict-advisor-column">
          <AdvisorWorkspace state={state} event={event} officer={officer} currentEdict={edictText} config={advisorConfig} onAdopt={adoptAdvisorEdict} setBusy={setAIBusy} />
        </div>
        <div className="edict-workspace">
          <div className="edict-composer">
            <div className="composer-heading">
              <p>诏令正文</p>
              <div className="composer-tools"><button type="button" onClick={() => { setArchiveReturnsToEdict(true); setPanel('archive'); }}><Users size={15} />承办官：{officer.name}</button></div>
            </div>
            <textarea
              aria-label="御前诏令正文"
              value={edictText}
              onChange={(e) => updateEdict(e.target.value)}
              placeholder="可同时处理财政、民生、军事、任免、制度与地方执行。例如：命司马光查京东青苗抑配，灾伤州县缓征，并裁减宫观营造补其岁入。"
            />
          </div>
          {error && <strong className="panel-error">{error}</strong>}
          <button className="seal-action panel-seal" type="button" onClick={issueEdict} disabled={state.ended || !edictText.trim()}><span>用玺</span><small>颁行诏令</small></button>
        </div>
      </div>}
    </Drawer>}
    {result && !state.ending && <Result result={result} state={state} onClose={() => { setResult(null); showDilemmas(dilemmaBaseline); }} />}
    {aiBusy && <AIBusy title={aiBusy} />}
    {state.ending && <EndingScreen state={state} onRestart={restart} />}
  </main>;
}

function Indicator({ type, value }: { type: IndicatorKey; value: number }) {
  const meta = indicatorMeta[type]; const Icon = meta.icon; const tone = value < 30 ? 'critical' : value < 50 ? 'strained' : 'stable';
  return <div className={`indicator ${tone}`}><div><Icon size={15} /><span>{meta.label}</span><strong>{value}</strong></div><div className="track"><i style={{ width: `${value}%` }} /></div></div>;
}

function EndingScreen({ state, onRestart }: { state: GameState; onRestart: () => void }) {
  const ending = state.ending!;
  const visual = endingVisuals[ending.id as keyof typeof endingVisuals] ?? endingVisuals['unfinished-history'];
  const completedObjectives = state.objectives.filter((objective) => objective.completed).length;
  const metrics = (Object.keys(indicatorMeta) as IndicatorKey[]).map((key) => ({ key, label: indicatorMeta[key].label, value: state.indicators[key] }));

  return <div className={`modal ending-layer ending-${ending.id}`} role="dialog" aria-modal="true" aria-labelledby="ending-title">
    <section className="ending-chronicle">
      <div className="ending-mark" aria-hidden="true"><span>{visual.mark}</span></div>
      <header className="ending-heading">
        <p>熙宁初政 · 施政终卷</p>
        <small>{visual.kicker}</small>
        <h2 id="ending-title">{ending.title}</h2>
        <blockquote>{visual.verdict}</blockquote>
      </header>
      <div className="ending-score"><strong>{ending.score}</strong><span>史官总评</span></div>
      <p className="ending-description">{ending.description}</p>
      <div className="ending-metrics" aria-label="终局国势">
        {metrics.map((metric) => <div key={metric.key}><span>{metric.label}</span><i><b style={{ width: `${metric.value}%` }} /></i><strong>{metric.value}</strong></div>)}
      </div>
      <footer className="ending-legacy">
        <span>历经 <strong>{state.history.length}</strong> 回合</span>
        <span>完成国策 <strong>{completedObjectives}</strong> / {state.objectives.length}</span>
      </footer>
      <button type="button" onClick={onRestart}><RotateCcw size={18} />重新开局</button>
    </section>
  </div>;
}

function Drawer({ title, children, onClose, variant = 'default', kind }: { title: string; children: ReactNode; onClose: () => void; variant?: 'default' | 'workspace'; kind?: Exclude<PanelName, null> }) {
  return <div className={`drawer-layer ${variant === 'workspace' ? 'workspace-layer' : ''}${kind ? ` drawer-layer-${kind}` : ''}`} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><section className={`drawer ${variant === 'workspace' ? 'drawer-workspace' : ''}${kind ? ` drawer-${kind}` : ''}`}><header><div><p>御前案牍</p><h2>{title}</h2></div><button type="button" onClick={onClose} aria-label="关闭"><X /></button></header><div className="drawer-scroll">{children}</div></section></div>;
}

function Dilemmas({ state, baseline, onDraft }: { state: GameState; baseline: DilemmaProgress[] | null; onDraft: () => void }) {
  const pageSize = 5;
  const labels = { structural: '结构性积弊', urgent: '当期急务', reform: '改革后遗症' } as const;
  const previous = new Map(baseline?.map((item) => [item.id, item]));
  const items = state.dilemmas.map((item) => {
    const old = previous.get(item.id);
    const delta = old ? item.severity - old.severity : 0;
    const status: DilemmaChange | null = baseline && item.category !== 'urgent' ? (!old ? 'new' : delta >= 3 ? 'worse' : delta <= -3 ? 'eased' : null) : null;
    return { ...item, status, delta };
  });
  const resolved = (baseline ?? []).filter((item) => item.category !== 'urgent' && !state.dilemmas.some((current) => current.id === item.id)).map((item) => ({ ...item, severity: 0, status: 'resolved' as DilemmaChange, delta: -item.severity }));
  const statusLabels = { new: '新生', worse: '恶化', eased: '缓解', resolved: '已解决' } as const;
  const displayed = [...items, ...resolved];
  const [page, setPage] = useState(0);
  const pagination = paginate(displayed, page, pageSize);
  const { items: pageItems, page: visiblePage, pageCount } = pagination;
  useEffect(() => setPage(0), [baseline]);
  useEffect(() => setPage((current) => Math.min(current, pageCount - 1)), [pageCount]);
  const renderDilemma = (item: (typeof displayed)[number], slot: number) => <article key={item.id} className={`dilemma-card dilemma-slot-${slot} ${item.category} ${item.status ?? ''}`}>
    <div className="dilemma-copy">
      <header><span>{labels[item.category]}</span>{item.status && <em>{statusLabels[item.status]}</em>}</header>
      <h3>{item.title}</h3>
      <p>{item.description}</p>
      <small><b>改革方向</b>{item.status === 'resolved' ? '当前条件下，此项困境已经消退。' : item.reformDirection}</small>
    </div>
    <strong className="dilemma-seal"><small>严重度</small>{item.severity}<i>{item.status && item.status !== 'new' && item.delta !== 0 ? `${item.delta > 0 ? '+' : ''}${item.delta}` : ''}</i></strong>
  </article>;
  return <div className="dilemma-book dilemma-panel">
    <header className="dilemma-book-heading"><div><span>御前案牍</span><h2>北宋当前困境</h2></div><p>{baseline ? '半年施政已结算。以下是改革之后的天下新局，变化较大的困境已作标记。' : '改革的目标是化解这些困境，而非单纯推满数值。新法若设计或执行失当，也会产生新的困境。'}</p></header>
    <div className="dilemma-list" aria-live="polite">{pageItems.map(renderDilemma)}</div>
    {pageCount > 1 && <nav className="dilemma-pagination" aria-label="困境翻页">
      <button type="button" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={visiblePage === 0}>‹ 上一页</button>
      <strong>{visiblePage + 1} / {pageCount}</strong>
      <button type="button" onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} disabled={visiblePage === pageCount - 1}>下一页 ›</button>
    </nav>}
    <button className="event-draft-action" type="button" onClick={onDraft}><ScrollText size={18} />据当前困境拟诏</button>
  </div>;
}

function CourtAppointments({ state, onAppoint, onDismiss }: {
  state: GameState;
  onAppoint: (officeKey: CourtOfficeKey, postKey: CourtPostKey, officerId: string) => void;
  onDismiss: (officeKey: CourtOfficeKey, postKey: CourtPostKey) => void;
}) {
  const [selectedOfficeKey, setSelectedOfficeKey] = useState<CourtOfficeKey>(state.polity.offices[0]?.key ?? 'secretariat');
  const selectedOffice = state.polity.offices.find((office) => office.key === selectedOfficeKey) ?? state.polity.offices[0]!;
  const [selectedPostKey, setSelectedPostKey] = useState<CourtPostKey>(selectedOffice.posts[0]!.key);
  const selectedPost = selectedOffice.posts.find((post) => post.key === selectedPostKey) ?? selectedOffice.posts[0]!;
  const availableCandidates = useMemo(
    () => officers.filter((officer) => !isCourtOfficerAppointed(state, officer.id)),
    [state],
  );
  const [candidateId, setCandidateId] = useState(availableCandidates[0]?.id ?? '');
  const [candidateOpen, setCandidateOpen] = useState(false);

  useEffect(() => {
    setCandidateId((current) => (
      availableCandidates.some((officer) => officer.id === current)
        ? current
        : availableCandidates[0]?.id ?? ''
    ));
    setCandidateOpen(false);
  }, [availableCandidates, selectedPost.key]);

  const selectedCandidate = availableCandidates.find((item) => item.id === candidateId);
  const selectOffice = (officeKey: CourtOfficeKey) => {
    const office = state.polity.offices.find((item) => item.key === officeKey);
    if (!office) return;
    setSelectedOfficeKey(officeKey);
    setSelectedPostKey(office.posts[0]!.key);
  };

  return <div className="court-polity court-polity-screen">
    <img className="court-panel-layer court-roster-layer" src={assetUrl('assets/decorations/appointment-roster-panel-v4.png')} alt="" aria-hidden="true" />
    <img className="court-panel-layer court-assign-layer" src={assetUrl('assets/decorations/appointment-assign-panel-v3.png')} alt="" aria-hidden="true" />
    <header className="court-screen-title">
      <span>御前案牍</span>
      <h2>铨选 · 朝廷官制</h2>
      <p>两府、三司、台谏与诸路各有职掌。点选机构和核心官职，再从官员簿中改授或罢免现任。</p>
    </header>
    <div className="court-chart" aria-label="朝廷官制关系图">
      <div className="court-previous-seal" aria-hidden="true">
        <img src={assetUrl('assets/decorations/appointment-center-seal-v1.png')} alt="" />
      </div>
      <img
        className="court-fixed-overlay"
        src={assetUrl('assets/decorations/appointments-chart-fixed-overlay-v1.svg')}
        alt=""
        aria-hidden="true"
      />
      <div className="court-center-label"><span>御前中枢</span></div>
      {state.polity.offices.map((office) => {
        const principalPost = office.posts[0]!;
        const incumbent = principalPost.appointeeId ? officers.find((item) => item.id === principalPost.appointeeId) : null;
        const filledPosts = office.posts.filter((post) => post.appointeeId).length;
        return <button
          className={`court-office-node office-${office.key}${selectedOfficeKey === office.key ? ' active' : ''}${filledPosts ? '' : ' vacant'}`}
          key={office.key}
          type="button"
          data-office-key={office.key}
          data-selected={selectedOfficeKey === office.key}
          onClick={() => selectOffice(office.key)}
          aria-pressed={selectedOfficeKey === office.key}
        >
          <strong>{office.name}</strong>
          <small>{principalPost.title}</small>
          <b>{incumbent?.name ?? '虚位'}</b>
          <em>核心席位 {filledPosts}/{office.posts.length}</em>
        </button>;
      })}
    </div>
    <aside className="court-roster">
      <header><h3>{selectedOffice.name} · 官员簿</h3><p>{selectedOffice.scope}</p></header>
      <div className="court-roster-list">
        {selectedOffice.posts.map((post) => {
          const incumbent = post.appointeeId ? officers.find((item) => item.id === post.appointeeId) : null;
          return <button
            key={post.key}
            type="button"
            className={selectedPost.key === post.key ? 'active' : ''}
            aria-pressed={selectedPost.key === post.key}
            aria-label={`${post.title}，${incumbent?.name ?? '虚位'}`}
            onClick={() => setSelectedPostKey(post.key)}
          >
            <span>{post.title}</span><strong>{incumbent?.name ?? '虚位'}</strong><i aria-hidden="true" />
          </button>;
        })}
      </div>
    </aside>
    <section className="court-assign">
      <h3>铨选此职</h3>
      <dl>
        <div><dt>所选官职</dt><dd>{selectedPost.title}</dd></div>
        <div><dt>拟授人选</dt><dd className="court-candidate-cell">
          <div className={`court-candidate-picker${candidateOpen ? ' open' : ''}`}>
            <button
              className="court-candidate-trigger"
              type="button"
              aria-label="拟授人选"
              aria-haspopup="listbox"
              aria-expanded={candidateOpen}
              disabled={!availableCandidates.length}
              onClick={() => setCandidateOpen((open) => !open)}
            >
              <span>{selectedCandidate?.name ?? '请选择官员'}</span>
              <i aria-hidden="true" />
            </button>
            {candidateOpen && <div className="court-candidate-list" role="listbox" aria-label="官员候选名单">
              {availableCandidates.map((item) => <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={candidateId === item.id}
                className={candidateId === item.id ? 'selected' : ''}
                onClick={() => {
                  setCandidateId(item.id);
                  setCandidateOpen(false);
                }}
              ><strong>{item.name}</strong><span>待任 · {item.specialtyTags.map((tag) => tagLabels[tag]).join('、')}</span></button>)}
            </div>}
          </div>
        </dd></div>
      </dl>
      <div>
        <button className="court-appoint" type="button" disabled={!selectedCandidate} onClick={() => selectedCandidate && onAppoint(selectedOffice.key, selectedPost.key, selectedCandidate.id)}><span>改授</span></button>
        <button className="court-dismiss" type="button" disabled={!selectedPost.appointeeId} onClick={() => onDismiss(selectedOffice.key, selectedPost.key)}><span>罢免</span></button>
      </div>
    </section>
  </div>;
}

function OfficerArchive({ selectedOfficerId, onAppoint }: { selectedOfficerId: string; onAppoint: (id: string) => void }) {
  const pageSize = 8;
  type ArchiveCategory = 'all' | 'central' | 'censor' | 'finance' | 'relief' | 'military' | 'institution';
  const categoryOptions: Array<{ id: ArchiveCategory; label: string; description: string; matches: (officer: Officer) => boolean }> = [
    { id: 'all', label: '全部人物', description: '汇集本局可查阅人物；以下门类依据官署职掌与施政经历编排，同一人物可能兼见数类。', matches: () => true },
    { id: 'central', label: '宰执中枢', description: '参与中书、门下与枢密院等中央决策机构，负责议政、制令、协调文武及统摄朝廷政务。', matches: (officer) => /参知政事|同中书门下|枢密|翰林学士承旨/.test(officer.role) },
    { id: 'censor', label: '台谏监察', description: '包括御史与谏官，负责纠察百官、审核政令得失和进谏；其奏劾属于待核实的政治指控，并非定罪。', matches: (officer) => /御史|谏院|台谏/.test(officer.role) },
    { id: 'finance', label: '财计', description: '涉及三司财赋、青苗市易、钱粮核算与国家收支，关注财政能否支撑军政、赈济及长期制度。', matches: (officer) => officer.specialtyTags.includes('finance') },
    { id: 'relief', label: '民政', description: '处理赈灾、差役、赋税负担与地方治理，重点考察政令抵达州县后对民户产生的实际影响。', matches: (officer) => officer.specialtyTags.includes('relief') },
    { id: 'military', label: '边务', description: '涉及枢密军政、西北经略、军储寨堡与将兵调度，兼顾战守方略、后勤成本及边地治理。', matches: (officer) => officer.specialtyTags.includes('military') },
    { id: 'institution', label: '制度', description: '参与法令设计、官署整顿与改革推行，关注制度如何制定、试行、考课，以及州县执行中的变形风险。', matches: (officer) => officer.specialtyTags.includes('reform') },
  ];
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ArchiveCategory>('all');
  const [page, setPage] = useState(0);
  const [activeId, setActiveId] = useState(selectedOfficerId || officers[0]?.id || '');
  const [sourceIndex, setSourceIndex] = useState<number | null>(null);
  const activeCategory = categoryOptions.find((option) => option.id === category) ?? categoryOptions[0]!;
  const filtered = useMemo(() => officers.filter((item) => {
    const haystack = `${item.name}${item.courtesyName}${item.origin}${item.role}${item.stance}${item.biography}${item.publicReputation}`;
    return activeCategory.matches(item) && haystack.includes(query.trim());
  }), [category, query]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const active = filtered.find((item) => item.id === activeId) ?? pageItems[0] ?? null;
  const activeIndex = active ? filtered.findIndex((item) => item.id === active.id) : -1;
  const activeSourceIndex = sourceIndex ?? 0;
  const activeSource = active && sourceIndex !== null ? active.sources[activeSourceIndex] ?? null : null;
  const goToPage = (nextPage: number) => {
    const target = Math.max(0, Math.min(pageCount - 1, nextPage));
    setPage(target);
    setActiveId(filtered[target * pageSize]?.id ?? '');
  };
  const goToPerson = (nextIndex: number) => {
    const target = Math.max(0, Math.min(filtered.length - 1, nextIndex));
    const next = filtered[target];
    if (!next) return;
    setActiveId(next.id);
    setPage(Math.floor(target / pageSize));
  };

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  useEffect(() => setSourceIndex(null), [active?.id]);

  return <div className="archive-browser archive-book-screen">
    <header className="archive-book-title"><h2>秘阁人物志</h2><span>熙丰人物档案</span></header>
    <div className="archive-tools"><label><Search size={20} /><input aria-label="检索秘阁人物" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); setActiveId(''); }} placeholder="检索人物、籍贯、官职或政见" /></label></div>
    <nav className="archive-groups" aria-label="人物职掌索引">{categoryOptions.map((item) => { const count = officers.filter(item.matches).length; return <button key={item.id} type="button" className={category === item.id ? 'active' : ''} onClick={() => { setCategory(item.id); setPage(0); setActiveId(''); }}><span>{item.label}</span><small>{count}</small></button>; })}</nav>
    <aside className="archive-side-tabs" aria-label="秘阁目录"><span className="active">人物</span><span>籍贯</span><span>官职</span><span>政见</span></aside>
    <div className="archive-count"><strong>人物目录</strong><span>{activeCategory.label} · {filtered.length} 人</span></div>
    <div className="archive-index">{pageItems.map((item) => <button key={item.id} type="button" className={active?.id === item.id ? 'active' : ''} onClick={() => setActiveId(item.id)}><img src={officerPortraitUrl(item.name)} alt="" aria-hidden="true" loading="lazy" /><span><strong>{item.name}</strong><small>{item.role}</small></span><em>{item.stance}</em></button>)}</div>
    <nav className="archive-index-pagination" aria-label="人物目录翻页">
      <button type="button" disabled={safePage === 0} onClick={() => goToPage(safePage - 1)} aria-label="上一页">↑</button>
      <strong>{safePage + 1} / {pageCount}</strong>
      <button type="button" disabled={safePage >= pageCount - 1} onClick={() => goToPage(safePage + 1)} aria-label="下一页">↓</button>
    </nav>
    {active && <article className="archive-detail">
      <header><figure className="archive-portrait"><img src={officerPortraitUrl(active.name)} alt={`${active.name}半身画像`} /></figure><div><div className="archive-role-line"><span><b>史实职衔</b>{active.role}</span><span><b>立场</b>{active.stance}</span></div><h3>{active.name}</h3><p>字 {active.courtesyName}</p><p>{active.lifespan} · {active.origin}</p><div className="archive-identity-lower"><div className="archive-tag-row">{active.specialtyTags.map((tag) => <b key={tag}>{officerTagLabels[tag]}</b>)}</div><blockquote className="archive-verdict"><p>{active.verdict}</p></blockquote></div><section className="archive-overview"><p>{active.historicalSignificance}</p></section></div></header>
      <div className="archive-profile-grid">
        <section><h4>历史地位</h4><ul>{active.whyImportant.map((item) => <li key={item}>{item}</li>)}</ul></section>
        <section><h4>主要事迹</h4><ul>{active.majorContributions.map((item) => <li key={item}>{item}</li>)}</ul></section>
        <section className={`archive-timeline${active.timeline.length <= 2 ? ' sparse' : ''}`}><h4>生平节点</h4><ol>{active.timeline.map((item) => <li key={`${item.year}-${item.event}`}><b>{item.year}</b><span>{item.event}</span></li>)}</ol></section>
        <section className="archive-evaluation"><h4>历史争议</h4><p>{active.publicReputation}</p></section>
      </div>
      <section className="archive-source-teaser"><div><h4>原典全文</h4><p>{active.sources.length ? `收录 ${active.sources.length} 篇完整原文，附史料背景、白话说明与阅读提示。` : '该人物的完整原典正在校勘整理。'}</p></div><div className="archive-source-actions"><button type="button" disabled={!active.sources.length} onClick={() => setSourceIndex(0)}>{active.sources.length ? '阅读全文' : '整理中'}</button><button className="archive-appoint-officer" type="button" disabled={active.id === selectedOfficerId} onClick={() => onAppoint(active.id)}>{active.id === selectedOfficerId ? '当前承办官' : '任命承办官'}</button></div></section>
      <nav className="archive-person-pagination" aria-label="人物翻页">
        <button type="button" disabled={activeIndex <= 0} onClick={() => goToPerson(activeIndex - 1)}>‹ 上一个</button>
        <strong>{activeIndex + 1} / {filtered.length}</strong>
        <button type="button" disabled={activeIndex < 0 || activeIndex >= filtered.length - 1} onClick={() => goToPerson(activeIndex + 1)}>下一个 ›</button>
      </nav>
    </article>}
    {active && activeSource && <div className="archive-source-backdrop" role="dialog" aria-modal="true" aria-label={`${active.name}史料摘录`}>
      <article className="archive-source-reader">
        <header><div><span>{activeSource.type}</span><h3>{active.name} · {activeSource.title}</h3></div><button type="button" aria-label="关闭史料" onClick={() => setSourceIndex(null)}><X size={22} /></button></header>
        <p className="archive-source-context">史料背景 · {activeSource.context}</p>
        <div className="archive-source-body">
          <section className="archive-source-original"><h4>原文全文</h4><div>{activeSource.fullText.split(/\n{2,}/).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></section>
          <aside className="archive-source-notes"><section><h4>白话说明</h4><p>{activeSource.translation}</p></section><section><h4>阅读提示</h4><p>{activeSource.significance}</p></section><section><h4>核心摘句</h4><p>{activeSource.excerpt}</p></section></aside>
        </div>
        <footer><small>{activeSource.citation}</small><nav aria-label="史料翻页"><button type="button" disabled={activeSourceIndex <= 0} onClick={() => setSourceIndex(Math.max(0, activeSourceIndex - 1))}>‹ 上一则</button><strong>{activeSourceIndex + 1} / {active.sources.length}</strong><button type="button" disabled={activeSourceIndex >= active.sources.length - 1} onClick={() => setSourceIndex(Math.min(active.sources.length - 1, activeSourceIndex + 1))}>下一则 ›</button></nav></footer>
      </article>
    </div>}
    {!active && <section className="archive-empty-detail"><LibraryBig size={42} /><span>人物志尚未展开</span><p>{filtered.length ? '请从左侧名录选择一位人物，阅览其生平、政见、争议与本局履历。' : '当前分类中没有符合检索条件的人物。'}</p></section>}
  </div>;
}

function Records({ state }: { state: GameState }) {
  const latestTurn = state.history.at(-1)?.turn ?? state.turn;
  const [selectedTurn, setSelectedTurn] = useState(latestTurn);
  useEffect(() => setSelectedTurn(latestTurn), [latestTurn]);

  const recordsByTurn = new Map(state.history.map((record) => [record.turn, record]));
  const selected = recordsByTurn.get(selectedTurn);
  const completedTurns = state.history.map((record) => record.turn);
  const selectedIndex = completedTurns.indexOf(selectedTurn);
  const previousTurn = selectedIndex > 0 ? completedTurns[selectedIndex - 1] ?? null : null;
  const nextTurn = selectedIndex >= 0 && selectedIndex < completedTurns.length - 1 ? completedTurns[selectedIndex + 1] ?? null : null;
  const turnDate = (turn: number) => formatGameDate({ reignYear: 2 + Math.floor((turn - 1) / 2), half: turn % 2 === 1 ? 1 : 2 });
  const edictLines = selected?.edictText
    ? selected.edictText.split(/[。；\n]+/).map((line) => line.trim()).filter(Boolean).slice(0, 3)
    : selected?.policyIds.map((id) => policies.find((item) => item.id === id)?.name).filter((name): name is string => Boolean(name)) ?? [];
  const resourceLabels = { treasury: '国库', politicalCapital: '政略', administration: '行政' } as const;
  const settlement = selected ? [
    ...Object.entries(selected.resourceChanges).map(([key, value]) => `${resourceLabels[key as keyof typeof resourceLabels]} ${Number(value) > 0 ? '+' : ''}${value}`),
    ...effectText(selected.indicatorChanges),
  ] : [];

  return <div className="records-book">
    <section className="records-index-page" aria-label="回合目录">
      <header><h2>熙宁起居注</h2><p>回合纪年</p></header>
      <h3>回合目录</h3>
      <div className="records-timeline">
        {Array.from({ length: state.maxTurns }, (_, index) => {
          const turn = index + 1;
          const record = recordsByTurn.get(turn);
          const active = turn === selectedTurn;
          return <button key={turn} type="button" className={`${active ? 'active' : ''}${record ? ' recorded' : ' future'}`} disabled={!record} onClick={() => setSelectedTurn(turn)}>
            <i>{turn}</i><strong>第{numerals[turn] ?? turn}回</strong><span>{record ? formatGameDate(record.date) : turnDate(turn)}</span>
          </button>;
        })}
      </div>
    </section>

    <section className="records-detail-page" aria-live="polite">
      <header>
        <h2>第{numerals[selectedTurn] ?? selectedTurn}回</h2>
        <p>{selected ? formatGameDate(selected.date) : turnDate(selectedTurn)}</p>
        {selectedTurn === latestTurn && <em>当前</em>}
      </header>
      {selected ? <div className="records-detail-scroll">
        <section><h3>本回纪要</h3><p>· {selected.aiSummary ? localizeDisplayText(selected.aiSummary) : `围绕「${selected.eventTitle}」颁行诏令，交付有司与州县施行。`}</p>{selected.administrativeOverload > 0 && <p>· 行政超载 {selected.administrativeOverload}，部分政令在传达中延宕变形。</p>}{selected.politicalOverdraft > 0 && <p>· 政略透支 {selected.politicalOverdraft}，诏令虽已颁行，但士论与执行受到额外损耗。</p>}</section>
        <section><h3>颁行诏令</h3>{edictLines.length ? edictLines.map((line) => <p key={line}>· {line}。</p>) : <p>· 本回未留下诏令正文。</p>}</section>
        <section><h3>半年结算</h3><p>· {selected.eventTitle}</p><div className="records-settlement">{settlement.length ? settlement.map((item) => <strong key={item}>{item}</strong>) : <span>诸项无显著变动</span>}</div></section>
      </div> : <div className="records-unwritten"><BookOpenText /><strong>此回尚未载录</strong><p>待半年政务结算后，史官将在此补记诏令与朝局变化。</p></div>}
      <nav className="records-pagination" aria-label="起居注翻页">
        <button type="button" disabled={previousTurn === null} onClick={() => previousTurn !== null && setSelectedTurn(previousTurn)}>‹ <span>上一回</span></button>
        <strong>{selectedTurn} / {state.maxTurns}</strong>
        <button type="button" disabled={nextTurn === null} onClick={() => nextTurn !== null && setSelectedTurn(nextTurn)}><span>下一回</span> ›</button>
      </nav>
    </section>
  </div>;
}

function AdvisorWorkspace({ state, event, officer, currentEdict, config, onAdopt, setBusy }: { state: GameState; event: HistoricalEvent; officer: Officer; currentEdict: string; config: AIConfig; onAdopt: (text: string, policyIds: string[]) => void; setBusy: (text: string) => void }) {
  const [question, setQuestion] = useState('请结合当前困境，分析我应优先处理什么，并拟一份兼顾执行与民生的诏书。');
  const [advice, setAdvice] = useState<AdvisorAdvice | null>(null);
  const [advisorError, setAdvisorError] = useState('');

  async function consult() {
    if (!config.apiKey) {
      setAdvisorError('尚未配置推演密钥，请先完成模型配置。');
      return;
    }
    setAdvisorError('');
    setBusy('辅政官正在参详天下格局');
    try {
      setAdvice(localizeAdvisorAdvice(await consultAdvisorRemote({ question, currentEdict, state, event, officer, policies, config })));
    } catch (caught) {
      setAdvisorError(caught instanceof Error ? caught.message : '辅政官未能完成参详。');
    } finally {
      setBusy('');
    }
  }

  return <section className="advisor-workspace">
    <header><div><span>颁诏前咨询 · 御前参详</span><h3>{advice ? '格局判断' : '辅政官'}</h3></div><small>{config.model}</small></header>
    <p>{advice ? '辅政官已据当前国势参详利害，以下判断与草诏仍由陛下裁定。' : '辅政官以儒家治道为纲，比较路线利害权衡轻重；是否采用、如何修改、何时用玺仍由陛下裁定。'}</p>
    <div className="advisor-question"><textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="例如：国库不足、州县抑配并起，我该先查吏还是先筹钱？" /><button type="button" onClick={consult}>召来参详</button></div>
    {advisorError && <strong className="advisor-error">{advisorError}</strong>}
    {advice && <>
      <div className="advisor-answer"><p>{advice.situation}</p>{advice.priorities.length > 0 && <div className="chips light">{advice.priorities.map((item) => <span key={item}>{item}</span>)}</div>}<div className="advisor-routes">{advice.options.map((item) => <article key={item.title}><strong>{item.title}</strong><span>可得：{item.benefit}</span><small>代价：{item.risk}</small></article>)}</div>{advice.cautions.length > 0 && <div className="advisor-cautions">{advice.cautions.map((item) => <p key={item}>· {item}</p>)}</div>}<div className="advisor-draft"><h4>辅政草诏</h4><pre>{advice.draftEdict}</pre></div></div>
      <button className="advisor-adopt" type="button" onClick={() => onAdopt(advice.draftEdict, advice.policyIds)}>置入御案，继续修改</button>
    </>}
  </section>;
}

interface StoredGame {
  version: 1;
  savedAt: string;
  state: GameState;
  officerId: string;
}

const saveSlotKey = (slot: number) => `xifeng-save-slot-${slot}`;

function readSaveSlot(slot: number): StoredGame | null {
  try {
    const saved = JSON.parse(localStorage.getItem(saveSlotKey(slot)) || 'null') as StoredGame | null;
    return saved?.version === 1 && saved.state && typeof saved.state.turn === 'number' ? saved : null;
  } catch {
    return null;
  }
}

function SaveArchive({ state, officerId, onLoad }: { state: GameState; officerId: string; onLoad: (state: GameState, officerId: string) => void }) {
  const [revision, setRevision] = useState(0);
  const [notice, setNotice] = useState('');
  const slots = useMemo(() => [1, 2, 3].map((slot) => ({ slot, saved: readSaveSlot(slot) })), [revision]);

  const writeSlot = (slot: number) => {
    const saved: StoredGame = { version: 1, savedAt: new Date().toISOString(), state: structuredClone(state), officerId };
    localStorage.setItem(saveSlotKey(slot), JSON.stringify(saved));
    setRevision((value) => value + 1);
    setNotice(`存档 ${slot} 已写入。`);
  };

  const clearSlot = (slot: number) => {
    if (!window.confirm(`确认清除存档 ${slot}？`)) return;
    localStorage.removeItem(saveSlotKey(slot));
    setRevision((value) => value + 1);
    setNotice(`存档 ${slot} 已清除。`);
  };

  return <section className="save-archive">
    <header><div><span>御前封识 · 施政卷宗</span><h3>御前存档</h3></div></header>
    <div className="save-current"><span>当前御案</span><h4>{state.ending?.title ?? formatGameDate(state.date)}</h4><p>第 {state.turn} / {state.maxTurns} 回合</p><small>国库 {state.resources.treasury.toLocaleString()}万贯　政略 {state.resources.politicalCapital}　行政 {state.resources.administration}</small></div>
    <div className="save-slot-list">
      {slots.map(({ slot, saved }) => <article className={saved ? 'is-filled' : 'is-empty'} key={slot}>
        <div className="save-slot-seal"><small>卷</small><strong>{slot}</strong></div>
        {saved ? <div className="save-slot-copy">
          <span>{saved.state.ended ? '终局卷宗' : formatGameDate(saved.state.date)}</span>
          <h4>{saved.state.ending?.title ?? `第 ${saved.state.turn} / ${saved.state.maxTurns} 回合`}</h4>
          <p>国库 {saved.state.resources.treasury.toLocaleString()}万贯 · 政略 {saved.state.resources.politicalCapital} · 行政 {saved.state.resources.administration}</p>
          <small>{new Date(saved.savedAt).toLocaleString('zh-CN', { hour12: false })}</small>
        </div> : <div className="save-slot-copy"><span>尚未封存</span><h4>空白卷宗</h4><p>可将当前进度写入此处。</p></div>}
        <div className="save-slot-actions">
          {saved && <button type="button" onClick={() => onLoad(structuredClone(saved.state), saved.officerId)}><ArchiveRestore size={17} />读取</button>}
          <button type="button" onClick={() => writeSlot(slot)}><Save size={17} />{saved ? '覆盖' : '保存'}</button>
          {saved && <button className="danger" type="button" aria-label={`清除存档 ${slot}`} onClick={() => clearSlot(slot)}><Trash2 size={16} />清除</button>}
        </div>
      </article>)}
    </div>
    <p className="save-notice" aria-live="polite">{notice || '读取存档会关闭当前卷宗界面；未保存的当前进度不会自动覆盖。'}</p>
  </section>;
}

function AISettings({ inferenceConfig, onSave }: { inferenceConfig: AIConfig; onSave: (inference: AIConfig) => void }) {
  const [inferenceDraft, setInferenceDraft] = useState(inferenceConfig);
  const [testStatus, setTestStatus] = useState('');
  const [testing, setTesting] = useState(false);
  const fixedConfig: AIConfig = { ...inferenceDraft, provider: 'deepseek', model: providerDefaults.deepseek.model, baseUrl: providerDefaults.deepseek.baseUrl };
  return <form className="ai-settings" onSubmit={(event) => { event.preventDefault(); onSave(fixedConfig); }}>
    <p className="settings-note">辅政官与推演史官共用一套已验证的 DeepSeek 配置。两个角色均固定使用 deepseek-v4-flash，以不同提示词区分职责，避免额外模型权限、思考模式和并发问题。API Key只保存在当前浏览器。</p>
    <label>模型厂商<input value="DeepSeek" readOnly /></label>
    <label>API Key<input type="password" value={inferenceDraft.apiKey} onChange={(event) => setInferenceDraft({ ...inferenceDraft, apiKey: event.target.value })} placeholder="sk-..." autoComplete="off" /></label>
    <label>Base URL<input value={providerDefaults.deepseek.baseUrl} readOnly /></label>
    <div className="dual-model-settings"><label><span>辅政官模型</span><small>格局分析与草诏</small><input value="deepseek-v4-flash" readOnly /></label><label><span>推演史官模型</span><small>诏意识别与半年推演</small><input value="deepseek-v4-flash" readOnly /></label></div>
    {testStatus && <p className={`connection-status ${testStatus.startsWith('连接成功') ? 'success' : 'failure'}`}>{testStatus}</p>}
    <div className="settings-actions three"><button type="button" onClick={() => { setInferenceDraft({ ...fixedConfig, apiKey: '' }); setTestStatus(''); }}>清空 Key</button><button type="button" disabled={testing || !inferenceDraft.apiKey} onClick={async () => { setTesting(true); setTestStatus(''); try { await testAIConnectionRemote(fixedConfig); setTestStatus('连接成功：辅政官与推演史官的共享模型已就绪'); } catch (caught) { setTestStatus(`连接失败：共享模型 deepseek-v4-flash：${caught instanceof Error ? caught.message : '未知错误'}`); } finally { setTesting(false); } }}>{testing ? '测试中…' : '测试共享模型'}</button><button type="submit">保存设置</button></div>
  </form>;
}

function AIBusy({ title }: { title: string }) {
  const phases = title.includes('辅政官')
    ? ['阅览天下奏报', '比较财用与民生取舍', '核对官员立场与执行风险', '整理可修改的草诏']
    : ['核对诏意与前情', '推演中书与部司承办', '追踪监司和州县落实', '汇总朝议与民间反应'];
  const [progress, setProgress] = useState(8);
  useEffect(() => {
    const timer = window.setInterval(() => setProgress((value) => value < 68 ? value + 3 : value < 88 ? value + 1 : Math.min(94, value + .25)), 500);
    return () => window.clearInterval(timer);
  }, []);
  const phase = Math.min(phases.length - 1, Math.floor(progress / 25));
  return <div className="ai-busy" role="status"><LoaderCircle /><span>{title}</span><small>{phases[phase]} · 数值仍由规则引擎裁定</small><div><i style={{ width: `${progress}%` }} /></div><em>总进度 {Math.round(progress)}%</em></div>;
}

function Result({ result, state, onClose }: {
  result: { event: HistoricalEvent; record: TurnRecord; narrative?: HistoricalNarrative; aiError?: string };
  state: GameState;
  onClose: () => void;
}) {
  const narrative = result.narrative ? localizeHistoricalNarrative(result.narrative) : undefined;
  const officer = officers.find((item) => item.id === result.record.officerId);
  const enactedPolicies = result.record.policyIds
    .map((id) => policies.find((item) => item.id === id))
    .filter((item): item is (typeof policies)[number] => Boolean(item));
  const reformDilemmas = state.dilemmas.filter((item) => item.category === 'reform').slice(0, 3);
  const changes = effectText(result.record.indicatorChanges);
  const report = narrative?.report
    || `${formatGameDate(result.record.date)}，御前据「${result.event.title}」颁下诏令，命${officer?.name ?? '有司主官'}承办。${enactedPolicies.map((item) => item.name).join('、') || '中书依诏分付有司'}，其成效与隐患均已按本回合规则结算。`;
  const situation = narrative?.situationUpdate
    || (reformDilemmas.length
      ? reformDilemmas.map((item) => `${item.title}（严重度 ${item.severity}）`).join('；')
      : '本回施政未产生新的改革后遗，朝廷仍须继续观察州县落实与朝议变化。');
  const implementation = narrative?.implementation.length
    ? narrative.implementation
    : [
      { stage: '政令下达', text: `御前颁下诏书，交${officer?.name ?? '承办官'}据诏施行。` },
      { stage: '中书覆奏', text: `中书门下将诏意拆为${enactedPolicies.map((item) => item.name).join('、') || '专项政务'}，核定承办次第。` },
      { stage: '部司承办', text: result.record.administrativeOverload > 0 ? `有司承办超出行政能力 ${result.record.administrativeOverload}，部分文移发生延宕。` : '有关部司依限具牒，调拨钱粮并交监司覆核。' },
      { stage: '州县落实', text: result.record.politicalOverdraft > 0 ? `政略透支 ${result.record.politicalOverdraft}，地方执行伴随更多观望与抵牾。` : '监司下达州县，按本地情形施行并候期复奏。' },
    ];
  const reactions = narrative?.reactions.length
    ? narrative.reactions.slice(0, 6)
    : [
      ...changes.slice(0, 4).map((text) => ({ label: text.split(' ')[0] ?? '国势', text: `本回结算记为 ${text}，后续影响将延续到下一期施政。` })),
      ...(reformDilemmas.length ? reformDilemmas.slice(0, 2).map((item) => ({ label: item.title, text: item.description })) : []),
    ].slice(0, 6);

  return <div className="modal settlement-layer">
    <section className="settlement-result" aria-label="半年施政结算">
      <button className="settlement-close" type="button" onClick={onClose} aria-label="关闭结算档案"><X /></button>

      <div className="settlement-left-page">
        <header className="settlement-heading">
          <div>
            <span>半年施政结算</span>
            <h2>{result.event.title}</h2>
            <p>{result.event.description}</p>
          </div>
          <div className="settlement-changes">
            {changes.length ? changes.slice(0, 3).map((text) => <em key={text}>{text}</em>) : <em>诸项持平</em>}
          </div>
        </header>

        <div className="settlement-left-scroll">
          <section className="settlement-report">
            <h3><i>史</i>史官推演</h3>
            <p>{report}</p>
          </section>

          <section className="settlement-situation">
            <h3>天下情势</h3>
            <div className="settlement-situation-scroll">
              <p>{situation}</p>
              {result.record.administrativeOverload > 0 && <small>行政超载 {result.record.administrativeOverload}：部分政令在传达和执行中延宕变形。</small>}
              {result.record.politicalOverdraft > 0 && <small>政略透支 {result.record.politicalOverdraft}：诏令已经颁行，但士论与执行额外受损。</small>}
            </div>
          </section>

          <section className="settlement-reactions">
            <h3><i>奏</i>各方回奏</h3>
            <div>
              {reactions.length ? reactions.map((reaction, index) => <article key={`${reaction.label}-${index}`}>
                <div className="settlement-reaction-copy">
                  <strong>{reaction.label}</strong>
                  <p>{reaction.text}</p>
                </div>
                <em>回奏</em>
              </article>) : <p className="settlement-empty">本回暂无另奏。</p>}
            </div>
          </section>

        </div>
      </div>

      <aside className="settlement-right-page">
        <span className="settlement-filed">已入起居注</span>
        <h3><i>录</i>施行记录</h3>
        <div className="settlement-timeline">
          {implementation.slice(0, 4).map((step, index) => <article key={`${step.stage}-${index}`}>
            <i>{index + 1}</i>
            <div><strong>{step.stage}</strong><p>{step.text}</p></div>
            <em>已毕</em>
          </article>)}
        </div>
        {narrative?.nextWarnings.length ? <section className="settlement-warnings"><strong>后续警讯</strong>{narrative.nextWarnings.slice(0, 2).map((item) => <p key={item}>· {item}</p>)}</section> : null}
        {result.aiError && <p className="settlement-ai-error">史官奏报未完成：{result.aiError}。以上数值仍由规则正常结算。</p>}
        <button className="settlement-archive" type="button" onClick={onClose}><span>归档</span><small>进入 {formatDate(state)}</small></button>
      </aside>
    </section>
  </div>;
}
