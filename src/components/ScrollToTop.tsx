/**
 * ScrollToTop — GamePay
 * Phase 5 UX Polish:
 *  - Auto-scrolls to top on route change (original logic preserved)
 *  - NEW: Floating neon "back to top" button with pulse animation,
 *    appears after scrolling 400px down
 */

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronUp } from 'lucide-react';

export default function ScrollToTop() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);

  // Original: scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  // New: show/hide floating button
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollUp = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.button
            key="scroll-top"
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={scrollUp}
            aria-label="العودة للأعلى"
            title="العودة للأعلى"
            className="
              fixed bottom-24 lg:bottom-8 left-4 z-40
              w-11 h-11 rounded-full
              flex items-center justify-center
              cursor-pointer
              bg-gradient-to-br from-red-600 to-rose-500
              shadow-[0_4px_20px_rgba(255,32,64,0.5)]
              dark:shadow-[0_4px_25px_rgba(255,32,64,0.6),0_0_40px_rgba(255,32,64,0.2)]
              border border-red-500/30
              text-white
              hover:scale-110 hover:shadow-[0_4px_30px_rgba(255,32,64,0.8)]
              active:scale-95
              transition-all duration-200
            "
            style={{
              animation: 'neon-pulse 2.5s ease-in-out infinite',
            }}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronUp size={20} strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
