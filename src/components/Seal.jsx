export default function Seal({ children, className = '' }) {
  return (
    <span
      className={`inline-flex min-h-16 min-w-16 rotate-[-6deg] items-center justify-center border-4 border-cinnabar/80 px-3 py-2 font-song text-base font-bold leading-tight text-cinnabar shadow-seal ${className}`}
    >
      {children}
    </span>
  );
}
