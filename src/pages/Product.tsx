import React, { useState, useEffect } from 'react';
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
  Heart
} from 'lucide-react';
import ProductSection from '../components/ProductSection';
import { useCart } from '../contexts/CartContext';
import ProductComments from '../components/ProductComments';

export default function Product() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { formatPrice } = useCurrency();
  const { addItem } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  
  const [formData, setFormData] = useState({
    playerId: '',
    username: '',
    socialLink: '',
    phoneNumber: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [isCustomRobux, setIsCustomRobux] = useState(false);
  const [customRobuxAmount, setCustomRobuxAmount] = useState<number>(1000);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [boughtTogether, setBoughtTogether] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'description' | 'details' | 'shipping'>('description');
  const [roboCoinsEnabled, setRoboCoinsEnabled] = useState(false);
  const [roboCoinsBalance, setRoboCoinsBalance] = useState(5000);

  useEffect(() => {
    async function fetchProductData() {
      try {
        setIsLoading(true);
        // Fetch current product
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        setProduct(data);
        if (data) {
          setCustomRobuxAmount(data.robux_quantity && data.robux_quantity > 0 ? data.robux_quantity : 1000);
        }

        // Fetch Settings for Robo-coins/Robux
        const { data: settingsData } = await supabase
          .from('settings')
          .select('*')
          .single();
        if (settingsData) {
          setRoboCoinsEnabled(settingsData.robo_coins_enabled ?? false);
          setRoboCoinsBalance(settingsData.robo_coins_balance ?? 5000);
        }

        // Fetch ALL products to filter related
        const { data: allProductsData } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });
        
        const allProducts = allProductsData || [];

        // Apply exactly the literal JS filtering logic requested
        const related = allProducts.filter(p => 
          p.game_name?.trim().toLowerCase() === data.game_name?.trim().toLowerCase() &&
          p.id !== data.id
        ).slice(0, 5); // Limit to 5 for UI

        setRelatedProducts(related);

        // Fetch 2 random products for "Bought Together"
        const together = allProducts.filter(p => p.id !== data.id).slice(0, 2);
        setBoughtTogether(together);

      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (id) fetchProductData();
    window.scrollTo(0, 0);
  }, [id]);

  const handleAddToCart = () => {
    const newErrors: Record<string, string> = {};
    
    // Explicit dynamic requirements from DB
    if (product.require_player_id && !formData.playerId.trim()) {
      newErrors.playerId = 'يرجى إدخال معرف اللاعب (Player ID)';
    }
    if (product.require_username && !formData.username.trim()) {
      newErrors.username = 'يرجى إدخال اسم المستخدم';
    }
    if (product.require_social_link && !formData.socialLink.trim()) {
      newErrors.socialLink = 'يرجى إدخال رابط الحساب';
    }
    if (product.require_phone_number && !formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'يرجى إدخال رقم الهاتف';
    }

    // Default manual requirement: if no specific flags are set, we still ask for Player ID
    const hasNoCustomRequirements = !product.require_player_id && 
                                   !product.require_username && 
                                   !product.require_social_link && 
                                   !product.require_phone_number;
    
    if (hasNoCustomRequirements && !formData.playerId.trim()) {
      newErrors.playerId = 'يرجى إدخال معرف اللاعب (ID) لإتمام عملية الشحن';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      addToast('يرجى تعبئة كافة الحقول المطلوبة ❌', 'error');
      return;
    }

    setErrors({});
    setIsAdding(true);
    
    // Pro-rata computation if Custom Robux is chosen
    const baseRobuxQty = product?.robux_quantity || 1000;
    const unitPrice = product ? Number(product.price) / baseRobuxQty : 0;
    const activeRobuxQty = isCustomRobux ? customRobuxAmount : (product?.robux_quantity || 0);
    const activePrice = isCustomRobux ? Math.max(1, Math.round(unitPrice * customRobuxAmount)) : Number(product?.price || 0);

    if (isRobloxProd && roboCoinsEnabled && activeRobuxQty > roboCoinsBalance) {
      addToast('الكمية المطلوبة تتجاوز مخزون السيرفر المتبقي ❌', 'error');
      setIsAdding(false);
      return;
    }

    const customerData = {
      player_id: formData.playerId,
      player_username: formData.username,
      player_social: formData.socialLink,
      player_phone: formData.phoneNumber
    };

    const overriddenProduct = {
      ...product,
      price: activePrice,
      ...(product && product.robux_quantity !== undefined ? { robux_quantity: activeRobuxQty } : {})
    };

    setTimeout(() => {
      addItem(overriddenProduct, 1, customerData);
      addToast('تمت إضافة المنتج للسلة بنجاح ✅', 'success');
      setIsAdding(false);
      navigate('/cart');
    }, 600);
  };

  const handleAddToCartAll = () => {
    // Both main product and the suggested products
    const itemsToAdd = [product, ...boughtTogether].filter(p => p && p.id);
    
    itemsToAdd.map(item => {
      if (item && item.id) {
        // Use activePrice if it's the main product, else use its own price
        const overriddenPrice = item.id === product?.id ? activePrice : Number(item.price);
        const itemToAdd = { ...item, price: overriddenPrice };
        addItem(itemToAdd, 1);
      }
    });

    addToast(`تمت إضافة ${itemsToAdd.length} منتج إلى السلة بنجاح!`, 'success');
  };

  if (isLoading) {
    return (
      <div className="flex-1 container mx-auto px-4 max-w-7xl py-8">
        <div className="h-4 bg-gray-100 dark:bg-[#1a1d24] w-1/4 mb-4 rounded animate-pulse"></div>
        <div className="h-8 bg-gray-100 dark:bg-[#1a1d24] w-1/2 mb-8 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
           <div className="lg:col-span-8 bg-gray-50 dark:bg-[#0f1115] h-[500px] rounded-xl"></div>
           <div className="lg:col-span-4 bg-gray-50 dark:bg-[#0f1115] h-[500px] rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="flex-1 py-20 text-center font-bold">المنتج غير موجود</div>;
  }

  const isRobloxProd = !!(
    product.game_name?.toLowerCase().includes('roblox') || 
    product.game_name?.toLowerCase().includes('robux') || 
    product.game_name?.includes('روبلوكس') || 
    product.game_name?.includes('روبوكس') || 
    product.title?.toLowerCase().includes('roblox') || 
    product.title?.toLowerCase().includes('robux') || 
    product.title?.includes('روبلوكس') || 
    product.title?.includes('روبوكس')
  );

  const baseRobuxQty = product?.robux_quantity || 1000;
  const unitPrice = product ? Number(product.price) / baseRobuxQty : 0;
  const activeRobuxQty = isCustomRobux ? customRobuxAmount : (product?.robux_quantity || 0);
  const activePrice = isCustomRobux ? Math.max(1, Math.round(unitPrice * customRobuxAmount)) : Number(product?.price || 0);

  const totalPriceTogether = activePrice + boughtTogether.reduce((acc, curr) => acc + Number(curr.price), 0);
  const isFav = product ? isFavorite(product.id) : false;

  return (
    <div className="flex-1 w-full">
      {/* Product Top Info (Breadcrumbs & Title) */}
      <div className="bg-white dark:bg-[#1a1d24]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-700/50 py-4 px-4 md:px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-[10px] md:text-xs text-gray-400 mb-4 font-bold overflow-x-auto whitespace-nowrap scrollbar-hide">
             <Link to="/" className="hover:text-red-700 transition-colors">متحر موكا</Link>
             <ChevronRight size={12} />
             <Link to="/category/all" className="hover:text-red-700 transition-colors">منتجات رقمية</Link>
             <ChevronRight size={12} />
             <span className="text-gray-400">{product.game_name || 'بطاقات شحن'}</span>
             <ChevronRight size={12} />
             <span className="text-red-700">{product.title}</span>
          </nav>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tighter text-right">{product.title}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Main Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          
          {/* Product Hero (Image Display) */}
          <div className="lg:col-span-8 order-2 lg:order-1">
            <div className="relative bg-zinc-950 rounded-3xl p-6 md:p-12 flex items-center justify-center min-h-[300px] md:min-h-[500px] shadow-sm overflow-hidden">
              <div 
                className="absolute inset-0 w-full h-full opacity-40 blur-3xl scale-[1.2] bg-center bg-cover bg-no-repeat pointer-events-none"
                style={{ backgroundImage: product?.image_url ? `url(${product.image_url})` : undefined }}
              />
              <img 
                src={product?.image_url || null} 
                alt={product?.title || ''} 
                className="relative z-10 w-full max-w-[280px] md:max-w-[420px] object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500" 
              />
              {product.discount_badge && (
                <div className="absolute top-6 left-6 z-20 bg-red-600 text-white text-xs font-black py-1.5 px-3 rounded-full shadow-lg">
                  {product.discount_badge}
                </div>
              )}
              <div className="absolute bottom-6 right-6 z-20 flex gap-2">
                <button className="bg-white dark:bg-[#1a1d24]/10 backdrop-blur-md border border-white/20 p-2.5 rounded-full shadow-md hover:bg-white dark:bg-[#1a1d24]/20 text-white transition-colors">
                  <Share2 size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Product Sidebar (Purchase Options) */}
          <div className="lg:col-span-4 space-y-6 order-1 lg:order-2">
            <div className="bg-white dark:bg-[#1a1d24] border border-gray-100 dark:border-gray-700 rounded-3xl p-6 md:p-8 shadow-sm h-full flex flex-col text-right">
              <div className="mb-6">
                 <h2 className="text-xl font-bold mb-2">{product.title}</h2>
                 <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-h-20 overflow-hidden line-clamp-3">
                   {product.description || `اشحن باقة ${product.title} الآن واستمتع بمكافآت حصرية. شحن فوري وآمن 100%.`}
                 </p>
              </div>

              <div className="flex items-center gap-3 mb-8 justify-end">
                <span className="text-3xl font-black text-red-700 tracking-tighter order-2">
                  {formatPrice(activePrice)}
                </span>
                {!isCustomRobux && product.old_price && (
                  <span className="text-lg text-gray-300 line-through font-bold order-1">{formatPrice(Number(product.old_price))}</span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-3 bg-green-50 text-green-700 px-4 py-2.5 rounded-xl border border-green-100 justify-end">
                <span className="text-xs font-bold">تسليم فوري ومؤكد للكود أو الشحن</span>
                <Zap size={18} />
              </div>

              {/* Live stock indicator */}
              <div className="flex items-center justify-between text-sm bg-gray-50 dark:bg-[#0f1115] border border-gray-100 dark:border-gray-700/60 rounded-xl p-3 mb-3 text-right" dir="rtl">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    product.stock === undefined || product.stock === null || product.stock > 0 
                      ? 'bg-green-500 animate-pulse' 
                      : 'bg-red-500'
                  }`}></span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">حالة المخزون المتوفر</span>
                </div>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md border ${
                  product.stock === undefined || product.stock === null 
                    ? 'bg-zinc-50 dark:bg-[#0f1115] border-zinc-200 text-zinc-650' 
                    : product.stock <= 0 
                      ? 'bg-red-50 border-red-100 text-red-650' 
                      : product.stock <= 5 
                        ? 'bg-amber-50 border-amber-100 text-amber-650' 
                        : 'bg-green-50 border-green-100 text-green-650'
                }`}>
                  {product.stock === undefined || product.stock === null 
                    ? 'متوفر بلا حدود ♾️' 
                    : product.stock <= 0 
                      ? 'نفد من المخزون ❌' 
                      : `متبقي ${product.stock} وحدات فقط 📦`}
                </span>
              </div>

              {/* Robux Balance Indicator (On Roblox product details page) */}
              {isRobloxProd && roboCoinsEnabled && (
                <div className="flex flex-col gap-2 bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-3 text-right" dir="rtl">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                      🪙 رصيد الـ Robux المتوفر للشحن بالسيستم
                    </span>
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-3xl font-black font-mono text-amber-700 tracking-tight">
                      {roboCoinsBalance.toLocaleString('en-US')}
                    </span>
                    <span className="text-xs font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200">روبوكس (Robux)</span>
                  </div>
                  <p className="text-[9px] text-amber-600 font-bold leading-normal mt-0.5">شحن فوري ومباشر إلى حسابك فور تأكيد الدفع ⚡</p>
                </div>
              )}

              {/* Product specific Robux package amount */}
              {product.robux_quantity !== undefined && product.robux_quantity > 0 && !isCustomRobux && (
                <div className="flex items-center justify-between text-sm bg-zinc-900 text-white rounded-xl p-3.5 mb-3 text-right" dir="rtl">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🎮</span>
                    <span className="text-[10px] font-black tracking-wider text-amber-400">حجم باقة شحن Robux</span>
                  </div>
                  <span className="text-[11px] font-black bg-amber-500 text-zinc-950 px-2.5 py-1 rounded-lg">
                    {product.robux_quantity.toLocaleString('en-US')} Robux
                  </span>
                </div>
              )}

              {/* Bundle Metric Info */}
              {product.bundle_quantity !== undefined && product.bundle_quantity > 0 && (
                <div className="flex flex-col bg-zinc-50 dark:bg-[#0f1115] border border-zinc-200 rounded-2xl p-4.5 mb-4 text-right" dir="rtl">
                  <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5 block">📦 معلومات الحزمة والمقاييس</span>
                  <div className="flex items-center justify-between mt-1 text-[11px] font-bold text-zinc-700">
                    <span>إجمالي الكمية: {product.bundle_quantity.toLocaleString('ar-EG')} وحدة</span>
                    <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200">
                      سعر الـ 100 وحدة: {((Number(product.price) / product.bundle_quantity) * 100).toFixed(2)} د.ل
                    </span>
                  </div>
                </div>
              )}

              {/* Custom Robux Selection Block */}
              {isRobloxProd && roboCoinsEnabled && (
                <div className="flex flex-col bg-zinc-50 dark:bg-[#0f1115] border border-zinc-200 rounded-2xl p-4.5 mb-4 text-right" dir="rtl">
                  <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5 block">⚡ تحديد كمية الـ Robux المطلوبة</span>
                  
                  {/* Selector Tabs */}
                  <div className="grid grid-cols-2 gap-2 mb-4 bg-zinc-200 dark:bg-zinc-800/50 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setIsCustomRobux(false)}
                      className={`py-2 text-[11px] font-black rounded-lg transition-all ${
                        !isCustomRobux ? 'bg-white dark:bg-[#1a1d24] text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                    >
                      باقة ثابتة ({product.robux_quantity?.toLocaleString('en-US')})
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCustomRobux(true)}
                      className={`py-2 text-[11px] font-black rounded-lg transition-all ${
                        isCustomRobux ? 'bg-white dark:bg-[#1a1d24] text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                    >
                      شحن كمية مخصصة 🪙
                    </button>
                  </div>

                  {/* Switchable selection controls */}
                  {isCustomRobux ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-zinc-500">الكمية التي تريدها:</span>
                        <div className="flex items-center bg-white dark:bg-[#1a1d24] border border-zinc-205 rounded-xl overflow-hidden self-end">
                          <button
                            type="button"
                            onClick={() => setCustomRobuxAmount(prev => Math.max(10, prev - 100))}
                            className="px-3 py-1 text-zinc-650 hover:bg-zinc-100 dark:bg-[#1a1d24] font-bold text-base transition-colors"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={customRobuxAmount}
                            onChange={(e) => setCustomRobuxAmount(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-20 text-center font-mono font-black text-sm text-zinc-800 py-1 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setCustomRobuxAmount(prev => prev + 100)}
                            className="px-3 py-1 text-zinc-650 hover:bg-zinc-100 dark:bg-[#1a1d24] font-bold text-base transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Quick chips selection */}
                      <div className="flex flex-wrap gap-1.5 justify-end mt-1">
                        {[400, 800, 1000, 2000, 4500, 10000].map(amt => (
                          <button
                            type="button"
                            key={amt}
                            onClick={() => setCustomRobuxAmount(amt)}
                            className={`px-2.5 py-1 text-[10px] font-black rounded-lg border transition-all ${
                              customRobuxAmount === amt
                                ? 'bg-amber-500 border-amber-500 text-zinc-950 shadow-sm'
                                : 'bg-white dark:bg-[#1a1d24] border-zinc-250 text-zinc-600 hover:bg-zinc-100 dark:bg-[#1a1d24]'
                            }`}
                          >
                            {amt.toLocaleString('en-US')}
                          </button>
                        ))}
                      </div>

                      {/* Live balance-deduct warnings */}
                      {activeRobuxQty > roboCoinsBalance ? (
                        <div className="bg-red-50 border border-red-200 text-red-950 rounded-xl p-3 text-[10px] leading-relaxed font-bold">
                          ⚠️ خطأ: الكمية المطلوبة تتجاوز مخزون السيرفر المتوفر ({roboCoinsBalance.toLocaleString('en-US')} Robux). يرجى تحديد كمية أقل لإتمام الشراء.
                        </div>
                      ) : activeRobuxQty === roboCoinsBalance ? (
                        <div className="bg-amber-50 border border-amber-250 text-amber-950 rounded-xl p-3 text-[10px] leading-relaxed font-bold">
                          ⚠️ تنبيه مباشر: بشراء هذه الكمية، سينفد مخزون السيرفر بالكامل فوراً!
                        </div>
                      ) : roboCoinsBalance - activeRobuxQty <= 1000 ? (
                        <div className="bg-amber-50 border border-amber-250 text-amber-950 rounded-xl p-3 text-[10px] leading-relaxed font-bold">
                          ⚠️ تنبيه مباشر: أوشك مخزون السيرفر على النفاد. سيتبقى بالسيستم فقط {(roboCoinsBalance - activeRobuxQty).toLocaleString('en-US')} Robux بعد طلبك!
                        </div>
                      ) : (
                        <div className="bg-green-50 border border-green-250 text-green-950 rounded-xl p-3 text-[10px] leading-relaxed font-bold">
                          ✅ متوفر: مخزون السيرفر آمن (سيتبقى بالسيستم {(roboCoinsBalance - activeRobuxQty).toLocaleString('en-US')} Robux بعد الطلب).
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-[10px] text-zinc-500 leading-normal">أنت تطلب الباقة المعيارية الثابتة المرفقة بهذا المنتج والبالغ حجمها <span className="font-mono font-black">{product.robux_quantity?.toLocaleString('en-US')} Robux</span>.</p>
                      
                      {/* Standard pack warning check */}
                      {activeRobuxQty > roboCoinsBalance ? (
                        <div className="bg-red-50 border border-red-200 text-red-950 rounded-xl p-3 text-[10px] leading-relaxed font-bold">
                          ⚠️ عذراً: لا توجد كمية كافية بالمخزون ({roboCoinsBalance.toLocaleString('en-US')} Robux) لشحن هذه الباقة حالياً. يرجى شراء حزمة مخصصة أصغر.
                        </div>
                      ) : roboCoinsBalance - activeRobuxQty <= 1000 ? (
                        <div className="bg-amber-50 border border-amber-250 text-amber-950 rounded-xl p-3 text-[10px] leading-relaxed font-bold">
                          ⚠️ تنبيه مباشر: مخزون السيرفر أوشك على النفاد. سيتبقى بالسيستم {(roboCoinsBalance - activeRobuxQty).toLocaleString('en-US')} Robux بعد طلبك.
                        </div>
                      ) : (
                        <div className="bg-green-50 border border-green-200 text-green-950 rounded-xl p-3 text-[10px] leading-relaxed font-bold">
                          ✅ متوفر: مخزون السيرفر كافٍ لشحن الباقة بالكامل فوراً.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Robo-coins bonus promotion */}
              {product.robo_coins_bonus !== undefined && product.robo_coins_bonus > 0 && (
                <div className="flex items-center justify-between text-xs bg-red-50/35 border border-red-100/80 rounded-xl p-3 mb-6 text-right" dir="rtl">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🎁</span>
                    <span className="text-[10px] font-black text-red-800 uppercase tracking-wider">مكافأة بونص Robux الهدية عند الشراء</span>
                  </div>
                  <span className="text-[10px] font-black bg-red-100 text-red-700 px-2.5 py-1 rounded-lg border border-red-200">
                    +{product.robo_coins_bonus} Robux
                  </span>
                </div>
              )}

              {/* Dynamic Customer Inputs */}
              <div className="space-y-4 mb-8">
                {product.require_player_id && (
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-700 dark:text-gray-300 mb-2 px-1 uppercase tracking-wider">
                      <Fingerprint size={14} className="text-red-700" />
                      معرف اللاعب (Player ID) <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={formData.playerId}
                      onChange={(e) => setFormData({...formData, playerId: e.target.value})}
                      placeholder="51244XXXX"
                      className={`w-full bg-gray-50 dark:bg-[#0f1115] border-2 ${errors.playerId ? 'border-red-400' : 'border-transparent'} focus:border-red-700 rounded-xl py-3.5 px-5 outline-none transition-all text-sm font-bold shadow-inner placeholder:text-gray-300 text-left`}
                      dir="ltr"
                    />
                    {errors.playerId && <p className="text-red-600 text-[10px] mt-1.5 font-bold">{errors.playerId}</p>}
                  </div>
                )}

                {product.require_username && (
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-700 dark:text-gray-300 mb-2 px-1 uppercase tracking-wider">
                      <UserIcon size={14} className="text-red-700" />
                      اسم المستخدم / اللاعب <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      placeholder="Username Here"
                      className={`w-full bg-gray-50 dark:bg-[#0f1115] border-2 ${errors.username ? 'border-red-400' : 'border-transparent'} focus:border-red-700 rounded-xl py-3.5 px-5 outline-none transition-all text-sm font-bold shadow-inner placeholder:text-gray-300 text-left`}
                      dir="ltr"
                    />
                    {errors.username && <p className="text-red-600 text-[10px] mt-1.5 font-bold">{errors.username}</p>}
                  </div>
                )}

                {product.require_social_link && (
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-700 dark:text-gray-300 mb-2 px-1 uppercase tracking-wider">
                      <ShareIcon size={14} className="text-red-700" />
                      رابط الحساب (فيسبوك/تويتر) <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input 
                      type="url" 
                      value={formData.socialLink}
                      onChange={(e) => setFormData({...formData, socialLink: e.target.value})}
                      placeholder="https://facebook.com/..."
                      className={`w-full bg-gray-50 dark:bg-[#0f1115] border-2 ${errors.socialLink ? 'border-red-400' : 'border-transparent'} focus:border-red-700 rounded-xl py-3.5 px-5 outline-none transition-all text-sm font-bold shadow-inner placeholder:text-gray-300 text-left`}
                      dir="ltr"
                    />
                    {errors.socialLink && <p className="text-red-600 text-[10px] mt-1.5 font-bold">{errors.socialLink}</p>}
                  </div>
                )}

                {product.require_phone_number && (
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-700 dark:text-gray-300 mb-2 px-1 uppercase tracking-wider">
                      <Phone size={14} className="text-red-700" />
                      رقم الهاتف للتواصل <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input 
                      type="tel" 
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                      placeholder="091XXXXXXX"
                      className={`w-full bg-gray-50 dark:bg-[#0f1115] border-2 ${errors.phoneNumber ? 'border-red-400' : 'border-transparent'} focus:border-red-700 rounded-xl py-3.5 px-5 outline-none transition-all text-sm font-bold shadow-inner placeholder:text-gray-300 text-left`}
                      dir="ltr"
                    />
                    {errors.phoneNumber && <p className="text-red-600 text-[10px] mt-1.5 font-bold">{errors.phoneNumber}</p>}
                  </div>
                )}
                
                {/* Fallback if no requirements are specified in the DB yet */}
                {!product.require_player_id && !product.require_username && !product.require_social_link && !product.require_phone_number && (
                  <div>
                    <label className="block text-[10px] font-black text-gray-700 dark:text-gray-300 mb-2 px-1 uppercase tracking-wider">
                      معرف اللاعب (ID)
                    </label>
                    <input 
                      type="text" 
                      value={formData.playerId}
                      onChange={(e) => setFormData({...formData, playerId: e.target.value})}
                      placeholder="أدخل الـ ID هنا للنسخ الصحيح"
                      className="w-full bg-gray-50 dark:bg-[#0f1115] border-2 border-transparent focus:border-red-700 rounded-xl py-4 px-5 outline-none transition-all text-sm font-bold shadow-inner placeholder:text-gray-300 text-left"
                      dir="ltr"
                    />
                  </div>
                )}
                
                <div className="flex items-center gap-3 w-full">
                  {product.stock !== undefined && product.stock !== null && product.stock <= 0 ? (
                    <button 
                      disabled
                      className="flex-1 bg-zinc-150 border border-zinc-200 text-zinc-400 font-black py-4.5 rounded-2xl flex items-center justify-center gap-3 cursor-not-allowed text-xs text-center"
                    >
                      <span>عذراً: نفدت الكمية الحالية من المخزون ❌</span>
                    </button>
                  ) : (
                    <button 
                      onClick={handleAddToCart}
                      disabled={isAdding}
                      className="flex-1 bg-[#A3C15A] hover:bg-[#92b14a] text-white font-black py-4.5 rounded-2xl shadow-xl shadow-green-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group disabled:opacity-50 text-sm whitespace-nowrap"
                    >
                      <ShoppingCart size={20} className="group-hover:animate-bounce" />
                      <span className="text-sm text-right">أضف إلى عربة التسوق</span>
                    </button>
                  )}

                  {/* Heart button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleFavorite(product);
                      if (isFav) {
                        addToast('تمت الإزالة من المفضلة ✖️', 'info');
                      } else {
                        addToast('تمت الإضافة للمفضلة ❤️', 'success');
                      }
                    }}
                    className={`rounded-2xl border transition-all flex items-center justify-center shadow-lg active:scale-95 duration-200 cursor-pointer`}
                    style={{ minWidth: '56px', height: '56px', backgroundColor: isFav ? '#fef2f2' : '#ffffff', borderColor: isFav ? '#fee2e2' : '#e4e4e7', color: isFav ? '#dc2626' : '#71717a' }}
                    title={isFav ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                  >
                    <Heart size={22} className={`${isFav ? 'fill-current scale-110' : ''} transition-transform`} />
                  </button>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-gray-50 mt-auto">
                <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 dark:text-gray-400">
                  <span className="text-gray-900 dark:text-white">أصلي ومضمون</span>
                  <span className="flex items-center gap-1.5">منتج رقمي (كود) <ShieldCheck size={14} className="text-green-600" /></span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 dark:text-gray-400">
                   <span className="text-gray-900 dark:text-white">2,451+ عملية ناجحة</span>
                  <span className="flex items-center gap-1.5">المبيعات <History size={14} className="text-blue-600" /></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Frequently Bought Together (Similar to Image 2) */}
        <div className="mb-16">
           <h3 className="text-xl font-black mb-8 border-l-4 border-red-700 pl-4 text-right">غالباً ما يتم شراؤها معاً</h3>
           <div className="bg-[#fcfdfd] border border-gray-100 dark:border-gray-700 rounded-[2.5rem] p-6 lg:p-10 shadow-sm">
             <div className="flex flex-col lg:flex-row-reverse items-center gap-8 lg:gap-12">
               
               {/* Summary Box */}
               <div className="w-full lg:w-1/4 bg-white dark:bg-[#1a1d24] border border-gray-50 rounded-3xl p-8 text-center shadow-sm">
                  <p className="text-xs font-bold text-gray-400 mb-2">إجمالي السعر</p>
                  <div className="text-3xl font-black text-red-700 mb-6 tracking-tighter">
                    {formatPrice(totalPriceTogether)}
                  </div>
                  <button 
                    onClick={handleAddToCartAll}
                    className="w-full bg-[#A3C15A] hover:bg-[#92b14a] text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-95"
                  >
                    أضف الكل للسلة
                  </button>
               </div>

               {/* Products Grid */}
               <div className="flex-1 flex flex-wrap lg:flex-nowrap items-center justify-center gap-4 md:gap-8 overflow-x-auto pb-4 lg:pb-0">
                 {/* Main Product */}
                 <div className="w-40 md:w-48 group relative flex-shrink-0">
                    <div className="bg-white dark:bg-[#1a1d24] border-2 border-red-100 rounded-3xl p-4 shadow-sm group-hover:shadow-md transition-shadow text-right">
                      <img src={product?.image_url || null} alt="" className="w-full h-24 md:h-32 object-contain mb-4" />
                      <p className="text-[10px] font-bold text-red-700 mb-1">هذا المنتج:</p>
                      <p className="text-xs font-black truncate">{product.title}</p>
                      <p className="text-xs font-black text-red-700 mt-2">{formatPrice(Number(product.price))}</p>
                      <div className="absolute -top-2 -right-2 bg-red-700 text-white rounded-full p-1 border-2 border-white">
                        <Plus size={16} />
                      </div>
                    </div>
                 </div>

                 {boughtTogether.map((item) => (
                   <React.Fragment key={item.id}>
                     <Plus className="text-gray-300 flex-shrink-0" size={24} />
                     <div className="w-40 md:w-48 group relative flex-shrink-0">
                        <div className="bg-white dark:bg-[#1a1d24] border border-gray-100 dark:border-gray-700 rounded-3xl p-4 shadow-sm group-hover:shadow-md transition-shadow text-center">
                          <img src={item?.image_url || null} alt="" className="w-full h-24 md:h-32 object-contain mb-4" />
                          <p className="text-xs font-black truncate">{item.title}</p>
                          <p className="text-xs font-black text-red-700 mt-2">{formatPrice(Number(item.price))}</p>
                        </div>
                     </div>
                   </React.Fragment>
                 ))}
               </div>

             </div>
           </div>
        </div>

        {/* Product Info Tabs (Similar to Image 4) */}
        <div className="mb-16">
          <div className="flex justify-end border-b border-gray-100 dark:border-gray-700 mb-8 overflow-x-auto scrollbar-hide">
            {[
              { id: 'shipping', label: 'طريقة الشحن' },
              { id: 'details', label: 'معلومات إضافية' },
              { id: 'description', label: 'وصف المنتج' }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-4 px-6 md:px-10 text-xs md:text-sm font-black transition-all whitespace-nowrap ${activeTab === tab.id ? 'text-red-700 border-b-4 border-red-700' : 'text-gray-400 hover:text-gray-600 dark:text-gray-400'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-[#1a1d24] rounded-3xl border border-gray-50 p-6 md:p-10 shadow-sm min-h-[300px]">
            {activeTab === 'description' && (
              <div className="prose prose-sm max-w-none prose-gray leading-loose text-right" dir="rtl">
                 <div className="bg-red-50/50 p-4 rounded-xl border-r-4 border-red-700 mb-6">
                    <p className="text-xs md:text-sm font-bold text-red-800">
                      تنويه هام: يرجى التأكد من أن حسابك متاح لاستلام الشحن في منطقتك. المتجر غير مسؤول عن القيود المفروضة من قبل اللعبة.
                    </p>
                 </div>
                 <h4 className="text-lg font-black mb-4">لماذا تختار متجر موكا لشحن {product.game_name}؟</h4>
                 <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                   نحن نقدم أفضل أسعار شحن {product.game_name} في السوق العربي مع ضمان كامل على كل عملية شحن. 
                   عملية الشحن لدينا تتم بشكل رسمي وقانوني تماماً، مما يضمن سلامة حسابك من أي مخاطر.
                 </p>
                 <ul className="list-disc pr-6 text-sm text-gray-600 dark:text-gray-400 space-y-3 mb-6">
                   <li>تسليم فوري بعد الدفع مباشرة.</li>
                   <li>دعم فني متواصل 24/7 لمساعدتك.</li>
                   <li>طرق دفع آمنة ومتنوعة تناسب الجميع.</li>
                   <li>نقاط ولاء يمكنك استبدالها بخصومات في عمليات الشراء القادمة.</li>
                 </ul>
                 <p className="text-gray-500 dark:text-gray-400 italic text-[11px]">ملحوظة: هذا المنتج رقمي ولا يمكن استرجاعه أو استبداله بعد الاستلام أو الشحن.</p>
              </div>
            )}
            {activeTab === 'details' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 text-right">
                {[
                  { label: 'اسم اللعبة', value: product.game_name },
                  { label: 'الفئة', value: product.category_name },
                  { label: 'نوع المنتج', value: 'منتج رقمي (شحن مباشر/كود)' },
                  { label: 'المنطقة', value: 'عالمي / Global' },
                  { label: 'الحالة', value: (product.stock || 99) > 0 ? 'متوفر' : 'غير متوفر' },
                  { label: 'تاريخ الإدراج', value: 'September 2025' }
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-row-reverse justify-between items-center py-4 border-b border-gray-50">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{item.label}</span>
                    <span className="text-xs font-black text-gray-900 dark:text-white">{item.value || 'N/A'}</span>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'shipping' && (
              <div className="space-y-6 text-right" dir="rtl">
                {[
                  { n: '١', t: 'إدخال معرف اللاعب (ID)', d: 'قم بكتابة الـ ID الخاص بحسابك في اللعبة في الحقل المخصص لذلك بدقة.' },
                  { n: '٢', t: 'إتمام الطلب والدفع', d: 'أضف المنتج للسلة وقم بإتمام عملية الدفع عبر إحدى الوسائل المتاحة.' },
                  { n: '٣', t: 'استلام الشحن', d: 'سيصلك الشحن إلى حسابك في غضون ثوانٍ أو دقائق معدودة بعد التأكد من الدفع.' }
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="bg-red-100 text-red-700 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm">{step.n}</div>
                    <div>
                      <h5 className="font-bold text-sm mb-1">{step.t}</h5>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{step.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Comments Section */}
        {product?.id && <ProductComments productId={product.id} />}

        {/* Similar Products */}
        {relatedProducts.length > 0 && (
          <div className="mb-8">
             <ProductSection 
               title="منتجات قد تعجبك" 
               products={relatedProducts} 
               isLoading={false}
               icon={<Flame className="fill-red-700" size={24} />}
             />
          </div>
        )}

      </div>
    </div>
  );
}
