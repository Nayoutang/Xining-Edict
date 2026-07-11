import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import PageShell from './components/PageShell';
import Seal from './components/Seal';
import StatBoard from './components/StatBoard';
import {
  createInitialCourtState,
  evaluateEdict,
  generateEdictDraft,
  statDescriptions,
  statOrder,
} from './data/xifengDemo';

const backgroundMusic = new URL('../music/main.mp3', import.meta.url).href;
const publicAsset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
const xifengImages = {
  map: publicAsset('/images/xifeng/map.png'),
  desk: publicAsset('/images/xifeng/desk.png'),
  edict: publicAsset('/images/xifeng/edict-scroll.png'),
};

const buttonBase =
  'inline-flex items-center justify-center border border-brownInk/35 bg-paper/80 px-5 py-3 font-song text-base font-bold text-ink shadow-sm transition-colors hover:border-cinnabar/70 hover:bg-paperDeep/45 focus:outline-none focus:ring-2 focus:ring-cinnabar/35';
const primaryButton = `${buttonBase} !border-cinnabar/70 !bg-cinnabar !text-paper shadow-seal hover:!border-cinnabar hover:!bg-[#7f241d]`;
const tapMotion = { whileHover: { y: -2 }, whileTap: { scale: 0.97, y: 0 } };

const suggestionIntents = [
  '先稳住民生，禁止地方官借青苗钱强制摊派，同时不要让国用继续恶化',
  '整顿吏治，严查州县催科与虚报功绩，边防暂不扩张',
  '平抑物价，限制官府逐利，但保留市易调节商贸的能力',
];

const introItemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] } },
};

function AudioSettings() {
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolume] = useState(0.1);

  useEffect(() => {
    const audio = document.querySelector('#xifeng-audio');
    if (!audio) return;
    audio.volume = volume;
    if (enabled) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [enabled, volume]);

  return (
    <div className="music-control fixed bottom-5 right-5 z-50">
      <audio id="xifeng-audio" src={backgroundMusic} loop preload="auto" />
      <button
        type="button"
        onClick={() => setEnabled((value) => !value)}
        className="music-toggle h-10 w-10 border border-paper/35 bg-ink/80 font-song text-sm font-bold text-paper shadow-seal backdrop-blur hover:bg-ink"
        title={enabled ? '关闭背景音乐' : '开启背景音乐'}
      >
        {enabled ? '音' : '静'}
      </button>
      <div className="music-panel absolute bottom-12 right-0 flex items-center gap-3 border border-brownInk/25 bg-ink/82 px-3 py-2 text-paper shadow-seal backdrop-blur">
        <input
          aria-label="背景音乐音量"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(event) => {
            const nextVolume = Number(event.target.value);
            setVolume(nextVolume);
            setEnabled(nextVolume > 0);
          }}
        />
        <span className="w-8 text-right text-xs tabular-nums">{Math.round(volume * 100)}</span>
      </div>
    </div>
  );
}

function AppFrame({ children, onHome, stats }) {
  return (
    <div
      className="game-root overflow-x-hidden bg-paper text-ink"
      style={{
        '--xifeng-map-image': `url("${xifengImages.map}")`,
        '--xifeng-desk-image': `url("${xifengImages.desk}")`,
      }}
    >
      <div className="paper-texture fixed inset-0" />
      <div className="ink-wash fixed inset-0" />
      <header className="app-header relative z-20 mx-auto flex w-full max-w-[1680px] items-start justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8 xl:py-4">
        <button onClick={onHome} className="group flex items-center gap-3 text-left">
          <span className="seal-dot">熙丰</span>
          <span>
            <span className="block font-song text-lg font-bold">未竟之史：熙丰万机</span>
            <span className="block text-xs text-brownInk/70">史实约束型皇帝诏令推演 demo</span>
          </span>
        </button>
        <TopStatusBar stats={stats} />
      </header>
      <div className="app-main">{children}</div>
      <CommandRail />
      <AudioSettings />
    </div>
  );
}

