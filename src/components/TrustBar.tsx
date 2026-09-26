import React from 'react';
import { ShieldCheck, Zap, Headphones, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';

const features = [
  {
    icon: <Zap size={22} />,
    color: 'text-amber-400',
    glow: 'rgba(251,191,36,0.5)',
    bg: 'dark:bg-amber-500/10',
    border: 'dark:border-amber-500/20',
    hoverBorder: 'dark:hover:border-amber-500/50',
    hoverGlow: 'dark:hover:shadow-[0_0_20px_rgba(251,191,36,0.25)]',
    title: 'تسليم فوري',
    desc: 'احصل على كودك فور الدفع مباشرة'
  },
  {
    icon: <ShieldCheck size={22} />,
    color: 'text-red-400',
    glow: 'rgba(255,32,64,0.5)',
    bg: 'dark:bg-red-500/10',
    border: 'dark:border-red-500/20',
    hoverBorder: 'dark:hover:border-red-500/50',
    hoverGlow: 'dark:hover:shadow-[0_0_20px_rgba(255,32,64,0.25)]',
    title: 'ضمان كامل',
    desc: 'ضمان 100% على كافة المنتجات'
  },
  {
    icon: <CreditCard size={22} />,
    color: 'text-blue-400',
    glow: 'rgba(0,212,255,0.5)',
    bg: 'dark:bg-blue-500/10',
    border: 'dark:border-blue-500/20',
    hoverBorder: 'dark:hover:border-blue-500/50',
    hoverGlow: 'dark:hover:shadow-[0_0_20px_rgba(0,212,255,0.2)]',
    title: 'دفع آمن',
    desc: 'أحدث وسائل الدفع العالمية والمحلية'
  },
  {
    icon: <Headphones size={22} />,
    color: 'text-emerald-400',
    glow: 'rgba(0,255,136,0.5)',
    bg: 'dark:bg-emerald-500/10',
    border: 'dark:border-emerald-500/20',
    hoverBorder: 'dark:hover:border-emerald-500/50',
    hoverGlow: 'dark:hover:shadow-[0_0_20px_rgba(0,255,136,0.2)]',
    title: 'دعم 24/7',
    desc: 'فريق فني متخصص لخدمتكم دائماً'
  }
];

export default function TrustBar() {
  return (
    <section className="mt-16 mb-8 w-full max-w-7xl mx-auto px-4 relative">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((f, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.45, ease: 'easeOut' }}
            viewport={{ once: true }}
            whileHover={{ y: -4 }}
            className={`
              bg-white dark:bg-[#0c0c10]
              backdrop-blur-md
              border border-gray-100 dark:border-white/5
              ${f.border}
              rounded-2xl p-4 md:p-6
              flex flex-col items-center text-center
              group
              shadow-sm
              transition-all duration-300
              ${f.hoverBorder}
              ${f.hoverGlow}
              hover:shadow-lg
              h-full
            `}
          >
            {/* Icon with neon glow ring */}
            <div className={`
              p-3 rounded-xl mb-4
              bg-gray-100 dark:bg-white/5 ${f.bg}
              group-hover:scale-110 transition-all duration-300
              ${f.color}
              shadow-sm
            `}
              style={{
                filter: `drop-shadow(0 0 0px transparent)`,
              }}
            >
              <div style={{ filter: `drop-shadow(0 0 6px ${f.glow})` }}>
                {f.icon}
              </div>
            </div>
            <h4 className="text-sm md:text-base font-black text-gray-900 dark:text-white mb-1.5 leading-none">
              {f.title}
            </h4>
            <p className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500 font-bold leading-relaxed max-w-[160px]">
              {f.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
