import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface TpsPageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * TpsPageTransition — Wraps page content with a subtle fade + upward slide animation.
 * Apply at the page/route level for smooth page transitions.
 */
export function TpsPageTransition({ children, className = '' }: TpsPageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