function TopStatusBar({ stats }) {
  const items = statOrder.map((name) => [name, stats[name]]);

  return (
    <div className="xifeng-status hidden items-center gap-2 lg:flex">
      {items.map(([label, value]) => (
        <div key={label} className="xifeng-status-item">
          <span>{label}</span>
          <motion.strong
            key={`${label}-${value}`}
            initial={{ opacity: 0.35, scale: 0.78, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          >
            {value}
          </motion.strong>
        </div>
      ))}
    </div>
  );
}

function CommandRail() {
  return (
    <aside className="xifeng-rail hidden lg:flex">
      <button title="奏报">奏</button>
      <button title="诏书">诏</button>
      <button title="舆图">图</button>
      <button title="史官">史</button>
    </aside>
  );
}

function StartPage({ onStart }) {
  return (
    <PageShell full className="app-scroll-screen xifeng-map-stage px-6 pb-8 pt-2 lg:px-12 xl:px-16">
      <section className="mx-auto grid min-h-full w-full max-w-[1680px] items-center gap-8 py-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(420px,1.2fr)] xl:gap-12 2xl:gap-20">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.09 } } }}
          className="max-w-4xl"
        >
          <motion.p variants={introItemVariants} className="mb-4 w-fit border-y border-brownInk/25 py-2 text-sm tracking-[0.28em] text-brownInk">
            宋神宗一朝 1067-1085
          </motion.p>
          <motion.h1 variants={introItemVariants} className="font-song text-[clamp(3.4rem,7vw,7.4rem)] font-black leading-tight text-ink">
            熙丰万机
          </motion.h1>
          <motion.p variants={introItemVariants} className="mt-5 font-song text-2xl text-brownInk 2xl:text-3xl">
            一道圣旨下去，朝廷、州县、士论与民间都会回应。
          </motion.p>
          <motion.p variants={introItemVariants} className="mt-6 max-w-3xl text-lg leading-8 text-brownInk/85 2xl:text-xl">
            本 demo 先用本地规则模拟辅政 AI 与推演 AI。你提出治理意图，系统拟成圣旨，再返回一份整体政令执行报告。
          </motion.p>
          <motion.div variants={introItemVariants} className="mt-9 flex flex-wrap gap-3">
            <motion.button {...tapMotion} onClick={onStart} className={primaryButton}>
              入御前
            </motion.button>
          </motion.div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="xifeng-map-card xifeng-map-card--alive relative"
        >
          <img src={xifengImages.map} alt="熙丰舆图" className="xifeng-map-image h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink/25" />
          <div className="absolute bottom-6 left-6 z-10 text-paper drop-shadow">
            <p className="font-song text-3xl font-black">熙丰舆图</p>
            <p className="mt-2 text-sm">国用、边防、士论与民生交汇于此。</p>
          </div>
          <div className="xifeng-seal-float absolute -bottom-5 right-6">
            <Seal>御前<br />万机</Seal>
          </div>
        </motion.div>
      </section>
      <div className="xifeng-memorial-tab hidden lg:block">御前奏折</div>
      <div className="xifeng-task-tab hidden lg:block">时政任务</div>
    </PageShell>
  );
}

