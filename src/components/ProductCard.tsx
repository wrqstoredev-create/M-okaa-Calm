/**
 * ProductCard — GamePay
 * Phase 4: Cyberpunk Visual Revamp
 *
 * Features:
 * ─────────────────────────────────────────────────────────────────────────────
 * • 3D Tilt with smooth spring physics via Framer Motion (perspective 1000px).
 * • Dynamic Cyber Glare Sheen that moves with cursor coordinates.
 * • Neon Glow Borders in dark mode (red + violet ambient bloom on hover).
 * • Ripple Micro-interactions on CTA buttons (click wave originating from pointer).
 * • Glowing Neon-Green price typography with subtle luminescence.
 * • Shimmer sweep beam on discounted/premium items.
 * • All existing business logic, routing, currency, cart & favorite handling preserved 100%.
 */

import { ShoppingCart, Zap, Heart, Sparkles, Star } from 'lucide-react';
import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useCurrency } from '../contexts/CurrencyContext';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { Product } from '../types/products';
import RippleButton from './ui/RippleButton';

/* ─── Types ──────────────────────────────────────────────────────────────── */

type ProductCardProps = {
  product: Product & {
    image?: string;
    name?: string;
    game?: string;
    discountBadge?: string;
  };
  key?: any;
};

/* ─── Badge config ────────────────────────────────────────────────────────── */

type BadgeVariant = 'discount' | 'featured' | 'new' | 'low-stock' | 'custom';

interface BadgeConfig {
  label: string;
  variant: BadgeVariant;
}

function resolveBadge(product: ProductCardProps['product']): BadgeConfig | null {
  const price    = Number(product.price    || 0);
  const oldPrice = product.old_price ? Number(product.old_price) : null;

  if (oldPrice && oldPrice > price) {
    const pct = Math.round(((oldPrice - price) / oldPrice) * 100);
    return { label: `${pct}% خصم`, variant: 'discount' };
  }

  const customBadge = product.discount_badge || product.discountBadge;
  if (customBadge) return { label: customBadge, variant: 'custom' };

  if (product.stock !== undefined && product.stock > 0 && product.stock <= 5) {
    return { label: `آخر ${product.stock} قطع`, variant: 'low-stock' };
  }

  if (product.is_featured) return { label: 'مميز', variant: 'featured' };
  if (product.is_new) return { label: 'جديد', variant: 'new' };

  return null;
}

const BADGE_STYLES: Record<BadgeVariant, string> = {
  discount:   'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_2px_10px_rgba(255,32,64,0.5)]',
  featured:   'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-[0_2px_10px_rgba(245,158,11,0.5)]',
  new:        'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-[0_2px_10px_rgba(16,185,129,0.5)]',
  'low-stock': 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-[0_2px_10px_rgba(234,88,12,0.5)]',
  custom:     'bg-gradient-to-r from-red-700 to-rose-700 text-white shadow-[0_2px_10px_rgba(255,32,64,0.4)]',
};

function BadgeIcon({ variant }: { variant: BadgeVariant }) {
  if (variant === 'featured') return <Star size={9} className="fill-white" />;
  if (variant === 'new')      return <Sparkles size={9} />;
  return null;
}

