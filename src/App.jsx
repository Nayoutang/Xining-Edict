import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import FeedbackImageCard from './components/FeedbackImageCard';
import PageShell from './components/PageShell';
import RouteRecord from './components/RouteRecord';
import ScenePlaceholder from './components/ScenePlaceholder';
import Seal from './components/Seal';
import StatBoard from './components/StatBoard';
import {
  backgroundCards,
  clampStat,
  decisionNodes,
  designRules,
  getEnding,
  imageStoryItems,
  initialStats,
  introText,
  sceneImages,
} from './data/gameData';

const backgroundMusic = new URL('../music/main.mp3', import.meta.url).href;
const musicStartOffset = 2;

const buttonBase =
  'inline-flex items-center justify-center border border-brownInk/35 bg-paper/80 px-5 py-3 font-song text-base font-bold text-ink shadow-sm transition-colors hover:border-cinnabar/70 hover:bg-paperDeep/45 focus:outline-none focus:ring-2 focus:ring-cinnabar/35';
const primaryButton = `${buttonBase} !border-cinnabar/70 !bg-cinnabar !text-paper shadow-seal hover:!border-cinnabar hover:!bg-[#7f241d]`;
const attributionStatOrder = ['国用', '民生', '边防', '士论', '法度', '党争'];

function AudioSettings() {
  const audioRef = useRef(null);
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolume] = useState(0.12);
  const [unlocked, setUnlocked] = useState(false);

  function playBackgroundMusic() {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.currentTime < musicStartOffset) {
      audio.currentTime = musicStartOffset;
    }
    audio.play().catch(() => {});
  }

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (enabled && unlocked) {
      playBackgroundMusic();
    } else {
      audio.pause();
    }
  }, [enabled, unlocked]);

  useEffect(() => {
    function unlockAudio() {
      setUnlocked(true);
      if (enabled) {
        playBackgroundMusic();
      }
    }

    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, [enabled]);

  return (
    <div className="music-control fixed bottom-5 right-5 z-50">
      <audio ref={audioRef} src={backgroundMusic} loop preload="auto" />
      <button
        type="button"
        onClick={() => {
          setUnlocked(true);
          setEnabled((value) => !value);
          if (!enabled) {
            playBackgroundMusic();
          }
        }}
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
            setUnlocked(true);
          }}
        />
        <span className="w-8 text-right text-xs tabular-nums">{Math.round(volume * 100)}</span>
      </div>
    </div>
  );
}

function AppFrame({ children, onHome }) {
  return (
    <div className="game-root min-h-screen overflow-x-hidden bg-paper text-ink">
      <div className="paper-texture fixed inset-0" />
      <div className="ink-wash fixed inset-0" />
      <header className="relative z-20 mx-auto flex w-full max-w-[1680px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <button onClick={onHome} className="group flex items-center gap-3 text-left">
          <span className="seal-dot">熙宁</span>
          <span>
            <span className="block font-song text-lg font-bold">熙宁抉择</span>
            <span className="block text-xs text-brownInk/70">史实约束型历史交互叙事</span>
          </span>
        </button>
      </header>
      <div className="relative z-10">{children}</div>
      <AudioSettings />
    </div>
  );
}