function StatLegend({ stats }) {
  return (
    <section className="xifeng-panel p-5">
      <p className="text-sm tracking-[0.28em] text-cinnabar">六项朝局</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {statOrder.map((name) => (
          <div key={name} className="border border-brownInk/15 bg-paper/55 px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <span className="font-song text-lg font-black text-ink">{name}</span>
              <span className="font-song text-xl font-black text-cinnabar">{stats[name]}</span>
            </div>
            <p className="mt-1 text-sm leading-6 text-brownInk/80">{statDescriptions[name]}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CourtPage({ state, intent, setIntent, onDraft }) {
  return (
    <PageShell full className="app-scroll-screen xifeng-desk-stage px-4 py-3 sm:px-6 lg:px-10">
      <section className="grid min-h-[650px] flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="xifeng-panel flex min-h-0 flex-col p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-brownInk/15 pb-4">
            <div>
              <p className="text-sm tracking-[0.32em] text-cinnabar">第 {state.round} 轮御前总奏</p>
              <h2 className="mt-2 font-song text-4xl font-black leading-tight text-ink">国政交逼，诏令待发</h2>
              <p className="mt-2 text-brownInk/75">{state.year}</p>
            </div>
            <Seal>御案<br />待批</Seal>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="xifeng-mini-map relative min-h-48 overflow-hidden border border-brownInk/20">
              <img src={xifengImages.map} alt="朝局舆图" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-ink/20" />
              <div className="absolute bottom-4 left-4 text-paper drop-shadow">
                <p className="font-song text-2xl font-black">天下总势</p>
                <p className="text-sm">奏报入内，群议未定。</p>
              </div>
            </div>
            <div className="border-l-2 border-cinnabar/45 bg-paper/70 p-5">
              <p className="text-sm tracking-[0.28em] text-cinnabar">奏报</p>
              <p className="mt-3 text-lg leading-9 text-brownInk">{state.crisis}</p>
            </div>
          </div>

          <div className="mt-6">
            <label className="font-song text-2xl font-black text-ink" htmlFor="edict-intent">
              你的治理意图
            </label>
            <textarea
              id="edict-intent"
              value={intent}
              onChange={(event) => setIntent(event.target.value)}
              className="xifeng-textarea mt-3 min-h-36 w-full border border-brownInk/25 bg-paper/80 p-4 text-lg leading-8 text-ink outline-none focus:border-cinnabar/70 focus:ring-2 focus:ring-cinnabar/25"
              placeholder="例如：先稳住民生，禁止地方官强制摊派，同时不要让国用继续恶化。"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestionIntents.map((suggestion) => (
                <button key={suggestion} type="button" className="xifeng-chip" onClick={() => setIntent(suggestion)}>
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto flex justify-end pt-5">
            <motion.button {...tapMotion} type="button" onClick={onDraft} disabled={!intent.trim()} className={primaryButton}>
              命辅政拟旨
            </motion.button>
          </div>
        </div>
        <div className="grid min-h-0 gap-5">
          <StatBoard stats={state.stats} title="当前朝局" />
          <HistoryBrief history={state.history} />
        </div>
      </section>
    </PageShell>
  );
}

function HistoryBrief({ history }) {
  return (
    <section className="xifeng-panel p-5">
      <p className="text-sm tracking-[0.28em] text-cinnabar">诏令记录</p>
      {history.length === 0 ? (
        <p className="mt-3 leading-7 text-brownInk/80">尚未颁行圣旨。第一道诏令会决定朝廷对你的判断。</p>
      ) : (
        <div className="mt-3 grid gap-3">
          {history.slice(-3).map((item, index) => (
            <article key={`${item.title}-${index}`} className="border border-brownInk/15 bg-paper/55 p-3">
              <h3 className="font-song text-lg font-black text-ink">{item.title}</h3>
              <p className="mt-1 text-sm leading-6 text-brownInk/80">{item.intent}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function DraftPage({ draft, finalText, setFinalText, onBack, onIssue, isIssuing }) {
  return (
    <PageShell full className="app-scroll-screen xifeng-desk-stage px-4 py-3 sm:px-6 lg:px-10">
      <section className="mx-auto grid min-h-[650px] max-w-[1500px] gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="xifeng-scroll-panel p-5 sm:p-7">
          <div className="xifeng-scroll-inner">
            <p className="text-sm tracking-[0.32em] text-cinnabar">辅政拟旨</p>
            <h2 className="mt-2 font-song text-4xl font-black text-ink">{draft.title}</h2>
            <p className="mt-2 text-brownInk/75">{draft.year}</p>
          <textarea
            value={finalText}
            onChange={(event) => setFinalText(event.target.value)}
            className="xifeng-edict mt-5 min-h-[360px] w-full border border-brownInk/20 bg-paper/45 p-5 font-song text-xl font-bold leading-10 text-ink outline-none focus:border-cinnabar/70 focus:ring-2 focus:ring-cinnabar/25"
          />
          <div className="mt-5 flex flex-wrap justify-between gap-3">
            <button type="button" onClick={onBack} disabled={isIssuing} className={buttonBase}>
              退回重议
            </button>
            <motion.button {...tapMotion} type="button" onClick={onIssue} disabled={isIssuing} className={primaryButton}>
              {isIssuing ? '诏令传发中' : '颁行圣旨'}
            </motion.button>
          </div>
          </div>
          <AnimatePresence>
            {isIssuing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="xifeng-issue-overlay"
              >
                <motion.div
                  initial={{ scale: 0.76, rotate: -14 }}
                  animate={{ scale: [0.76, 1.08, 1], rotate: [-14, 3, -6] }}
                  transition={{ duration: 0.46, ease: 'easeOut' }}
                  className="xifeng-issue-seal"
                >
                  奉天<br />颁行
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <aside className="xifeng-panel p-5">
          <p className="text-sm tracking-[0.28em] text-cinnabar">臣僚议论</p>
          <div className="mt-4 grid gap-3">
            {draft.advisers.map((adviser) => (
              <article key={adviser.name} className="border border-brownInk/15 bg-paper/60 p-4">
                <h3 className="font-song text-2xl font-black text-ink">{adviser.name}</h3>
                <p className="mt-2 leading-7 text-brownInk">{adviser.stance}</p>
              </article>
            ))}
          </div>
          <div className="mt-5 border-l-2 border-cinnabar/45 bg-paperDeep/45 p-4">
            <p className="font-song text-xl font-black text-ink">制度条款</p>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-brownInk/85">
              {draft.clauses.map((clause) => (
                <li key={clause} className="border border-brownInk/10 bg-paper/55 px-3 py-2">
                  {clause}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>
    </PageShell>
  );
}

function ReportPage({ result, onContinue, onRestart }) {
  return (
    <PageShell full className="app-scroll-screen px-4 py-3 sm:px-6 lg:px-10">
      <section className="mx-auto grid min-h-[650px] max-w-[1540px] gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="xifeng-panel p-5 sm:p-7">
          <p className="text-sm tracking-[0.32em] text-cinnabar">政令执行回报</p>
          <h2 className="mt-2 font-song text-4xl font-black text-ink">{result.draft.title}</h2>
          <div className="mt-5 grid gap-4">
            {result.report.map((section, index) => (
              <motion.article
                key={section.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-l-2 border-cinnabar/45 bg-paper/60 p-4"
              >
                <h3 className="font-song text-2xl font-black text-ink">{section.title}</h3>
                <p className="mt-2 text-base leading-8 text-brownInk">{section.body}</p>
              </motion.article>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap justify-between gap-3">
            <button type="button" onClick={onRestart} className={buttonBase}>
              重开一局
            </button>
            <button type="button" onClick={onContinue} className={primaryButton}>
              召下一轮奏报
            </button>
          </div>
        </div>
        <aside className="grid min-h-0 gap-5">
          <section className="xifeng-panel p-5">
            <p className="text-sm tracking-[0.28em] text-cinnabar">变量变化</p>
            <div className="mt-4 grid gap-2">
              {result.deltas.map((delta, index) => (
                <motion.div
                  key={delta.name}
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.12 + index * 0.06 }}
                  className="flex items-center justify-between border border-brownInk/15 bg-paper/60 px-3 py-2"
                >
                  <span className="font-song text-lg font-black text-ink">{delta.name}</span>
                  <motion.span
                    initial={{ scale: 0.7 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.06, type: 'spring', stiffness: 300, damping: 15 }}
                    className={delta.value >= 0 ? 'font-song text-xl font-black text-cinnabar' : 'font-song text-xl font-black text-moss'}
                  >
                    {delta.value > 0 ? '+' : ''}
                    {delta.value}
                  </motion.span>
                </motion.div>
              ))}
            </div>
          </section>
          <StatLegend stats={result.nextState.stats} />
        </aside>
      </section>
    </PageShell>
  );
}

export default function App() {
  const [screen, setScreen] = useState('start');
  const [courtState, setCourtState] = useState(() => createInitialCourtState());
  const [intent, setIntent] = useState(suggestionIntents[0]);
  const [draft, setDraft] = useState(null);
  const [finalText, setFinalText] = useState('');
  const [result, setResult] = useState(null);
  const [isIssuing, setIsIssuing] = useState(false);
  const issueTimer = useRef(null);

  function restart() {
    if (issueTimer.current) clearTimeout(issueTimer.current);
    setIsIssuing(false);
    setCourtState(createInitialCourtState());
    setIntent(suggestionIntents[0]);
    setDraft(null);
    setFinalText('');
    setResult(null);
    setScreen('start');
  }

  function draftEdict() {
    const nextDraft = generateEdictDraft(intent, courtState);
    setDraft(nextDraft);
    setFinalText(nextDraft.text);
    setScreen('draft');
  }

  function issueEdict() {
    if (isIssuing) return;
    setIsIssuing(true);
    const issuedDraft = { ...draft, text: finalText };
    issueTimer.current = setTimeout(() => {
      const nextResult = evaluateEdict(issuedDraft, courtState);
      setResult(nextResult);
      setIsIssuing(false);
      setScreen('report');
    }, 480);
  }

  function continueCourt() {
    setCourtState(result.nextState);
    setIntent('');
    setDraft(null);
    setFinalText('');
    setResult(null);
    setScreen('court');
  }

  return (
    <AppFrame onHome={restart} stats={screen === 'report' && result ? result.nextState.stats : courtState.stats}>
      <AnimatePresence mode="wait">
        {screen === 'start' && <StartPage key="start" onStart={() => setScreen('court')} />}
        {screen === 'court' && (
          <CourtPage
            key={`court-${courtState.round}`}
            state={courtState}
            intent={intent}
            setIntent={setIntent}
            onDraft={draftEdict}
          />
        )}
        {screen === 'draft' && draft && (
          <DraftPage
            key={`draft-${draft.id}`}
            draft={draft}
            finalText={finalText}
            setFinalText={setFinalText}
            onBack={() => setScreen('court')}
            onIssue={issueEdict}
            isIssuing={isIssuing}
          />
        )}
        {screen === 'report' && result && (
          <ReportPage
            key={`report-${result.draft.id}`}
            result={result}
            onContinue={continueCourt}
            onRestart={restart}
          />
        )}
      </AnimatePresence>
    </AppFrame>
  );
}
