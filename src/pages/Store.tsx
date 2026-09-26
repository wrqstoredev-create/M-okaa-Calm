import React, { useState, useEffect, useMemo } from 'react';
import { productsApi } from '../services/api/productsApi';
import { motion, AnimatePresence } from 'motion/react';
import ProductCard from '../components/ProductCard';
import ProductSkeleton from '../components/ProductSkeleton';
import { Search, Ticket, Cpu, Loader2, Sparkles, ArrowUpDown, Check, Filter, RotateCcw, CheckCircle2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import RippleButton from '../components/ui/RippleButton';

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'newest';

export default function Store() {
  const [games, setGames] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [redeemCode, setRedeemCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [gamesData, productsData] = await Promise.all([
          productsApi.getGames(),
          productsApi.getProducts()
        ]);

        if (gamesData) setGames(gamesData);
        if (productsData) setProducts(productsData);
      } catch (error) {
        console.error('Error fetching store data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemCode.trim()) return;

    setIsRedeeming(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    setIsRedeeming(false);

    if (redeemCode.toLowerCase() === 'mokaa2026') {
      addToast('رمز صحيح! تمت إضافة 50 نقطة لرصيدك 🎁', 'success');
      setRedeemCode('');
    } else {
      addToast('رمز الشحن غير صحيح أو منتهي الصلاحية', 'error');
    }
  };

  const filteredAndSortedProducts = useMemo(() => {
    let result = products.filter(p => {
      const query = searchTerm.toLowerCase();
      const matchesSearch = (p.title || '').toLowerCase().includes(query) || 
                           (p.game_name || '').toLowerCase().includes(query) ||
                           (p.description || '').toLowerCase().includes(query);
      const matchesCategory = activeCategory === 'all' || (p.game_name || '').toLowerCase() === activeCategory.toLowerCase();
      const matchesStock = inStockOnly ? (p.stock === undefined || p.stock === null || p.stock > 0) : true;
      return matchesSearch && matchesCategory && matchesStock;
    });

    switch (sortBy) {
      case 'price-asc':
        return result.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
      case 'price-desc':
        return result.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
      case 'newest':
        return result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      default:
        return result;
    }
  }, [products, searchTerm, activeCategory, inStockOnly, sortBy]);

  const hasActiveFilters = activeCategory !== 'all' || searchTerm.trim() !== '' || inStockOnly || sortBy !== 'default';

  const resetFilters = () => {
    setActiveCategory('all');
    setSearchTerm('');
    setInStockOnly(false);
    setSortBy('default');
  };

  return (
    <div className="flex-1 w-full relative bg-[#f8f8fa] dark:bg-[#060608] min-h-screen text-right" dir="rtl">
      {/* Decorative ambient neon background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] dark:opacity-60" />
        <div className="absolute top-1/3 left-10 w-96 h-96 bg-purple-600/10 rounded-full blur-[140px] dark:opacity-50" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 relative z-10">
        
        {/* Redeem Section - Cyber Terminal */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/95 dark:bg-[#0c0c10]/95 backdrop-blur-2xl border border-gray-150 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-xl dark:shadow-[0_12px_45px_rgba(0,0,0,0.8),0_0_20px_rgba(255,32,64,0.08)] mb-10 overflow-hidden relative group"
        >
          {/* Neon corner accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-red-500/15 via-purple-500/5 to-transparent pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4 text-right">
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-500 shadow-[0_0_15px_rgba(255,32,64,0.2)] flex-shrink-0">
                <Ticket size={32} />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                  لديك رمز شحن أو بطاقة هدية؟
                  <Sparkles size={18} className="text-amber-400 animate-pulse" />
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-bold">
                  قم بإدخال الكود للحصول على رصيد محفظة أو هدايا فورية بحسابك.
                </p>
              </div>
            </div>
            
            <form onSubmit={handleRedeem} className="flex w-full md:w-auto gap-2.5">
              <input 
                type="text" 
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value)}
                placeholder="أدخل الرمز هنا (مثال: MOKAA2026)" 
                className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-6 py-4 flex-1 md:w-80 outline-none focus:border-red-500 dark:focus:border-red-500 focus:shadow-[0_0_15px_rgba(255,32,64,0.25)] transition-all text-center md:text-right font-black uppercase tracking-widest placeholder:tracking-normal placeholder:font-normal text-gray-900 dark:text-white dark:placeholder-gray-500"
                dir="ltr"
              />
              <RippleButton 
                type="submit"
                disabled={isRedeeming || !redeemCode.trim()}
                rippleColor="rgba(255, 255, 255, 0.4)"
                className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black px-8 py-4 rounded-2xl transition-all shadow-[0_4px_16px_rgba(255,32,64,0.35)] hover:shadow-[0_0_24px_rgba(255,32,64,0.65)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px] cursor-pointer"
              >
                {isRedeeming ? <Loader2 className="w-5 h-5 animate-spin" /> : 'استرداد الكود ⚡'}
              </RippleButton>
            </form>
          </div>
        </motion.div>

        {/* Store Header & Search */}
        <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center mb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-1.5 flex items-center gap-2">
              جميع باقات الألعاب والمنتجات
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-bold text-sm">
              تصفح أكثر من {products.length} باقة شحن وبطاقة ألعاب رقمية بأسعار منافسة وتسليم فوري.
            </p>
          </div>

          <div className="relative w-full lg:w-96">
            <input 
              type="text" 
              placeholder="ابحث عن لعبة، باقة، أو بطاقة شحن..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/95 dark:bg-[#0c0c10]/95 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl pl-12 pr-6 py-3.5 outline-none text-gray-900 dark:text-white focus:border-red-500 dark:focus:border-red-500 focus:shadow-[0_0_15px_rgba(255,32,64,0.25)] transition-all shadow-sm font-bold placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={19} />
          </div>
        </div>

        {/* Mobile Horizontal Category Pills (Hidden on Desktop) */}
        <div className="lg:hidden flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-4">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-zinc-300'
            }`}
          >
            الكل ({products.length})
          </button>
          {games.map(game => (
            <button
              key={game.id}
              onClick={() => setActiveCategory(game.name)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                (activeCategory || '').toLowerCase() === (game.name || '').toLowerCase()
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-zinc-300'
              }`}
            >
              {game.image_url && <img src={game.image_url} alt="" className="w-4 h-4 object-contain" />}
              <span>{game.name}</span>
            </button>
          ))}
        </div>

        {/* Controls Toolbar: Results Count, In-Stock Filter, Sort Dropdown */}
        <div className="bg-white/80 dark:bg-[#0c0c10]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 rounded-2xl p-3 md:p-4 mb-6 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          {/* Results count & active status */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-gray-500 dark:text-gray-400">
              عرض <strong className="text-red-600 dark:text-red-400 font-mono text-sm">{filteredAndSortedProducts.length}</strong> من أصل {products.length} منتج
            </span>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-[11px] font-black text-red-600 dark:text-red-400 hover:underline cursor-pointer mr-2"
                title="إعادة تعيين الفلاتر"
              >
                <RotateCcw size={12} />
                مسح الفلاتر
              </button>
            )}
          </div>

          {/* Action Filters: In Stock Only & Sort */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* In-Stock Toggle Button */}
            <button
              type="button"
              onClick={() => setInStockOnly(!inStockOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer border ${
                inStockOnly
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${inStockOnly ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
              <span>المتوفر بالمخزون فقط</span>
            </button>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold text-gray-400 flex items-center gap-1">
                <ArrowUpDown size={13} /> ترتيب:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-red-500 cursor-pointer"
              >
                <option value="default" className="dark:bg-[#101118]">الافتراضي (الأكثر صلة)</option>
                <option value="price-asc" className="dark:bg-[#101118]">السعر: من الأقل للأعلى</option>
                <option value="price-desc" className="dark:bg-[#101118]">السعر: من الأعلى للأقل</option>
                <option value="newest" className="dark:bg-[#101118]">الأحدث إضافة</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Categories (Desktop) */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white/95 dark:bg-[#0c0c10]/95 backdrop-blur-2xl border border-gray-150 dark:border-white/10 rounded-3xl p-4 md:p-5 shadow-sm sticky top-24 space-y-3">
              <h3 className="font-black text-gray-900 dark:text-white px-2 text-sm border-r-4 border-red-600 pr-2.5">
                تصفية حسب اللعبة
              </h3>
              <div className="space-y-1 max-h-[65vh] overflow-y-auto pr-1">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`w-full text-right px-4 py-3 rounded-2xl font-bold transition-all duration-200 flex items-center justify-between cursor-pointer ${
                    activeCategory === 'all' 
                      ? 'bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 shadow-[0_0_15px_rgba(255,32,64,0.15)]' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <span className="text-xs font-black">جميع الألعاب</span>
                  <span className={`text-[11px] font-bold py-0.5 px-2 rounded-full border ${activeCategory === 'all' ? 'bg-red-600 text-white border-transparent' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 border-transparent'}`}>
                    {products.length}
                  </span>
                </button>
                
                {games.map(game => {
                  const count = products.filter(p => (p.game_name || '').toLowerCase() === (game.name || '').toLowerCase()).length;
                  const isActive = (activeCategory || '').toLowerCase() === (game.name || '').toLowerCase();
                  return (
                    <button
                      key={game.id}
                      onClick={() => setActiveCategory(game.name)}
                      className={`w-full text-right px-4 py-3 rounded-2xl font-bold transition-all duration-200 flex items-center justify-between group cursor-pointer ${
                        isActive 
                          ? 'bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 shadow-[0_0_15px_rgba(255,32,64,0.15)]' 
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {game.image_url ? (
                          <img src={game.image_url} alt="" className="w-6 h-6 rounded-md object-contain opacity-85 group-hover:opacity-100 flex-shrink-0" />
                        ) : (
                          <div className="w-6 h-6 rounded-md bg-gray-200 dark:bg-white/10 flex items-center justify-center text-[10px] font-black">🎮</div>
                        )}
                        <span className="truncate max-w-[120px] text-xs font-black">{game.name}</span>
                      </div>
                      <span className={`text-[11px] font-bold py-0.5 px-2 rounded-full border ${isActive ? 'bg-red-600 text-white border-transparent' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 border-transparent'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            ) : filteredAndSortedProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredAndSortedProducts.map((product) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25 }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="bg-white/95 dark:bg-[#0c0c10]/95 backdrop-blur-2xl border border-gray-150 dark:border-white/10 rounded-3xl p-16 text-center shadow-xl">
                <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(255,32,64,0.15)]">
                  <Cpu className="text-red-500" size={32} />
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">لا توجد منتجات مطابقة</h3>
                <p className="text-gray-500 dark:text-gray-400 font-bold max-w-sm mx-auto text-sm leading-relaxed">
                  لم نتمكن من العثور على أي باقات أو منتجات مطابقة لبحثك والفلاتر المحددة.
                </p>
                <button 
                  onClick={resetFilters}
                  className="mt-6 font-black text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 px-6 py-2.5 rounded-xl transition-all shadow-[0_4px_16px_rgba(255,32,64,0.3)] hover:shadow-[0_0_20px_rgba(255,32,64,0.6)] cursor-pointer"
                >
                  إعادة ضبط جميع الفلاتر
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
