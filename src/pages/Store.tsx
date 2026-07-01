import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'motion/react';
import ProductCard from '../components/ProductCard';
import { Search, Gift, Ticket, Cpu, Loader2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export default function Store() {
  const [games, setGames] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [redeemCode, setRedeemCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [gamesRes, productsRes] = await Promise.all([
          supabase.from('games').select('*').order('name'),
          supabase.from('products').select('*').order('created_at', { ascending: false })
        ]);

        if (gamesRes.data) setGames(gamesRes.data);
        if (productsRes.data) setProducts(productsRes.data);
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
    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRedeeming(false);

    // Mock response
    if (redeemCode.toLowerCase() === 'mokaa2026') {
      addToast('رمز صحيح! تمت إضافة 50 نقطة لرصيدك 🎁', 'success');
      setRedeemCode('');
    } else {
      addToast('رمز الشحن غير صحيح أو منتهي الصلاحية', 'error');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = (p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (p.game_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || (p.game_name || '').toLowerCase() === activeCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 w-full relative bg-[#F9FAFB]">
      {/* Decorative background lines */}
      <div className="absolute inset-0 bg-[#F9FAFB] z-0">
         <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-40"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 relative z-10">
        
        {/* Redeem Section - New Feature */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1a1d24]/80 backdrop-blur-xl border border-gray-100 dark:border-gray-700 rounded-3xl p-6 md:p-8 shadow-sm mb-10 overflow-hidden relative group"
        >
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-red-50 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4 text-right">
              <div className="bg-red-50 p-4 rounded-2xl">
                <Ticket className="text-red-700" size={32} />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white mb-1">لديك رمز شحن؟</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-bold">قم بإدخال الكود للحصول على رصيد أو منتجات فورية.</p>
              </div>
            </div>
            
            <form onSubmit={handleRedeem} className="flex w-full md:w-auto gap-2">
              <input 
                type="text" 
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value)}
                placeholder="أدخل الرمز هنا (مثال: MOKAA2026)" 
                className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-2xl px-6 py-4 flex-1 md:w-80 outline-none focus:border-red-500 focus:bg-white dark:focus:bg-gray-800 transition-all text-center md:text-right font-black uppercase tracking-widest placeholder:tracking-normal placeholder:font-normal dark:text-white dark:placeholder-gray-400"
                dir="ltr"
              />
              <button 
                type="submit"
                disabled={isRedeeming || !redeemCode.trim()}
                className="bg-red-700 text-white font-black px-8 py-4 rounded-2xl hover:bg-red-800 transition-all shadow-lg shadow-red-700/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
              >
                {isRedeeming ? <Loader2 className="w-5 h-5 animate-spin" /> : 'استرداد'}
              </button>
            </form>
          </div>
        </motion.div>

        {/* Store Header & Filters */}
        <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">جميع المنتجات</h1>
            <p className="text-gray-500 dark:text-gray-400 font-bold">تصفح {products.length} منتج متوفر في المتجر</p>
          </div>

          <div className="relative w-full lg:w-96">
            <input 
              type="text" 
              placeholder="ابحث عن لعبة أو منتج..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-[#1a1d24] border border-gray-200 dark:border-gray-700 rounded-2xl pl-12 pr-6 py-3.5 outline-none focus:border-red-500 transition-colors shadow-sm font-bold"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Categories */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-[#1a1d24] border border-gray-100 dark:border-gray-700 rounded-2xl p-4 shadow-sm sticky top-24">
              <h3 className="font-black text-gray-900 dark:text-white mb-4 px-2">التصنيفات</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`w-full text-right px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-between ${
                    activeCategory === 'all' 
                      ? 'bg-red-50 text-red-700' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span>الكل</span>
                  <span className="text-xs bg-white dark:bg-[#1a1d24] py-0.5 px-2 rounded-full border border-gray-100 dark:border-gray-700">{products.length}</span>
                </button>
                
                {games.map(game => {
                  const count = products.filter(p => (p.game_name || '').toLowerCase() === (game.name || '').toLowerCase()).length;
                  return (
                    <button
                      key={game.id}
                      onClick={() => setActiveCategory(game.name)}
                      className={`w-full text-right px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-between group ${
                        (activeCategory || '').toLowerCase() === (game.name || '').toLowerCase() 
                          ? 'bg-red-50 text-red-700' 
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img src={game.image_url} alt="" className="w-6 h-6 rounded-md object-contain mix-blend-multiply opacity-80 group-hover:opacity-100" />
                        <span className="truncate max-w-[120px]">{game.name}</span>
                      </div>
                      <span className={`text-xs py-0.5 px-2 rounded-full border ${(activeCategory || '').toLowerCase() === (game.name || '').toLowerCase() ? 'bg-white dark:bg-[#1a1d24] border-red-100' : 'bg-white dark:bg-[#1a1d24] border-gray-100 dark:border-gray-700'}`}>{count}</span>
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
                  <div key={i} className="animate-pulse bg-white dark:bg-[#1a1d24] border border-gray-100 dark:border-gray-700 rounded-2xl h-80"></div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#1a1d24] border border-gray-100 dark:border-gray-700 rounded-3xl p-16 text-center shadow-sm">
                <div className="w-20 h-20 bg-gray-50 dark:bg-[#0f1115] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Cpu className="text-gray-400" size={32} />
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">لا توجد منتجات</h3>
                <p className="text-gray-500 dark:text-gray-400 font-bold max-w-sm mx-auto">
                  لم نتمكن من العثور على أي منتجات مطابقة لبحثك أو في هذا التصنيف.
                </p>
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setActiveCategory('all');
                  }}
                  className="mt-6 font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-6 py-2 rounded-xl transition-colors"
                >
                  عرض كافة المنتجات
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
