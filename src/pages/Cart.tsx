import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, Ticket, Loader2, X, CheckCircle, ArrowRight, AlertTriangle } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import RippleButton from '../components/ui/RippleButton';

export default function Cart() {
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const { 
    items, 
    updateQuantity, 
    removeItem, 
    totalPrice, 
    appliedCoupon, 
    applyCoupon, 
    removeCoupon,
    discountAmount,
    shippingFee,
    finalPrice
  } = useCart();
  
  const isItemOutOfStock = (item: any) => item.stock !== undefined && item.stock !== null && Number(item.stock) <= 0;
  const hasOutOfStock = items.some(isItemOutOfStock);
  
  const [couponCode, setCouponCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.trim().toUpperCase())
        .eq('is_active', true)
        .maybeSingle();
        
      if (fetchError) throw fetchError;
      
      if (!data) {
        setError('كود الخصم غير صحيح أو غير مفعل حالياً');
        return;
      }
      
      applyCoupon(data);
      setSuccess(`تم تطبيق الخصم بنجاح: ${data.code}`);
      setCouponCode('');
    } catch (err: any) {
      setError('حدث خطأ أثناء التحقق من الكود');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="w-24 h-24 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_25px_rgba(255,32,64,0.15)]">
          <ShoppingBag size={40} className="text-gray-400 dark:text-red-500/80" />
        </div>
        <h1 className="text-2xl font-black mb-2 text-gray-900 dark:text-white">السلة فارغة</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm font-bold text-sm leading-relaxed">
          لم تقم بإضافة أي منتجات أو باقات شحن إلى سلة المشتريات حتى الآن.
        </p>
        <Link 
          to="/" 
          className="bg-gradient-to-r from-red-600 to-rose-600 text-white font-black py-4 px-10 rounded-2xl hover:from-red-500 hover:to-rose-500 transition-all shadow-[0_4px_20px_rgba(255,32,64,0.4)] hover:shadow-[0_0_30px_rgba(255,32,64,0.65)] active:scale-[0.98]"
        >
          تصفح المتجر الآن
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 container mx-auto px-4 max-w-5xl py-8 md:py-12" dir="rtl">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200 dark:border-white/10">
        <h1 className="text-2xl md:text-3xl font-black border-r-4 border-red-600 pr-3 text-gray-900 dark:text-white">
          سلة المشتريات
        </h1>
        <span className="text-xs font-bold text-gray-400">
          ({items.length} {items.length === 1 ? 'عنصر' : 'عناصر'})
        </span>
      </div>
      
      {/* Out of stock top banner */}
      {hasOutOfStock && (
        <div className="mb-6 bg-red-500/15 border-2 border-red-500/50 rounded-2xl p-4 flex items-center gap-3 text-red-600 dark:text-red-400 animate-pulse">
          <AlertTriangle size={24} className="flex-shrink-0" />
          <div className="text-right">
            <h4 className="font-black text-sm">تنبيه: توجد منتجات نفدت كميتها في سلتك!</h4>
            <p className="text-xs font-bold mt-0.5 opacity-90">
              يرجى حذف المنتجات الموضحة باللون الأحمر لتتمكن من إتمام الطلب والدفع.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const outOfStock = isItemOutOfStock(item);
            const username = item.attributes?.username || item.customerData?.player_username || (item.customerData as any)?.username;
            const playerId = item.attributes?.id || item.customerData?.player_id;
            const phone = item.attributes?.phone || item.customerData?.player_phone;
            const itemKey = item.id + JSON.stringify(item.attributes || item.customerData || {});

            return (
              <div 
                key={itemKey} 
                className={`bg-white/95 dark:bg-[#0c0c10]/95 backdrop-blur-2xl rounded-3xl p-5 shadow-sm transition-all duration-300 flex flex-col gap-4 border ${
                  outOfStock
                    ? 'border-red-500 bg-red-50/20 dark:bg-red-950/20 shadow-[0_0_25px_rgba(239,68,68,0.2)]'
                    : 'border-gray-150 dark:border-white/10 hover:border-red-400/40 dark:hover:border-red-500/30 dark:hover:shadow-[0_0_20px_rgba(255,32,64,0.12)]'
                }`}
              >
                {/* Out of Stock Warning Banner */}
                {outOfStock && (
                  <div className="bg-red-500/15 border border-red-500/40 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-red-600 dark:text-red-400">
                    <div className="flex items-center gap-2 font-black text-xs">
                      <AlertTriangle size={16} className="text-red-500 animate-bounce flex-shrink-0" />
                      <span>نفدت الكمية - يرجى الحذف للمتابعة ⚠️</span>
                    </div>
                    <button
                      onClick={() => removeItem(item.id, item.attributes)}
                      className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-black px-3.5 py-1.5 rounded-xl transition-all shadow-md hover:shadow-red-600/40 flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto"
                    >
                      <Trash2 size={13} />
                      حذف من السلة
                    </button>
                  </div>
                )}

                <div className="flex w-full gap-4 items-center">
                  <div className="w-20 h-20 bg-gray-50 dark:bg-[#141418] rounded-2xl p-1 flex-shrink-0 flex items-center justify-center border border-gray-200 dark:border-white/10 overflow-hidden relative">
                     <img src={item.image_url || undefined} alt={item.title} className="w-full h-full object-contain filter drop-shadow-sm" />
                     {outOfStock && (
                       <span className="absolute inset-0 bg-red-950/70 backdrop-blur-[1px] flex items-center justify-center text-white text-[10px] font-black">
                         نفد ❌
                       </span>
                     )}
                  </div>
                  
                  <div className="flex-1 min-w-0 text-right">
                    <div className="text-[10px] text-red-500 dark:text-red-400 font-black mb-1 uppercase tracking-widest">{item.game_name}</div>
                    <h3 className="font-black text-gray-900 dark:text-white text-sm truncate">{item.title}</h3>
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      {username && (
                        <div className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-lg text-[10px] font-black border border-purple-200 dark:border-purple-800/40" dir="ltr">
                          User: {username}
                        </div>
                      )}
                      {playerId && (
                        <div className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-lg text-[10px] font-black border border-red-200 dark:border-red-800/40" dir="ltr">
                          ID: {playerId}
                        </div>
                      )}
                      {phone && (
                        <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-lg text-[10px] font-black border border-emerald-200 dark:border-emerald-800/40" dir="ltr">
                          Phone: {phone}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <button 
                      onClick={() => removeItem(item.id, item.attributes)} 
                      className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                      title="حذف من السلة"
                    >
                      <Trash2 size={17} />
                    </button>
                    <div 
                      className="font-black text-sm whitespace-nowrap"
                      style={{
                        color: 'var(--neon-green)',
                        textShadow: '0 0 10px rgba(0, 255, 136, 0.4)',
                      }}
                      dir="ltr"
                    >
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between w-full pt-4 border-t border-gray-100 dark:border-white/5">
                  <div className={`flex items-center bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden p-0.5 ${outOfStock ? 'opacity-40 pointer-events-none' : ''}`}>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)} 
                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                      disabled={outOfStock}
                    >
                      <Minus size={13} />
                    </button>
                    <span className="w-10 text-center text-sm font-black text-gray-900 dark:text-white">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)} 
                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                      disabled={outOfStock}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  
                  <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider" dir="ltr">
                    Unit: {formatPrice(item.price)}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Coupon Section */}
          <div className="bg-white/95 dark:bg-[#0c0c10]/95 backdrop-blur-2xl border border-dashed border-gray-200 dark:border-white/15 rounded-3xl p-6 mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center text-red-500">
                <Ticket size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white">هل لديك كود خصم؟</h3>
                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400">أدخل الكود للحصول على تخفيض فوري</p>
              </div>
            </div>

            {appliedCoupon ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <CheckCircle size={18} className="text-emerald-500" />
                  <div>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block line-height-none">
                      تم تطبيق الكود: {appliedCoupon.code}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-500">
                      خصم بقيمة {appliedCoupon.discount_value}{appliedCoupon.discount_type === 'percentage' ? '%' : ' SAR'}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={removeCoupon}
                  className="p-2 text-emerald-500 hover:bg-emerald-500/20 rounded-xl transition-colors cursor-pointer"
                  title="إزالة الكود"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input 
                  type="text" 
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="أدخل الكود هنا (مثال: SALE20)"
                  className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-black text-gray-900 dark:text-white focus:outline-none focus:border-red-500 dark:focus:border-red-500 focus:shadow-[0_0_15px_rgba(255,32,64,0.25)] transition-all"
                  disabled={isSubmitting}
                />
                <RippleButton 
                  type="submit"
                  disabled={isSubmitting || !couponCode.trim()}
                  rippleColor="rgba(255, 255, 255, 0.3)"
                  className="bg-zinc-900 dark:bg-white/10 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-zinc-800 dark:hover:bg-white/20 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'تطبيق'}
                </RippleButton>
              </form>
            )}
            
            {error && <p className="mt-3 text-[10px] font-black text-red-500 flex items-center gap-1"><X size={12}/> {error}</p>}
            {success && <p className="mt-3 text-[10px] font-black text-emerald-500 flex items-center gap-1"><CheckCircle size={12}/> {success}</p>}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white/95 dark:bg-[#0c0c10]/95 backdrop-blur-2xl border border-gray-150 dark:border-white/10 rounded-[2.5rem] p-7 md:p-8 sticky top-24 shadow-2xl dark:shadow-[0_12px_45px_rgba(0,0,0,0.8),0_0_20px_rgba(255,32,64,0.08)] space-y-6">
            <h2 className="text-lg font-black border-b border-gray-100 dark:border-white/10 pb-4 text-gray-900 dark:text-white">
              تفاصيل الطلب
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400 font-bold">المجموع الفرعي:</span>
                <span className="font-black text-gray-900 dark:text-white" dir="ltr">{formatPrice(totalPrice)}</span>
              </div>
              
              {appliedCoupon && (
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-500 font-bold flex items-center gap-1">الخصم ({appliedCoupon.code}):</span>
                  <span className="font-black text-emerald-500" dir="ltr">-{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-xs">
                <span className="text-gray-400 font-bold">الشحن والرسوم:</span>
                <span className={`${shippingFee === 0 ? 'text-emerald-500' : 'text-gray-900 dark:text-white'} font-black`}>
                  {shippingFee === 0 ? 'فوري مجاني ⚡' : formatPrice(shippingFee)}
                </span>
              </div>
              
              <div className="border-t border-gray-100 dark:border-white/10 pt-5 flex justify-between items-baseline">
                <span className="font-black text-sm text-gray-900 dark:text-white">الإجمالي النهائي:</span>
                <span 
                  className="font-black text-2xl md:text-3xl tracking-tight"
                  style={{
                    color: 'var(--neon-green)',
                    textShadow: '0 0 16px rgba(0, 255, 136, 0.5)',
                  }}
                  dir="ltr"
                >
                  {formatPrice(finalPrice)}
                </span>
              </div>
            </div>

            {hasOutOfStock ? (
              <div className="space-y-2">
                <button 
                  disabled 
                  className="w-full text-center bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-gray-500 font-black py-4 rounded-2xl border border-gray-300 dark:border-white/10 text-sm cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <AlertTriangle size={16} className="text-red-500" />
                  متابعة للدفع (معطل)
                </button>
                <p className="text-[11px] font-black text-red-600 dark:text-red-400 text-center leading-relaxed bg-red-500/10 border border-red-500/20 py-2.5 px-3 rounded-xl">
                  ⚠️ السلة تحتوي على منتجات نفدت كميتها. يرجى حذفها أولاً لتتمكن من متابعة الدفع.
                </p>
              </div>
            ) : (
              <Link 
                to={user ? "/checkout" : "/login"} 
                className="block w-full text-center bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-black py-4 rounded-2xl shadow-[0_4px_20px_rgba(255,32,64,0.4)] hover:shadow-[0_0_30px_rgba(255,32,64,0.7)] active:scale-[0.98] transition-all cursor-pointer"
              >
                متابعة للدفع ⚡
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
