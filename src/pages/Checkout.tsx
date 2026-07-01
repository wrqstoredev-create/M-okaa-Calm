import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCurrency } from '../contexts/CurrencyContext';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { CreditCard, Wallet, Smartphone, ShieldCheck, CheckCircle2, ChevronRight, Copy, Loader2, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatPrice, currency } = useCurrency();
  const { items, totalPrice, finalPrice, discountAmount, shippingFee, appliedCoupon, clearCart } = useCart();
  const { addToast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState('');
  const [settings, setSettings] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase.from('settings').select('*').single();
      if (data) {
        setSettings(data);
        if (data.enable_visa) setPaymentMethod('visa');
        else if (data.enable_apple_pay) setPaymentMethod('apple-pay');
        else if (data.enable_phone_cash) setPaymentMethod('phone-cash');
        else if (data.enable_instapay) setPaymentMethod('instapay');
        else if (data.enable_fawry) setPaymentMethod('fawry');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const isAutomatic = paymentMethod === 'visa' || paymentMethod === 'apple-pay';
  const isManual = !isAutomatic;

  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handlePayment = async () => {
    if (!termsAccepted) {
      addToast('يرجى الموافقة على الشروط والأحكام للمتابعة 📄', 'error');
      return;
    }

    if (isManual && !paymentScreenshot) {
      addToast('يرجى رفع صورة إيصال التحويل لضمان تأكيد طلبك 📸', 'error');
      return;
    }

    setIsProcessing(true);
    let screenshotUrl = '';

    try {
      if (paymentScreenshot) {
        setIsUploading(true);
        const fileExt = paymentScreenshot.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `screenshots/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('payment-screenshots')
          .upload(filePath, paymentScreenshot);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('payment-screenshots')
          .getPublicUrl(filePath);
        
        screenshotUrl = publicUrl;
      }

      // 1. Create the order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id || null,
          total_price: finalPrice, // Use finalPrice after discount
          payment_method: `${paymentMethod}___${currency}`,
          customer_email: user?.email || 'guest@example.com',
          payment_screenshot_url: screenshotUrl,
          status: isManual ? 'pending' : 'processing',
          coupon_code: appliedCoupon?.code || null,
          discount_amount: discountAmount
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create order items
      const orderItems = items.map(item => ({
        order_id: orderData.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        player_id: item.customerData?.player_id || null,
        player_username: item.customerData?.player_username || null,
        player_social: item.customerData?.player_social || null,
        player_phone: item.customerData?.player_phone || null
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 3. Notify owner via Discord bot
      try {
        await fetch('/api/notify-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: orderData, items })
        });
      } catch (notifyError) {
        console.error('Failed to notify owner via Discord:', notifyError);
      }

      setIsProcessing(false);
      setIsSuccess(true);
      addToast('تم استلام طلبك وبانتظار مراجعة التحويل ✅', 'success');
      clearCart();

    } catch (error) {
      console.error('Payment error:', error);
      addToast('حدث خطأ أثناء معالجة الطلب ❌', 'error');
      setIsProcessing(false);
    }
  };

  if (items.length === 0 && !isSuccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
        <h1 className="text-2xl font-black mb-4">لا توجد منتجات للدفع</h1>
        <Link to="/" className="bg-black text-white px-8 py-3 rounded-2xl font-black transition-transform active:scale-95">العودة للمتجر</Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600"
        >
          <CheckCircle2 size={48} />
        </motion.div>
        <h1 className="text-3xl font-black mb-2">شكراً لطلبك!</h1>
        <p className="text-zinc-500 mb-8 max-w-sm font-bold">تم استلام طلبك وهو قيد المراجعة الآن. سيتم شحن المنتجات إلى حسابك في أقرب وقت ممكن.</p>
        <Link to="/" className="bg-black text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-black/10 active:scale-95 transition-all">العودة للرئيسية</Link>
      </div>
    );
  }

  return (
    <div className="flex-1 container mx-auto px-4 max-w-5xl py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/cart" className="w-10 h-10 bg-zinc-100 dark:bg-[#1a1d24] rounded-full flex items-center justify-center text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 transition-colors">
          <ChevronRight size={20} />
        </Link>
        <h1 className="text-2xl font-black border-r-4 border-red-700 pr-3">إتمام الطلب</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment Methods */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#1a1d24] border border-gray-100 dark:border-gray-700 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <ShieldCheck size={20} className="text-green-600" />
              <h2 className="text-lg font-black italic">اختر وسيلة الدفع الآمنة</h2>
            </div>
            
            <div className="space-y-8">
              {/* Automatic Payments Section */}
              <div>
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4 px-2">الدفع التلقائي (فوري)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Visa */}
                  {settings?.enable_visa && (
                    <label className={`flex items-center justify-between p-5 rounded-3xl border-2 transition-all cursor-pointer ${paymentMethod === 'visa' ? 'border-red-600 bg-red-50/30' : 'border-zinc-100 bg-zinc-50 dark:bg-[#0f1115]/50 hover:border-zinc-200'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${paymentMethod === 'visa' ? 'bg-red-600 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}>
                          <CreditCard size={20} />
                        </div>
                        <div className="text-right">
                          <p className={`font-black text-[12px] ${paymentMethod === 'visa' ? 'text-red-900' : 'text-zinc-900 dark:text-white'}`}>الفيزا</p>
                        </div>
                      </div>
                      <input 
                        type="radio" 
                        name="payment" 
                        value="visa"
                        checked={paymentMethod === 'visa'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="hidden" 
                      />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === 'visa' ? 'border-red-600 bg-red-600' : 'border-zinc-300'}`}>
                        {paymentMethod === 'visa' && <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-[#1a1d24]" />}
                      </div>
                    </label>
                  )}

                  {/* Apple Pay */}
                  {settings?.enable_apple_pay && (
                    <label className={`flex items-center justify-between p-5 rounded-3xl border-2 transition-all cursor-pointer ${paymentMethod === 'apple-pay' ? 'border-zinc-900 bg-zinc-100 dark:bg-[#1a1d24]' : 'border-zinc-100 bg-zinc-50 dark:bg-[#0f1115]/50 hover:border-zinc-200'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${paymentMethod === 'apple-pay' ? 'bg-zinc-900 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}>
                          <Smartphone size={20} />
                        </div>
                        <div className="text-right">
                          <p className={`font-black text-[12px] ${paymentMethod === 'apple-pay' ? 'text-zinc-900 dark:text-white' : 'text-zinc-900 dark:text-white'}`}>أبل باي</p>
                        </div>
                      </div>
                      <input 
                        type="radio" 
                        name="payment" 
                        value="apple-pay"
                        checked={paymentMethod === 'apple-pay'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="hidden" 
                      />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === 'apple-pay' ? 'border-zinc-900 bg-zinc-900' : 'border-zinc-300'}`}>
                        {paymentMethod === 'apple-pay' && <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-[#1a1d24]" />}
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {/* Manual Payments Section */}
              <div>
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4 px-2">الدفع اليدوي (تأكيد بشري)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Phone Cash */}
                  {settings?.enable_phone_cash && (
                    <label className={`flex items-center justify-between p-5 rounded-3xl border-2 transition-all cursor-pointer ${paymentMethod === 'phone-cash' ? 'border-orange-500 bg-orange-50/30' : 'border-zinc-100 bg-zinc-50 dark:bg-[#0f1115]/50 hover:border-zinc-200'}`}>
                      <div className="flex flex-col gap-2">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${paymentMethod === 'phone-cash' ? 'bg-orange-500 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}>
                          <Smartphone size={20} />
                        </div>
                        <p className={`font-black text-[10px] ${paymentMethod === 'phone-cash' ? 'text-orange-900' : 'text-zinc-900 dark:text-white'}`}>تليفون كاش</p>
                      </div>
                      <input 
                        type="radio" 
                        name="payment" 
                        value="phone-cash"
                        checked={paymentMethod === 'phone-cash'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="hidden" 
                      />
                    </label>
                  )}

                  {/* InstaPay */}
                  {settings?.enable_instapay && (
                    <label className={`flex items-center justify-between p-5 rounded-3xl border-2 transition-all cursor-pointer ${paymentMethod === 'instapay' ? 'border-purple-600 bg-purple-50/30' : 'border-zinc-100 bg-zinc-50 dark:bg-[#0f1115]/50 hover:border-zinc-200'}`}>
                      <div className="flex flex-col gap-2">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${paymentMethod === 'instapay' ? 'bg-purple-600 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}>
                          <Smartphone size={20} />
                        </div>
                        <p className={`font-black text-[10px] ${paymentMethod === 'instapay' ? 'text-purple-900' : 'text-zinc-900 dark:text-white'}`}>إنستا باي</p>
                      </div>
                      <input 
                        type="radio" 
                        name="payment" 
                        value="instapay"
                        checked={paymentMethod === 'instapay'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="hidden" 
                      />
                    </label>
                  )}

                  {/* Fawry */}
                  {settings?.enable_fawry && (
                    <label className={`flex items-center justify-between p-5 rounded-3xl border-2 transition-all cursor-pointer ${paymentMethod === 'fawry' ? 'border-yellow-500 bg-yellow-50/30' : 'border-zinc-100 bg-zinc-50 dark:bg-[#0f1115]/50 hover:border-zinc-200'}`}>
                      <div className="flex flex-col gap-2">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${paymentMethod === 'fawry' ? 'bg-yellow-500 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}>
                          <Wallet size={20} />
                        </div>
                        <p className={`font-black text-[10px] ${paymentMethod === 'fawry' ? 'text-yellow-900' : 'text-zinc-900 dark:text-white'}`}>فوري كاش</p>
                      </div>
                      <input 
                        type="radio" 
                        name="payment" 
                        value="fawry"
                        checked={paymentMethod === 'fawry'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Dynamic Content Based on Payment Method */}
            <AnimatePresence mode="wait">
              {paymentMethod === 'visa' && (
                <motion.div 
                  key="visa-form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-8 space-y-6 bg-zinc-50 dark:bg-[#0f1115] p-6 rounded-[2rem] border border-zinc-100"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-zinc-500 mb-2 uppercase tracking-widest px-2">رقم البطاقة</label>
                      <input 
                        type="text" 
                        className="w-full bg-white dark:bg-[#1a1d24] border-2 border-transparent focus:border-red-600 rounded-2xl py-4 px-6 outline-none transition-all text-sm font-black shadow-sm" 
                        placeholder="0000 0000 0000 0000" 
                        dir="ltr" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-zinc-500 mb-2 uppercase tracking-widest px-2">تاريخ الانتهاء</label>
                      <input 
                        type="text" 
                        className="w-full bg-white dark:bg-[#1a1d24] border-2 border-transparent focus:border-red-600 rounded-2xl py-4 px-6 outline-none transition-all text-sm font-black shadow-sm" 
                        placeholder="MM/YY" 
                        dir="ltr" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-zinc-500 mb-2 uppercase tracking-widest px-2">رمز الحماية CVV</label>
                      <input 
                        type="text" 
                        className="w-full bg-white dark:bg-[#1a1d24] border-2 border-transparent focus:border-red-600 rounded-2xl py-4 px-6 outline-none transition-all text-sm font-black shadow-sm" 
                        placeholder="***" 
                        dir="ltr" 
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {(paymentMethod === 'fawry' || paymentMethod === 'instapay' || paymentMethod === 'phone-cash') && (
                <motion.div 
                  key="manual-instructions"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-8 p-8 rounded-[2rem] border-2 border-dashed border-zinc-200 bg-zinc-50 dark:bg-[#0f1115]"
                >
                  <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 mb-2">
                      <Copy size={20} />
                    </div>
                    <h3 className="text-lg font-black">تعليمات الدفع اليدوي</h3>
                    <p className="text-sm font-bold text-zinc-500 leading-relaxed">
                      يرجى التحويل إلى الحساب التالي ثم الضغط على "تأكيد الدفع". 
                      سيقوم فريقنا بمراجعة التحويل وشحن طلبك خلال دقائق.
                    </p>
                    
                    <div className="bg-white dark:bg-[#1a1d24] p-6 rounded-2xl shadow-sm border border-zinc-100 flex items-center justify-between gap-4">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-zinc-400 uppercase">رقم الحساب / المحفظة</p>
                        <p className="text-xl font-black tracking-wider" dir="ltr">
                          {paymentMethod === 'phone-cash' ? settings?.phone_cash_number : paymentMethod === 'instapay' ? settings?.instapay_id : settings?.fawry_number}
                        </p>
                        <p className="text-[10px] font-bold text-orange-600 mt-1">
                          {paymentMethod === 'phone-cash' ? 'فودافون كاش / أورنج كاش / اتصالات كاش' : ''}
                        </p>
                      </div>
                      <button 
                        onClick={() => {
                          const val = paymentMethod === 'phone-cash' ? settings?.phone_cash_number : paymentMethod === 'instapay' ? settings?.instapay_id : settings?.fawry_number;
                          navigator.clipboard.writeText(val);
                          addToast('تم نسخ الرقم بنجاح ✨', 'success');
                        }}
                        className="bg-black text-white px-4 py-2 rounded-xl text-xs font-black active:scale-95 transition-all"
                      >
                        نسخ البيانات
                      </button>
                    </div>

                    <div className="flex items-center gap-2 justify-center text-[10px] font-black text-red-600 bg-red-50 py-2 rounded-full">
                      <ShieldCheck size={12} />
                      <span>يرجى الاحتفاظ بصورة من إيصال التحويل</span>
                    </div>

                    {/* Screenshot Upload UI */}
                    <div className="mt-6 pt-6 border-t border-zinc-200">
                      <p className="text-[10px] font-black text-zinc-500 mb-3 uppercase tracking-widest text-right">رفع إيصال التحويل (مطلوب)</p>
                      <label className={`relative flex flex-col items-center justify-center w-full h-32 rounded-3xl border-2 border-dashed transition-all cursor-pointer ${paymentScreenshot ? 'border-emerald-500 bg-emerald-50/30' : 'border-zinc-300 bg-white dark:bg-[#1a1d24] hover:border-red-400'}`}>
                        {paymentScreenshot ? (
                          <div className="flex flex-col items-center gap-2">
                             <CheckCircle2 size={32} className="text-emerald-500" />
                             <p className="text-xs font-black text-emerald-900">{paymentScreenshot.name}</p>
                             <button 
                               onClick={(e) => { e.preventDefault(); setPaymentScreenshot(null); }}
                               className="text-[10px] font-bold text-red-600 underline"
                             >
                               تغيير الصورة
                             </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-[#1a1d24] flex items-center justify-center text-zinc-400">
                              <Smartphone size={20} />
                            </div>
                            <p className="text-xs font-black text-zinc-900 dark:text-white">اضغط هنا لرفع الصورة</p>
                            <p className="text-[9px] font-bold text-zinc-400">PNG, JPG up to 5MB</p>
                          </div>
                        )}
                        <input 
                          type="file" 
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setPaymentScreenshot(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-[#1a1d24] border border-zinc-100 rounded-[2.5rem] p-8 sticky top-4 shadow-xl shadow-zinc-200/50">
            <h2 className="text-xl font-black mb-6 border-b border-zinc-100 pb-5">ملخص الطلب</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500 font-black">المجموع الفرعي:</span>
                <span className="font-black text-zinc-900 dark:text-white">{formatPrice(totalPrice)}</span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-xs">
                  <span className="text-green-600 font-black">الخصم ({appliedCoupon.code}):</span>
                  <span className="font-black text-green-600">-{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-xs">
                <span className="text-zinc-500 font-black">رسوم المعالجة والشحن:</span>
                <span className={`${shippingFee === 0 ? 'text-green-600' : 'text-zinc-900 dark:text-white'} font-black`}>
                  {shippingFee === 0 ? 'مجاني' : formatPrice(shippingFee)}
                </span>
              </div>
              
              {/* Cart Items Preview */}
              <div className="pt-4 space-y-3">
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-zinc-100">
                      <img src={item.image_url || null} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-zinc-900 dark:text-white truncate">{item.title}</p>
                      <p className="text-[9px] font-bold text-zinc-400">كمية: {item.quantity}</p>
                    </div>
                    <p className="text-[10px] font-black text-red-600">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-zinc-100 pt-6 flex justify-between items-center">
                <span className="font-black text-sm">الإجمالي النهائي:</span>
                <span className="font-black text-red-700 text-3xl tracking-tighter">{formatPrice(finalPrice)}</span>
              </div>
            </div>

            {/* Terms and Conditions Checkbox */}
            <div className="mb-6 px-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    id="terms-checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-zinc-300 transition-all checked:bg-red-600 checked:border-red-600 focus:ring-0"
                  />
                  <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                </div>
                <p className="text-[11px] font-black text-zinc-600 select-none">
                  لقد قرأت وأوافق على <button type="button" onClick={() => setShowTermsModal(true)} className="text-red-700 underline underline-offset-2 hover:text-red-800">الشروط والأحكام وسياسة الاسترجاع</button>
                </p>
              </label>
            </div>

            <button 
              onClick={handlePayment}
              disabled={isProcessing}
              className={`w-full font-black py-5 rounded-2xl shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 ${
                termsAccepted 
                  ? 'bg-black text-white hover:bg-zinc-800 shadow-black/10' 
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed shadow-none'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  <span>جاري المعالجة...</span>
                </>
              ) : (
                'تأكيد الدفع وإتمام الطلب'
              )}
            </button>
            <div className="mt-6 flex items-center justify-center gap-3 text-zinc-400 font-black text-[10px]">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>دفع آمن ومحمي 100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Terms Modal */}
      <AnimatePresence>
        {showTermsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTermsModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#1a1d24] rounded-[2.5rem] shadow-2xl overflow-hidden"
              dir="rtl"
            >
              <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-zinc-900 dark:text-white leading-tight">الشروط والأحكام</h2>
                  <p className="text-xs font-bold text-zinc-400 mt-1">يرجى قراءة البنود التالية بعناية</p>
                </div>
                <button 
                  onClick={() => setShowTermsModal(false)}
                  className="w-10 h-10 rounded-full bg-zinc-50 dark:bg-[#0f1115] flex items-center justify-center text-zinc-400 hover:text-red-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-red-50 flex-shrink-0 flex items-center justify-center text-red-600 font-black text-sm">١</div>
                    <div className="space-y-1">
                      <h4 className="font-black text-zinc-900 dark:text-white text-sm">سياسة الاسترجاع</h4>
                      <p className="text-xs font-bold text-zinc-500 leading-relaxed">
                        لا يحق للعميل طلب استرجاع المبلغ بعد بدء معالجة الطلب، سواء كان الدفع يدوياً أو من خلال بوابة الدفع الآلية.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-red-50 flex-shrink-0 flex items-center justify-center text-red-600 font-black text-sm">٢</div>
                    <div className="space-y-1">
                      <h4 className="font-black text-zinc-900 dark:text-white text-sm">دقة البيانات</h4>
                      <p className="text-xs font-bold text-zinc-500 leading-relaxed">
                        العميل مسؤول مسؤولية كاملة عن صحة البيانات المدخلة، مثل اسم المستخدم (Username) أو الـ ID الخاص بالحساب.
                      </p>
                    </div>
                   </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-red-50 flex-shrink-0 flex items-center justify-center text-red-600 font-black text-sm">٣</div>
                    <div className="space-y-1">
                      <h4 className="font-black text-zinc-900 dark:text-white text-sm">مدة المعالجة</h4>
                      <p className="text-xs font-bold text-zinc-500 leading-relaxed">
                        تتم معالجة الطلبات وتنفيذها خلال فترة تتراوح بين 15 دقيقة و12 ساعة عمل كحد أقصى.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-red-50 flex-shrink-0 flex items-center justify-center text-red-600 font-black text-sm">٤</div>
                    <div className="space-y-1">
                      <h4 className="font-black text-zinc-900 dark:text-white text-sm">الإقرار القانوني</h4>
                      <p className="text-xs font-bold text-zinc-500 leading-relaxed">
                        بإتمامك لعملية الشحن للروبوكس أو أي خدمة رقمية، فأنت تقر بصحة العملية وتوافق على كافة الشروط المذكورة.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-zinc-50 dark:bg-[#0f1115] border-t border-zinc-100">
                <button 
                  onClick={() => {
                    setTermsAccepted(true);
                    setShowTermsModal(false);
                  }}
                  className="w-full bg-red-600 text-white font-black py-4 rounded-2xl hover:bg-red-700 shadow-xl shadow-red-600/10 transition-all active:scale-[0.98]"
                >
                  قرأت وأوافق على جميع الشروط
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