function StartPage({ onStart, onRules, onGallery, onQuit }) {
  return (
    <PageShell full className="h-[calc(100vh-96px)] overflow-hidden px-6 pb-8 pt-2 lg:px-12 xl:px-16">
      <section className="mx-auto grid h-full w-full max-w-[1680px] items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] 2xl:gap-20">
        <div className="max-w-4xl">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-4 w-fit border-y border-brownInk/25 py-2 text-sm tracking-[0.38em] text-brownInk"
          >
            北宋 熙宁 年间
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24, duration: 0.7 }}
            className="font-song text-6xl font-black leading-tight text-ink sm:text-7xl lg:text-8xl 2xl:text-9xl"
          >
            熙宁抉择
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42, duration: 0.6 }}
            className="mt-5 font-song text-2xl text-brownInk 2xl:text-3xl"
          >
            史实约束下的王安石变法交互叙事体验
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.56, duration: 0.6 }}
            className="mt-6 max-w-2xl text-lg leading-8 text-brownInk/85 2xl:text-xl"
          >
            在史实的边界内，重新理解一次改革。
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="mt-9 flex flex-wrap gap-3"
          >
            <motion.button whileTap={{ scale: 0.98 }} onClick={onStart} className={primaryButton}>
              开始抉择
            </motion.button>
            <motion.button whileTap={{ scale: 0.98 }} onClick={onRules} className={buttonBase}>
              查看游戏介绍
            </motion.button>
            <motion.button whileTap={{ scale: 0.98 }} onClick={onGallery} className={buttonBase}>
              图像叙事展示
            </motion.button>
            <motion.button whileTap={{ scale: 0.98 }} onClick={onQuit} className={buttonBase}>
              退出游戏
            </motion.button>
          </motion.div>
        </div>
        <div className="relative">
          <ScenePlaceholder
            scene="汴京城远景"
            subtitle="北宋熙宁，风起汴京。"
            image={sceneImages.汴京城远景}
          />
          <div className="absolute -bottom-5 right-6">
            <Seal>御前<br />抉择</Seal>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function BackgroundPage({ onNext, onRules, onGallery }) {
  return (
    <PageShell>
      <div className="mb-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <ScenePlaceholder
          scene="北宋熙宁，风起汴京"
          subtitle="朝堂、边防、财政与民生在此交汇。"
          image={sceneImages.汴京城远景}
        />
        <section className="scroll-card p-6 sm:p-8">
          <p className="mb-3 text-sm tracking-[0.32em] text-cinnabar">历史背景</p>
          <h2 className="font-song text-4xl font-black text-ink">治平之后，变法之前</h2>
          <p className="mt-5 text-lg leading-9 text-brownInk">{introText}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button onClick={onNext} className={primaryButton}>
              进入朝局
            </button>
            <button onClick={onGallery} className={buttonBase}>
              图像叙事
            </button>
            <button onClick={onRules} className={buttonBase}>
              游戏介绍
            </button>
          </div>
        </section>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {backgroundCards.map((card, index) => (
          <motion.article
            key={card.title}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.12 }}
            className="scroll-card p-5"
          >
            <ScenePlaceholder scene={card.scene} image={sceneImages[card.scene]} compact />
            <h3 className="mt-4 font-song text-2xl font-bold text-ink">{card.title}</h3>
            <p className="mt-2 leading-7 text-brownInk/85">{card.description}</p>
          </motion.article>
        ))}
      </div>
    </PageShell>
  );
}

