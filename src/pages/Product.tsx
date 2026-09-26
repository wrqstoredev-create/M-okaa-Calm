/**
 * Product.tsx — GamePay
 *
 * Full redesign — changes vs. original:
 * ──────────────────────────────────────
 * 1. Image area: blurred backdrop glow + zoom-on-hover + badges overlay.
 * 2. Stock indicator: big, colour-coded pill (متوفر / ينفد / نفذ).
 * 3. Tab system: "وصف" | "معلومات" | "طريقة الشحن" | "تقييمات" | "منتجات مشابهة"
 *    Tabs slide with AnimatePresence so each panel fades in smoothly.
 * 4. Sticky Bottom Bar (mobile only): "شراء الآن" + "أضف للسلة" always
 *    accessible — appears once the purchase card scrolls out of view.
 * 5. All original cart/robux/validation logic is preserved 1-to-1.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { supabase } from '../lib/supabaseClient';
import {
  ShoppingCart,
  Share2,
  ChevronRight,
  ShieldCheck,
  Zap,
  History,
  Flame,
  Plus,
  Fingerprint,
  User as UserIcon,
  Share2 as ShareIcon,
  Phone,
  Heart,
  Star,
  MessageSquare,
  PackageCheck,
  Truck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ProductSection from '../components/ProductSection';
import { useCart } from '../contexts/CartContext';
import ProductComments from '../components/ProductComments';

/* ─── Tab config ──────────────────────────────────────────────────────────── */
type TabId = 'description' | 'details' | 'shipping' | 'reviews' | 'related';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'description', label: 'وصف المنتج',      icon: <Flame size={14} /> },
  { id: 'details',     label: 'معلومات إضافية',  icon: <PackageCheck size={14} /> },
  { id: 'shipping',    label: 'طريقة الشحن',     icon: <Truck size={14} /> },
  { id: 'reviews',     label: 'التقييمات',        icon: <MessageSquare size={14} /> },
  { id: 'related',     label: 'منتجات مشابهة',   icon: <ShoppingCart size={14} /> },
];

/* ─── Stock pill ──────────────────────────────────────────────────────────── */
function StockBadge({ stock }: { stock: number | null | undefined }) {
  if (stock === undefined || stock === null) {
    return (
      <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 border border-emerald-200 text-[11px] font-black px-3 py-1.5 rounded-full">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        متوفر بلا حدود ♾️
      </span>
    );
  }
  if (stock <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 border border-red-200 text-[11px] font-black px-3 py-1.5 rounded-full">
        <XCircle size={13} />
        نفد من المخزون
      </span>
    );
  }
  if (stock <= 5) {
    return (
      <span className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 border border-amber-200 text-[11px] font-black px-3 py-1.5 rounded-full">
        <AlertTriangle size={13} />
        آخر {stock} قطع فقط ⚡
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 border border-emerald-200 text-[11px] font-black px-3 py-1.5 rounded-full">
      <CheckCircle2 size={13} />
      متوفر ({stock} وحدة)
    </span>
  );
}

