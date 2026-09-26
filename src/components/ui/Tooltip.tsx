/**
 * Tooltip — GamePay
 * Phase 5 UX Polish: Modern glassmorphism tooltip with neon border
 *
 * Usage:
 *   <Tooltip content="نص التلميح">
 *     <button>...</button>
 *   </Tooltip>
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TooltipProps {
  content: string;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export default function Tooltip({
  content,
  children,
  position = 'top',
  delay = 300,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    timerRef.current = setTimeout(() => setVisible(true), delay);
  };

  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  };

  /* ── Position variants ───────────────────────────────────────── */
  const positions = {
    top:    { bottom: '110%', left: '50%', transform: 'translateX(-50%)',  marginBottom: '6px' },
    bottom: { top: '110%',    left: '50%', transform: 'translateX(-50%)',  marginTop: '6px'    },
    left:   { right: '110%', top: '50%',   transform: 'translateY(-50%)', marginRight: '6px'  },
    right:  { left: '110%',  top: '50%',   transform: 'translateY(-50%)', marginLeft: '6px'   },
  };

  const motionVariants = {
    top:    { initial: { opacity: 0, y: 6 },  animate: { opacity: 1, y: 0 } },
    bottom: { initial: { opacity: 0, y: -6 }, animate: { opacity: 1, y: 0 } },
    left:   { initial: { opacity: 0, x: 6 },  animate: { opacity: 1, x: 0 } },
    right:  { initial: { opacity: 0, x: -6 }, animate: { opacity: 1, x: 0 } },
  };

  const mv = motionVariants[position];

  return (
    <div className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            key="tooltip"
            initial={mv.initial}
            animate={mv.animate}
            exit={mv.initial}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="
              absolute z-[200] pointer-events-none
              whitespace-nowrap
              px-3 py-1.5
              text-[11px] font-bold
              rounded-lg
              bg-white/95 dark:bg-[#0e0e14]/95
              dark:backdrop-blur-xl
              border border-gray-200 dark:border-white/10 dark:border-red-500/20
              text-gray-800 dark:text-gray-200
              shadow-lg dark:shadow-[0_4px_20px_rgba(0,0,0,0.6),0_0_8px_rgba(255,32,64,0.1)]
            "
            style={{ ...positions[position] }}
            dir="rtl"
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

