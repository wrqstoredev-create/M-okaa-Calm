import React from 'react';
import { ShieldCheck, Zap, Headphones, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';

const features = [
  {
    icon: <Zap size={24} className="text-yellow-500 fill-yellow-500/20" />,
    title: 'تسليم فوري',
    desc: 'احصل على كودك فور الدفع مباشرة'
  },
  {
    icon: <ShieldCheck size={24} className="text-red-700 fill-red-700/20" />,
    title: 'ضمان كامل',
    desc: 'ضمان 100% على كافة المنتجات'
  },
  {
    icon: <CreditCard size={24} className="text-blue-600 fill-blue-600/20" />,
    title: 'دفع آمن',
    desc: 'أحدث وسائل الدفع العالمية والمحلية'
  },
  {
    icon: <Headphones size={24} className="text-green-600 fill-green-600/20" />,
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
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
            viewport={{ once: true }}
            className="bg-white dark:bg-[#1a1d24]/70 backdrop-blur-md border border-gray-100 dark:border-gray-700/50 rounded-2xl p-4 md:p-6 flex flex-col items-center text-center group hover:shadow-xl hover:border-red-100 transition-all duration-500 h-full shadow-sm"
          >
            <div className="p-3 bg-gray-50 dark:bg-[#0f1115] rounded-xl mb-4 group-hover:scale-110 group-hover:bg-red-700 group-hover:text-white transition-all duration-500 shadow-sm">
              {f.icon}
            </div>
            <h4 className="text-sm md:text-base font-black text-gray-900 dark:text-white mb-1.5 leading-none">{f.title}</h4>
            <p className="text-[10px] md:text-xs text-gray-400 font-bold leading-relaxed max-w-[160px]">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
