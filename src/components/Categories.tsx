import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabaseClient';

interface Game {
  id: string;
  name: string;
  image_url: string;
}

export default function Categories() {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isHovered = useRef(false);
  const pauseTimeout = useRef<NodeJS.Timeout | null>(null);

  const pauseAutoScroll = () => {
    isHovered.current = true;
    if (pauseTimeout.current) clearTimeout(pauseTimeout.current);
  };

  const resumeAutoScroll = () => {
    if (pauseTimeout.current) clearTimeout(pauseTimeout.current);
    pauseTimeout.current = setTimeout(() => {
      isHovered.current = false;
    }, 3000); // Wait 3 seconds after interaction before resuming
  };

  useEffect(() => {
    async function fetchGames() {
      try {
        const { data, error } = await supabase
          .from('games')
          .select('*')
          .order('name');
        
        if (error) throw error;
        setGames(data || []);
      } catch (err) {
        console.error('Error fetching games:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchGames();
  }, []);

  // Ping-pong horizontal scroll effect
  useEffect(() => {
    if (isLoading || games.length === 0) return;
    
    // Add a slight delay before auto-scrolling starts
    const startDelay = setTimeout(() => {
      const el = scrollRef.current;
      if (!el) return;

      const isOverflowing = el.scrollWidth > el.clientWidth;
      if (!isOverflowing) return;

      let animationId: number;
      let scrollSpeed = 0.5; // pixels per frame
      let dir = 1; // 1 means moving further along the scroll (leftward in RTL)
      let accumulated = 0;

      const animateScroll = () => {
        const isCalmMode = localStorage.getItem('calm_mode') === 'true';
        if (!isHovered.current && !isCalmMode) {
          const maxScroll = el.scrollWidth - el.clientWidth;
          
          // Detect current scroll position (some browsers use negative for RTL, some positive)
          const currentScroll = Math.abs(el.scrollLeft);
          
          if (currentScroll >= maxScroll - 1) {
            dir = -1; // hit boundary, reverse
          } else if (currentScroll <= 1) {
            dir = 1; // hit start, forward
          }

          accumulated += scrollSpeed;
          if (accumulated >= 1) {
            const step = Math.floor(accumulated);
            accumulated -= step;
            
            // Use dirRTL to handle the sign mapping
            const isRtl = getComputedStyle(el).direction === 'rtl';
            if (isRtl) {
              el.scrollLeft -= dir * step;
            } else {
              el.scrollLeft += dir * step;
            }
          }
        }
        
        animationId = requestAnimationFrame(animateScroll);
      };

      animationId = requestAnimationFrame(animateScroll);

      return () => cancelAnimationFrame(animationId);
    }, 2000); // 2 second delay before starting ping-pong

    return () => clearTimeout(startDelay);
  }, [isLoading, games]);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
      pauseAutoScroll();
      resumeAutoScroll();
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
      pauseAutoScroll();
      resumeAutoScroll();
    }
  };

  if (isLoading) {
    return (
      <section className="bg-white dark:bg-[#1a1d24]/80 backdrop-blur-md py-6 px-4 md:px-6 border-b border-gray-100 dark:border-gray-700/50">
        <div className="flex justify-between items-center gap-6 overflow-x-auto no-scrollbar w-full max-w-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 animate-pulse min-w-max">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gray-100 dark:bg-[#1a1d24] shadow-sm" />
              <div className="w-16 h-2.5 bg-gray-100 dark:bg-[#1a1d24] rounded-full mt-1" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white/95 dark:bg-[#060608]/90 backdrop-blur-xl py-4 px-4 md:px-6 border-b border-gray-150 dark:border-white/10 overflow-hidden relative z-10 w-full group">
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="max-w-[1180px] mx-auto relative"
      >
        <button 
          onClick={scrollLeft}
          className="absolute left-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-gradient-to-r from-red-600 to-rose-600 flex items-center justify-center text-white z-20 shadow-[0_2px_12px_rgba(255,32,64,0.4)] hover:shadow-[0_0_20px_rgba(255,32,64,0.65)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          aria-label="Scroll left"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
        </button>

        <button 
          onClick={scrollRight}
          className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-gradient-to-r from-red-600 to-rose-600 flex items-center justify-center text-white z-20 shadow-[0_2px_12px_rgba(255,32,64,0.4)] hover:shadow-[0_0_20px_rgba(255,32,64,0.65)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          aria-label="Scroll right"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
        </button>

        <div 
          ref={scrollRef}
          onMouseEnter={pauseAutoScroll}
          onMouseLeave={resumeAutoScroll}
          onTouchStart={pauseAutoScroll}
          onTouchEnd={resumeAutoScroll}
          onTouchCancel={resumeAutoScroll}
          onWheel={() => {
            pauseAutoScroll();
            resumeAutoScroll();
          }}
          className="flex items-center gap-4 sm:gap-6 overflow-x-auto overflow-y-hidden no-scrollbar px-10 py-1"
          style={{ scrollBehavior: 'auto' }}
        >
          {games.map((game, index) => {
            const isHot = game.name.toLowerCase().includes('roblox') || 
                          game.name.toLowerCase().includes('pubg') || 
                          game.name.toLowerCase().includes('free fire') ||
                          game.name.includes('روبلوكس') ||
                          game.name.includes('ببجي') ||
                          index < 2;

            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.04 }}
                className="flex-shrink-0"
              >
                <Link 
                  to={`/category/${game.name.split(' ')[0].toLowerCase()}`} 
                  className="flex flex-col items-center gap-2 group cursor-pointer min-w-max relative-layout"
                >
                  <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-white dark:bg-[#101016] border border-gray-200 dark:border-white/10 flex items-center justify-center transition-all duration-300 relative overflow-visible p-3 shadow-sm group-hover:border-red-500 group-hover:shadow-[0_0_25px_rgba(255,32,64,0.35)] group-hover:scale-105 group-hover:-translate-y-1">
                    <div className="w-full h-full flex items-center justify-center z-10 transition-transform duration-500 group-hover:scale-110">
                      <img 
                        src={game.image_url} 
                        alt={game.name}
                        className="w-full h-full object-contain filter drop-shadow-sm" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    {/* Hot Badge */}
                    {isHot && (
                      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full z-20 shadow-[0_2px_10px_rgba(255,32,64,0.5)] border border-white/20 uppercase whitespace-nowrap">
                        🔥 رائج
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] sm:text-[12px] font-black text-gray-800 dark:text-gray-200 group-hover:text-red-600 dark:group-hover:text-red-400 group-hover:drop-shadow-[0_0_8px_rgba(255,32,64,0.5)] transition-all capitalize text-center leading-tight">
                    {game.name}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
