import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import ProductSkeleton from '../components/ProductSkeleton';
import { SearchX, ShoppingCart, Zap, Star, Layout, Loader2, List, Sparkles, Trophy, ShieldCheck, BadgePercent } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { motion } from 'motion/react';
import { useCurrency } from '../contexts/CurrencyContext';
import { useToast } from '../contexts/ToastContext';

export default function Category() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const { addToast } = useToast();
  
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gameInfo, setGameInfo] = useState<any>(null);

  useEffect(() => {
    async function fetchCategoryProducts() {
      try {
        setIsLoading(true);
        setGameInfo(null);
        
        if (name && name !== 'all') {
          try {
            // Find a game matching the name
            const { data: matchedGames } = await supabase
              .from('games')
              .select('*')
              .ilike('name', `%${name}%`);

            if (matchedGames && matchedGames.length > 0) {
              const matchedGame = matchedGames[0];
              setGameInfo(matchedGame);
              
              const gameIds = matchedGames.map(g => g.id);
              // Priority: If we have matched games, ONLY show products explicitly linked by game_id
              const { data, error } = await supabase
                .from('products')
                .select('*')
                .in('game_id', gameIds);
              
              if (!error) {
                setProducts(data || []);
                setIsLoading(false);
                return;
              }
            }
          } catch (innerErr) {
            console.warn('Advanced game select fallback:', innerErr);
          }

          // Default fallback (only if no games matched by name in games table)
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .ilike('game_name', `%${name}%`);
          
          if (error) throw error;
          setProducts(data || []);
        } else {
          const { data, error } = await supabase
            .from('products')
            .select('*');
          if (error) throw error;
          setProducts(data || []);
          setGameInfo(null);
        }
      } catch (err) {
        console.error('Error fetching category products:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCategoryProducts();
  }, [name]);
  
  const handleQuickAdd = (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/product/${product.id}`);
    addToast('يرجى إكمال بيانات الشحن للمنتج ⚡', 'info');
  };

  const displayTitle = name && name !== 'all' ? `منتجات ${name}` : 'جميع المنتجات';
  const layoutStyle = gameInfo?.layout_style || 'grid_modern';

  // Component states and designs
  return (
    <div className={`flex-1 px-4 md:px-6 py-8 transition-colors duration-500 ${layoutStyle === 'grid_dark_glow' ? 'bg-zinc-950 text-white min-h-screen' : 'bg-transparent text-zinc-900 dark:text-white'}`}>
      <div className="max-w-7xl mx-auto">
        
        {/* Category Header Banner with layout-specific styles */}
        {gameInfo && (
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 md:p-8 rounded-[2rem] mb-10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border ${
              layoutStyle === 'grid_dark_glow' 
                ? 'bg-zinc-900/70 border-zinc-800 shadow-[0_0_30px_rgba(239,68,68,0.05)]' 
                : 'bg-white dark:bg-[#1a1d24] border-zinc-100 shadow-sm'
            }`}
          >
            {/* Visual background decorations */}
            <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl -z-0 opacity-10 ${layoutStyle === 'grid_dark_glow' ? 'bg-red-500' : 'bg-red-300'}`}></div>

            <div className="flex items-center gap-5 z-10 text-right w-full md:w-auto">
              <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2.5xl flex items-center justify-center p-3 relative overflow-hidden ${
                layoutStyle === 'grid_dark_glow' ? 'bg-zinc-800 border border-zinc-700' : 'bg-zinc-50 dark:bg-[#0f1115] border border-zinc-100'
              }`}>
                {gameInfo.image_url && gameInfo.image_url !== '' ? (
                  <img referrerPolicy="no-referrer" src={gameInfo.image_url} alt={gameInfo.name} className="w-full h-full object-contain" />
                ) : (
                  <Zap size={32} className="text-red-600" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                    layoutStyle === 'grid_dark_glow' ? 'bg-red-950/40 border-red-800 text-red-400' : 'bg-red-50 border-red-100 text-red-700'
                  }`}>
                    شحن فوري وآمن ⚡
                  </span>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                    layoutStyle === 'grid_dark_glow' ? 'bg-zinc-800 border-zinc-700 text-zinc-400' : 'bg-zinc-100 dark:bg-[#1a1d24] border-zinc-200/60 text-zinc-500'
                  }`}>
                    {layoutStyle === 'grid_dark_glow' ? 'تصميم مخصص: عتمة نيون' : 
                     layoutStyle === 'compact_rows' ? 'تصميم مخصص: صفوف سريعة' : 
                     layoutStyle === 'bento_metro' ? 'تصميم مخصص: لوح بينتو' : 'تصميم مخصص: شبكة عصرية'}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black">{gameInfo.name}</h1>
                <p className={`text-xs mt-1 font-bold ${layoutStyle === 'grid_dark_glow' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  تصفح أفضل عروض شحن لـ {gameInfo.name} بأفضل الأسعار وبشكل فوري.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-center z-10 w-full md:w-auto justify-end">
              <div className={`p-4 rounded-2xl text-center min-w-[100px] border ${
                layoutStyle === 'grid_dark_glow' ? 'bg-zinc-800/40 border-zinc-700' : 'bg-zinc-50 dark:bg-[#0f1115] border-zinc-100'
              }`}>
                <div className="text-xl font-black text-red-600">{products.length}</div>
                <div className={`text-[10px] font-bold ${layoutStyle === 'grid_dark_glow' ? 'text-zinc-400' : 'text-zinc-500'}`}>منتج متاح للشحن</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Regular Category Title if gameInfo is not present */}
        {!gameInfo && (
          <h1 className="text-2xl font-black mb-8 border-r-4 border-red-700 pr-3 text-zinc-900 dark:text-white">
            {displayTitle}
          </h1>
        )}
        
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {Array.from({ length: 10 }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : products.length > 0 ? (
          
          /* LAYOUT 1: grid_modern */
          layoutStyle === 'grid_modern' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) :

          /* LAYOUT 2: grid_dark_glow (Gamer Cyber Theme) */
          layoutStyle === 'grid_dark_glow' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.map((product, idx) => {
                const price = Number(product.price || 0);
                const oldPrice = product.old_price ? Number(product.old_price) : null;
                const dynamicBadge = oldPrice && price && oldPrice > price ? `وفر ${Math.round(((oldPrice - price) / oldPrice) * 100)}%` : product.discount_badge;

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    whileHover={{ y: -6 }}
                    className="h-full"
                  >
                    <Link 
                      to={`/product/${product.id}`} 
                      className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 hover:border-red-500/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.25)] transition-all duration-300 relative flex flex-col h-full text-right overflow-hidden group"
                    >
                      {/* Cyber neon line highlight */}
                      <div className="absolute top-0 right-0 w-0 h-[2px] bg-red-600 transition-all duration-500 group-hover:w-full"></div>

                      {dynamicBadge && (
                        <div className="absolute top-3 left-3 bg-red-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-md z-10 flex items-center gap-1 shadow-md shadow-red-950/20">
                          <Sparkles size={9} className="fill-white" />
                          {dynamicBadge}
                        </div>
                      )}

                      <div className="w-full h-36 bg-zinc-950 rounded-xl mb-4 overflow-hidden relative flex items-center justify-center p-2 border border-zinc-850">
                        <img 
                          referrerPolicy="no-referrer" 
                          src={(product.image_url || product.image) || null} 
                          alt={product.title} 
                          className="w-full h-full object-contain z-10 transition-transform duration-500 group-hover:scale-110" 
                        />
                      </div>

                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] text-red-500 font-extrabold tracking-widest uppercase mb-1 block">
                            {product.game_name}
                          </span>
                          <h4 className="text-xs md:text-sm font-black text-zinc-100 line-clamp-2 leading-snug group-hover:text-red-500 transition-colors">
                            {product.title}
                          </h4>
                        </div>

                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-3 border-t border-zinc-800 pt-3">
                            <span className="text-red-500 font-black text-base md:text-lg">
                              {formatPrice(price)}
                            </span>
                            {oldPrice && (
                              <span className="text-zinc-500 text-[11px] line-through font-bold">
                                {formatPrice(oldPrice)}
                              </span>
                            )}
                          </div>

                          <button 
                            onClick={(e) => handleQuickAdd(product, e)}
                            className="w-full bg-zinc-800 text-zinc-200 group-hover:bg-red-600 group-hover:text-white text-[11px] font-black py-2.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 border border-zinc-750 group-hover:border-red-500"
                          >
                            <ShoppingCart size={14} />
                            <span>شحن الآن</span>
                          </button>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          ) :

          /* LAYOUT 3: compact_rows (List/Row theme) */
          layoutStyle === 'compact_rows' ? (
            <div className="flex flex-col gap-3">
              {products.map((product, idx) => {
                const price = Number(product.price || 0);
                const oldPrice = product.old_price ? Number(product.old_price) : null;
                const dynamicBadge = oldPrice && price && oldPrice > price ? `وفر ${Math.round(((oldPrice - price) / oldPrice) * 100)}%` : product.discount_badge;

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    whileHover={{ scale: 1.005 }}
                  >
                    <Link 
                      to={`/product/${product.id}`}
                      className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white dark:bg-[#1a1d24]/80 backdrop-blur-md border border-zinc-100 rounded-2xl hover:border-red-500/30 hover:bg-red-50/5 hover:shadow-md transition-all gap-4 text-right shadow-sm group"
                    >
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="w-16 h-16 rounded-xl bg-zinc-50 dark:bg-[#0f1115] border border-zinc-100 flex-shrink-0 p-2 overflow-hidden flex items-center justify-center">
                          <img 
                            referrerPolicy="no-referrer" 
                            src={(product.image_url || product.image) || null} 
                            alt={product.title} 
                            className="max-h-full max-w-full object-contain transition-transform group-hover:scale-105" 
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[9px] bg-red-50 border border-red-100 text-red-700 px-2 py-0.5 rounded-md font-bold">
                              {product.game_name}
                            </span>
                            {dynamicBadge && (
                              <span className="text-[9px] bg-amber-50 border border-amber-100 text-amber-700 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                                <BadgePercent size={10} />
                                {dynamicBadge}
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-black text-zinc-900 dark:text-white group-hover:text-red-700 transition-colors line-clamp-1">{product.title}</h4>
                          <span className="text-[10px] text-zinc-400 font-bold block mt-0.5">تسليم أوتوماتيكي فوري إلى الحساب ⚡</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 border-zinc-50 pt-3 sm:pt-0">
                        <div className="flex flex-col text-left items-end">
                          <span className="text-red-700 font-black text-lg">
                            {formatPrice(price)}
                          </span>
                          {oldPrice && (
                            <span className="text-zinc-300 text-[10px] line-through font-bold">
                              {formatPrice(oldPrice)}
                            </span>
                          )}
                        </div>

                        <button 
                          onClick={(e) => handleQuickAdd(product, e)}
                          className="bg-zinc-900 group-hover:bg-red-600 text-white font-black px-5 py-3 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-zinc-900/5 transition-all"
                        >
                          <ShoppingCart size={14} />
                          <span>شراء سريع</span>
                        </button>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          ) :

          /* LAYOUT 4: bento_metro (Asymmetric High Aesthetic Grid Style) */
          (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-5">
              {products.map((product, idx) => {
                const price = Number(product.price || 0);
                const oldPrice = product.old_price ? Number(product.old_price) : null;
                const dynamicBadge = oldPrice && price && oldPrice > price ? `خصم ${Math.round(((oldPrice - price) / oldPrice) * 100)}%` : product.discount_badge;

                // Asymmetric Bento blocks configuration based on index
                let bentoClass = "md:col-span-2 h-[400px]"; // Medium card
                if (idx % 5 === 0) {
                  bentoClass = "md:col-span-3 h-[420px]"; // Big highlight card
                } else if (idx % 5 === 3) {
                  bentoClass = "md:col-span-3 h-[420px]"; // Big highlight card
                } else if (idx % 5 === 4) {
                  bentoClass = "md:col-span-4 h-[380px]"; // Extra wide block !
                }

                const isBigBento = idx % 5 === 0 || idx % 5 === 3;

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.04 }}
                    className={`${bentoClass} h-full`}
                  >
                    <Link 
                      to={`/product/${product.id}`}
                      className={`block bg-white dark:bg-[#1a1d24]/90 backdrop-blur-md rounded-[2.2rem] border border-zinc-100 p-5 shadow-sm hover:shadow-xl hover:border-red-200 hover:shadow-red-950/[0.02] flex flex-col transition-all h-full relative overflow-hidden group text-right ${
                        isBigBento ? 'ring-1 ring-red-500/10' : ''
                      }`}
                    >
                      {/* Background decorative blob for highlight blocks */}
                      {isBigBento && (
                        <div className="absolute -top-10 -right-10 w-44 h-44 bg-red-100/40 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700"></div>
                      )}

                      <div className="flex items-center justify-between mb-4 z-10 relative">
                        <span className="text-[9px] bg-zinc-100 dark:bg-[#1a1d24] text-zinc-500 font-extrabold px-2.5 py-1 rounded-lg border border-zinc-200/40">
                          {product.game_name}
                        </span>
                        
                        {isBigBento && (
                          <span className="text-[9px] bg-red-600 text-white font-black px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-lg shadow-red-600/10">
                            <Trophy size={9} />
                            عرض المقرح 🔥
                          </span>
                        )}

                        {!isBigBento && dynamicBadge && (
                          <span className="text-[9px] bg-red-50 text-red-600 font-black px-2.5 py-1 rounded-lg">
                            {dynamicBadge}
                          </span>
                        )}
                      </div>

                      {/* Display image inside the bento block */}
                      <div className={`w-full bg-zinc-50 dark:bg-[#0f1115]/50 rounded-2xl mb-4 overflow-hidden relative flex items-center justify-center p-4 border border-zinc-100/50 ${
                        isBigBento ? 'h-48' : 'h-36'
                      }`}>
                        <img 
                          referrerPolicy="no-referrer" 
                          src={(product.image_url || product.image) || null} 
                          alt={product.title} 
                          className="max-h-full object-contain transition-transform duration-500 group-hover:scale-110 z-10" 
                        />
                      </div>

                      {/* Info & pricing details */}
                      <div className="flex-1 flex flex-col justify-between z-10">
                        <div>
                          <h4 className="text-sm font-black text-zinc-900 dark:text-white group-hover:text-red-700 transition-colors line-clamp-2 leading-snug">
                            {product.title}
                          </h4>
                          {isBigBento && (
                            <p className="text-[10px] text-zinc-400 font-bold mt-1.5 leading-relaxed line-clamp-1">
                              شحن فوري بالبطاقة الرقمية والباركود مباشرة.
                            </p>
                          )}
                        </div>

                        <div className="mt-4 border-t border-zinc-50/80 pt-3 flex flex-col">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex flex-col text-right">
                              <span className="text-red-600 font-black text-lg">
                                {formatPrice(price)}
                              </span>
                              {oldPrice && (
                                <span className="text-zinc-300 text-[10px] line-through font-bold">
                                  {formatPrice(oldPrice)}
                                </span>
                              )}
                            </div>
                            
                            {isBigBento && dynamicBadge && (
                              <div className="text-[10px] bg-red-50 text-red-600 font-black px-2.5 py-1 rounded-lg border border-red-100/50">
                                {dynamicBadge}
                              </div>
                            )}
                          </div>

                          <button 
                            onClick={(e) => handleQuickAdd(product, e)}
                            className="bg-zinc-900 group-hover:bg-red-600 text-white text-[11px] font-black py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
                          >
                            <ShoppingCart size={14} />
                            <span>اطلب الآن</span>
                          </button>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-[#0f1115] rounded-[2rem] border border-dashed border-gray-300 dark:border-gray-600 text-center">
            <div className="w-16 h-16 bg-white dark:bg-[#1a1d24] rounded-full flex items-center justify-center mb-4 shadow-sm">
                <SearchX size={28} className="text-gray-400" />
            </div>
            <h2 className="text-lg font-black text-gray-700 dark:text-gray-300 mb-2">لا توجد منتجات مخصصة متوفرة لـ "{name}"</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold max-w-sm">لم يتم ربط أي منتجات بهذا القسم حالياً. يمكنك الذهاب لقسم الألعاب في لوحة التحكم وتخصيص المنتجات.</p>
          </div>
        )}
      </div>
    </div>
  );
}
