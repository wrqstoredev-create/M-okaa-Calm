import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import ProductCard from './ProductCard';
import ProductSkeleton from './ProductSkeleton';

type ProductSectionProps = {
  title: string;
  icon?: React.ReactNode;
  products: any[];
  isLoading?: boolean;
  type?: 'grid' | 'carousel';
};

export default function ProductSection({ title, icon, products, isLoading = false, type = 'carousel' }: ProductSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollAmount = clientWidth * 0.8;
      const targetScroll = direction === 'left' 
        ? scrollLeft - scrollAmount 
        : scrollLeft + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <section className="px-4 md:px-8 py-12 relative overflow-hidden group/section">
      <div className="max-w-[1600px] mx-auto">
        {/* Header Design */}
        <div className="flex justify-between items-end mb-8 px-2 border-b border-gray-100 dark:border-gray-800 pb-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              {icon && <div className="text-red-600">{icon}</div>}
              <h3 className="text-2xl md:text-4xl font-black text-gray-950 dark:text-white uppercase tracking-tighter">
                {title}
              </h3>
            </div>
            <div className="h-1.5 w-20 bg-red-600 rounded-full"></div>
          </div>
          
          <Link 
            to="/store" 
            className="group flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white font-black py-4 px-8 rounded-2xl transition-all duration-300 shadow-xl shadow-red-600/20 active:scale-95 transform hover:-translate-y-1"
          >
            <span className="text-sm md:text-base uppercase tracking-widest">عرض الكل</span>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        
        <div className="relative group/carousel">
          {/* Navigation Arrows */}
          <button 
            onClick={() => scroll('left')}
            className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white dark:bg-[#1a1d24] rounded-full shadow-xl border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:text-red-600 hover:border-red-100 hover:shadow-red-500/10 transition-all opacity-0 group-hover/carousel:opacity-100 focus:outline-none"
          >
            <ChevronLeft size={24} />
          </button>

          <button 
            onClick={() => scroll('right')}
            className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white dark:bg-[#1a1d24] rounded-full shadow-xl border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:text-red-600 hover:border-red-100 hover:shadow-red-500/10 transition-all opacity-0 group-hover/carousel:opacity-100 focus:outline-none"
          >
            <ChevronRight size={24} />
          </button>

          {/* Carousel Container */}
          <motion.div 
            ref={scrollContainerRef}
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="flex overflow-x-auto pb-10 pt-2 gap-6 no-scrollbar snap-x w-full"
          >
            {isLoading 
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="min-w-[200px] w-[200px] md:min-w-[280px] flex-shrink-0 snap-start">
                    <ProductSkeleton />
                  </div>
                ))
              : products.map((product) => (
                  <motion.div 
                    key={product.id} 
                    variants={itemVariants}
                    className="min-w-[200px] w-[200px] md:min-w-[280px] h-full snap-start flex-shrink-0 transform hover:-translate-y-2 transition-transform duration-300"
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))
            }
          </motion.div>
        </div>
      </div>
    </section>
  );
}
