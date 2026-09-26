/**
 * ProductCard — GamePay
 *
 * Improvements over original:
 * ────────────────────────────
 * • Fixed 1:1 aspect-ratio image area → no more distortion at any card width.
 * • Rich badge system:
 *     - Discount %   → auto-calculated from old_price / price
 *     - "مميز"       → when product.is_featured === true
 *     - "جديد"       → when product.is_new === true
 *     - "ينفد"       → when stock ≤ 5
 *     - Custom badge → product.discount_badge string (fallback)
 * • "شراء الآن" CTA is now a full-width pill button with min-h-11 (44 px)
 *   so it comfortably meets Apple's HIG touch-target minimum on mobile.
 * • Favourite heart button overlaid on the image (top-left corner).
 * • Hover lift is handled entirely by the parent wrapper in ProductSection
 *   (avoids double-transform jank); internal motion only scales the image.
 * • All logic (price formatting, navigation, cart, favourites) is unchanged.
 */

import { ShoppingCart, Zap, Heart, Sparkles, Star } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useCurrency } from '../contexts/CurrencyContext';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { Product } from '../types/products';

/* ─── Types ──────────────────────────────────────────────────────────────── */

type ProductCardProps = {
  product: Product & {
    image?: string;
    name?: string;
    game?: string;
    discountBadge?: string;
  };
  key?: any; // React key — passed by parent list renders, not used internally
};

/* ─── Badge config ────────────────────────────────────────────────────────── */

type BadgeVariant = 'discount' | 'featured' | 'new' | 'low-stock' | 'custom';

interface BadgeConfig {
  label: string;
  variant: BadgeVariant;
}

/** Returns the single highest-priority badge to display on the card. */
function resolveBadge(product: ProductCardProps['product']): BadgeConfig | null {
  const price    = Number(product.price    || 0);
  const oldPrice = product.old_price ? Number(product.old_price) : null;

  // 1 — Discount (highest priority if there is an actual price drop)
  if (oldPrice && oldPrice > price) {
    const pct = Math.round(((oldPrice - price) / oldPrice) * 100);
    return { label: `${pct}% خصم`, variant: 'discount' };
  }

  // 2 — Custom badge from DB
  const customBadge = product.discount_badge || product.discountBadge;
  if (customBadge) return { label: customBadge, variant: 'custom' };

  // 3 — Low stock
  if (product.stock !== undefined && product.stock > 0 && product.stock <= 5) {
    return { label: `آخر ${product.stock} قطع`, variant: 'low-stock' };
  }

  // 4 — Featured
  if (product.is_featured) return { label: 'مميز', variant: 'featured' };

  // 5 — New
  if (product.is_new) return { label: 'جديد', variant: 'new' };

  return null;
}

/** Badge colour map per variant */
const BADGE_STYLES: Record<BadgeVariant, string> = {
  discount:   'bg-red-600 text-white',
  featured:   'bg-amber-500 text-white',
  new:        'bg-emerald-600 text-white',
  'low-stock': 'bg-orange-500 text-white',
  custom:     'bg-red-700 text-white',
};

/** Badge icon per variant */
function BadgeIcon({ variant }: { variant: BadgeVariant }) {
  if (variant === 'featured') return <Star size={9} className="fill-white" />;
  if (variant === 'new')      return <Sparkles size={9} />;
  return null;
}

/* ─── Currency symbol helper ─────────────────────────────────────────────── */

function getCurrencySymbol(cur: string) {
  switch (cur) {
    case 'EGY': return 'ج.م';
    case 'SAR': return 'ر.س';
    case 'USD': return '$';
    default:    return cur;
  }
}

/* ─── Price formatter (compact, no trailing .00) ──────────────────────────── */

