import Categories from '../components/Categories';
import HeroBanners from '../components/HeroBanners';
import ProductSection from '../components/ProductSection';
import TrustBar from '../components/TrustBar';
import BrandShowcase from '../components/BrandShowcase';
import CustomerReviews from '../components/CustomerReviews';
import { Flame, Star, Zap, ShieldCheck, Trophy, Loader2, Layout, Search } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useCurrency } from '../contexts/CurrencyContext';

export default function Home() {
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const [sections, setSections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roboCoinsEnabled, setRoboCoinsEnabled] = useState(false);
  const [roboCoinsBalance, setRoboCoinsBalance] = useState(5000);
  const [bigSearchTerm, setBigSearchTerm] = useState('');

  // Suggestion states for the central big search bar
  const [bigSuggestions, setBigSuggestions] = useState<any[]>([]);
  const [isBigSearching, setIsBigSearching] = useState(false);
  const [showBigSuggestions, setShowBigSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const handleBigSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (bigSearchTerm.trim()) {
      setShowBigSuggestions(false);
      navigate(`/search?q=${encodeURIComponent(bigSearchTerm.trim())}`);
    } else {
      navigate('/store');
    }
  };

  // Real-time suggestions fetching with query parsing
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!bigSearchTerm.trim()) {
        setBigSuggestions([]);
        return;
      }

      setIsBigSearching(true);
      try {
        const queryTerm = `%${bigSearchTerm.trim()}%`;
        const { data } = await supabase
          .from('products')
          .select('id, title, price, image_url, game_name, description')
          .or(`title.ilike.${queryTerm},game_name.ilike.${queryTerm},description.ilike.${queryTerm}`)
          .limit(10);

        setBigSuggestions(data || []);
      } catch (err) {
        console.error('Error fetching suggestions for main search:', err);
      } finally {
        setIsBigSearching(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(debounce);
  }, [bigSearchTerm]);

  // Click outside suggestions logic
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowBigSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    async function fetchHomeData() {
      try {
        setIsLoading(true);
        
        // Fetch Settings for Robo-coins
        const { data: settingsData } = await supabase
          .from('settings')
          .select('*')
          .single();
        if (settingsData) {
          setRoboCoinsEnabled(settingsData.robo_coins_enabled ?? false);
          setRoboCoinsBalance(settingsData.robo_coins_balance ?? 5000);
        }

        // Fetch active home sections
        const { data: sectionsData, error: sectionsError } = await supabase
          .from('home_sections')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');

        if (sectionsError) throw sectionsError;

        if (sectionsData && sectionsData.length > 0) {
          // Fetch section products mapping
          const sectionIds = sectionsData.map(s => s.id);
          const { data: sectionProductsData, error: mappingError } = await supabase
            .from('section_products')
            .select('*')
            .in('section_id', sectionIds)
            .order('sort_order');

          if (mappingError) throw mappingError;

          if (sectionProductsData && sectionProductsData.length > 0) {
            const productIds = [...new Set(sectionProductsData.map(sp => sp.product_id))];
            
            // Fetch the actual products
            const { data: productsData, error: productsError } = await supabase
              .from('products')
              .select('*')
              .in('id', productIds);
              
            if (productsError) throw productsError;

            // Map products to their sections
            const generatedSections = sectionsData.map(section => {
              const sectionProductMappings = sectionProductsData.filter(sp => sp.section_id === section.id);
              const sectionProducts = sectionProductMappings
                .map(sp => productsData?.find(p => p.id === sp.product_id))
                .filter(Boolean); // Remove any nulls if a product was deleted
                
              return {
                id: section.id,
                title: section.title,
                icon: section.icon || 'layout',
                section_type: section.section_type || 'carousel',
                products: sectionProducts
              };
            }).filter(section => section.products.length > 0);

            setSections(generatedSections);
          } else {
            setSections([]);
          }
        } else {
          setSections([]);
        }

      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchHomeData();
  }, []);

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      flame: <Flame className="fill-orange-500 text-orange-500" size={24} />,
      star: <Star className="fill-red-700 text-red-700" size={24} />,
      zap: <Zap className="fill-yellow-500 text-yellow-500" size={24} />,
      shield: <ShieldCheck className="fill-blue-500 text-blue-500" size={24} />,
      trophy: <Trophy className="fill-yellow-400 text-yellow-400" size={24} />,
      gift: <Zap className="fill-pink-500 text-pink-500" size={24} />,
      layout: <ShieldCheck className="fill-red-700 text-red-700" size={24} />
    };
    return icons[iconName?.toLowerCase()] || <Star className="fill-red-700 text-red-700" size={24} />;
  };

  return (
    <div className="w-full relative">
      <Categories />
      
      {/* Centered Modern Big Search Bar */}
      <div className="w-full max-w-[880px] mx-auto px-4 mt-4 mb-4 relative" ref={searchContainerRef}>
        <form onSubmit={handleBigSearchSubmit} className="flex items-center w-full">
          <div className="relative flex-grow">
            <input
              type="text"
              value={bigSearchTerm}
              onFocus={() => setShowBigSuggestions(true)}
              onChange={(e) => setBigSearchTerm(e.target.value)}
              placeholder="Search Big Deals, games, parts..."
              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 py-3.5 pl-12 pr-6 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-red-600 transition-all font-semibold shadow-sm text-left animate-none"
              style={{ direction: 'ltr' }}
            />
            <button
              type="submit"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-700 transition-colors cursor-pointer bg-transparent border-none outline-none flex items-center justify-center p-1"
              aria-label="Search"
            >
              <Search size={18} className="stroke-[2.5]" />
            </button>
          </div>
        </form>

        {/* Suggestion Dropdown Panel */}
        <AnimatePresence>
          {showBigSuggestions && bigSearchTerm.trim().length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-4 right-4 mt-2 bg-white dark:bg-[#1a1d24] border border-gray-150 rounded-xl shadow-2xl z-50 overflow-hidden text-right"
              dir="rtl"
            >
              {isBigSearching ? (
                <div className="flex items-center justify-center gap-2 py-8 text-gray-500 dark:text-gray-400">
                  <Loader2 size={20} className="animate-spin text-red-600" />
                  <span className="text-xs font-bold font-sans">جاري البحث عن العروض...</span>
                </div>
              ) : bigSuggestions.length > 0 ? (
                <div className="py-2">
                  <div className="px-4 py-2 flex items-center justify-between border-b border-gray-50">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">المقترحات المطابقة</span>
                    <span className="text-[9px] bg-red-50 text-red-700 font-extrabold px-1.5 py-0.5 rounded-md">{bigSuggestions.length} نتائج</span>
                  </div>
                  
                  <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-50">
                    {bigSuggestions.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setShowBigSuggestions(false);
                          setBigSearchTerm('');
                          navigate(`/product/${item.id}`);
                        }}
                        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-right flex-row-reverse"
                      >
                        {/* Image */}
                        <div className="w-12 h-12 bg-gray-50 dark:bg-[#0f1115] border border-gray-100 dark:border-gray-700 rounded-lg flex-shrink-0 flex items-center justify-center p-1.5 overflow-hidden">
                          <img 
                            src={item.image_url || null} 
                            alt="" 
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Title & Category info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-extrabold text-gray-900 dark:text-white truncate">{item.title}</p>
                          <p className="text-[10px] font-bold text-gray-400 mt-0.5">{item.game_name || 'قسم العروض الكبرى'}</p>
                        </div>

                        {/* Price */}
                        <div className="text-xs font-black text-red-700 whitespace-nowrap">
                          {formatPrice(Number(item.price))}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Show All option */}
                  <button
                    onClick={handleBigSearchSubmit}
                    className="w-full py-3 text-center text-xs font-extrabold text-red-700 hover:bg-red-50/50 border-t border-gray-50 bg-red-50/20 transition-all"
                  >
                    عرض جميع النتائج لـ "{bigSearchTerm}" ←
                  </button>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-gray-50 dark:bg-[#0f1115] rounded-full flex items-center justify-center mx-auto mb-3">
                    <Search className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-xs font-extrabold text-gray-400">لا توجد نتائج مطابقة لبحثك عن "{bigSearchTerm}"</p>
                  <p className="text-[10px] text-gray-400 mt-1">تأكد من كتابة الكلمة بشكل صحيح وجرب كتابة اللعبة أو البطاقة</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <main className="flex-1 flex flex-col space-y-6 pb-32">
        <HeroBanners />

        {roboCoinsEnabled && (
          <div className="px-4 md:px-6">
            <div className="max-w-7xl mx-auto">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-red-650 via-zinc-900 to-zinc-900 text-white rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-zinc-800 shadow-xl shadow-red-950/10 overflow-hidden relative group"
              >
                {/* Background decorative coin orbits */}
                <div className="absolute -top-16 -left-16 w-48 h-48 bg-red-650/12 rounded-full blur-3xl group-hover:bg-red-650/20 transition-all duration-700"></div>
                
                <div className="flex items-center gap-4 text-right z-10 flex-col md:flex-row md:gap-5" dir="rtl">
                  <div className="bg-red-700/60 p-4 rounded-2xl flex items-center justify-center animate-bounce border border-red-500/30">
                    <span className="text-3xl">🪙</span>
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-black text-red-100 flex items-center gap-2 justify-center md:justify-start">
                      مخزون الروبوكس (Robux) المتاح للشحن الفوري بالمتجر ⚡
                    </h2>
                    <p className="text-xs md:text-sm text-zinc-300 font-bold mt-1 leading-relaxed max-w-2xl">
                      اشحن كمية الروبوكس التي تتمناها فورياً وبأفضل أسعار بالمملكة والوطن العربي مع تتبع لحظي للمخزون المتبقي بالسيستم لضمان سرعة الخدمة وتوفير الطلب!
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center bg-zinc-950/60 py-3.5 px-6 rounded-2xl border border-zinc-800/80 min-w-[200px] z-10" dir="rtl">
                  <span className="text-[10px] font-black tracking-widest text-[#A3C15A] uppercase">مخزون روبوكس المتبقي</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl md:text-3xl font-black font-mono text-white tracking-tight">
                      {roboCoinsBalance.toLocaleString('en-US')}
                    </span>
                    <span className="text-sm font-black text-red-500">Robux 🪙</span>
                  </div>
                  <p className="text-[9px] text-zinc-400 font-bold mt-1 leading-none">يتناقص هذا المخزون الرئيسي بالمتجر مع كل عملية شراء وتسليم ناجحة لعملائنا 📦</p>
                </div>
              </motion.div>
            </div>
          </div>
        )}
        
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="py-8">
              <ProductSection title="" icon={<Loader2 className="animate-spin" size={24} />} products={[]} isLoading={true} />
            </div>
          ))
        ) : sections.length > 0 ? (
          sections.map((section, index) => (
            <React.Fragment key={section.id}>
              {/* Promo Break after first section */}
              {index === 1 && (
                <div className="px-4 md:px-6 py-6">
                  <div className="max-w-7xl mx-auto">
                    <motion.div 
                       initial={{ opacity: 0, scale: 0.95 }}
                       whileInView={{ opacity: 1, scale: 1 }}
                       viewport={{ once: true }}
                       className="bg-red-700 rounded-[2rem] p-8 md:p-12 relative overflow-hidden text-center md:text-right group"
                    >
                      <div className="absolute top-0 left-0 w-full h-full bg-black/10 z-0"></div>
                      <div className="absolute -top-24 -left-24 w-64 h-64 bg-white dark:bg-[#1a1d24]/10 rounded-full blur-3xl"></div>
                      
                      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                          <div className="flex items-center gap-3 justify-center md:justify-start mb-4">
                            <Trophy className="text-yellow-400 fill-yellow-400" size={32} />
                            <span className="text-white/80 font-black tracking-widest uppercase text-xs">رقم 1 في الخليج</span>
                          </div>
                          <h3 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">موثوقية وأمان <br className="hidden md:block" /> في كل عملية شحن</h3>
                          <p className="text-red-100/70 text-sm md:text-base max-w-xl font-bold">نحن نوفر لك أسرع تجربة شحن للألعاب والبطاقات الرقمية في المنطقة، بضمان كامل ودعم فني متواجد دائماً لخدمتكم.</p>
                        </div>
                        <div className="flex flex-col gap-3 min-w-[200px]">
                          <Link to="/store" className="bg-white dark:bg-[#1a1d24] text-red-700 font-black py-4 px-8 rounded-2xl hover:bg-red-50 transition-all duration-300 shadow-xl shadow-red-900/20 active:scale-95 whitespace-nowrap">تصفح كافة المنتجات</Link>
                          <p className="text-white/80 text-xs font-bold whitespace-nowrap">أكثر من 50,000+ عميل يثق بنا</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              )}

              <div className={`
                ${section.section_type === 'carousel' ? 'bg-gray-50 dark:bg-[#0f1115]/80 border-y border-gray-100 dark:border-gray-700/50 py-4 pb-12 overflow-hidden' : 'relative py-4'}
              `}>
                <ProductSection 
                  title={section.title} 
                  icon={getIconComponent(section.icon)} 
                  products={section.products} 
                  isLoading={isLoading}
                  type={section.section_type}
                />
              </div>
            </React.Fragment>
          ))
        ) : (
          <div className="py-20 text-center opacity-50 flex flex-col items-center">
            <Layout size={48} className="text-zinc-300 mb-4" />
            <p className="font-black text-zinc-900 dark:text-white">لا توجد أقسام مخصصة حالياً</p>
            <p className="text-xs font-bold text-zinc-500 mt-1">يرجى إضافة أقسام من لوحة التحكم لتظهر هنا.</p>
          </div>
        )}

        <CustomerReviews />
        <BrandShowcase />
        <TrustBar />
      </main>
    </div>
  );
}
