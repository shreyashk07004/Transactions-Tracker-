import React from 'react';
import { motion } from 'motion/react';
import { pageVariants } from './variants';
import { useReducedMotion } from './useReducedMotion';

interface PageTransitionProps {
  children: React.ReactNode;
  pageKey: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, pageKey }) => {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className="w-full h-full">{children}</div>;
  }

  return (
    <motion.div
      key={pageKey}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full h-full flex flex-col"
    >
      {children}
    </motion.div>
  );
};
