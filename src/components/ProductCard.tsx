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
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="h-full"
    >
      <Link 
        to={`/product/${product.id}`} 
        className="bg-white dark:bg-[#1a1d24] border border-gray-150 rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 relative flex flex-col h-full group text-left overflow-hidden"
      >
        {/* Only 3 Badge centered at the top as shown in the screenshot */}
        {product.stock !== undefined && product.stock > 0 && product.stock <= 5 && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-[#b88c4b] text-white text-[10px] font-black px-3.5 py-1 rounded-full z-20 shadow-md border border-white uppercase tracking-wider">
            Only {product.stock}
          </div>
        )}

        {/* Product Image and Discount Badge */}
        <div className="w-full aspect-square bg-transparent rounded-xl mb-3 overflow-hidden relative z-10 flex items-center justify-center p-2">
           {dynamicBadge && (
            <div className="absolute top-3 left-3 bg-[#cc2229] text-white text-[10px] font-black px-2 py-1 rounded-md z-20 shadow-sm border border-white" dir="ltr">
              {dynamicBadge.includes('خصم') ? `${dynamicBadge.replace('خصم ', '').trim()}-` : dynamicBadge}
            </div>
          )}
          
          <motion.img 
            whileHover={{ scale: 1.05 }}
            src={imageUrl || null} 
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 drop-shadow-md"
          />
        </div>

        {/* Product Info */}
        <div className="flex-1 flex flex-col items-start px-1">
          <h4 className="text-[13px] font-black text-gray-900 dark:text-white mb-3 line-clamp-2 leading-tight tracking-tight uppercase">
            {title}
          </h4>
          
          <div className="mt-auto w-full">
            {/* Price section precisely matching the screenshot */}
            <div className="flex items-center justify-between gap-1.5 mb-4 w-full flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {hasDiscount && (
                  <div className="flex items-center gap-0.5 text-red-600 text-xs line-through font-bold opacity-80" dir="ltr">
                    <span>{new Intl.NumberFormat('en-US', { minimumFractionDigits: (displayOldPrice || 0) % 1 !== 0 ? 2 : 0, maximumFractionDigits: 2 }).format(displayOldPrice || 0)}</span>
                    <span>{getSymbol(currency)}</span>
                  </div>
                )}
                <div className="flex items-center gap-0.5 text-[#25a544] font-black text-lg tracking-tight" dir="ltr">
                  <span>{new Intl.NumberFormat('en-US', { minimumFractionDigits: displayPrice % 1 !== 0 ? 2 : 0, maximumFractionDigits: 2 }).format(displayPrice)}</span>
                  <span>{getSymbol(currency)}</span>
                </div>
              </div>


            </div>

            {/* Action Buttons exactly as in the image */}
            <div className="flex flex-col gap-2 w-full mt-2">
              <button 
                onClick={handleQuickAdd}
                disabled={isAdding}
                className="w-full bg-[#cc2229] hover:bg-red-700 text-white text-[12px] font-black py-2.5 rounded-full transition-all duration-300 shadow-sm active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Shop Now</span>
                <Zap size={11} className="fill-white text-white" />
              </button>
              
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(`/product/${product.id}`);
                  addToast('يرجى إدخال البيانات المطلوبة لإضافة المنتج إلى السلة 🛒', 'info');
                }}
                className="w-full bg-white dark:bg-[#1a1d24] border border-gray-200 dark:border-gray-700 text-[#cc2229] text-[12px] font-black py-2.5 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingCart size={12} className="text-[#cc2229]" />
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
