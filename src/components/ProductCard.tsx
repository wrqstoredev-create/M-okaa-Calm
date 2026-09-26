import { ShoppingCart, Star, Zap, Loader2, Heart } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useCurrency } from '../contexts/CurrencyContext';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { useFavorites } from '../contexts/FavoritesContext';

export default function ProductCard({ product }: { product: any, key?: any }) {
  const navigate = useNavigate();
  const { formatPrice, currency, convertPrice } = useCurrency();
  const { addItem } = useCart();
  const { addToast } = useToast();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [isAdding, setIsAdding] = useState(false);

  const price = Number(product.price || 0);
  const oldPrice = product.old_price ? Number(product.old_price) : null;
  const hasDiscount = !!oldPrice;
  const imageUrl = product.image_url || product.image;
  const title = product.title || product.name;
  const gameName = product.game_name || product.game;
  const badge = product.discount_badge || product.discountBadge;
  const isFav = isFavorite(product.id);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Navigate to product page to fill requirements manually as requested
    navigate(`/product/${product.id}`);
    addToast('يرجى إكمال بيانات الشحن للمنتج ⚡', 'info');
  };

  // Calculate discount percentage automatically if not provided explicitly
  const calculateDiscount = () => {
    if (oldPrice && price && oldPrice > price) {
      const percentage = Math.round(((oldPrice - price) / oldPrice) * 100);
      return `خصم ${percentage}%`;
    }
    return badge;
  };

  const dynamicBadge = calculateDiscount();
  const displayPrice = convertPrice(price);
  const displayOldPrice = oldPrice ? convertPrice(oldPrice) : null;

  // Get short symbol
  const getSymbol = (cur: string) => {
    switch(cur) {
      case 'EGY': return 'EGY';
      case 'SAR': return 'SAR';
      case 'USD': return '$';
      default: return cur;
    }
  };

  const isHighlighted = hasDiscount;

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 350, damping: 22 }}
      className="h-full"
    >
      <Link 
        to={`/product/${product.id}`} 
        className={`
          relative flex flex-col h-full group text-left overflow-hidden
          rounded-2xl p-4 transition-all duration-300
          border shadow-sm
          bg-white dark:bg-[#0c0c10]
          border-gray-150 dark:border-white/5
          hover:shadow-xl
          dark:hover:border-red-500/25
          dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,32,64,0.12)]
          ${isHighlighted ? 'shimmer-card' : ''}
        `}
      >
        {/* Neon corner accent for discounted/premium items */}
        {isHighlighted && (
          <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-red-500/15 to-transparent" />
          </div>
        )}

        {/* Only 3 Badge centered at the top */}
        {product.stock !== undefined && product.stock > 0 && product.stock <= 5 && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-[#b88c4b] text-white text-[10px] font-black px-3.5 py-1 rounded-full z-20 shadow-md border border-white uppercase tracking-wider">
            Only {product.stock}
          </div>
        )}

        {/* Product Image and Discount Badge */}
        <div className="w-full aspect-square bg-transparent rounded-xl mb-3 overflow-hidden relative z-10 flex items-center justify-center p-2">
           {dynamicBadge && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-red-600 to-rose-500 text-white text-[10px] font-black px-2 py-1 rounded-md z-20 shadow-sm shadow-red-500/30 dark:shadow-[0_2px_8px_rgba(255,32,64,0.5)]" dir="ltr">
              {dynamicBadge.includes('خصم') ? `${dynamicBadge.replace('خصم ', '').trim()}-` : dynamicBadge}
            </div>
          )}
          
          <motion.img 
            whileHover={{ scale: 1.07 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            src={imageUrl || null} 
            alt={title}
            className="w-full h-full object-cover drop-shadow-md"
          />
        </div>

        {/* Product Info */}
        <div className="flex-1 flex flex-col items-start px-1">
          <h4 className="text-[13px] font-black text-gray-900 dark:text-white mb-3 line-clamp-2 leading-tight tracking-tight uppercase group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-200">
            {title}
          </h4>
          
          <div className="mt-auto w-full">
            {/* Price section */}
            <div className="flex items-center justify-between gap-1.5 mb-4 w-full flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {hasDiscount && (
                  <div className="flex items-center gap-0.5 text-red-400 dark:text-red-400/70 text-xs line-through font-bold opacity-80" dir="ltr">
                    <span>{new Intl.NumberFormat('en-US', { minimumFractionDigits: (displayOldPrice || 0) % 1 !== 0 ? 2 : 0, maximumFractionDigits: 2 }).format(displayOldPrice || 0)}</span>
                    <span>{getSymbol(currency)}</span>
                  </div>
                )}
                {/* Neon green price */}
                <div
                  className="flex items-center gap-0.5 font-black text-lg tracking-tight"
                  style={{
                    color: 'var(--neon-green)',
                    textShadow: 'var(--glow-green) ? 0 0 8px rgba(0,255,136,0.5) : none',
                  }}
                  dir="ltr"
                >
                  <span>{new Intl.NumberFormat('en-US', { minimumFractionDigits: displayPrice % 1 !== 0 ? 2 : 0, maximumFractionDigits: 2 }).format(displayPrice)}</span>
                  <span>{getSymbol(currency)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 w-full mt-2">
              {/* Shop Now — Neon gradient with glow */}
              <button 
                onClick={handleQuickAdd}
                disabled={isAdding}
                className="
                  w-full text-white text-[12px] font-black py-2.5 rounded-full
                  transition-all duration-300 active:scale-95 flex items-center justify-center gap-1 cursor-pointer
                  bg-gradient-to-r from-red-600 to-rose-500
                  shadow-[0_4px_12px_rgba(255,32,64,0.35)]
                  hover:shadow-[0_4px_20px_rgba(255,32,64,0.6)]
                  hover:from-red-500 hover:to-rose-400
                  dark:shadow-[0_4px_15px_rgba(255,32,64,0.4)]
                  dark:hover:shadow-[0_0_25px_rgba(255,32,64,0.65),0_4px_20px_rgba(255,32,64,0.4)]
                "
              >
                <span>Shop Now</span>
                <Zap size={11} className="fill-white text-white" />
              </button>
              
              {/* Add to Cart — Glassmorphism */}
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(`/product/${product.id}`);
                  addToast('يرجى إدخال البيانات المطلوبة لإضافة المنتج إلى السلة 🛒', 'info');
                }}
                className="
                  w-full text-[12px] font-black py-2.5 rounded-full
                  transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer
                  bg-white dark:bg-white/5
                  border border-gray-200 dark:border-white/10
                  text-red-600 dark:text-red-400
                  hover:bg-gray-50 dark:hover:bg-red-500/10
                  hover:border-red-300 dark:hover:border-red-500/40
                  dark:hover:shadow-[0_0_12px_rgba(255,32,64,0.2)]
                "
              >
                <ShoppingCart size={12} className="text-red-600 dark:text-red-400" />
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