function getCurrencySymbol(cur: string) {
  switch (cur) {
    case 'EGY': return 'ج.م';
    case 'SAR': return 'ر.س';
    case 'USD': return '$';
    default:    return cur;
  }
}

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

  /* ── 3D Tilt & Glare Math ────────────────────────────────────────────── */
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth spring physics for natural tilt feel
  const mouseXSpring = useSpring(x, { stiffness: 280, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 280, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7deg', '-7deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-7deg', '7deg']);

  // Coordinates for the interactive glare sheen
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);

    setGlare({
      x: (mouseX / width) * 100,
      y: (mouseY / height) * 100,
      opacity: 1,
    });
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  };

  /* ── Handlers ────────────────────────────────────────────────────────── */
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

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="h-full [perspective:1000px]"
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="h-full transition-transform duration-100 ease-out"
      >
        <Link
          to={`/product/${product.id}`}
          className={[
            /* Base layout & surface */
            'group relative flex flex-col h-full rounded-2xl overflow-hidden',
            'bg-white dark:bg-[#0c0c10]',
            'border border-gray-150 dark:border-white/10',
            /* Cyberpunk Hover Glows */
            'hover:shadow-2xl hover:border-red-400/40',
            'dark:hover:border-red-500/50',
            'dark:hover:shadow-[0_0_30px_rgba(255,32,64,0.3),0_0_50px_rgba(155,93,229,0.12)]',
            'transition-colors duration-300',
            hasDiscount ? 'shimmer-card' : '',
          ].join(' ')}
        >
          {/* ── Dynamic Cyber Glare Sheen ────────────────────────────── */}
          <div
            className="absolute inset-0 pointer-events-none rounded-2xl transition-opacity duration-300 z-30"
            style={{
              opacity: glare.opacity,
              background: `radial-gradient(circle 240px at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.15), rgba(255,32,64,0.08) 35%, transparent 70%)`,
            }}
          />

          {/* ── Neon Accent Light in corner for premium items ─────────── */}
          {hasDiscount && (
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-red-500/15 via-purple-500/5 to-transparent pointer-events-none z-10" />
          )}

          {/* ── Image region ─────────────────────────────────────────── */}
          <div className="relative w-full aspect-square bg-gray-50/80 dark:bg-[#0f1115] overflow-hidden flex items-center justify-center p-3">
            {/* Product image */}
            <motion.img
              src={imageUrl || undefined}
              alt={title}
              loading="lazy"
              decoding="async"
              whileHover={{ scale: 1.08 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="w-full h-full object-contain filter drop-shadow-md z-10"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.opacity = '0';
              }}
            />

            {/* Top-right: Badge */}
            {badge && (
              <div
                className={[
                  'absolute top-2.5 right-2.5 z-20',
                  'flex items-center gap-1',
                  'text-[10px] font-black px-2.5 py-1 rounded-full',
                  'backdrop-blur-md',
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
                'absolute top-2.5 left-2.5 z-20',
                'w-8 h-8 rounded-full flex items-center justify-center',
                'border transition-all duration-200 shadow-sm cursor-pointer active:scale-90',
                isFav
                  ? 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-500/50 shadow-[0_0_12px_rgba(255,32,64,0.4)]'
                  : 'bg-white/80 dark:bg-white/10 backdrop-blur-md border-transparent hover:border-red-500/30 opacity-80 group-hover:opacity-100',
              ].join(' ')}
            >
              <Heart
                size={15}
                className={
                  isFav
                    ? 'fill-red-600 text-red-600 dark:fill-red-500 dark:text-red-500'
                    : 'text-gray-500 dark:text-gray-300'
                }
              />
            </button>

            {/* Bottom gradient fade for dark-mode depth */}
            <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-white/80 dark:from-[#0c0c10] to-transparent pointer-events-none z-10" />
          </div>

          {/* ── Info region ──────────────────────────────────────────── */}
          <div className="flex flex-col flex-1 p-3.5 gap-2 relative z-10">
            {/* Game name chip */}
            {gameName && (
              <span className="text-[10px] font-bold text-red-600 dark:text-red-400 tracking-wider uppercase line-clamp-1">
                {gameName}
              </span>
            )}

            {/* Product title */}
            <h4 className="text-[12px] md:text-[13px] font-black text-gray-900 dark:text-white line-clamp-2 leading-tight tracking-tight flex-1 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-200">
              {title}
            </h4>

            {/* Price row */}
            <div className="flex items-center gap-2 mt-auto" dir="ltr">
              {/* Current glowing price */}
              <span
                className="text-base md:text-lg font-black tracking-tight"
                style={{
                  color: 'var(--neon-green)',
                  textShadow: '0 0 12px rgba(0, 255, 136, 0.45)',
                }}
              >
                {formatAmount(displayPrice)}
                <span className="text-[10px] font-bold mr-0.5 text-emerald-500">{symbol}</span>
              </span>

              {/* Old price (strike-through) */}
              {hasDiscount && displayOldPrice && (
                <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 line-through">
                  {formatAmount(displayOldPrice)}{symbol}
                </span>
              )}
            </div>

            {/* ── CTA Buttons with Ripple & Neon Polish ─────────────── */}
            <div className="flex flex-col gap-1.5 mt-1.5">
              {/* Primary: Buy Now */}
              <RippleButton
                onClick={handleBuyNow}
                rippleColor="rgba(255, 255, 255, 0.45)"
                className={[
                  'w-full min-h-[44px] rounded-xl font-black text-[12px] md:text-[13px] text-white cursor-pointer',
                  'bg-gradient-to-r from-red-600 via-rose-600 to-red-600',
                  'hover:from-red-500 hover:to-rose-500',
                  'shadow-[0_4px_16px_rgba(255,32,64,0.35)]',
                  'hover:shadow-[0_0_24px_rgba(255,32,64,0.65)]',
                  'transition-all duration-300',
                ].join(' ')}
              >
                <Zap size={13} className="fill-white text-white flex-shrink-0" />
                شراء الآن
              </RippleButton>

              {/* Secondary: Add to Cart */}
              <RippleButton
                onClick={handleAddToCart}
                rippleColor="rgba(255, 32, 64, 0.25)"
                className={[
                  'w-full min-h-[40px] rounded-xl font-black text-[11px] md:text-[12px] cursor-pointer',
                  'bg-gray-50/80 dark:bg-white/5 backdrop-blur-sm',
                  'border border-gray-200 dark:border-white/10',
                  'text-gray-700 dark:text-gray-200',
                  'hover:text-red-600 dark:hover:text-red-400',
                  'hover:border-red-400 dark:hover:border-red-500/50',
                  'hover:shadow-[0_0_15px_rgba(255,32,64,0.2)]',
                  'transition-all duration-200',
                ].join(' ')}
              >
                <ShoppingCart size={12} className="flex-shrink-0" />
                أضف للسلة
              </RippleButton>
            </div>
          </div>
        </Link>
      </motion.div>
    </div>
  );
}