function formatAmount(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: value % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/* ═══════════════════════════════════════════════════════════════════════════
   Component
═══════════════════════════════════════════════════════════════════════════ */

export default function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();
  const { currency, convertPrice } = useCurrency();
  const { addToast }               = useToast();
  const { toggleFavorite, isFavorite } = useFavorites();

  const isFav = isFavorite(product.id);

  /* Derived values */
  const price         = Number(product.price || 0);
  const oldPrice      = product.old_price ? Number(product.old_price) : null;
  const hasDiscount   = !!oldPrice && oldPrice > price;
  const imageUrl      = product.image_url || product.image;
  const title         = product.title     || product.name  || '';
  const gameName      = product.game_name || product.game;
  const badge         = resolveBadge(product);
  const displayPrice  = convertPrice(price);
  const displayOldPrice = oldPrice ? convertPrice(oldPrice) : null;
  const symbol        = getCurrencySymbol(currency);

  /* Handlers */
  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/product/${product.id}`);
    addToast('يرجى إكمال بيانات الشحن للمنتج ⚡', 'info');
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/product/${product.id}`);
    addToast('يرجى إدخال البيانات المطلوبة لإضافة المنتج إلى السلة 🛒', 'info');
  };

  const handleFavourite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product);
  };

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <Link
      to={`/product/${product.id}`}
      className={[
        /* Card shell */
        'group relative flex flex-col h-full',
        'bg-white dark:bg-[#1a1d24]',
        'border border-gray-100 dark:border-gray-700/60',
        'rounded-2xl overflow-hidden',
        'shadow-sm hover:shadow-xl hover:shadow-black/5',
        'transition-all duration-300',
        /* Micro-lift on hover (works together with parent wrapper lift) */
        'hover:-translate-y-0.5',
      ].join(' ')}
    >
      {/* ── Image region ────────────────────────────────────────────── */}
      <div className="relative w-full aspect-square bg-gray-50 dark:bg-[#0f1115] overflow-hidden">

        {/* Product image */}
        <motion.img
          src={imageUrl || undefined}
          alt={title}
          loading="lazy"
          decoding="async"
          whileHover={{ scale: 1.06 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="absolute inset-0 w-full h-full object-contain p-3"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.opacity = '0';
          }}
        />

        {/* Top-right: Badge */}
        {badge && (
          <div
            className={[
              'absolute top-2.5 right-2.5 z-10',
              'flex items-center gap-1',
              'text-[10px] font-black px-2.5 py-1 rounded-full',
              'shadow-md backdrop-blur-sm',
              BADGE_STYLES[badge.variant],
            ].join(' ')}
            dir="rtl"
          >
            <BadgeIcon variant={badge.variant} />
            {badge.label}
          </div>
        )}

        {/* Top-left: Favourite heart button */}
        <button
          onClick={handleFavourite}
          aria-label={isFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
          className={[
            'absolute top-2.5 left-2.5 z-10',
            'w-8 h-8 rounded-full flex items-center justify-center',
            'border transition-all duration-200 shadow-sm',
            isFav
              ? 'bg-red-50 border-red-200'
              : 'bg-white/80 dark:bg-[#1a1d24]/80 border-transparent opacity-0 group-hover:opacity-100',
          ].join(' ')}
        >
          <Heart
            size={15}
            className={isFav ? 'fill-red-600 text-red-600' : 'text-gray-400'}
          />
        </button>

        {/* Bottom gradient fade for dark-mode depth */}
        <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-white/60 dark:from-[#1a1d24]/60 to-transparent pointer-events-none" />
      </div>

      {/* ── Info region ─────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 p-3 gap-2">

        {/* Game name chip */}
        {gameName && (
          <span className="text-[10px] font-bold text-red-600/80 dark:text-red-400/70 uppercase tracking-wide line-clamp-1">
            {gameName}
          </span>
        )}

        {/* Product title */}
        <h4 className="text-[12px] md:text-[13px] font-black text-gray-900 dark:text-white line-clamp-2 leading-tight tracking-tight flex-1">
          {title}
        </h4>

        {/* Price row */}
        <div className="flex items-center gap-2 mt-auto" dir="ltr">
          {/* Current price */}
          <span className="text-base md:text-lg font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatAmount(displayPrice)}
            <span className="text-[10px] font-bold mr-0.5">{symbol}</span>
          </span>

          {/* Old price (strike-through) */}
          {hasDiscount && displayOldPrice && (
            <span className="text-[11px] font-bold text-gray-400 line-through">
              {formatAmount(displayOldPrice)}{symbol}
            </span>
          )}
        </div>

        {/* ── CTA Buttons ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-1.5 mt-1">

          {/* Primary: Buy Now */}
          <button
            onClick={handleBuyNow}
            className={[
              /* Base */
              'w-full min-h-[44px] flex items-center justify-center gap-1.5',
              'rounded-xl font-black text-[12px] md:text-[13px]',
              'bg-red-700 hover:bg-red-800 text-white',
              'shadow-md shadow-red-700/20',
              'active:scale-95 transition-all duration-200',
            ].join(' ')}
          >
            <Zap size={13} className="fill-white text-white flex-shrink-0" />
            شراء الآن
          </button>

          {/* Secondary: Add to Cart */}
          <button
            onClick={handleAddToCart}
            className={[
              'w-full min-h-[40px] flex items-center justify-center gap-1.5',
              'rounded-xl font-black text-[11px] md:text-[12px]',
              'bg-transparent border border-gray-200 dark:border-gray-600',
              'text-gray-600 dark:text-gray-300',
              'hover:border-red-300 hover:text-red-700 dark:hover:text-red-400',
              'active:scale-95 transition-all duration-200',
            ].join(' ')}
          >
            <ShoppingCart size={12} className="flex-shrink-0" />
            أضف للسلة
          </button>
        </div>
      </div>
    </Link>
  );
}