/* ─── Input field helper ─────────────────────────────────────────────────── */
function FormInput({
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-[11px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">
        <span className="text-red-600">{icon}</span>
        {label} <span className="text-red-500">*</span>
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={type === 'url' || type === 'tel' || type === 'text' ? 'ltr' : undefined}
        className={[
          'w-full bg-gray-50 dark:bg-[#0f1115]',
          'border-2 rounded-xl py-3.5 px-4',
          'text-sm font-bold outline-none transition-all',
          'placeholder:text-gray-300',
          error
            ? 'border-red-400 focus:border-red-600 bg-red-50/30'
            : 'border-transparent focus:border-red-600',
        ].join(' ')}
      />
      {error && (
        <p className="text-red-600 text-[10px] font-bold flex items-center gap-1">
          <AlertTriangle size={10} /> {error}
        </p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════════════════════════════════ */
export default function Product() {
  const { id }           = useParams<{ id: string }>();
  const navigate         = useNavigate();
  const { addToast }     = useToast();
  const { formatPrice }  = useCurrency();
  const { addItem, openCartDrawer } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  /* ── State ──────────────────────────────────────────────────────────── */
  const [formData, setFormData] = useState({
    playerId: '', username: '', socialLink: '', phoneNumber: '',
  });
  const [errors,           setErrors]           = useState<Record<string, string>>({});
  const [isAdding,         setIsAdding]         = useState(false);
  const [product,          setProduct]          = useState<any>(null);
  const [isCustomRobux,    setIsCustomRobux]    = useState(false);
  const [customRobuxAmount, setCustomRobuxAmount] = useState<number>(1000);
  const [relatedProducts,  setRelatedProducts]  = useState<any[]>([]);
  const [boughtTogether,   setBoughtTogether]   = useState<any[]>([]);
  const [isLoading,        setIsLoading]        = useState(true);
  const [activeTab,        setActiveTab]        = useState<TabId>('description');
  const [roboCoinsEnabled, setRoboCoinsEnabled] = useState(false);
  const [roboCoinsBalance, setRoboCoinsBalance] = useState(5000);

  /* Sticky bar visibility: shown when purchase card is off-screen */
  const purchaseCardRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 },
    );
    if (purchaseCardRef.current) obs.observe(purchaseCardRef.current);
    return () => obs.disconnect();
  }, [product]);

  /* ── Data fetching ──────────────────────────────────────────────────── */
  useEffect(() => {
    async function fetchProductData() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
        if (error) throw error;
        setProduct(data);
        if (data) setCustomRobuxAmount(data.robux_quantity > 0 ? data.robux_quantity : 1000);

        const { data: settingsData } = await supabase.from('settings').select('*').single();
        if (settingsData) {
          setRoboCoinsEnabled(settingsData.robo_coins_enabled ?? false);
          setRoboCoinsBalance(settingsData.robo_coins_balance ?? 5000);
        }

        const { data: allProductsData } = await supabase
          .from('products').select('*').order('created_at', { ascending: false });
        const allProducts = allProductsData || [];

        setRelatedProducts(
          allProducts
            .filter(p => p.game_name?.trim().toLowerCase() === data.game_name?.trim().toLowerCase() && p.id !== data.id)
            .slice(0, 6),
        );
        setBoughtTogether(allProducts.filter(p => p.id !== data.id).slice(0, 2));
      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        setIsLoading(false);
      }
    }
    if (id) fetchProductData();
    window.scrollTo(0, 0);
  }, [id]);

  /* ── Cart validation ────────────────────────────────────────────────── */
  const handleAddToCart = (thenNavigate = false) => {
    const newErrors: Record<string, string> = {};
    if (product.require_player_id && !formData.playerId.trim())
      newErrors.playerId = 'يرجى إدخال معرف اللاعب (Player ID)';
    if (product.require_username && !formData.username.trim())
      newErrors.username = 'يرجى إدخال اسم المستخدم';
    if (product.require_social_link && !formData.socialLink.trim())
      newErrors.socialLink = 'يرجى إدخال رابط الحساب';
    if (product.require_phone_number && !formData.phoneNumber.trim())
      newErrors.phoneNumber = 'يرجى إدخال رقم الهاتف';

    const hasNoCustomReqs = !product.require_player_id && !product.require_username &&
                            !product.require_social_link && !product.require_phone_number;
    if (hasNoCustomReqs && !formData.playerId.trim())
      newErrors.playerId = 'يرجى إدخال معرف اللاعب (ID) لإتمام عملية الشحن';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      addToast('يرجى تعبئة كافة الحقول المطلوبة ❌', 'error');
      purchaseCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setErrors({});
    setIsAdding(true);

    const baseRobuxQty  = product?.robux_quantity || 1000;
    const unitPrice     = product ? Number(product.price) / baseRobuxQty : 0;
    const activeRobuxQty = isCustomRobux ? customRobuxAmount : (product?.robux_quantity || 0);
    const activePrice   = isCustomRobux
      ? Math.max(1, Math.round(unitPrice * customRobuxAmount))
      : Number(product?.price || 0);

    if (isRobloxProd && roboCoinsEnabled && activeRobuxQty > roboCoinsBalance) {
      addToast('الكمية المطلوبة تتجاوز مخزون السيرفر المتبقي ❌', 'error');
      setIsAdding(false);
      return;
    }

    const customerData = {
      player_id: formData.playerId, player_username: formData.username,
      player_social: formData.socialLink, player_phone: formData.phoneNumber,
    };
    const overriddenProduct = {
      ...product, price: activePrice,
      ...(product?.robux_quantity !== undefined ? { robux_quantity: activeRobuxQty } : {}),
    };

    setTimeout(() => {
      addItem(overriddenProduct, 1, customerData);
      addToast('تمت إضافة المنتج للسلة بنجاح ✅', 'success');
      setIsAdding(false);
      if (thenNavigate) navigate('/checkout');
      else openCartDrawer();
    }, 400);
  };

  const handleAddToCartAll = () => {
    const baseRobuxQty = product?.robux_quantity || 1000;
    const unitPrice    = product ? Number(product.price) / baseRobuxQty : 0;
    const activeRobuxQty = isCustomRobux ? customRobuxAmount : (product?.robux_quantity || 0);
    const activePrice  = isCustomRobux
      ? Math.max(1, Math.round(unitPrice * customRobuxAmount))
      : Number(product?.price || 0);

    [product, ...boughtTogether].filter(p => p?.id).forEach((item) => {
      const price = item.id === product?.id ? activePrice : Number(item.price);
      addItem({ ...item, price }, 1);
    });
    addToast(`تمت إضافة ${1 + boughtTogether.length} منتج إلى السلة!`, 'success');
    openCartDrawer();
  };

  /* ── Loading skeleton ───────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="flex-1 max-w-7xl mx-auto px-4 md:px-6 py-8 animate-pulse">
        <div className="h-3 bg-gray-100 dark:bg-[#1a1d24] w-1/3 mb-6 rounded-full" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 bg-gray-50 dark:bg-[#0f1115] h-[420px] rounded-3xl" />
          <div className="lg:col-span-5 bg-gray-50 dark:bg-[#0f1115] h-[420px] rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex-1 py-20 text-center font-bold text-gray-500">
        المنتج غير موجود
      </div>
    );
  }

  /* ── Derived values ─────────────────────────────────────────────────── */
  const isRobloxProd = !!(
    product.game_name?.toLowerCase().includes('roblox') ||
    product.game_name?.toLowerCase().includes('robux') ||
    product.game_name?.includes('روبلوكس') ||
    product.game_name?.includes('روبوكس') ||
    product.title?.toLowerCase().includes('roblox') ||
    product.title?.toLowerCase().includes('robux')
  );

  const baseRobuxQty   = product?.robux_quantity || 1000;
  const unitPrice      = product ? Number(product.price) / baseRobuxQty : 0;
  const activeRobuxQty = isCustomRobux ? customRobuxAmount : (product?.robux_quantity || 0);
  const activePrice    = isCustomRobux
    ? Math.max(1, Math.round(unitPrice * customRobuxAmount))
    : Number(product?.price || 0);
  const totalTogether  = activePrice + boughtTogether.reduce((a, c) => a + Number(c.price), 0);
  const isFav          = isFavorite(product.id);
  const isOutOfStock   = product.stock !== undefined && product.stock !== null && product.stock <= 0;

  /* ────────────────────────────────────────────────────────────────────── */
  return (
    <div className="flex-1 w-full" dir="rtl">

      {/* ── Breadcrumb ───────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1a1d24]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-700/50 py-3 px-4 md:px-6 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-[11px] text-gray-400 font-bold overflow-x-auto no-scrollbar">
          <Link to="/" className="hover:text-red-700 transition-colors whitespace-nowrap">الرئيسية</Link>
          <ChevronRight size={12} />
          <Link to="/store" className="hover:text-red-700 transition-colors whitespace-nowrap">المتجر</Link>
          <ChevronRight size={12} />
          {product.game_name && (
            <>
              <Link to={`/category/${product.game_name.split(' ')[0].toLowerCase()}`} className="hover:text-red-700 transition-colors whitespace-nowrap">
                {product.game_name}
              </Link>
              <ChevronRight size={12} />
            </>
          )}
          <span className="text-red-700 truncate max-w-[180px]">{product.title}</span>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">

        {/* Page title (mobile) */}
        <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-6 lg:hidden">
          {product.title}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 mb-12">

          {/* ── LEFT: Image + Bought Together ──────────────────────── */}
          <div className="lg:col-span-7 space-y-6 order-2 lg:order-1">

            {/* Image area */}
            <div className="relative bg-zinc-950 rounded-3xl overflow-hidden min-h-[320px] md:min-h-[480px] flex items-center justify-center">
              {/* Blurred background glow */}
              {product.image_url && (
                <div
                  className="absolute inset-0 opacity-50 blur-3xl scale-125 bg-center bg-cover"
                  style={{ backgroundImage: `url(${product.image_url})` }}
                />
              )}

              {/* Main image */}
              <motion.img
                src={product.image_url || undefined}
                alt={product.title}
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="relative z-10 w-full max-w-[260px] md:max-w-[400px] object-contain drop-shadow-2xl"
              />

              {/* Discount badge */}
              {product.discount_badge && (
                <div className="absolute top-5 right-5 z-20 bg-red-600 text-white text-[11px] font-black py-1.5 px-3 rounded-full shadow-lg">
                  {product.discount_badge}
                </div>
              )}

              {/* New badge */}
              {product.is_new && !product.discount_badge && (
                <div className="absolute top-5 right-5 z-20 bg-emerald-600 text-white text-[11px] font-black py-1.5 px-3 rounded-full shadow-lg">
                  جديد ✨
                </div>
              )}

              {/* Featured badge */}
              {product.is_featured && (
                <div className="absolute top-5 left-5 z-20 bg-amber-500 text-white text-[11px] font-black py-1.5 px-3 rounded-full shadow-lg flex items-center gap-1">
                  <Star size={10} className="fill-white" /> مميز
                </div>
              )}

              {/* Share button */}
              <button
                onClick={() => navigator.share?.({ title: product.title, url: window.location.href })}
                className="absolute bottom-5 left-5 z-20 w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all"
              >
                <Share2 size={18} />
              </button>
            </div>

            {/* Frequently bought together */}
            {boughtTogether.length > 0 && (
              <div className="bg-white dark:bg-[#1a1d24] border border-gray-100 dark:border-gray-700 rounded-3xl p-5">
                <h3 className="text-sm font-black text-gray-900 dark:text-white mb-4 border-r-4 border-red-600 pr-3">
                  غالباً ما يتم شراؤها معاً
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Main product chip */}
                  <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 rounded-2xl p-2 flex-shrink-0">
                    <img src={product.image_url || undefined} alt="" className="w-10 h-10 object-contain" />
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-900 dark:text-white truncate max-w-[90px]">{product.title}</p>
                      <p className="text-[10px] font-black text-red-700">{formatPrice(activePrice)}</p>
                    </div>
                  </div>

                  {boughtTogether.map((item) => (
                    <React.Fragment key={item.id}>
                      <Plus size={16} className="text-gray-300 flex-shrink-0" />
                      <Link to={`/product/${item.id}`} className="flex items-center gap-2 bg-gray-50 dark:bg-[#0f1115] border border-gray-100 dark:border-gray-700 rounded-2xl p-2 flex-shrink-0 hover:border-red-200 transition-colors">
                        <img src={item.image_url || undefined} alt="" className="w-10 h-10 object-contain" />
                        <div className="text-right">
                          <p className="text-[10px] font-black text-gray-900 dark:text-white truncate max-w-[90px]">{item.title}</p>
                          <p className="text-[10px] font-black text-red-700">{formatPrice(Number(item.price))}</p>
                        </div>
                      </Link>
                    </React.Fragment>
                  ))}

                  <button
                    onClick={handleAddToCartAll}
                    className="mr-auto bg-red-700 hover:bg-red-800 text-white font-black text-[11px] px-4 py-2.5 rounded-xl transition-all active:scale-95 flex items-center gap-1.5 flex-shrink-0"
                  >
                    <ShoppingCart size={13} />
                    أضف الكل ({formatPrice(totalTogether)})
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Purchase card ─────────────────────────────────── */}
          <div className="lg:col-span-5 order-1 lg:order-2" ref={purchaseCardRef}>
            <div className="bg-white dark:bg-[#1a1d24] border border-gray-100 dark:border-gray-700 rounded-3xl p-5 md:p-7 shadow-sm sticky top-20 space-y-5">

              {/* Title */}
              <div>
                <h1 className="hidden lg:block text-xl font-black text-gray-900 dark:text-white leading-tight mb-2">
                  {product.title}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
                  {product.description || `اشحن باقة ${product.title} الآن واستمتع بمكافآت حصرية.`}
                </p>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-red-700 tracking-tight">
                  {formatPrice(activePrice)}
                </span>
                {!isCustomRobux && product.old_price && (
                  <span className="text-base text-gray-300 line-through font-bold">
                    {formatPrice(Number(product.old_price))}
                  </span>
                )}
              </div>

              {/* Stock + delivery badges */}
              <div className="flex flex-wrap gap-2">
                <StockBadge stock={product.stock} />
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 border border-emerald-200 text-[11px] font-black px-3 py-1.5 rounded-full">
                  <Zap size={12} className="fill-emerald-600" />
                  تسليم فوري
                </span>
              </div>

              {/* Robux balance indicator */}
              {isRobloxProd && roboCoinsEnabled && (
                <div className="bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-200 rounded-2xl p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                      🪙 رصيد Robux المتوفر للشحن
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse block" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black font-mono text-amber-700">
                      {roboCoinsBalance.toLocaleString('en-US')}
                    </span>
                    <span className="text-xs font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200">Robux</span>
                  </div>
                </div>
              )}

              {/* Robux quantity selector */}
              {isRobloxProd && roboCoinsEnabled && (
                <div className="bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-2xl p-4 space-y-3">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">⚡ تحديد كمية Robux</span>
                  <div className="grid grid-cols-2 gap-2 bg-gray-200 dark:bg-zinc-800 p-1 rounded-xl">
                    <button
                      onClick={() => setIsCustomRobux(false)}
                      className={`py-2 text-[11px] font-black rounded-lg transition-all ${!isCustomRobux ? 'bg-white dark:bg-[#1a1d24] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}
                    >
                      باقة ثابتة ({product.robux_quantity?.toLocaleString('en-US')})
                    </button>
                    <button
                      onClick={() => setIsCustomRobux(true)}
                      className={`py-2 text-[11px] font-black rounded-lg transition-all ${isCustomRobux ? 'bg-white dark:bg-[#1a1d24] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}
                    >
                      كمية مخصصة 🪙
                    </button>
                  </div>

                  {isCustomRobux ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-500">الكمية:</span>
                        <div className="flex items-center bg-white dark:bg-[#1a1d24] border border-gray-200 rounded-xl overflow-hidden">
                          <button onClick={() => setCustomRobuxAmount(v => Math.max(10, v - 100))} className="px-3 py-2 text-gray-500 hover:bg-gray-50 font-bold">−</button>
                          <input
                            type="number"
                            value={customRobuxAmount}
                            onChange={(e) => setCustomRobuxAmount(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-20 text-center font-mono font-black text-sm focus:outline-none bg-transparent"
                          />
                          <button onClick={() => setCustomRobuxAmount(v => v + 100)} className="px-3 py-2 text-gray-500 hover:bg-gray-50 font-bold">+</button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {[400, 800, 1000, 2000, 4500, 10000].map(amt => (
                          <button
                            key={amt}
                            onClick={() => setCustomRobuxAmount(amt)}
                            className={`px-2.5 py-1 text-[10px] font-black rounded-lg border transition-all ${customRobuxAmount === amt ? 'bg-amber-500 border-amber-500 text-zinc-950' : 'bg-white dark:bg-[#1a1d24] border-gray-200 text-gray-600'}`}
                          >
                            {amt.toLocaleString('en-US')}
                          </button>
                        ))}
                      </div>
                      {activeRobuxQty > roboCoinsBalance ? (
                        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 text-[10px] font-bold">
                          ⚠️ الكمية تتجاوز مخزون السيرفر ({roboCoinsBalance.toLocaleString('en-US')} Robux)
                        </div>
                      ) : roboCoinsBalance - activeRobuxQty <= 1000 ? (
                        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-[10px] font-bold">
                          ⚠️ مخزون السيرفر أوشك على النفاد
                        </div>
                      ) : (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-[10px] font-bold">
                          ✅ متوفر — سيتبقى {(roboCoinsBalance - activeRobuxQty).toLocaleString('en-US')} Robux
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      الباقة المعيارية الثابتة: <span className="font-mono font-black">{product.robux_quantity?.toLocaleString('en-US')} Robux</span>
                    </p>
                  )}
                </div>
              )}

              {/* Robux package info */}
              {product.robux_quantity > 0 && !isCustomRobux && (
                <div className="flex items-center justify-between bg-zinc-900 text-white rounded-xl p-3">
                  <span className="text-[10px] font-black tracking-wider text-amber-400">🎮 حجم باقة Robux</span>
                  <span className="text-[11px] font-black bg-amber-500 text-zinc-950 px-2.5 py-1 rounded-lg">
                    {product.robux_quantity.toLocaleString('en-US')} Robux
                  </span>
                </div>
              )}

              {/* Bonus */}
              {product.robo_coins_bonus > 0 && (
                <div className="flex items-center justify-between bg-red-50/60 border border-red-100 rounded-xl p-3">
                  <span className="text-[10px] font-black text-red-800">🎁 بونص عند الشراء</span>
                  <span className="text-[10px] font-black bg-red-100 text-red-700 px-2.5 py-1 rounded-lg border border-red-200">
                    +{product.robo_coins_bonus} Robux
                  </span>
                </div>
              )}

              {/* Customer inputs */}
              <div className="space-y-4">
                {product.require_player_id && (
                  <FormInput
                    label="معرف اللاعب (Player ID)"
                    icon={<Fingerprint size={14} />}
                    value={formData.playerId}
                    onChange={(v) => setFormData({ ...formData, playerId: v })}
                    placeholder="51244XXXX"
                    error={errors.playerId}
                  />
                )}
                {product.require_username && (
                  <FormInput
                    label="اسم المستخدم"
                    icon={<UserIcon size={14} />}
                    value={formData.username}
                    onChange={(v) => setFormData({ ...formData, username: v })}
                    placeholder="Username"
                    error={errors.username}
                  />
                )}
                {product.require_social_link && (
                  <FormInput
                    label="رابط الحساب"
                    icon={<ShareIcon size={14} />}
                    value={formData.socialLink}
                    onChange={(v) => setFormData({ ...formData, socialLink: v })}
                    placeholder="https://facebook.com/..."
                    type="url"
                    error={errors.socialLink}
                  />
                )}
                {product.require_phone_number && (
                  <FormInput
                    label="رقم الهاتف"
                    icon={<Phone size={14} />}
                    value={formData.phoneNumber}
                    onChange={(v) => setFormData({ ...formData, phoneNumber: v })}
                    placeholder="091XXXXXXX"
                    type="tel"
                    error={errors.phoneNumber}
                  />
                )}
                {/* Fallback Player ID */}
                {!product.require_player_id && !product.require_username &&
                  !product.require_social_link && !product.require_phone_number && (
                  <FormInput
                    label="معرف اللاعب (ID)"
                    icon={<Fingerprint size={14} />}
                    value={formData.playerId}
                    onChange={(v) => setFormData({ ...formData, playerId: v })}
                    placeholder="أدخل الـ ID هنا"
                    error={errors.playerId}
                  />
                )}
              </div>

              {/* CTA Buttons */}
              {isOutOfStock ? (
                <button disabled className="w-full bg-gray-100 text-gray-400 font-black py-4 rounded-2xl text-sm cursor-not-allowed">
                  نفدت الكمية الحالية ❌
                </button>
              ) : (
                <div className="flex gap-3">
                  {/* Buy now */}
                  <button
                    onClick={() => handleAddToCart(true)}
                    disabled={isAdding}
                    className="flex-1 bg-red-700 hover:bg-red-800 text-white font-black py-4 rounded-2xl text-sm shadow-lg shadow-red-700/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isAdding ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} className="fill-white" />}
                    شراء الآن
                  </button>
                  {/* Add to cart */}
                  <button
                    onClick={() => handleAddToCart(false)}
                    disabled={isAdding}
                    className="flex-1 bg-gray-100 dark:bg-[#0f1115] hover:bg-gray-200 dark:hover:bg-[#0a0c10] border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white font-black py-4 rounded-2xl text-sm active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={16} />
                    أضف للسلة
                  </button>
                  {/* Favourite */}
                  <button
                    onClick={() => {
                      toggleFavorite(product);
                      addToast(isFav ? 'تمت الإزالة من المفضلة' : 'تمت الإضافة للمفضلة ❤️', isFav ? 'info' : 'success');
                    }}
                    className={`w-14 h-14 flex items-center justify-center rounded-2xl border-2 transition-all flex-shrink-0 ${isFav ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white dark:bg-[#0f1115] border-gray-200 dark:border-gray-700 text-gray-400 hover:border-red-200 hover:text-red-600'}`}
                  >
                    <Heart size={20} className={isFav ? 'fill-current' : ''} />
                  </button>
                </div>
              )}

              {/* Trust indicators */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-3">
                {[
                  { icon: <ShieldCheck size={14} className="text-emerald-600" />, text: 'منتج أصلي ومضمون' },
                  { icon: <History size={14} className="text-blue-600" />, text: '2,451+ عملية ناجحة' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] font-bold text-gray-500 dark:text-gray-400">
                    {item.icon}
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Info Tabs ──────────────────────────────────────────────── */}
        <div className="mb-16">
          {/* Tab buttons */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-gray-100 dark:border-gray-700 mb-6">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'relative flex items-center gap-1.5 px-4 py-3 text-[12px] font-black',
                  'whitespace-nowrap transition-all focus:outline-none',
                  activeTab === tab.id
                    ? 'text-red-700'
                    : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
                ].join(' ')}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute bottom-0 inset-x-0 h-0.5 bg-red-700 rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab panels */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="bg-white dark:bg-[#1a1d24] rounded-3xl border border-gray-100 dark:border-gray-700 p-6 md:p-10 min-h-[280px]"
            >
              {/* Description */}
              {activeTab === 'description' && (
                <div className="space-y-5 text-right" dir="rtl">
                  <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border-r-4 border-red-600">
                    <p className="text-xs font-bold text-red-800 dark:text-red-300">
                      تنويه: يرجى التأكد من أن حسابك متاح لاستلام الشحن في منطقتك. المتجر غير مسؤول عن القيود المفروضة من اللعبة.
                    </p>
                  </div>
                  <h4 className="text-base font-black">لماذا تختار متجرنا لشحن {product.game_name}؟</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    نقدم أفضل أسعار شحن {product.game_name} في السوق العربي مع ضمان كامل على كل عملية شحن. الشحن يتم بشكل رسمي وقانوني مما يضمن سلامة حسابك.
                  </p>
                  <ul className="space-y-2">
                    {['تسليم فوري بعد الدفع مباشرة.', 'دعم فني متواصل 24/7.', 'طرق دفع آمنة ومتنوعة.', 'نقاط ولاء يمكنك استبدالها بخصومات.'].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Details */}
              {activeTab === 'details' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1 text-right" dir="rtl">
                  {[
                    { label: 'اسم اللعبة',   value: product.game_name },
                    { label: 'نوع المنتج',   value: 'منتج رقمي (شحن مباشر/كود)' },
                    { label: 'المنطقة',      value: 'عالمي / Global' },
                    { label: 'الحالة',       value: (product.stock || 99) > 0 ? 'متوفر ✅' : 'غير متوفر ❌' },
                    { label: 'الفئة',        value: product.category_name || 'بطاقات الشحن' },
                    { label: 'تاريخ الإدراج', value: new Date(product.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' }) },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-3.5 border-b border-gray-50 dark:border-gray-700/50">
                      <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">{item.label}</span>
                      <span className="text-[11px] font-black text-gray-900 dark:text-white">{item.value || 'N/A'}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Shipping */}
              {activeTab === 'shipping' && (
                <div className="space-y-4 text-right" dir="rtl">
                  {[
                    { n: '١', t: 'إدخال معرف اللاعب (ID)', d: 'قم بكتابة الـ ID الخاص بحسابك في اللعبة في الحقل المخصص بدقة.' },
                    { n: '٢', t: 'إتمام الطلب والدفع',    d: 'أضف المنتج للسلة وأتمم عملية الدفع عبر إحدى الوسائل المتاحة.' },
                    { n: '٣', t: 'استلام الشحن الفوري',   d: 'سيصلك الشحن إلى حسابك في غضون ثوانٍ أو دقائق معدودة.' },
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-red-700 text-white rounded-2xl flex items-center justify-center font-black text-base flex-shrink-0">
                        {step.n}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-gray-900 dark:text-white mb-1">{step.t}</h4>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 leading-relaxed">{step.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reviews */}
              {activeTab === 'reviews' && (
                <div>
                  <ProductComments productId={product.id} />
                </div>
              )}

              {/* Related products */}
              {activeTab === 'related' && (
                <div>
                  {relatedProducts.length > 0 ? (
                    <ProductSection
                      title={`منتجات مشابهة — ${product.game_name}`}
                      products={relatedProducts}
                      isLoading={false}
                      type="carousel"
                    />
                  ) : (
                    <div className="py-12 text-center text-gray-400 font-bold text-sm">
                      لا توجد منتجات مشابهة حالياً
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Sticky Bottom Bar (mobile only) ──────────────────────────── */}
      <AnimatePresence>
        {showStickyBar && !isOutOfStock && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className={[
              'fixed bottom-0 inset-x-0 z-50',
              'lg:hidden',
              'bg-white dark:bg-[#1a1d24]',
              'border-t border-gray-100 dark:border-gray-700',
              'shadow-[0_-8px_30px_rgba(0,0,0,0.1)]',
              'px-4 pb-safe pt-3',
            ].join(' ')}
            dir="rtl"
          >
            {/* Mini product info */}
            <div className="flex items-center gap-3 mb-3">
              {product.image_url && (
                <img src={product.image_url} alt="" className="w-10 h-10 object-contain bg-gray-50 rounded-xl p-1 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-gray-900 dark:text-white truncate">{product.title}</p>
                <p className="text-base font-black text-red-700 leading-none mt-0.5">{formatPrice(activePrice)}</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pb-1">
              <button
                onClick={() => handleAddToCart(true)}
                disabled={isAdding}
                className="flex-1 min-h-[48px] bg-red-700 hover:bg-red-800 text-white font-black text-sm rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-700/20"
              >
                {isAdding ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} className="fill-white" />}
                شراء الآن
              </button>
              <button
                onClick={() => handleAddToCart(false)}
                disabled={isAdding}
                className="flex-1 min-h-[48px] bg-gray-100 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white font-black text-sm rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ShoppingCart size={16} />
                أضف للسلة
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
