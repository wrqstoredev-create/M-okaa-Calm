import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import ProductCard from '../components/ProductCard';
import ProductSkeleton from '../components/ProductSkeleton';
import { Search } from 'lucide-react';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSearchResults() {
      if (!query.trim()) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .ilike('title', `%${query}%`);

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

  return (
    <div className="flex-1 bg-white dark:bg-[#1a1d24] py-8">
      <div className="w-full px-2 sm:px-4 md:px-6">
        <div className="flex items-center gap-3 mb-8 border-r-4 border-red-700 pr-4">
          <Search className="text-red-700" size={24} />
          <div>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              نتائج البحث عن: "{query}"
            </h1>
            <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest">
              {products.length} منتج تم العثور عليه
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 w-full">
          {isLoading ? (
            Array.from({ length: 10 }).map((_, i) => <ProductSkeleton key={i} />)
          ) : products.length > 0 ? (
            products.map((product) => <ProductCard key={product.id} product={product} />)
          ) : (
            <div className="col-span-full py-20 text-center">
              <div className="bg-gray-50 dark:bg-[#0f1115] rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Search size={40} className="text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">لم نجد أي منتجات</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">حاول البحث بكلمات مختلفة أو تحقق من الإملاء</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
