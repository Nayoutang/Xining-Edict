import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function ScenePlaceholder({ scene, subtitle, compact = false, image }) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (!isPreviewOpen) return;

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsPreviewOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPreviewOpen]);

  return (
    <>
      <motion.div
        whileHover={{ y: compact ? 0 : -3 }}
        onDoubleClick={(event) => {
          event.stopPropagation();
          if (image) {
            setIsPreviewOpen(true);
          }
        }}
        className={`scene-panel relative overflow-hidden border border-brownInk/20 bg-paperDeep/60 ${
          compact ? 'min-h-36' : 'min-h-64'
        } ${image ? 'cursor-zoom-in' : ''}`}
      >
        {image ? (
          <>
            <div
              className="scene-image-layer absolute inset-0"
              style={{
                backgroundImage: `url("${image}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <img
              src={image}
              alt={scene}
              className="sr-only"
              loading={compact ? 'lazy' : 'eager'}
            />
          </>
        ) : (
          <div className="absolute inset-0 scene-gradient" />
        )}
        <div className={`absolute inset-0 ${image ? 'bg-gradient-to-b from-ink/10 via-transparent to-ink/35' : ''}`} />
        <div className={`absolute inset-0 ink-lines ${image ? 'opacity-15' : 'opacity-45'}`} />
        <div className="relative z-10 flex h-full min-h-inherit flex-col justify-end p-5 text-paper">
          <div>
            <p className="font-song text-2xl font-bold text-paper drop-shadow">{scene}</p>
            {subtitle && <p className="mt-2 max-w-md text-sm leading-6 text-paper/85">{subtitle}</p>}
          </div>
        </div>
      </motion.div>

      {image && isPreviewOpen && createPortal(
        <div
          className="image-preview fixed inset-0 z-[80] flex items-center justify-center bg-ink/82 p-6 backdrop-blur-sm"
          onClick={() => setIsPreviewOpen(false)}
        >
          <button
            type="button"
            className="absolute right-6 top-5 border border-paper/40 bg-paper/10 px-4 py-2 font-song text-sm font-bold text-paper hover:bg-paper/20"
            onClick={() => setIsPreviewOpen(false)}
          >
            关闭
          </button>
          <img
            src={image}
            alt={scene}
            className="max-h-full max-w-full border border-paper/35 object-contain shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
            onClick={(event) => event.stopPropagation()}
          />
        </div>,
        document.body
      )}
    </>
  );
}
