import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Gamepad2, Home, Search, ShoppingBag, ArrowRight, Sparkles, Compass } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/store');
    }
  };

  return (
    <div className="flex-1 w-full min-h-[75vh] flex items-center justify-center px-4 py-16 relative overflow-hidden text-right" dir="rtl">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-650/10 dark:bg-red-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-xl w-full text-center relative z-10 flex flex-col items-center"
      >
        {/* Floating Gamer Badge & 404 Graphic */}
        <div className="relative mb-6">
          <div className="relative inline-block">
            <span className="text-8xl sm:text-9xl font-black font-mono tracking-tighter bg-gradient-to-b from-gray-900 via-gray-700 to-gray-400 dark:from-white dark:via-zinc-200 dark:to-zinc-600 bg-clip-text text-transparent drop-shadow-sm select-none">
              404
            </span>
            <motion.div 
              animate={{ y: [-4, 4, -4], rotate: [-2, 2, -2] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 p-3 rounded-2xl bg-gradient-to-br from-red-600 to-rose-600 text-white shadow-[0_0_25px_rgba(255,32,64,0.5)] border border-white/20"
            >
              <Gamepad2 size={28} />
            </motion.div>
          </div>
        </div>

        {/* Headings */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-black mb-3">
          <Compass size={14} className="animate-spin" style={{ animationDuration: '6s' }} />
          <span>خطأ في الإحداثيات (Out of Bounds)</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-3">
          لقد سقطت خارج الخريطة! 🎮
        </h1>

        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-bold mb-8 max-w-md leading-relaxed">
          الصفحة التي تحاول الوصول إليها انتقلت لسيرفر آخر، تم حذفها، أو أن الرابط غير صحيح. لا تقلق، يمكنك العودة لمتابعة مغامرتك!
        </p>

        {/* Quick Search Bar */}
        <form onSubmit={handleSearch} className="w-full max-w-md mb-8">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl blur opacity-20 group-hover:opacity-40 group-focus-within:opacity-60 transition duration-300" />
            <div className="relative flex items-center bg-white dark:bg-[#101118] border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden p-1.5">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث عن لعبة، بطاقة، أو شحنة..."
                className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-4 py-2 rounded-xl text-xs font-black shadow-sm flex items-center gap-1 flex-shrink-0 cursor-pointer transition-all active:scale-95"
              >
                <Search size={14} />
                <span>بحث</span>
              </button>
            </div>
          </div>
        </form>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 w-full max-w-md flex-col sm:flex-row">
          <Link
            to="/"
            className="w-full sm:w-auto flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black py-3 px-6 rounded-2xl shadow-[0_4px_15px_rgba(255,32,64,0.35)] hover:shadow-[0_0_20px_rgba(255,32,64,0.6)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
          >
            <Home size={16} />
            <span>العودة للرئيسية</span>
          </Link>

          <Link
            to="/store"
            className="w-full sm:w-auto flex-1 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-white font-black py-3 px-6 rounded-2xl shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
          >
            <ShoppingBag size={16} />
            <span>تصفح المتجر</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

