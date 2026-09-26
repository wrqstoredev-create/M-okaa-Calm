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
      <section className="bg-white/95 dark:bg-[#060608]/90 backdrop-blur-xl py-3 px-4 md:px-6 border-b border-gray-100 dark:border-white/10 relative z-10 w-full">
        <div className="max-w-[1240px] mx-auto flex items-center gap-3 overflow-x-auto no-scrollbar py-3 px-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="w-[74px] sm:w-[82px] flex-shrink-0 flex flex-col items-center gap-2 animate-pulse">
              <div className="w-16 h-16 sm:w-[68px] sm:h-[68px] rounded-2xl bg-gray-200 dark:bg-white/5" />
              <div className="w-12 h-2.5 bg-gray-200 dark:bg-white/5 rounded-full" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white/95 dark:bg-[#060608]/90 backdrop-blur-xl border-b border-gray-150 dark:border-white/10 relative z-10 w-full group py-1">
      <motion.div 
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[1240px] mx-auto relative px-2 sm:px-4"
      >
        {/* Left Fade Gradient Mask */}
        <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-16 bg-gradient-to-r from-white dark:from-[#060608] via-white/80 dark:via-[#060608]/80 to-transparent z-15 pointer-events-none" />

        {/* Right Fade Gradient Mask */}
        <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-16 bg-gradient-to-l from-white dark:from-[#060608] via-white/80 dark:via-[#060608]/80 to-transparent z-15 pointer-events-none" />

        {/* Scroll Left Button */}
        <button 
          onClick={scrollLeft}
          className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 dark:bg-[#12131a]/95 backdrop-blur-md border border-gray-200 dark:border-white/15 text-gray-700 dark:text-gray-200 hover:text-white hover:bg-gradient-to-r hover:from-red-600 hover:to-rose-600 hover:border-transparent flex items-center justify-center z-20 shadow-md hover:shadow-[0_0_15px_rgba(255,32,64,0.5)] active:scale-95 transition-all cursor-pointer"
          aria-label="Scroll left"
        >
          <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Scroll Right Button */}
        <button 
          onClick={scrollRight}
          className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 dark:bg-[#12131a]/95 backdrop-blur-md border border-gray-200 dark:border-white/15 text-gray-700 dark:text-gray-200 hover:text-white hover:bg-gradient-to-r hover:from-red-600 hover:to-rose-600 hover:border-transparent flex items-center justify-center z-20 shadow-md hover:shadow-[0_0_15px_rgba(255,32,64,0.5)] active:scale-95 transition-all cursor-pointer"
          aria-label="Scroll right"
        >
          <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Horizontal Games Scroller with generous top/bottom padding to prevent any clipping */}
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
          className="flex items-center gap-2.5 sm:gap-3.5 overflow-x-auto no-scrollbar px-10 sm:px-14 pt-4 pb-3"
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
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                className="w-[74px] sm:w-[82px] flex-shrink-0"
              >
                <Link 
                  to={`/category/${game.name.split(' ')[0].toLowerCase()}`} 
                  className="w-full flex flex-col items-center gap-1.5 group cursor-pointer"
                  title={game.name}
                >
                  {/* Card Container */}
                  <div className="w-16 h-16 sm:w-[68px] sm:h-[68px] rounded-2xl bg-white dark:bg-[#0c0d14] border border-gray-200 dark:border-white/10 flex items-center justify-center relative p-2.5 shadow-xs transition-all duration-300 origin-center group-hover:border-red-500 group-hover:shadow-[0_0_20px_rgba(255,32,64,0.35)] group-hover:scale-105">
                    
                    {/* Game Icon */}
                    <div className="w-full h-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                      <img 
                        src={game.image_url} 
                        alt={game.name}
                        className="w-full h-full object-contain filter drop-shadow-sm select-none" 
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Hot Badge — Perfectly nested and padded so it NEVER clips */}
                    {isHot && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-[0_2px_8px_rgba(255,32,64,0.45)] border border-white/20 uppercase whitespace-nowrap pointer-events-none z-20">
                        🔥 رائج
                      </div>
                    )}
                  </div>

                  {/* Clean truncated title with exact width bounds */}
                  <span className="w-full text-center text-[10px] sm:text-[11px] font-extrabold text-gray-700 dark:text-zinc-300 group-hover:text-red-600 dark:group-hover:text-red-400 group-hover:drop-shadow-[0_0_8px_rgba(255,32,64,0.4)] transition-colors truncate px-0.5 leading-snug">
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
