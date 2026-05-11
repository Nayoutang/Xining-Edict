import { decisionNodes } from '../data/gameData';

export default function RouteRecord({ history }) {
  if (!history.length) {
    return <p className="text-brownInk/75">尚未留下路线记录。</p>;
  }

  return (
    <div className="space-y-3 pb-4">
      {history.map((entry, index) => {
        const node = decisionNodes[index];
        return (
          <article key={`${node.id}-${entry.option.label}`} className="border-l-2 border-cinnabar/55 bg-paper/45 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-brownInk/70">
              <span>第 {index + 1} 节</span>
              <span>{node.year}</span>
            </div>
            <h3 className="mt-1 font-song text-xl font-bold text-ink">{node.title}</h3>
            <p className="mt-2 font-song text-lg text-cinnabar">
              {entry.option.label}. {entry.option.text}
            </p>
            <p className="mt-1 leading-7 text-brownInk">{entry.option.feedback}</p>
          </article>
        );
      })}
    </div>
  );
}
