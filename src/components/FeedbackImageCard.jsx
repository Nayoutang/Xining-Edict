import { useMemo, useState } from 'react';

export default function FeedbackImageCard({
  image,
  title = '历史回响',
  description = '后续可替换为真实历史场景图片。',
  compact = false,
}) {
  const [failed, setFailed] = useState(false);
  const shouldShowImage = Boolean(image) && !failed;
  const fallbackMark = useMemo(() => title.slice(0, 2) || '史', [title]);

  return (
    <figure className={`feedback-image-card relative overflow-hidden border border-brownInk/25 bg-paperDeep/70 shadow-[0_16px_38px_rgba(72,45,18,0.13)] ${compact ? 'h-full min-h-0' : ''}`}>
      <div className="absolute inset-0 ink-lines opacity-25" />
      <div className={`relative overflow-hidden bg-[#e5d8bd] ${compact ? 'h-full min-h-56' : 'aspect-[16/9]'}`}>
        {shouldShowImage ? (
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover sepia-[0.22] saturate-[0.8]"
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_42%,rgba(177,54,44,0.13),transparent_34%),linear-gradient(135deg,rgba(234,217,183,0.92),rgba(205,185,145,0.72))]">
            <div className={`${compact ? 'h-20 w-20 text-3xl' : 'h-24 w-24 text-4xl'} flex rotate-[-7deg] items-center justify-center border-[3px] border-cinnabar/70 bg-paper/35 font-song font-black text-cinnabar shadow-seal`}>
              {fallbackMark}
            </div>
          </div>
        )}
        <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 via-ink/25 to-transparent text-paper ${compact ? 'p-3' : 'p-4'}`}>
          <p className={`font-song font-black drop-shadow ${compact ? 'text-lg' : 'text-xl'}`}>{title}</p>
          <p className={`${compact ? 'mt-0.5 text-xs leading-5' : 'mt-1 text-sm leading-6'} text-paper/85`}>{description}</p>
        </div>
      </div>
      <figcaption className={`relative border-t border-brownInk/15 bg-paper/55 px-4 text-xs tracking-[0.28em] text-cinnabar ${compact ? 'py-2' : 'py-3'}`}>
        历史回响
      </figcaption>
    </figure>
  );
}
