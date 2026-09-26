import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import ProductCard from '../components/ProductCard';
import ProductSkeleton from '../components/ProductSkeleton';
import { Search, SlidersHorizontal, ArrowUpDown, Flame, PackageX, Sparkles, X } from 'lucide-react';
import { motion } from 'motion/react';

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'newest';

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  
  const [searchInput, setSearchInput] = useState(query);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('default');

  // Keep input in sync with URL query
  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  // Comprehensive multi-field search (title, game_name, description)
  useEffect(() => {
    async function fetchSearchResults() {
      if (!query.trim()) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const queryTerm = `%${query.trim()}%`;
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .or(`title.ilike.${queryTerm},game_name.ilike.${queryTerm},description.ilike.${queryTerm}`);

        if (error) throw error;
        setProducts(data || []);
      } catch (err) {
        console.error('Error searching products:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSearchResults();
  }, [query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim() });
    }
  };

  // Sorted products
  const sortedProducts = useMemo(() => {
    const list = [...products];
    switch (sortBy) {
      case 'price-asc':
        return list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
      case 'price-desc':
        return list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
      case 'newest':
        return list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      default:
        return list;
    }
  }, [products, sortBy]);

  return (
    <div className="flex-1 w-full bg-[#f8f8fa] dark:bg-[#060608] py-8 text-right min-h-screen relative" dir="rtl">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        
        {/* Search Header Bar */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 dark:bg-[#0c0d14]/90 backdrop-blur-xl border border-gray-200/90 dark:border-white/10 rounded-3xl p-5 md:p-6 mb-8 shadow-sm"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Title & Count */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400">
                  <Search size={20} className="stroke-[2.5]" />
                </div>
                <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">
                  نتائج البحث عن: <span className="text-red-600 dark:text-red-400">"{query}"</span>
                </h1>
              </div>
              <p className="text-xs text-gray-400 font-extrabold pr-9">
                {isLoading ? 'جاري الفحص في قاعدة البيانات...' : `تم العثور على ${products.length} منتج مطابق`}
              </p>
            </div>

            {/* Quick In-Page Refine Search Form */}
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md w-full">
              <div className="relative flex items-center bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden px-3 py-1">
                <Search size={16} className="text-gray-400 ml-2" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="تعديل البحث..."
                  className="w-full bg-transparent py-2 text-xs font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                />
                {searchInput && (
                  <button 
                    type="button" 
                    onClick={() => setSearchInput('')}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
                <button
                  type="submit"
                  className="mr-2 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[11px] font-black px-3.5 py-1.5 rounded-xl shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                >
                  بحث
                </button>
              </div>
            </form>

            {/* Sort Dropdown */}
            {products.length > 0 && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-extrabold text-gray-400 flex items-center gap-1">
                  <ArrowUpDown size={14} /> ترتيب:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-red-500 cursor-pointer"
                >
                  <option value="default" className="dark:bg-[#101118]">الأكثر صلة</option>
                  <option value="price-asc" className="dark:bg-[#101118]">السعر: من الأقل للأعلى</option>
                  <option value="price-desc" className="dark:bg-[#101118]">السعر: من الأعلى للأقل</option>
                  <option value="newest" className="dark:bg-[#101118]">الأحدث إضافة</option>
                </select>
              </div>
            )}
          </div>
        </motion.div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 w-full">
          {isLoading ? (
            Array.from({ length: 10 }).map((_, i) => <ProductSkeleton key={i} />)
          ) : sortedProducts.length > 0 ? (
            sortedProducts.map((product) => <ProductCard key={product.id} product={product} />)
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="col-span-full py-16 px-6 text-center bg-white/60 dark:bg-[#0c0d14]/60 backdrop-blur-xl border border-gray-200/60 dark:border-white/5 rounded-3xl"
            >
              <div className="bg-red-500/10 border border-red-500/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 text-red-500 shadow-[0_0_20px_rgba(255,32,64,0.15)]">
                <PackageX size={36} />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                عذراً، لم نجد أي منتجات تطابق "{query}"
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-bold max-w-md mx-auto mb-6">
                تأكد من كتابة الكلمات بشكل صحيح أو جرب البحث باسم اللعبة مثل (روبلوكس، ببجي، فري فاير).
              </p>

              {/* Quick Suggestions Tags */}
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto">
                <span className="text-xs font-black text-gray-400 flex items-center gap-1">
                  <Flame size={14} className="text-red-500 fill-red-500" /> جرب البحث عن:
                </span>
                {[
                  { label: '🎮 روبلوكس', term: 'روبلوكس' },
                  { label: '🔥 ببجي', term: 'ببجي' },
                  { label: '💎 فري فاير', term: 'فري فاير' },
                  { label: '⚡ ستيم', term: 'ستيم' },
                ].map((tag) => (
                  <button
                    key={tag.term}
                    type="button"
                    onClick={() => {
                      setSearchParams({ q: tag.term });
                    }}
                    className="text-xs font-extrabold px-3 py-1 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 hover:border-red-500/40 transition-all cursor-pointer shadow-xs"
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
