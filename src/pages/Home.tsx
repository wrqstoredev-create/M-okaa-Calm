import Categories from '../components/Categories';
import HeroBanners from '../components/HeroBanners';
import ProductSection from '../components/ProductSection';
import TrustBar from '../components/TrustBar';
import BrandShowcase from '../components/BrandShowcase';
import CustomerReviews from '../components/CustomerReviews';
import { Flame, Star, Zap, ShieldCheck, Trophy, Loader2, Layout, Search, CheckCircle2, X, Sparkles } from 'lucide-react';
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
      
      {/* Centered Modern Big Search Bar (Cyberpunk Glassmorphism) */}
      <div className="w-full max-w-[880px] mx-auto px-4 mt-6 mb-6 relative" ref={searchContainerRef}>
        <form onSubmit={handleBigSearchSubmit} className="flex items-center w-full relative">
          <div className="relative flex-grow group">
            {/* Ambient Glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-650 via-rose-600 to-red-650 rounded-2xl blur opacity-25 group-hover:opacity-45 group-focus-within:opacity-80 transition-all duration-500"></div>

            <div className="relative flex items-center bg-white/90 dark:bg-[#0c0d14]/90 backdrop-blur-xl border border-gray-200/90 dark:border-white/10 rounded-2xl shadow-lg transition-all">
              {/* Right Search Icon (RTL friendly) */}
              <div className="pr-4 pl-2 text-gray-400 dark:text-gray-500 flex items-center justify-center">
                <Search size={20} className="stroke-[2.5]" />
              </div>

              {/* Text Input */}
              <input
                type="text"
                value={bigSearchTerm}
                onFocus={() => setShowBigSuggestions(true)}
                onChange={(e) => setBigSearchTerm(e.target.value)}
                placeholder="ابحث عن لعبتك المفضلة، بطاقات الشحن، أو الأكواد الحصرية..."
                className="w-full bg-transparent border-none py-3.5 px-2 text-sm font-bold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
                dir="rtl"
              />

              {/* Clear button if text exists */}
              {bigSearchTerm.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setBigSearchTerm('');
                    setShowBigSuggestions(false);
                  }}
                  className="p-1.5 ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  title="مسح البحث"
                >
                  <X size={16} />
                </button>
              )}

              {/* Prominent Submit Button */}
              <div className="pl-2">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-[0_2px_12px_rgba(255,32,64,0.4)] hover:shadow-[0_0_20px_rgba(255,32,64,0.65)] hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <span>بحث</span>
                  <Zap size={14} className="fill-white" />
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Quick Trending Tags */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar py-1" dir="rtl">
          <span className="text-[11px] font-black text-gray-500 dark:text-gray-400 whitespace-nowrap flex items-center gap-1">
            <Flame size={13} className="text-red-500 fill-red-500" /> الكلمات الشائعة:
          </span>
          {[
            { label: '🎮 روبلوكس', term: 'روبلوكس' },
            { label: '🔥 ببجي موبايل', term: 'ببجي' },
            { label: '💎 فري فاير', term: 'فري فاير' },
            { label: '⚡ ستيم', term: 'ستيم' },
            { label: '🏆 بلايستيشن', term: 'بلايستيشن' },
            { label: '🎯 فورتنايت', term: 'فورتنايت' },
          ].map((tag) => (
            <button
              key={tag.term}
              type="button"
              onClick={() => {
                setBigSearchTerm(tag.term);
                setShowBigSuggestions(false);
                navigate(`/search?q=${encodeURIComponent(tag.term)}`);
              }}
              className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 hover:border-red-500/50 hover:bg-red-50/50 dark:hover:bg-red-950/30 transition-all whitespace-nowrap shadow-xs hover:shadow-[0_0_12px_rgba(255,32,64,0.2)] cursor-pointer"
            >
              {tag.label}
            </button>
          ))}
        </div>

        {/* Suggestion Dropdown Panel */}
        <AnimatePresence>
          {showBigSuggestions && bigSearchTerm.trim().length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-4 right-4 mt-2 bg-white/95 dark:bg-[#0c0d14]/95 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden text-right"
              dir="rtl"
            >
              {isBigSearching ? (
                <div className="flex items-center justify-center gap-2 py-8 text-gray-500 dark:text-gray-400">
                  <Loader2 size={20} className="animate-spin text-red-600" />
                  <span className="text-xs font-bold font-sans">جاري البحث عن العروض...</span>
                </div>
              ) : bigSuggestions.length > 0 ? (
                <div className="py-2">
                  <div className="px-4 py-2 flex items-center justify-between border-b border-gray-100 dark:border-white/5">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">المقترحات المطابقة</span>
                    <span className="text-[9px] bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 font-extrabold px-2 py-0.5 rounded-full border border-red-500/20">{bigSuggestions.length} نتائج</span>
                  </div>
                  
                  <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-100 dark:divide-white/5">
                    {bigSuggestions.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setShowBigSuggestions(false);
                          setBigSearchTerm('');
                          navigate(`/product/${item.id}`);
                        }}
                        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-right flex-row-reverse group cursor-pointer"
                      >
                        {/* Image */}
                        <div className="w-12 h-12 bg-gray-50 dark:bg-[#15171e] border border-gray-100 dark:border-white/10 rounded-xl flex-shrink-0 flex items-center justify-center p-1.5 overflow-hidden group-hover:scale-105 transition-transform">
                          <img 
                            src={item.image_url || null} 
                            alt="" 
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Title & Category info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-extrabold text-gray-900 dark:text-white truncate group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">{item.title}</p>
                          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-0.5">{item.game_name || 'قسم العروض الكبرى'}</p>
                        </div>

                        {/* Price */}
                        <div className="text-xs font-black text-red-600 dark:text-red-400 whitespace-nowrap font-mono">
                          {formatPrice(Number(item.price))}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Show All option */}
                  <button
                    onClick={handleBigSearchSubmit}
                    className="w-full py-3 text-center text-xs font-extrabold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border-t border-gray-100 dark:border-white/5 bg-red-50/30 dark:bg-red-950/10 transition-all cursor-pointer"
                  >
                    عرض جميع النتائج لـ "{bigSearchTerm}" ←
                  </button>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-gray-50 dark:bg-[#15171e] rounded-full flex items-center justify-center mx-auto mb-3">
                    <Search className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                  </div>
                  <p className="text-xs font-extrabold text-gray-500 dark:text-gray-400">لا توجد نتائج مطابقة لبحثك عن "{bigSearchTerm}"</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">تأكد من كتابة الكلمة بشكل صحيح وجرب كتابة اللعبة أو نوع البطاقة</p>
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
                className="bg-gradient-to-r from-red-650 via-zinc-950 to-zinc-900 text-white rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-red-500/20 shadow-2xl shadow-red-950/30 overflow-hidden relative group"
              >
                {/* Background decorative glowing blur orbits */}
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-red-600/20 rounded-full blur-3xl group-hover:bg-red-600/30 transition-all duration-700 pointer-events-none"></div>
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="flex items-center gap-5 text-right z-10 flex-col md:flex-row" dir="rtl">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400/20 to-red-650/40 border border-amber-400/30 flex items-center justify-center shadow-[0_0_25px_rgba(251,191,36,0.3)]">
                      <span className="text-3xl animate-bounce">🪙</span>
                    </div>
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full text-emerald-400 text-[11px] font-black mb-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      متصل بالسيرفر — تحديث لحظي
                    </div>
                    <h2 className="text-lg md:text-xl font-black text-white flex items-center gap-2 justify-center md:justify-start">
                      مخزون الروبوكس (Robux) المتاح للشحن الفوري بالمتجر ⚡
                    </h2>
                    <p className="text-xs md:text-sm text-zinc-300 font-bold mt-1.5 leading-relaxed max-w-2xl">
                      اشحن كمية الروبوكس التي تتمناها فورياً وبأفضل أسعار بالمملكة والوطن العربي مع تتبع لحظي للمخزون المتبقي بالسيستم لضمان سرعة الخدمة وتوفير الطلب!
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center md:items-end bg-black/40 backdrop-blur-md py-4 px-6 rounded-2xl border border-white/10 min-w-[220px] z-10 shadow-[0_0_30px_rgba(0,0,0,0.5)]" dir="rtl">
                  <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase">مخزون روبوكس المتبقي</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-3xl md:text-4xl font-black font-mono bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(251,191,36,0.5)] tracking-tight">
                      {roboCoinsBalance.toLocaleString('en-US')}
                    </span>
                    <span className="text-sm font-black text-amber-400">Robux 🪙</span>
                  </div>
                  <p className="text-[9px] text-zinc-400 font-bold mt-1 leading-none">يتناقص لحظياً مع كل عملية شراء ناجحة 📦</p>
                  <Link
                    to="/category/roblox"
                    className="mt-3 w-full text-center bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs py-2.5 px-4 rounded-xl shadow-[0_0_20px_rgba(255,32,64,0.4)] hover:shadow-[0_0_25px_rgba(255,32,64,0.7)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>اشحن روبوكس الآن</span>
                    <Zap size={14} className="fill-yellow-300 text-yellow-300" />
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* Plan 3: Platform Live Stats Counter */}
        <div className="px-4 md:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4" dir="rtl">
              {[
                {
                  icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" />,
                  value: "+12,000",
                  title: "طلب مكتمل بنجاح",
                  desc: "شحن فوري ومضمون لآلاف اللاعبين",
                  glowColor: "hover:border-emerald-500/40 hover:shadow-emerald-500/10",
                  badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                },
                {
                  icon: <Star className="w-6 h-6 text-amber-400 fill-amber-400" />,
                  value: "4.9 / 5.0",
                  title: "تقييم العملاء المعتمد",
                  desc: "أعلى نسبة ثقة بالخليج والوطن العربي",
                  glowColor: "hover:border-amber-500/40 hover:shadow-amber-500/10",
                  badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                },
                {
                  icon: <Zap className="w-6 h-6 text-red-500 fill-red-500" />,
                  value: "< 60 ثانية",
                  title: "سرعة التسليم الفوري",
                  desc: "أنظمة شحن آلية تعمل على مدار الساعة",
                  glowColor: "hover:border-red-500/40 hover:shadow-red-500/10",
                  badgeColor: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                },
                {
                  icon: <ShieldCheck className="w-6 h-6 text-blue-500" />,
                  value: "100% رسمي",
                  title: "أمان وحماية الحسابات",
                  desc: "طرق شحن معتمدة ورسمية بدون حظر",
                  glowColor: "hover:border-blue-500/40 hover:shadow-blue-500/10",
                  badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                }
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className={`group bg-white/80 dark:bg-[#0c0d12]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 rounded-2xl p-4 md:p-5 flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 ${stat.glowColor}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 group-hover:scale-110 transition-transform">
                      {stat.icon}
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${stat.badgeColor}`}>
                      مباشر
                    </span>
                  </div>
                  <div>
                    <div className="text-xl md:text-2xl font-black text-gray-900 dark:text-white font-mono tracking-tight flex items-baseline gap-1">
                      {stat.value}
                    </div>
                    <div className="text-xs md:text-sm font-extrabold text-gray-800 dark:text-gray-200 mt-0.5">
                      {stat.title}
                    </div>
                    <div className="text-[10px] md:text-[11px] font-semibold text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                      {stat.desc}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="py-8">
              <ProductSection title="" icon={<Loader2 className="animate-spin" size={24} />} products={[]} isLoading={true} />
            </div>
          ))
        ) : sections.length > 0 ? (
          sections.map((section, index) => (
            <React.Fragment key={section.id}>
              {/* Promo Break after first section (Plan 6: Revamped Banner) */}
              {index === 1 && (
                <div className="px-4 md:px-6 py-6">
                  <div className="max-w-7xl mx-auto">
                    <motion.div 
                       initial={{ opacity: 0, scale: 0.95 }}
                       whileInView={{ opacity: 1, scale: 1 }}
                       viewport={{ once: true }}
                       className="bg-gradient-to-r from-red-650 via-rose-900 to-zinc-950 text-white rounded-[2rem] p-8 md:p-12 relative overflow-hidden text-center md:text-right border border-red-500/30 shadow-2xl shadow-red-950/40 group"
                    >
                      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_70%)] pointer-events-none"></div>
                      <div className="absolute -top-24 -left-24 w-72 h-72 bg-rose-500/20 rounded-full blur-3xl pointer-events-none"></div>
                      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-red-600/20 rounded-full blur-3xl pointer-events-none"></div>
                      
                      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8" dir="rtl">
                        <div>
                          <div className="flex items-center gap-3 justify-center md:justify-start mb-4">
                            <div className="p-2 rounded-xl bg-yellow-400/20 border border-yellow-400/30 shadow-[0_0_15px_rgba(250,204,21,0.3)]">
                              <Trophy className="text-yellow-400 fill-yellow-400" size={24} />
                            </div>
                            <span className="bg-white/10 border border-white/20 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
                              المنصة رقم #1 بالشرق الأوسط
                            </span>
                          </div>
                          <h3 className="text-2xl md:text-4xl lg:text-5xl font-black text-white mb-4 leading-tight drop-shadow-sm">
                            موثوقية وأمان فائق <br className="hidden md:block" /> في كل عملية شحن وتسليم
                          </h3>
                          <p className="text-red-100/80 text-xs md:text-sm max-w-xl font-bold leading-relaxed">
                            نحن نوفر لك أسرع تجربة شحن للألعاب والبطاقات الرقمية في المنطقة بضمان كامل 100% بدون أي مخاطر على الحسابات، ودعم فني متواجد لحظياً على مدار الساعة لخدمتكم.
                          </p>
                        </div>
                        <div className="flex flex-col gap-3 min-w-[220px] w-full md:w-auto items-center md:items-end">
                          <Link 
                            to="/store" 
                            className="w-full md:w-auto text-center bg-white text-zinc-950 font-black py-4 px-8 rounded-2xl hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_0_25px_rgba(255,255,255,0.4)] whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <span>تصفح كافة المنتجات</span>
                            <Sparkles size={16} className="text-amber-500 fill-amber-500" />
                          </Link>
                          <p className="text-white/80 text-xs font-extrabold whitespace-nowrap flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            أكثر من 5,000+ عميل معتمد يثق بنا
                          </p>
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
