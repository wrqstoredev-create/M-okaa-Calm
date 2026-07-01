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
    <section className="bg-white dark:bg-[#1a1d24]/80 backdrop-blur-md py-3 px-4 md:px-6 border-b border-gray-100 dark:border-gray-700/50 overflow-hidden relative z-10 w-full group">
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="max-w-[1110px] mx-auto relative"
      >
        <button 
          onClick={scrollLeft}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#cc2229] flex items-center justify-center text-white z-20 shadow-md hover:bg-red-700 transition-colors"
          aria-label="Scroll left"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
        </button>

        <button 
          onClick={scrollRight}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#cc2229] flex items-center justify-center text-white z-20 shadow-md hover:bg-red-700 transition-colors"
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
          className="flex items-center gap-4 sm:gap-8 overflow-x-auto overflow-y-hidden no-scrollbar px-6"
          style={{ scrollBehavior: 'auto' }}
        >
          {games.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="flex-shrink-0"
            >
              <Link 
                to={`/category/${game.name.split(' ')[0].toLowerCase()}`} 
                className="flex flex-col items-center gap-2 group cursor-pointer min-w-max relative-layout"
              >
                <div className="w-20 h-20 sm:w-21 sm:h-21 rounded-full bg-white dark:bg-[#1a1d24] border border-gray-200 dark:border-gray-700/70 flex items-center justify-center transition-all duration-300 relative overflow-visible p-3 shadow-sm group-hover:border-red-605 group-hover:shadow-md">
                  <div className="w-full h-full flex items-center justify-center z-10 transition-transform duration-500 group-hover:scale-105">
                    <img 
                      src={game.image_url} 
                      alt={game.name}
                      className="w-full h-full object-contain" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  {/* Optional SALE badge for visual matching the example */}
                  {game.name.toLowerCase().includes('parts') && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full z-20 shadow-md border border-white uppercase">
                      SALE
                    </div>
                  )}
                </div>
                <span className="text-[11px] sm:text-[12px] font-bold text-gray-800 dark:text-white group-hover:text-red-700 transition-colors capitalize text-center leading-tight">
                  {game.name}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