function DecisionPage({ node, index, stats, onChoose }) {
  return (
    <PageShell full className="flex h-[calc(100vh-96px)] flex-col overflow-hidden px-4 py-3 sm:px-6 lg:px-10">
      <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm tracking-[0.28em] text-cinnabar">第 {index + 1} 道诏令</p>
          <h2 className="mt-1 font-song text-3xl font-black text-ink xl:text-4xl">{node.title}</h2>
        </div>
        <span className="border border-brownInk/25 bg-paperDeep/30 px-4 py-2 font-song text-brownInk">{node.year}</span>
      </div>
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3">
          <ScenePlaceholder scene={node.scene} subtitle={node.year} image={sceneImages[node.scene]} compact />
          <article className="scroll-card flex min-h-0 flex-col overflow-hidden p-5 sm:p-6">
            <p className="text-sm tracking-[0.3em] text-brownInk/70">史事缘起</p>
            <p className="decision-background mt-3 text-base leading-8 text-brownInk xl:text-lg">{node.background}</p>
            <div className="my-4 h-px shrink-0 bg-brownInk/15" />
            <h3 className="shrink-0 font-song text-2xl font-bold text-ink xl:text-3xl">{node.question}</h3>
            <div className="mt-4 grid shrink-0 gap-2 xl:gap-3">
              {node.options.map((option, optionIndex) => (
                <motion.button
                  key={option.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: optionIndex * 0.08 }}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onChoose(option)}
                  className="group border border-brownInk/45 bg-[#ead9b7]/95 p-3 text-left shadow-[0_10px_26px_rgba(45,28,10,0.12)] transition hover:border-cinnabar/80 hover:bg-[#dfc89f] hover:shadow-[0_14px_34px_rgba(45,28,10,0.18)] xl:p-4"
                >
                  <div className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-cinnabar/75 bg-cinnabar/10 font-song text-base font-bold text-cinnabar group-hover:bg-cinnabar group-hover:text-paper xl:h-9 xl:w-9 xl:text-lg">
                      {option.label}
                    </span>
                    <span className="pt-1 font-song text-lg font-black text-ink xl:text-xl">{option.text}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </article>
        </section>
        <div className="min-h-0 overflow-hidden">
          <StatBoard stats={stats} />
        </div>
      </div>
    </PageShell>
  );
}

function FeedbackPage({ selected, stats, previousStats, onNext }) {
  const effects = Object.entries(selected.option.effects);
  const imageTitle = selected.option.imageTitle || selected.node.title;
  const imageDescription = selected.option.imageDescription || 'Feedback image placeholder.';

  return (
    <PageShell full className="flex h-[calc(100vh-96px)] flex-col overflow-hidden px-4 py-3 sm:px-6 lg:px-10">
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="scroll-card flex min-h-0 flex-col overflow-hidden p-5 sm:p-6">
          <p className="text-sm tracking-[0.32em] text-cinnabar">选择反馈</p>
          <h2 className="mt-2 shrink-0 font-song text-3xl font-black text-ink xl:text-4xl">{selected.node.title}</h2>
          <div className="feedback-card-slot mt-4 shrink-0">
            <FeedbackImageCard
              image={selected.option.image}
              title={imageTitle}
              description={imageDescription}
              compact
            />
          </div>
          <div className="mt-4 shrink-0 border-l-2 border-cinnabar/60 bg-paper/55 p-4">
            <p className="text-sm text-brownInk/70">你选择了</p>
            <p className="mt-1 font-song text-xl font-bold leading-8 text-cinnabar xl:text-2xl">
              {selected.option.label}. {selected.option.text}
            </p>
          </div>
          {selected.option.summary && (
            <div className="mt-3 shrink-0 border-l-2 border-brownInk/30 bg-paperDeep/45 px-4 py-3">
              <p className="text-sm tracking-[0.28em] text-cinnabar">局势解读</p>
              <p className="mt-1 font-song text-lg font-bold leading-7 text-ink xl:text-xl">{selected.option.summary}</p>
            </div>
          )}
          <p className="feedback-explanation mt-3 text-base leading-8 text-brownInk xl:text-lg">{selected.option.feedback}</p>
          <div className="mt-4 grid shrink-0 gap-2 sm:grid-cols-2 xl:grid-cols-5">
            {effects.map(([name, delta], index) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="flex items-center justify-between border border-brownInk/20 bg-paper/60 px-3 py-2"
              >
                <span className="font-song text-base font-bold text-ink">{name}</span>
                <span className={`font-song text-lg font-black ${delta >= 0 ? 'text-cinnabar' : 'text-moss'}`}>
                  {delta > 0 ? '+' : ''}
                  {delta}
                </span>
              </motion.div>
            ))}
          </div>
          <button onClick={onNext} className={`${primaryButton} mt-4 w-fit shrink-0`}>
            进入下一节点
          </button>
        </section>
        <div className="min-h-0 overflow-hidden">
          <StatBoard stats={stats} previousStats={previousStats} />
        </div>
      </div>
    </PageShell>
  );
}

