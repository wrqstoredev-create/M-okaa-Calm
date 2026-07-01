import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabaseClient';

interface Brand {
  id: string;
  name: string;
  image_url: string;
  target_url?: string;
}

const fallbackBrands = [
  { id: '1', name: 'PUBG Mobile', image_url: 'https://www.midasbuy.com/images/apps/pubgm/logo.png', target_url: 'https://midasbuy.com' },
  { id: '2', name: 'Free Fire', image_url: 'https://www.midasbuy.com/images/apps/ff/logo.png' },
  { id: '3', name: 'Valorant', image_url: 'https://w7.pngwing.com/pngs/4/220/png-transparent-valorant-logo-white-thumbnail.png' },
  { id: '4', name: 'League of Legends', image_url: 'https://w7.pngwing.com/pngs/351/658/png-transparent-league-of-legends-logo-riot-games-video-game-multiplayer-online-battle-arena-league-of-legends-text-logo-video-game-thumbnail.png' },
  { id: '5', name: 'iTunes', image_url: 'https://upload.wikimedia.org/wikipedia/commons/d/df/ITunes_logo.svg' },
  { id: '6', name: 'Google Play', image_url: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Play_Arrow_logo.svg' },
  { id: '7', name: 'Steam', image_url: 'https://upload.wikimedia.org/wikipedia/commons/8/83/Steam_icon_logo.svg' },
];

export default function BrandShowcase() {
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    async function fetchCards() {
      try {
        const { data, error } = await supabase
          .from('sponsored_cards')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
          
        if (data && data.length > 0) {
          setBrands(data);
        }
      } catch (err) {
        console.error('Error fetching partner cards:', err);
      }
    }
    fetchCards();
  }, []);

  const displayBrands = brands.length > 0 ? brands : fallbackBrands;
  
  // We need enough items to fill the screen, plus one full set to scroll through.
  // We duplicate it 4 times so we have a wide enough content block.
  // 50% of the total width will represent exactly 2 sets.
  const tickerItems = [...displayBrands, ...displayBrands, ...displayBrands, ...displayBrands];

  return (
    <section className="py-12 border-t border-gray-100 dark:border-gray-700 bg-transparent overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-8 text-center">
        <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-2">الألعاب والبطاقات المدعومة</h4>
        <div className="w-12 h-1 bg-red-700 mx-auto rounded-full"></div>
      </div>
      
      <div className="flex overflow-hidden relative group w-full" dir="ltr">
        {/* 
          Using translate-x by a percentage (-50%) will shift exactly half the content.
          Since the content is duplicated to be exactly symmetrical, this creates a perfect infinite loop.
        */}
        <div className="flex w-max items-center pr-12 gap-12 animate-marquee hover:[animation-play-state:paused]">
          {tickerItems.map((brand, i) => {
            const innerContent = (
              <>
                <img src={brand.image_url} alt={brand.name} className="h-10 md:h-12 w-auto object-contain max-w-[120px]" />
                <span className="text-sm font-black text-gray-900 dark:text-white whitespace-nowrap">{brand.name}</span>
              </>
            );

            return brand.target_url ? (
              <a 
                href={brand.target_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                key={`${brand.id}-${i}`} 
                className="flex items-center justify-center gap-3 opacity-50 hover:opacity-100 transition-opacity grayscale hover:grayscale-0 cursor-pointer px-4"
              >
                {innerContent}
              </a>
            ) : (
              <div 
                key={`${brand.id}-${i}`} 
                className="flex items-center justify-center gap-3 opacity-50 hover:opacity-100 transition-opacity grayscale hover:grayscale-0 cursor-pointer px-4"
              >
                {innerContent}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
