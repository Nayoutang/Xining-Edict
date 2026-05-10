import { motion, useSpring, useTransform } from 'framer-motion';
import { statMeta } from '../data/gameData';

const statOrder = ['国用', '民生', '边防', '士论', '法度', '党争'];

function StatRow({ name, value, previous }) {
  const spring = useSpring(value, { stiffness: 90, damping: 18, mass: 0.8 });
  const width = useTransform(spring, (latest) => `${Math.max(0, Math.min(100, latest))}%`);
  const rounded = useTransform(spring, (latest) => Math.round(latest));
  const delta = typeof previous === 'number' ? value - previous : 0;
  const isFaction = name === '党争';
  const barClass = isFaction
    ? value >= 70
      ? 'bg-cinnabar'
      : 'bg-cinnabar/65'
    : value >= 70
      ? 'bg-moss'
      : 'bg-tealgray';

  return (
    <div className="rounded-sm border border-brownInk/15 bg-paper/55 p-2">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div>
          <p className="font-song text-[15px] font-bold text-ink">{name}</p>
          <p className="mt-0.5 text-[11px] leading-4 text-brownInk/75">{statMeta[name]}</p>
        </div>
        <motion.span
          key={`${name}-${value}`}
          initial={{ scale: 0.86 }}
          animate={{ scale: 1 }}
          className={`min-w-10 text-right font-song text-base font-bold ${
            isFaction && value >= 70 ? 'text-cinnabar' : 'text-ink'
          }`}
        >
          <motion.span>{rounded}</motion.span>
        </motion.span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-brownInk/15">
        <motion.div className={`h-full rounded-full ${barClass}`} style={{ width }} />
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] text-brownInk/70">
        <span>{isFaction ? '低则朝局较稳' : '弱'}</span>
        {delta !== 0 && (
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={delta > 0 ? 'text-cinnabar' : 'text-moss'}
          >
            {delta > 0 ? '+' : ''}
            {delta}
          </motion.span>
        )}
        <span>{isFaction ? '高则撕裂加深' : '强'}</span>
      </div>
    </div>
  );
}

export default function StatBoard({ stats, previousStats, title = '朝局简表' }) {
  return (
    <aside className="scroll-card sticky top-4 h-fit p-3">
      <div className="mb-3 flex items-center justify-between border-b border-brownInk/20 pb-2">
        <div>
          <p className="font-song text-lg font-bold text-ink">{title}</p>
          <p className="mt-1 text-xs text-brownInk/70">党争越高越危险，其余指标通常越高越有利。</p>
        </div>
      </div>
      <div className="space-y-2">
        {statOrder.map((name) => (
          <StatRow
            key={name}
            name={name}
            value={stats[name]}
            previous={previousStats ? previousStats[name] : undefined}
          />
        ))}
      </div>
    </aside>
  );
}