function EndingPage({ ending, stats, onRestart, onRecord }) {
  const endingScene = ending.imageScene || '熙宁改良';
  const endingImage = sceneImages[endingScene] || sceneImages.熙宁改良 || sceneImages.汴京城远景;

  return (
    <PageShell>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="scroll-card overflow-hidden">
          <div className="relative min-h-72 bg-ink p-8 text-paper">
            {endingImage ? (
              <img
                src={endingImage}
                alt={endingScene}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 scene-gradient" />
            )}
            <div className="absolute inset-0 bg-ink/55" />
            <div className="absolute inset-0 ink-lines opacity-45" />
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
              className="relative z-10"
            >
              <p className="text-sm tracking-[0.32em] text-paper/75">结局评定</p>
              <h2 className="mt-4 font-song text-6xl font-black leading-tight">{ending.name}</h2>
              <p className="mt-3 text-lg text-paper/85">{ending.type}</p>
              <p className="mt-6 w-fit border border-paper/40 bg-ink/30 px-3 py-1 text-sm text-paper/90">
                结局图像：{endingScene}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -40, rotate: -18 }}
              animate={{ opacity: 1, y: 0, rotate: -6 }}
              transition={{ delay: 0.65, type: 'spring', stiffness: 140, damping: 12 }}
              className="absolute bottom-6 right-8 z-10"
            >
              <Seal className="bg-paper/10 text-paper border-paper/80">史官<br />评定</Seal>
            </motion.div>
          </div>
          <div className="p-6 sm:p-8">
            <div className="mb-7 grid gap-5 lg:grid-cols-[0.86fr_1.14fr]">
              <ScenePlaceholder scene={endingScene} subtitle={ending.imageCaption} image={endingImage} compact />
              <div className="flex flex-col justify-center border-l-2 border-cinnabar/45 bg-paper/55 p-5">
                <p className="text-sm tracking-[0.28em] text-cinnabar">史官评语</p>
                <p className="mt-3 font-song text-2xl font-bold text-cinnabar">“{ending.comment}”</p>
              </div>
            </div>
            <p className="text-lg leading-9 text-brownInk">{ending.explanation}</p>
            {ending.causeText && (
              <section className="mt-8 border-l-2 border-cinnabar/55 bg-paperDeep/50 px-5 py-5 shadow-[inset_0_0_26px_rgba(126,92,46,0.08)]">
                <p className="text-sm tracking-[0.28em] text-cinnabar">{ending.causeTitle || '何以至此'}</p>
                <p className="mt-3 text-base leading-8 text-brownInk">{ending.causeText}</p>
                {ending.causeBullets?.length > 0 && (
                  <ul className="mt-4 grid gap-2 text-sm leading-7 text-ink sm:grid-cols-2">
                    {ending.causeBullets.map((item) => (
                      <li key={item} className="border border-brownInk/15 bg-paper/55 px-3 py-2">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
            <section className="mt-5 border border-brownInk/20 bg-paper/60 p-5">
              <p className="font-song text-2xl font-black text-ink">数据归因</p>
              <dl className="mt-4 grid gap-2 sm:grid-cols-3">
                {attributionStatOrder.map((name) => (
                  <div key={name} className="flex items-center justify-between border-b border-brownInk/15 pb-2">
                    <dt className="font-song font-bold text-brownInk">{name}</dt>
                    <dd className="font-song text-xl font-black text-cinnabar">{stats[name]}</dd>
                  </div>
                ))}
              </dl>
              {ending.systemReason && (
                <p className="mt-4 border-t border-brownInk/15 pt-4 text-base leading-8 text-brownInk">
                  <span className="font-song font-bold text-ink">系统判断：</span>
                  {ending.systemReason}
                </p>
              )}
            </section>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={onRestart} className={primaryButton}>
                重新体验
              </button>
              <button onClick={onRecord} className={buttonBase}>
                查看路线记录
              </button>
            </div>
          </div>
        </div>
        <StatBoard stats={stats} title="最终六项变量" />
      </section>
    </PageShell>
  );
}

function EndingPageCompact({ ending, stats, onRestart, onRecord }) {
  const endingScene = ending.imageScene || '熙宁改良';
  const endingImage = sceneImages[endingScene] || sceneImages.熙宁改良 || sceneImages.汴京城远景;

  return (
    <PageShell full className="flex h-[calc(100vh-96px)] flex-col overflow-hidden px-4 py-3 sm:px-6 lg:px-10">
      <section className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="scroll-card flex min-h-0 flex-col overflow-hidden">
          <div className="relative h-[22vh] min-h-[178px] shrink-0 bg-ink p-6 text-paper">
            {endingImage ? (
              <img src={endingImage} alt={endingScene} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 scene-gradient" />
            )}
            <div className="absolute inset-0 bg-ink/55" />
            <div className="absolute inset-0 ink-lines opacity-45" />
            <div className="relative z-10">
              <p className="text-sm tracking-[0.32em] text-paper/75">结局评定</p>
              <h2 className="mt-3 font-song text-5xl font-black leading-tight xl:text-6xl">{ending.name}</h2>
              <p className="mt-2 text-base text-paper/85 xl:text-lg">{ending.type}</p>
            </div>
            <div className="absolute bottom-5 right-7 z-10">
              <Seal className="bg-paper/10 text-paper border-paper/80">史官<br />评定</Seal>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 gap-4 p-5 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="flex min-h-0 flex-col">
              <div className="grid shrink-0 gap-4 lg:grid-cols-[0.72fr_1.28fr]">
                <ScenePlaceholder scene={endingScene} subtitle={ending.imageCaption} image={endingImage} compact />
                <div className="flex flex-col justify-center border-l-2 border-cinnabar/45 bg-paper/55 p-4">
                  <p className="text-sm tracking-[0.28em] text-cinnabar">史官评语</p>
                  <p className="mt-2 font-song text-xl font-bold text-cinnabar xl:text-2xl">“{ending.comment}”</p>
                </div>
              </div>
              <p className="ending-explanation mt-4 text-base leading-7 text-brownInk xl:text-lg">{ending.explanation}</p>
              <div className="mt-auto flex shrink-0 flex-wrap gap-3 pt-4">
                <button onClick={onRestart} className={primaryButton}>
                  重新体验
                </button>
                <button onClick={onRecord} className={buttonBase}>
                  查看路线记录
                </button>
              </div>
            </div>

            <div className="flex min-h-0 flex-col gap-3">
              {ending.causeText && (
                <section className="border-l-2 border-cinnabar/55 bg-paperDeep/50 px-4 py-3 shadow-[inset_0_0_26px_rgba(126,92,46,0.08)]">
                  <p className="text-sm tracking-[0.28em] text-cinnabar">{ending.causeTitle || '何以至此'}</p>
                  <p className="ending-cause-text mt-2 text-sm leading-6 text-brownInk xl:text-base xl:leading-7">
                    {ending.causeText}
                  </p>
                  {ending.causeBullets?.length > 0 && (
                    <ul className="mt-3 grid gap-2 text-xs leading-5 text-ink sm:grid-cols-2 xl:text-sm">
                      {ending.causeBullets.map((item) => (
                        <li key={item} className="border border-brownInk/15 bg-paper/55 px-3 py-1.5">
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              <section className="border border-brownInk/20 bg-paper/60 p-3">
                <p className="font-song text-xl font-black text-ink">数据归因</p>
                <dl className="mt-2 grid gap-2 sm:grid-cols-3">
                  {attributionStatOrder.map((name) => (
                    <div key={name} className="flex items-center justify-between border-b border-brownInk/15 pb-1.5">
                      <dt className="font-song font-bold text-brownInk">{name}</dt>
                      <dd className="font-song text-lg font-black text-cinnabar">{stats[name]}</dd>
                    </div>
                  ))}
                </dl>
                {ending.systemReason && (
                  <p className="ending-system-reason mt-2 border-t border-brownInk/15 pt-2 text-sm leading-6 text-brownInk">
                    <span className="font-song font-bold text-ink">系统判断：</span>
                    {ending.systemReason}
                  </p>
                )}
              </section>
            </div>
          </div>
        </div>

        <div className="min-h-0 overflow-hidden">
          <StatBoard stats={stats} title="最终六项变量" />
        </div>
      </section>
    </PageShell>
  );
}

function RulesPage({ onBack }) {
  const statItems = designRules.slice(3);
  const [activeStatIndex, setActiveStatIndex] = useState(0);
  const activeStat = statItems[activeStatIndex];
  const statSymbols = ['仓', '民', '甲', '议', '令', '争'];
  const prologueText = [
    '治平既往，熙宁初开。汴梁城中车马喧阗，市肆灯火不绝；而繁华之外，国用日窘，边事多警，冗官、冗兵、冗费如积雪压梁。',
    '朝堂之上波澜骤起。王安石入对，言理财，言强兵，言变更旧制；其言锋利，如投石入水。年轻的宋神宗临朝未久，已知祖宗成法不足以尽解今日之困。',
    '墨色之内，权衡富国与安民，强兵与扰民，法度与人心。此局不是要你凭空改写历史，而是在史实的缝隙中，作出属于你的抉择。',
    '每一道诏令，都要越过士大夫的议论、州县官吏的执行、百姓田亩间的冷暖，以及边关烽烟下的军需。',
    '你将执掌御笔，扮演大宋天子赵顼。在青苗、募役、市易、保甲与新旧党争之间，判断取舍，承担后果。',
    '若急进，则国用或充，而民心或失；若守成，则朝局可安，而积弊难除。熙宁之局，已在案前展开。',
  ];

  return (
    <PageShell full className="h-[calc(100vh-96px)] overflow-hidden px-3 py-2 lg:px-4">
      <section className="prologue-stage scroll-card flex h-full flex-col overflow-hidden p-4 sm:p-5">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-brownInk/20 pb-3">
          <div className="min-w-0">
            <p className="text-xs tracking-[0.42em] text-cinnabar">序幕</p>
            <h2 className="mt-1 font-song text-4xl font-black leading-tight text-ink lg:text-5xl">
              熙宁风起，万机待断
            </h2>
          </div>
          <Seal>御前<br />开卷</Seal>
        </div>

        <div className="mt-4 grid min-h-0 flex-1 gap-4 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="prologue-scroll min-h-0 border border-brownInk/20 bg-paper/55 p-4">
            <div className="prologue-manuscript">
              <p className="prologue-lead">治平之后，山河未宁。</p>
              {prologueText.map((text) => (
                <p key={text}>{text}</p>
              ))}
            </div>
          </div>

          <div className="prologue-ledger min-h-0 border border-brownInk/15 bg-paper/45 p-4">
            <p className="mb-3 text-xs tracking-[0.34em] text-cinnabar">六项朝局</p>
            <div className="stat-token-grid">
              {statItems.map((rule, index) => (
                <motion.button
                  key={rule.title}
                  type="button"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onMouseEnter={() => setActiveStatIndex(index)}
                  onFocus={() => setActiveStatIndex(index)}
                  onClick={() => setActiveStatIndex(index)}
                  className={`stat-token ${activeStatIndex === index ? 'is-active' : ''}`}
                  aria-pressed={activeStatIndex === index}
                >
                  <span className="stat-token-symbol">{statSymbols[index]}</span>
                  <span className="stat-token-name">{rule.title}</span>
                </motion.button>
              ))}
            </div>
            <motion.div
              key={activeStat.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="stat-token-detail mt-5"
            >
              <p className="font-song text-3xl font-black text-ink">{activeStat.title}</p>
              <p className="mt-3 text-base leading-8 text-brownInk/90">{activeStat.detail}</p>
            </motion.div>
          </div>
        </div>

        <div className="mt-3 flex shrink-0 justify-end">
          <button onClick={onBack} className={buttonBase}>
            返回
          </button>
        </div>
      </section>
    </PageShell>
  );
}

function GalleryPage({ onBack }) {
  return (
    <PageShell>
      <section className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm tracking-[0.32em] text-cinnabar">图像叙事</p>
          <h2 className="mt-3 font-song text-4xl font-black text-ink">十二帧熙宁图卷</h2>
        </div>
        <button onClick={onBack} className={buttonBase}>
          返回
        </button>
      </section>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {imageStoryItems.map((item, index) => (
          <motion.article
            key={item.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="scroll-card p-4"
          >
            <ScenePlaceholder scene={item.scene} image={sceneImages[item.scene]} compact />
            <h3 className="mt-4 font-song text-2xl font-bold text-ink">{index + 1}. {item.title}</h3>
            <p className="mt-2 leading-7 text-brownInk/85">{item.description}</p>
          </motion.article>
        ))}
      </div>
    </PageShell>
  );
}

function RecordPage({ history, onBack, onRestart }) {
  return (
    <PageShell full className="h-[calc(100vh-96px)] overflow-hidden px-4 py-3 sm:px-6 lg:px-10">
      <section className="scroll-card flex h-full min-h-0 flex-col overflow-hidden p-5 sm:p-6">
        <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm tracking-[0.32em] text-cinnabar">路线记录</p>
            <h2 className="mt-3 font-song text-4xl font-black text-ink">你留下的改革轨迹</h2>
          </div>
          <div className="flex gap-3">
            <button onClick={onBack} className={buttonBase}>
              返回结局
            </button>
            <button onClick={onRestart} className={primaryButton}>
              重新体验
            </button>
          </div>
        </div>
        <div className="record-scroll mt-6 min-h-0 flex-1 overflow-y-auto pr-2">
          <RouteRecord history={history} />
        </div>
      </section>
    </PageShell>
  );
}

export default function App() {
  const [screen, setScreen] = useState('start');
  const [lastScreen, setLastScreen] = useState('start');
  const [nodeIndex, setNodeIndex] = useState(0);
  const [stats, setStats] = useState(initialStats);
  const [previousStats, setPreviousStats] = useState(null);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);

  const currentNode = decisionNodes[nodeIndex];
  const ending = useMemo(() => getEnding(stats), [stats]);

  function go(screenName) {
    setLastScreen(screen);
    setScreen(screenName);
  }

  function restart() {
    setNodeIndex(0);
    setStats(initialStats);
    setPreviousStats(null);
    setSelected(null);
    setHistory([]);
    setScreen('start');
    setLastScreen('start');
  }

  function handleChoose(option) {
    const nextStats = { ...stats };
    Object.entries(option.effects).forEach(([name, delta]) => {
      nextStats[name] = clampStat((nextStats[name] ?? 50) + delta);
    });
    const selection = { node: currentNode, option, before: stats, after: nextStats };
    setPreviousStats(stats);
    setStats(nextStats);
    setSelected(selection);
    setHistory((items) => [...items, selection]);
    go('feedback');
  }

  function nextAfterFeedback() {
    if (nodeIndex + 1 >= decisionNodes.length) {
      go('ending');
      return;
    }
    setNodeIndex((value) => value + 1);
    setPreviousStats(null);
    go('decision');
  }

  function goRules() {
    go('rules');
  }

  function goGallery() {
    go('gallery');
  }

  function backFromAuxiliary() {
    setScreen(lastScreen === 'rules' || lastScreen === 'gallery' ? 'start' : lastScreen);
  }

  return (
    <AppFrame onHome={restart}>
      <AnimatePresence mode="wait">
        {screen === 'start' && (
          <StartPage
            key="start"
            onStart={() => go('background')}
            onRules={goRules}
            onGallery={goGallery}
            onQuit={() => window.xiningApp?.quit?.()}
          />
        )}
        {screen === 'background' && (
          <BackgroundPage
            key="background"
            onNext={() => go('decision')}
            onRules={goRules}
            onGallery={goGallery}
          />
        )}
        {screen === 'decision' && (
          <DecisionPage
            key={`decision-${currentNode.id}`}
            node={currentNode}
            index={nodeIndex}
            stats={stats}
            onChoose={handleChoose}
          />
        )}
        {screen === 'feedback' && selected && (
          <FeedbackPage
            key={`feedback-${selected.node.id}`}
            selected={selected}
            stats={stats}
            previousStats={previousStats}
            onNext={nextAfterFeedback}
          />
        )}
        {screen === 'ending' && (
          <EndingPageCompact
            key="ending"
            ending={ending}
            stats={stats}
            onRestart={restart}
            onRecord={() => go('record')}
          />
        )}
        {screen === 'rules' && <RulesPage key="rules" onBack={backFromAuxiliary} />}
        {screen === 'gallery' && <GalleryPage key="gallery" onBack={backFromAuxiliary} />}
        {screen === 'record' && (
          <RecordPage
            key="record"
            history={history}
            onBack={() => go('ending')}
            onRestart={restart}
          />
        )}
      </AnimatePresence>
    </AppFrame>
  );
}
