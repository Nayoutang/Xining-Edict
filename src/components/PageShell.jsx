import { motion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export default function PageShell({ children, className = '', full = false }) {
  return (
    <motion.main
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={`mx-auto min-h-0 w-full px-4 py-6 sm:px-6 lg:px-8 ${full ? 'max-w-none' : 'max-w-[1680px]'} ${className}`}
    >
      {children}
    </motion.main>
  );
}
