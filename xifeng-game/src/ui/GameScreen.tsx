import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { GameState } from '../game/types';
import { getPoliticalCapitalRecovery } from '../game/turn-engine';
import { buildCrisisMarkers } from './crisis-map';
import './game-screen.css';

interface GameScreenProps {
  state: GameState;
  selectedCrisisId: string | null;
  onSelectCrisis: (id: string) => void;
  onOpenDilemmas: () => void;
  onOpenEdict: () => void;
  onOpenCourt: () => void;
  onOpenArchive: () => void;
  onOpenRecords: () => void;
  onOpenSaves: () => void;
}

const numerals = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export function formatGameDate(state: GameState) {
  return `熙宁${numerals[state.date.reignYear] ?? state.date.reignYear}年${state.date.half === 1 ? '上半年' : '下半年'}`;
}

export function GameScreen({
  state,
  selectedCrisisId,
  onSelectCrisis,
  onOpenDilemmas,
  onOpenEdict,
  onOpenCourt,
  onOpenArchive,
  onOpenRecords,
  onOpenSaves,
}: GameScreenProps) {
  const [activeResourceId, setActiveResourceId] = useState<string | null>(null);
  const resourceLayerRef = useRef<HTMLElement>(null);
  const markers = buildCrisisMarkers(state.dilemmas);
  const selected = markers.find((item) => item.id === selectedCrisisId) ?? markers[0] ?? null;
  const strategyRecovery = getPoliticalCapitalRecovery(state.indicators.courtSupport);
  const resources = [
    {
      id: 'treasury', label: '国库', value: `${state.resources.treasury.toLocaleString()}万贯`, asset: assetUrl('assets/resources/treasury.png'),
      summary: '朝廷可调度的钱粮，用于施行政务、赈济与边备。',
      rule: '政务和当期事件会直接改变国库；国库归零将触发财政崩溃。',
    },
    {
      id: 'strategy', label: '政略', value: state.resources.politicalCapital, asset: assetUrl('assets/resources/strategy.png'),
      summary: '推动诏令、协调朝议所需的政治余地。',
      rule: `按当前士论估算，回合结算后恢复 ${strategyRecovery} 点；承办官会增减每项政务的消耗。`,
    },
    {
      id: 'administration', label: '行政', value: state.resources.administration, asset: assetUrl('assets/resources/administration.png'),
      summary: '官僚体系在半年内能够承办的政务规模。',
      rule: '每回合恢复 8 点；政务超过现有行政能力仍可颁行，但会形成行政超载。',
    },
    {
      id: 'public-support', label: '民心', value: state.indicators.livelihood, asset: assetUrl('assets/resources/public-support.png'),
      summary: '民户生计以及百姓对政令的承受状况。',
      rule: '赈济、减轻摊派可改善民心；灾伤、强制执行和行政超载会使其下降。',
    },
    {
      id: 'scholar-support', label: '士论', value: state.indicators.courtSupport, asset: assetUrl('assets/resources/scholar-support.png'),
      summary: '朝臣与士大夫对当前施政方向的支持程度。',
      rule: `士论会影响政略恢复；当前数值对应的基础恢复约为 ${strategyRecovery} 点。`,
    },
  ];
  const activeResource = resources.find((item) => item.id === activeResourceId) ?? null;

  useEffect(() => {
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!resourceLayerRef.current?.contains(event.target as Node)) setActiveResourceId(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveResourceId(null);
    };
    document.addEventListener('pointerdown', closeOnOutsidePress);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePress);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  return <section className="game-screen" data-testid="game-screen">
    <div className="scene-background" aria-hidden="true" />

    <div className="fixed-decoration-layer" aria-hidden="true">
      <i className="desk-vignette" />
    </div>

    <nav className="navigation-layer" aria-label="主要功能">
      <NavBookmark asset={assetUrl('assets/navigation/nav-crisis.png')} label="困境" onClick={onOpenDilemmas} />
      <NavBookmark asset={assetUrl('assets/navigation/nav-edict.png')} label="御案" onClick={onOpenEdict} />
      <NavBookmark asset={assetUrl('assets/navigation/nav-appointments.png')} label="铨选" onClick={onOpenCourt} />
      <NavBookmark asset={assetUrl('assets/navigation/nav-archive.png')} label="秘阁" onClick={onOpenArchive} />
      <NavBookmark asset={assetUrl('assets/navigation/nav-records.png')} label="起居注" onClick={onOpenRecords} />
      <button className="historian-settings" type="button" onClick={onOpenSaves} title="存档" aria-label="打开存档"><img src={assetUrl('assets/seals/settings.png')} alt="" aria-hidden="true" /></button>
    </nav>

    <header className="turn-layer" data-testid="turn-layer">
      <strong>{formatGameDate(state)}</strong>
      <span>第 {state.turn} / {state.maxTurns} 回合</span>
      <i aria-hidden="true">纪</i>
    </header>

    <section className="resource-layer" aria-label="朝廷资源" data-testid="resource-layer" ref={resourceLayerRef}>
      {resources.map(({ id, label, value, asset, summary }) => <button
        className={`resource-token resource-${id}${activeResourceId === id ? ' is-active' : ''}`}
        key={id}
        data-resource={id}
        type="button"
        title={`查看${label}说明`}
        aria-label={`${label} ${value}。${summary}`}
        aria-expanded={activeResourceId === id}
        aria-controls="resource-inspector"
        onClick={() => setActiveResourceId((current) => current === id ? null : id)}
      >
        <div className="resource-emblem" aria-hidden="true"><img src={asset} alt="" /></div>
        <span>{label}</span>
        <strong>{value}</strong>
      </button>)}
      {activeResource && <aside className="resource-inspector" id="resource-inspector" aria-live="polite">
        <div><small>朝廷簿册</small><strong>{activeResource.label}</strong><em>{activeResource.value}</em></div>
        <p>{activeResource.summary}<span>{activeResource.rule}</span></p>
        <button type="button" onClick={() => setActiveResourceId(null)} aria-label="收起资源说明">收</button>
      </aside>}
    </section>

    <section className="crisis-marker-layer" aria-label="天下困境" data-testid="crisis-marker-layer">
      {markers.filter((item) => item.status !== 'hidden').map((crisis) => <button
        className={`crisis-marker status-${crisis.status} category-${crisis.category}${selected?.id === crisis.id ? ' is-selected' : ''}`}
        data-crisis-id={crisis.id}
        data-status={crisis.status}
        key={crisis.id}
        onClick={() => onSelectCrisis(crisis.id)}
        style={{ '--crisis-x': `${crisis.x}%`, '--crisis-y': `${crisis.y}%` } as CSSProperties}
        type="button"
        aria-pressed={selected?.id === crisis.id}
      >
        <span className="crisis-location">{crisis.location}</span>
        <strong className="crisis-title">{crisis.title}</strong>
        <span className="crisis-severity"><small>严重度</small><b>{crisis.severity}</b></span>
      </button>)}
    </section>

    <aside className={`selected-crisis-layer${selected ? '' : ' is-empty'}`} data-testid="selected-crisis-layer" aria-live="polite">
      {selected ? <article className="selected-crisis-scroll">
          <span className="selected-crisis-context">{selected.location} · {selected.category === 'urgent' ? '当期急务' : selected.category === 'reform' ? '改革后遗' : '结构性困境'}</span>
          <h2>{selected.title}</h2>
          <p>{selected.description}</p>
          <div className="selected-crisis-footer">
            <span className="selected-crisis-reform">改革方向：{selected.reformDirection}</span>
            <strong className="selected-severity-label" aria-hidden="true">严重度</strong>
            <em><small>严重度</small><b>{selected.severity}</b></em>
          </div>
          <button type="button" onClick={onOpenDilemmas} aria-label={`查看“${selected.title}”所在的困境总览`}><span>查看困境</span></button>
        </article> : <p>当前没有需要处置的困境。</p>}
    </aside>

    <div className="action-layer">
      <button type="button" onClick={onOpenEdict} aria-label="开御案，拟诏书">
        <img src={assetUrl('assets/scrolls/action-edict.png')} alt="" aria-hidden="true" />
      </button>
    </div>
  </section>;
}

function NavBookmark({ asset, label, onClick }: { asset: string; label: string; onClick: () => void }) {
  return <button className="nav-bookmark" type="button" onClick={onClick} aria-label={label}><img src={asset} alt="" aria-hidden="true" /><span>{label}</span></button>;
}
