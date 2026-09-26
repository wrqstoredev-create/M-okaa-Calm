import React, { useState, useEffect } from 'react';
import { Zap, Sparkles, ShieldCheck, Flame, X, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const TICKER_ITEMS = [
  {
    icon: <Zap size={13} className="text-yellow-400 fill-yellow-400 animate-pulse" />,
    badge: 'تسليم فوري',
    text: 'شحن آلي وسريع لكافة الألعاب والبطاقات الرقمية في أقل من 5 دقائق ⚡',
  },
  {
    icon: <Gift size={13} className="text-red-400" />,
    badge: 'كود خصم حصري',
    text: 'استخدم الكود [ GAMEPAY ] للاستفادة من خصم إضافي عند الدفع 🎁',
  },
  {
    icon: <Flame size={13} className="text-orange-400 fill-orange-400" />,
    badge: 'شحن روبلوكس',
    text: 'روبوكس بأرخص الأسعار في الوطن العربي مع سيرفر توزيع فوري 🪙',
  },
  {
    icon: <ShieldCheck size={13} className="text-emerald-400" />,
    badge: 'ضمان رسمي 100%',
    text: 'حماية وأمان كامل لحساباتك مع دعم فني متواصل عبر واتساب 💬',
  },
];

export default function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(() => {
    return localStorage.getItem('announcement_closed') !== 'true';
  });

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % TICKER_ITEMS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('announcement_closed', 'true');
  };

  if (!isVisible) return null;

  const currentItem = TICKER_ITEMS[currentIndex];

  return (
    <div className="relative bg-gradient-to-r from-[#0d0914] via-[#1a0812] to-[#0d0914] text-white border-b border-white/8 z-50 overflow-hidden text-xs py-2 px-3 shadow-inner select-none">
      {/* Glow highlight */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,32,64,0.15),transparent)] pointer-events-none" />

      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 relative z-10">
        {/* Left spacer / Badge */}
        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="text-[10px] font-black uppercase tracking-wider text-red-400">تحديثات حية</span>
        </div>

        {/* Center cycling ticker */}
        <div className="flex-1 flex items-center justify-center min-w-0 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="flex items-center justify-center gap-2 text-center truncate"
            >
              <div className="flex items-center justify-center flex-shrink-0">
                {currentItem.icon}
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/10 text-white/90 border border-white/10 hidden xs:inline-block">
                {currentItem.badge}
              </span>
              <p className="text-[11px] sm:text-xs font-bold text-gray-200 truncate">
                {currentItem.text}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={handleClose}
          className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0 cursor-pointer"
          title="إغلاق الإشعار"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

