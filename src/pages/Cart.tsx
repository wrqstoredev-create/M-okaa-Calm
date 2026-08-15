import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, Ticket, Loader2, X, CheckCircle } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

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
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-24 h-24 bg-gray-100 dark:bg-[#1a1d24] rounded-full flex items-center justify-center mb-6">
          <ShoppingBag size={40} className="text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold mb-2 font-black">السلة فارغة</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm font-bold">لم تقم بإضافة أي منتجات إلى سلة المشتريات حتى الآن.</p>
        <Link to="/" className="bg-black text-white font-black py-4 px-10 rounded-2xl hover:bg-gray-800 transition-all shadow-xl shadow-black/10 active:scale-[0.98]">
          تصفح المنتجات
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 container mx-auto px-4 max-w-5xl py-8" dir="rtl">
      <h1 className="text-2xl font-black mb-8 border-r-4 border-red-700 pr-3">سلة المشتريات</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id + JSON.stringify(item.customerData)} className="bg-white dark:bg-[#1a1d24] border border-gray-100 dark:border-gray-700 rounded-3xl p-5 shadow-sm flex flex-col sm:row gap-4 items-start sm:items-center">
              <div className="flex w-full gap-4 items-center">
                <div className="w-20 h-20 bg-zinc-50 dark:bg-[#0f1115] rounded-2xl p-1 flex-shrink-0 flex items-center justify-center border border-zinc-100 overflow-hidden">
                   <img src={item.image_url || null} alt={item.title} className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-zinc-400 font-black mb-1 uppercase tracking-widest">{item.game_name}</div>
                  <h3 className="font-black text-zinc-900 dark:text-white text-sm truncate">{item.title}</h3>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {item.customerData?.player_id && (
                      <div className="bg-red-50 text-red-700 px-2 py-0.5 rounded-lg text-[10px] font-black border border-red-100/50 uppercase" dir="ltr">
                        ID: {item.customerData.player_id}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                   <button onClick={() => removeItem(item.id)} className="text-zinc-300 hover:text-red-600 transition-colors p-2">
                    <Trash2 size={18} />
                  </button>
                  <div className="text-red-700 font-black text-sm whitespace-nowrap">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between w-full pt-4 border-t border-zinc-50">
                <div className="flex items-center bg-zinc-50 dark:bg-[#0f1115] border border-zinc-100 rounded-xl overflow-hidden p-1">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-2 text-zinc-500 hover:text-black dark:text-white hover:bg-zinc-200 dark:bg-zinc-800 rounded-lg transition-colors"><Minus size={14}/></button>
                  <span className="w-10 text-center text-sm font-black text-zinc-900 dark:text-white">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-2 text-zinc-500 hover:text-black dark:text-white hover:bg-zinc-200 dark:bg-zinc-800 rounded-lg transition-colors"><Plus size={14}/></button>
                </div>
                
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">سعر الوحدة: {formatPrice(item.price)}</span>
              </div>
            </div>
          ))}

          {/* Coupon Section */}
          <div className="bg-white dark:bg-[#1a1d24] border border-dashed border-zinc-200 rounded-3xl p-6 mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                <Ticket size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-zinc-900 dark:text-white">هل لديك كود خصم؟</h3>
                <p className="text-[10px] font-bold text-zinc-500">أدخل الكود للحصول على تخفيض فوري</p>
              </div>
            </div>

            {appliedCoupon ? (
              <div className="bg-green-50 border border-green-100 p-4 rounded-2xl flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <CheckCircle size={18} className="text-green-600" />
                  <div>
                    <span className="text-xs font-black text-green-700 block line-height-none">تم تطبيق الكود: {appliedCoupon.code}</span>
                    <span className="text-[10px] font-bold text-green-600">خصم بقيمة {appliedCoupon.discount_value}{appliedCoupon.discount_type === 'percentage' ? '%' : ' SAR'}</span>
                  </div>
                </div>
                <button 
                  onClick={removeCoupon}
                  className="p-2 text-green-700 hover:bg-green-100 rounded-xl transition-colors"
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
                  className="flex-1 bg-zinc-50 dark:bg-[#0f1115] border border-zinc-100 rounded-2xl px-4 py-3 text-sm font-black focus:outline-none focus:ring-2 focus:ring-red-600/10 focus:border-red-600 transition-all"
                  disabled={isSubmitting}
                />
                <button 
                  type="submit"
                  disabled={isSubmitting || !couponCode.trim()}
                  className="bg-zinc-900 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-zinc-800 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'تطبيق'}
                </button>
              </form>
            )}
            
            {error && <p className="mt-3 text-[10px] font-black text-red-600 flex items-center gap-1"><X size={12}/> {error}</p>}
            {success && <p className="mt-3 text-[10px] font-black text-green-600 flex items-center gap-1"><CheckCircle size={12}/> {success}</p>}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-[#1a1d24] border border-zinc-100 rounded-[2.5rem] p-8 sticky top-4 shadow-xl shadow-zinc-200/50">
            <h2 className="text-lg font-black mb-6 border-b border-zinc-50 pb-4">تفاصيل الطلب</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400 font-black">المجموع الفرعي:</span>
                <span className="font-black text-zinc-900 dark:text-white">{formatPrice(totalPrice)}</span>
              </div>
              
              {appliedCoupon && (
                <div className="flex justify-between text-xs">
                  <span className="text-green-600 font-black flex items-center gap-1">الخصم ({appliedCoupon.code}):</span>
                  <span className="font-black text-green-600">-{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-xs">
                <span className="text-zinc-400 font-black">الشحن والرسوم:</span>
                <span className={`${shippingFee === 0 ? 'text-green-600' : 'text-zinc-900 dark:text-white'} font-black`}>
                  {shippingFee === 0 ? 'مجاني' : formatPrice(shippingFee)}
                </span>
              </div>
              
              <div className="border-t border-zinc-50 pt-5 flex justify-between items-center">
                <span className="font-black text-sm">الإجمالي النهائي:</span>
                <span className="font-black text-red-700 text-2xl tracking-tighter">{formatPrice(finalPrice)}</span>
              </div>
            </div>

            <Link to={user ? "/checkout" : "/login"} className="block w-full text-center bg-black text-white font-black py-4 rounded-2xl hover:bg-zinc-800 shadow-xl shadow-black/10 active:scale-[0.98] transition-all">
              متابعة للدفع
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

