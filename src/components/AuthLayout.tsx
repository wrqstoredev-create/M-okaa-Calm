/**
 * AuthLayout — GamePay
 *
 * Shared split-screen layout for Login & Register.
 * Fully responsive and supports both Light Mode and OLED Dark Mode seamlessly.
 *
 * ── Desktop (lg+) ──
 *   Left panel  : Animated brand banner with game assets, trust stats,
 *                 testimonial quote, and floating decoration elements.
 *                 Adapts to light & dark theme cleanly.
 *   Right panel : Scrollable form area — passed as `children`.
 *
 * ── Mobile (<lg) ──
 *   Full-screen form with a compact logo header.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShieldCheck, Zap, Users } from 'lucide-react';

/* ── Trust stats data ────────────────────────────────────────────────────── */
const STATS = [
  { icon: <Users size={16} className="text-red-500" />,     label: '+50,000',  sub: 'عميل موثوق' },
  { icon: <Zap size={16} className="text-amber-500" />,     label: 'فوري',     sub: 'تسليم ضمني' },
  { icon: <ShieldCheck size={16} className="text-emerald-500" />, label: '100%', sub: 'دفع آمن' },
];

/* ── Floating game emoji chips ───────────────────────────────────────────── */
const CHIPS = [
  { emoji: '🎮', label: 'Roblox',      delay: 0 },
  { emoji: '⚽', label: 'FC Mobile',   delay: 0.3 },
  { emoji: '🔫', label: 'PUBG',        delay: 0.6 },
  { emoji: '🃏', label: 'Clash',       delay: 0.9 },
  { emoji: '🪙', label: 'Robux',       delay: 1.2 },
  { emoji: '🏆', label: 'Fortnite',    delay: 1.5 },
];

interface AuthLayoutProps {
  children: React.ReactNode;
  side?: 'left' | 'right';
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex-1 flex min-h-[calc(100vh-64px)] bg-zinc-50 dark:bg-[#060608] transition-colors duration-300" dir="rtl">

      {/* ── Left Banner Panel (hidden on mobile, adapts to Light & Dark) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-red-50/30 via-zinc-100/70 to-purple-50/20 dark:from-[#060608] dark:via-[#09090e] dark:to-[#060608] border-l border-gray-200/80 dark:border-white/5 flex-col items-center justify-center p-12 select-none transition-colors duration-300">

        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.06] dark:opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #ef4444 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Ambient glow orbs */}
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 right-1/3 w-80 h-80 bg-red-500/15 dark:bg-red-600/20 rounded-full blur-[90px] pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.22, 0.1] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-purple-500/10 dark:bg-purple-600/15 rounded-full blur-[80px] pointer-events-none"
        />

        {/* Floating game chips */}
        <div className="absolute inset-0 pointer-events-none">
          {CHIPS.map((chip, i) => {
            const positions = [
              { top: '12%', left: '8%'  },
              { top: '18%', right: '6%' },
              { top: '45%', left: '4%'  },
              { top: '55%', right: '4%' },
              { bottom: '20%', left: '10%' },
              { bottom: '14%', right: '8%'  },
            ];
            return (
              <motion.div
                key={chip.label}
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: chip.delay }}
                className="absolute flex items-center gap-2 bg-white/85 dark:bg-white/5 backdrop-blur-md border border-gray-200/80 dark:border-white/10 shadow-sm dark:shadow-none px-3.5 py-2 rounded-2xl"
                style={positions[i]}
              >
                <span className="text-lg">{chip.emoji}</span>
                <span className="text-[11px] font-black text-gray-800 dark:text-white/80">{chip.label}</span>
              </motion.div>
            );
          })}
        </div>

        {/* Center content */}
        <div className="relative z-10 text-center space-y-8 max-w-sm">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-black tracking-tighter">
              <span className="text-red-600">Mokaa</span>
              <span className="text-gray-900 dark:text-white">STORE</span>
            </h1>
            <p className="text-gray-500 dark:text-white/50 text-sm font-bold mt-1">متجرك الأول لشحن الألعاب</p>
          </motion.div>

          {/* Big headline */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h2 className="text-3xl font-black text-gray-900 dark:text-white leading-tight">
              اشحن ألعابك
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-600 to-red-600 dark:from-red-400 dark:to-red-600">
                بأفضل الأسعار
              </span>
            </h2>
            <p className="text-gray-600 dark:text-white/50 text-sm font-bold mt-3 leading-relaxed">
              أسرع منصة شحن ألعاب في المنطقة العربية مع ضمان التسليم الفوري وأعلى معايير الأمان.
            </p>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex items-center justify-center gap-6"
          >
            {STATS.map((stat, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 bg-white/90 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 rounded-xl flex items-center justify-center shadow-sm dark:shadow-none">
                  {stat.icon}
                </div>
                <span className="text-base font-black text-gray-900 dark:text-white">{stat.label}</span>
                <span className="text-[10px] font-bold text-gray-500 dark:text-white/40">{stat.sub}</span>
              </div>
            ))}
          </motion.div>

          {/* Testimonial quote */}
          <motion.blockquote
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="bg-white/90 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 rounded-2xl p-5 text-right shadow-sm dark:shadow-none backdrop-blur-md"
          >
            <p className="text-gray-700 dark:text-white/70 text-[13px] font-bold leading-relaxed italic">
              "أفضل متجر جربته في حياتي — التسليم كان في ثوانٍ والسعر لا يُقارن! 🔥"
            </p>
            <div className="flex items-center gap-2 mt-3 justify-end">
              <div className="text-right">
                <p className="text-gray-900 dark:text-white font-black text-[11px]">أحمد الشهراني</p>
                <p className="text-gray-500 dark:text-white/40 text-[10px] font-bold">عميل موثوق ⭐⭐⭐⭐⭐</p>
              </div>
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-sm">
                أ
              </div>
            </div>
          </motion.blockquote>
        </div>
      </div>

      {/* ── Right Form Panel (harmonious in Light & Dark mode) ────────── */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center bg-white dark:bg-[#0c0c10] px-6 py-10 overflow-y-auto transition-colors duration-300">

        {/* Mobile logo — hidden on desktop */}
        <div className="lg:hidden mb-8 text-center">
          <Link to="/">
            <h1 className="text-2xl font-black tracking-tight">
              <span className="text-red-600">Mokaa</span>
              <span className="text-gray-900 dark:text-white">STORE</span>
            </h1>
          </Link>
        </div>

        {/* Form content injected here */}
        <div className="w-full max-w-[420px]">
          {children}
        </div>

        {/* Back to home link */}
        <Link
          to="/"
          className="mt-8 text-[11px] font-bold text-gray-400 hover:text-red-600 transition-colors"
        >
          ← العودة إلى الرئيسية
        </Link>
      </div>
    </div>
  );
}
