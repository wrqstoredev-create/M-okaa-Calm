import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabaseClient';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface Slide {
  id: string;
  image_url: string;
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
  image_link: string;
}

import SmartImage from './SmartImage';

export default function HeroBanners() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [promoBanners, setPromoBanners] = useState<any[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [slidesResponse, promoResponse] = await Promise.all([
          supabase
            .from('slides')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true }),
          supabase
            .from('promo_banners')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
        ]);
        
        let retrievedSlides: Slide[] = [];
        if (slidesResponse.data && slidesResponse.data.length > 0) {
          retrievedSlides = slidesResponse.data;
        } else {
          // Fallback dynamically: Fetch real featured products to show as slider banners!
          const { data: featuredProducts } = await supabase
            .from('products')
            .select('id, title, description, image_url')
            .limit(4);

          if (featuredProducts && featuredProducts.length > 0) {
            retrievedSlides = featuredProducts.map((p: any) => ({
              id: p.id,
              image_url: p.image_url || '',
              title: p.title || '',
              subtitle: p.description || 'تصفح تشكيلة واسعة من أفضل الموديلات والقطع بأسعار مميزة',
              button_text: 'عرض المنتج',
              button_link: `/product/${p.id}`,
              image_link: `/product/${p.id}`
            }));
          }
        }
        
        setSlides(retrievedSlides);
        
        if (promoResponse.error) {
           if (promoResponse.error.code !== 'PGRST205') {
              console.error('Error fetching promo banners:', promoResponse.error);
           }
        } else if (promoResponse.data) {
          setPromoBanners(promoResponse.data);
        }
      } catch (err) {
        console.error('Error fetching banners:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlideIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
  };

  const renderMainBanner = () => {
    if (slides.length === 0) {
      return (
        <motion.div 
          variants={itemVariants}
          className="w-full h-full bg-gradient-to-r from-[#0a0a0a] via-[#141414] to-[#0a0a0a] rounded-lg relative overflow-hidden flex items-center justify-center p-6 text-white shadow-xl border border-white/5"
        >
          <div className="z-10 relative text-center max-w-sm">
            <h2 className="text-xl md:text-2xl font-black mb-2 leading-tight tracking-tight !text-white">
              أهلاً بكم في متجرنا
            </h2>
            <p className="text-zinc-400 text-xs md:text-sm font-semibold leading-relaxed">
              تصفح أحدث القطع والمنتجات الحصرية المتوفرة بأسعار مميزة وجودة عالية.
            </p>
          </div>
          <div className="absolute inset-0 bg-radial-at-c from-red-600/10 via-transparent to-transparent pointer-events-none" />
        </motion.div>
      );
    }

    const currentSlide = slides[currentSlideIndex];

    return (
      <motion.div 
        variants={itemVariants}
        className="w-full h-full bg-[#0a0a0a] rounded-lg relative overflow-hidden flex items-center justify-center md:justify-end px-6 md:px-12 py-8 md:py-0 text-white shadow-xl border border-white/5"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlideIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 w-full h-full"
            onClick={() => {
              if (currentSlide.image_link) window.location.href = currentSlide.image_link;
            }}
            style={{ cursor: currentSlide.image_link ? 'pointer' : 'default' }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = offset.x;
              // In RTL, dragging right (positive offset) means previous visually
              if (swipe < -50) {
                // Dragged left
                nextSlide();
              } else if (swipe > 50) {
                // Dragged right
                prevSlide();
              }
            }}
          >
            <SmartImage 
              src={currentSlide.image_url} 
              alt={currentSlide.title || ''} 
              className="w-full h-full opacity-60 md:opacity-100 mix-blend-overlay md:mix-blend-normal"
              imageClassName="object-contain w-full h-full"
            />
          </motion.div>
        </AnimatePresence>

        <div className="z-10 relative pointer-events-none max-w-xl text-center md:text-end flex flex-col items-center md:items-end w-full">
          {currentSlide.title && (
            <h2 className="text-2xl md:text-3xl font-black mb-2 leading-tight tracking-tighter !text-white drop-shadow-lg" dangerouslySetInnerHTML={{ __html: currentSlide.title.replace(/\n/g, '<br />') }} />
          )}
          {currentSlide.subtitle && (
            <p className="!text-white/90 text-sm md:text-base mb-8 font-medium drop-shadow-md">{currentSlide.subtitle}</p>
          )}
          {currentSlide.button_text && (
            <a 
              href={currentSlide.button_link || '#'} 
              className="pointer-events-auto inline-block bg-white dark:bg-[#1a1d24] text-black dark:text-white font-black px-8 py-3.5 rounded-xl hover:bg-red-600 hover:text-white transition-all duration-300 transform active:scale-95 shadow-xl w-max"
            >
              {currentSlide.button_text}
            </a>
          )}
        </div>

        {/* Carousel Controls */}
        {slides.length > 1 && (
          <div className="hidden md:flex absolute right-4 left-4 justify-between items-center z-20 pointer-events-none">
             <button onClick={prevSlide} className="pointer-events-auto w-10 h-10 bg-black/30 hover:bg-black/60 rounded-full flex items-center justify-center backdrop-blur-md transition-all text-white border border-white/10">
                <ChevronRight size={24} />
             </button>
             <button onClick={nextSlide} className="pointer-events-auto w-10 h-10 bg-black/30 hover:bg-black/60 rounded-full flex items-center justify-center backdrop-blur-md transition-all text-white border border-white/10">
                <ChevronLeft size={24} />
             </button>
          </div>
        )}

        {/* Indicators */}
        {slides.length > 1 && (
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
            {slides.map((_, i) => (
              <button 
                key={i} 
                onClick={() => setCurrentSlideIndex(i)}
                className={`h-2 rounded-full transition-all duration-300 ${i === currentSlideIndex ? 'w-8 bg-white dark:bg-[#1a1d24]' : 'w-2 bg-white dark:bg-[#1a1d24]/40'}`}
              />
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <section className="px-4 md:px-6">
        <div className="max-w-[618px] mx-auto">
          <div className="w-full h-[230px] rounded-lg bg-[#0d0d0d] animate-pulse border border-white/5 flex flex-col items-center justify-center p-6 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-red-650/20 border-t-red-600 animate-spin"></div>
            <span className="text-xs text-zinc-400 font-bold tracking-wider">جاري تحميل العروض والمنتجات الحصرية...</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 md:px-6">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-[618px] mx-auto space-y-4"
      >
        <div className="w-full h-[230px]">
          {/* Main Dynamic Banner */}
          {renderMainBanner()}
        </div>

        {/* Promo Banners Underneath */}
        {promoBanners.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {promoBanners.map((banner, i) => {
              const bgColors = ['bg-red-700', 'bg-blue-700', 'bg-emerald-700', 'bg-amber-700', 'bg-purple-700'];
              const textColors = ['text-red-500', 'text-blue-500', 'text-emerald-500', 'text-amber-500', 'text-purple-500'];
              const colorIdx = i % bgColors.length;

              return (
                <motion.div 
                  key={banner.id}
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  onClick={() => {
                    if (banner.button_link) window.location.href = banner.button_link;
                  }}
                  className="bg-gray-900 rounded-2xl p-6 flex flex-col justify-center text-white relative overflow-hidden group cursor-pointer border border-white/5 shadow-xl h-[160px]"
                >
                  <div className="relative z-10">
                    <h3 className="text-xl font-black mb-1 leading-none">{banner.title}</h3>
                    {banner.subtitle && (
                      <p className={`text-xs ${textColors[colorIdx]} font-black mb-2 tracking-widest uppercase`}>{banner.subtitle}</p>
                    )}
                    <div className="text-sm font-black text-gray-100 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">{banner.hover_text}</div>
                  </div>
                  {banner.button_text && (
                    <button className="relative z-10 border border-white/10 py-1.5 px-4 mt-2 sm:mt-auto self-start rounded-xl text-xs font-black hover:bg-white dark:bg-[#1a1d24] hover:text-black dark:text-white transition-all duration-300 backdrop-blur-sm">
                      {banner.button_text}
                    </button>
                  )}
                  <div className={`absolute -bottom-4 -right-4 w-24 h-24 ${bgColors[colorIdx]} opacity-20 rotate-12 blur-2xl z-0`}></div>
                  {banner.image_url && banner.image_url !== '' && (
                    <img 
                        src={banner.image_url} 
                        className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay group-hover:scale-110 transition-transform duration-700 pointer-events-none"
                        alt=""
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </section>
  );
}
