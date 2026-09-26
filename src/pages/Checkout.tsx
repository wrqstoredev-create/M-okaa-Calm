/**
 * Checkout.tsx â€” GamePay  (UI redesign â€” zero logic changes)
 *
 * What changed vs. original (UI only):
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * Layout
 *   â€¢ One-Step: everything on one page â€” no wizard steps.
 *   â€¢ Left (lg): sticky Order Summary with item list, price breakdown,
 *     coupon badge, terms checkbox, and the CTA confirm button.
 *   â€¢ Right (lg): Payment method picker + dynamic panel per method.
 *   â€¢ On mobile: Order Summary collapses at bottom; form first.
 *
 * Payment method cards
 *   â€¢ Bigger, clearer card tiles â€” icon + label + description.
 *   â€¢ Colour-coded per method (visa=blue, apple=black, fawry=yellow, â€¦).
 *   â€¢ Animated selection ring using layoutId spring.
 *
 * Empty / Success states
 *   â€¢ Richer success animation + confetti dots.
 *
 * All backend logic (handlePayment, screenshot upload, Discord notify,
 * Supabase order/order_items inserts) is preserved 1-to-1.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCurrency }   from '../contexts/CurrencyContext';
import { useCart }       from '../contexts/CartContext';
import { useToast }      from '../contexts/ToastContext';
import { useAuth }       from '../contexts/AuthContext';
import { supabase }      from '../lib/supabaseClient';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import {
  CreditCard, Wallet, Smartphone,
  ShieldCheck, CheckCircle2, ChevronRight,
  Copy, Loader2, X, Upload, ShoppingBag,
  Zap, Tag, AlertTriangle,
} from 'lucide-react';

/* â”€â”€â”€ Payment method config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
interface PayMethod {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;        // tailwind bg class â€” active icon bg
  border: string;       // tailwind border class â€” active card border
  bg: string;           // tailwind bg class â€” active card bg
  auto: boolean;        // true = automatic / false = manual
  settingKey: string;   // key in settings table
}

const PAY_METHODS: PayMethod[] = [
  {
    id: 'visa', label: 'ظپظٹط²ط§ / ظ…ط§ط³طھط±ظƒط§ط±ط¯', description: 'ط¯ظپط¹ ظپظˆط±ظٹ ظˆظ…ط¨ط§ط´ط±',
    icon: <CreditCard size={20} />,
    color: 'bg-blue-600', border: 'border-blue-600', bg: 'bg-blue-50/40 dark:bg-blue-900/10',
    auto: true, settingKey: 'enable_visa',
  },
  {
    id: 'apple-pay', label: 'Apple Pay', description: 'ظ…ظ† ظ‡ط§طھظپظƒ ظ…ط¨ط§ط´ط±ط©',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
    ),
    color: 'bg-zinc-900', border: 'border-zinc-900', bg: 'bg-zinc-50 dark:bg-zinc-900/20',
    auto: true, settingKey: 'enable_apple_pay',
  },
  {
    id: 'phone-cash', label: 'طھظ„ظٹظپظˆظ† ظƒط§ط´', description: 'ظپظˆط¯ط§ظپظˆظ† / ط§طھطµط§ظ„ط§طھ / ط£ظˆط±ظ†ط¬',
    icon: <Smartphone size={20} />,
    color: 'bg-orange-500', border: 'border-orange-500', bg: 'bg-orange-50/40 dark:bg-orange-900/10',
    auto: false, settingKey: 'enable_phone_cash',
  },
  {
    id: 'instapay', label: 'InstaPay', description: 'طھط­ظˆظٹظ„ ط¥ظ„ظƒطھط±ظˆظ†ظٹ ظپظˆط±ظٹ',
    icon: <Wallet size={20} />,
    color: 'bg-purple-600', border: 'border-purple-600', bg: 'bg-purple-50/40 dark:bg-purple-900/10',
    auto: false, settingKey: 'enable_instapay',
  },
  {
    id: 'fawry', label: 'ظپظˆط±ظٹ', description: 'ط§ط¯ظپط¹ ظ…ظ† ط£ظ‚ط±ط¨ ظپط±ط¹ ظپظˆط±ظٹ',
    icon: <Wallet size={20} />,
    color: 'bg-yellow-500', border: 'border-yellow-500', bg: 'bg-yellow-50/40 dark:bg-yellow-900/10',
    auto: false, settingKey: 'enable_fawry',
  },
];

/* â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function getAccountNumber(settings: any, method: string): string {
  if (method === 'phone-cash') return settings?.phone_cash_number || 'â€“';
  if (method === 'instapay')   return settings?.instapay_id       || 'â€“';
  if (method === 'fawry')      return settings?.fawry_number      || 'â€“';
  return 'â€“';
}

/* â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
   Main Component
â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ */
export default function Checkout() {
  const navigate         = useNavigate();
  const { user, profile } = useAuth();
  useEffect(() => { if (profile?.is_banned) { navigate('/profile', { replace: true }); } }, [profile, navigate]);
  const { formatPrice, currency } = useCurrency();
  const { items, totalPrice, finalPrice, discountAmount, shippingFee, appliedCoupon, clearCart } = useCart();
  const { addToast }     = useToast();

  const isItemOutOfStock = (item: any) => item.stock !== undefined && item.stock !== null && Number(item.stock) <= 0;
  const hasOutOfStock = items.some(isItemOutOfStock);

  const [paymentMethod,     setPaymentMethod]     = useState('');
  const [settings,          setSettings]          = useState<any>(null);
  const [isProcessing,      setIsProcessing]      = useState(false);
  const [isSuccess,         setIsSuccess]         = useState(false);
  const [termsAccepted,     setTermsAccepted]     = useState(false);
  const [showTermsModal,    setShowTermsModal]     = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [isUploading,       setIsUploading]       = useState(false);
  const [createdOrder,      setCreatedOrder]      = useState<any>(null);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase.from('settings').select('*').single();
      if (data) {
        setSettings(data);
        if (data.enable_visa)        setPaymentMethod('visa');
        else if (data.enable_apple_pay)  setPaymentMethod('apple-pay');
        else if (data.enable_phone_cash) setPaymentMethod('phone-cash');
        else if (data.enable_instapay)   setPaymentMethod('instapay');
        else if (data.enable_fawry)      setPaymentMethod('fawry');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const isAutomatic = paymentMethod === 'visa' || paymentMethod === 'apple-pay';
  const isManual    = !isAutomatic;

  /* â”€â”€ handlePayment â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const handlePayment = async () => {
    if (hasOutOfStock) {
      addToast('ط³ظ„طھظƒ طھط­طھظˆظٹ ط¹ظ„ظ‰ ظ…ظ†طھط¬ط§طھ ط؛ظٹط± ظ…طھظˆظپط±ط©طŒ ظٹط±ط¬ظ‰ ط¥ط²ط§ظ„طھظ‡ط§ ط£ظˆظ„ط§ظ‹ âڑ ï¸ڈ', 'error');
      navigate('/cart');
      return;
    }
    if (!paymentMethod) {
      addToast('ظٹط±ط¬ظ‰ ط§ط®طھظٹط§ط± ظˆط³ظٹظ„ط© ط§ظ„ط¯ظپط¹', 'error');
      return;
    }
    if (!termsAccepted) {
      addToast('ظٹط±ط¬ظ‰ ط§ظ„ظ…ظˆط§ظپظ‚ط© ط¹ظ„ظ‰ ط§ظ„ط´ط±ظˆط· ظˆط§ظ„ط£ط­ظƒط§ظ… ظ„ظ„ظ…طھط§ط¨ط¹ط© ًں“„', 'error');
      return;
    }
    if (isManual && !paymentScreenshot) {
      addToast('ظٹط±ط¬ظ‰ ط±ظپط¹ طµظˆط±ط© ط¥ظٹطµط§ظ„ ط§ظ„طھط­ظˆظٹظ„ ظ„ط¶ظ…ط§ظ† طھط£ظƒظٹط¯ ط·ظ„ط¨ظƒ ًں“¸', 'error');
      return;
    }

    setIsProcessing(true);
    let screenshotUrl = '';

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        addToast('ط§ظ†طھظ‡طھ طµظ„ط§ط­ظٹط© ط§ظ„ط¬ظ„ط³ط©طŒ ظٹط±ط¬ظ‰ طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„ ظ…ط±ط© ط£ط®ط±ظ‰', 'error');
        navigate('/login');
        return;
      }

      if (paymentScreenshot) {
        setIsUploading(true);
        const fileExt  = paymentScreenshot.name.split('.').pop();
        const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
        const filePath = `screenshots/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('payment-screenshots')
          .upload(filePath, paymentScreenshot);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('payment-screenshots')
          .getPublicUrl(filePath);
        screenshotUrl = publicUrl;
        setIsUploading(false);
      }

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: session.user.id,
          total_price: finalPrice,
          payment_method: `${paymentMethod}___${currency}`,
          customer_email: session.user.email || 'guest@example.com',
          payment_screenshot_url: screenshotUrl,
          status: isManual ? 'pending' : 'processing',
          coupon_code: appliedCoupon?.code || null,
          discount_amount: discountAmount,
        })
        .select()
        .single();
      if (orderError) throw orderError;
      setCreatedOrder(orderData);

      const orderItems = items.map(item => {
        const username = item.attributes?.username || item.customerData?.player_username || (item.customerData as any)?.username || null;
        const playerId = item.attributes?.id || item.customerData?.player_id || null;
        const phone    = item.attributes?.phone || item.customerData?.player_phone || null;
        const social   = item.attributes?.social || item.customerData?.player_social || null;

        const attributesObj = item.attributes || {
          username: username || undefined,
          phone: phone || undefined,
          id: playerId || undefined,
          social: social || undefined,
        };

        const notesJson = JSON.stringify(attributesObj);

        return {
          order_id:        orderData.id,
          product_id:      item.id,
          quantity:        item.quantity,
          unit_price:      item.price,
          player_id:       playerId,
          player_username: username,
          player_social:   social,
          player_phone:    phone,
          notes:           notesJson,
        };
      });

      // Try inserting with notes column
      let { error: itemsError } = await supabase.from('order_items').insert(orderItems);

      // Fallback: if 'notes' column doesn't exist in Supabase schema, insert without 'notes'
      if (itemsError && itemsError.message && (itemsError.message.includes('notes') || itemsError.code === '42703')) {
        console.warn('Retrying order_items insert without notes column:', itemsError.message);
        const fallbackOrderItems = orderItems.map(({ notes, ...rest }) => rest);
        const { error: retryError } = await supabase.from('order_items').insert(fallbackOrderItems);
        itemsError = retryError;
      }

      if (itemsError) throw itemsError;

      try {
        const API_BASE  = import.meta.env.VITE_API_URL || '';
        const notifyRes = await fetch(`${API_BASE}/api/notify-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: orderData, items }),
        });
        if (!notifyRes.ok) {
          const ct = notifyRes.headers.get('content-type');
          if (ct?.includes('application/json')) {
            console.error('Discord notify API error:', await notifyRes.json());
          } else {
            console.error(`Discord notify HTTP ${notifyRes.status}:`, await notifyRes.text());
          }
        }
      } catch (notifyError: any) {
        console.error('Failed to reach notification API:', notifyError.message);
      }

      setIsProcessing(false);
      setIsSuccess(true);
      addToast('طھظ… ط§ط³طھظ„ط§ظ… ط·ظ„ط¨ظƒ ظˆط¨ط§ظ†طھط¸ط§ط± ظ…ط±ط§ط¬ط¹ط© ط§ظ„طھط­ظˆظٹظ„ âœ…', 'success');
      clearCart();

    } catch (error) {
      console.error('Payment error:', error);
      addToast('ط­ط¯ط« ط®ط·ط£ ط£ط«ظ†ط§ط، ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ط·ظ„ط¨ â‌Œ', 'error');
      setIsProcessing(false);
      setIsUploading(false);
    }
  };

  /* â”€â”€ Empty cart state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  if (items.length === 0 && !isSuccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center gap-6" dir="rtl">
        <div className="w-20 h-20 bg-gray-100 dark:bg-[#1a1d24] rounded-full flex items-center justify-center">
          <ShoppingBag size={36} className="text-gray-400" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white mb-2">ط§ظ„ط³ظ„ط© ظپط§ط±ط؛ط©</h1>
          <p className="text-sm font-bold text-gray-400">ظ„ط§ طھظˆط¬ط¯ ظ…ظ†طھط¬ط§طھ ظ„ظ„ط¯ظپط¹ ط­ط§ظ„ظٹط§ظ‹</p>
        </div>
        <Link
          to="/store"
          className="bg-red-700 hover:bg-red-800 text-white px-8 py-3.5 rounded-2xl font-black transition-all active:scale-95 shadow-lg shadow-red-700/20"
        >
          طھطµظپط­ ط§ظ„ظ…طھط¬ط±
        </Link>
      </div>
    );
  }

  /* â”€â”€ Success state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  if (isSuccess) {
    const rawWa = settings?.whatsapp_number || settings?.phone_cash_number || 'mokaa3';
    const waClean = rawWa.replace(/[^a-zA-Z0-9]/g, '');
    const orderCode = createdOrder?.id ? `#${createdOrder.id.slice(0, 8).toUpperCase()}` : '';
    const waMessage = encodeURIComponent(
      `مرحباً، قمت بإتمام الطلب رقم: ${orderCode} بقيمة ${formatPrice(finalPrice)}، وأرجو تأكيد وسرعة التنفيذ والشحن وشكراً لك!`
    );
    const waUrl = rawWa.startsWith('http') ? rawWa : `https://wa.me/${waClean}?text=${waMessage}`;

    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 text-center gap-6" dir="rtl">
        {/* Confetti dots */}
        <div className="relative">
          {['top-0 left-1/2', 'top-4 right-4', 'top-4 left-4', 'bottom-0 left-1/3', 'bottom-0 right-1/3'].map((pos, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, y: [-0, -24 - i * 8, -16 - i * 8] }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.6, type: 'spring' }}
              className={`absolute w-3 h-3 rounded-full ${['bg-red-500','bg-emerald-500','bg-amber-400','bg-blue-400','bg-purple-400'][i]} ${pos}`}
            />
          ))}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
            className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
          >
            <CheckCircle2 size={48} className="text-emerald-600 dark:text-emerald-400" />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3 max-w-md"
        >
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">ط´ظƒط±ط§ظ‹ ظ„ط·ظ„ط¨ظƒ! ًںژ‰</h1>
          <p className="text-sm font-bold text-gray-500 max-w-sm leading-relaxed">
            {isManual
              ? 'طھظ… ط§ط³طھظ„ط§ظ… ط·ظ„ط¨ظƒ ظˆظ‡ظˆ ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط©. ط³ظٹطھظ… ط´ط­ظ† ظ…ظ†طھط¬ط§طھظƒ ط®ظ„ط§ظ„ ط¯ظ‚ط§ط¦ظ‚ ط¨ط¹ط¯ طھط£ظƒظٹط¯ ط§ظ„طھط­ظˆظٹظ„.'
              : 'طھظ…طھ ظ…ط¹ط§ظ„ط¬ط© ط·ظ„ط¨ظƒ ط¨ظ†ط¬ط§ط­ ظˆط³ظٹطھظ… ط´ط­ظ† ظ…ظ†طھط¬ط§طھظƒ ط¥ظ„ظ‰ ط­ط³ط§ط¨ظƒ ظپظˆط±ط§ظ‹.'}
          </p>

          {/* Order Details Badge Card with Copy */}
          {createdOrder?.id && (
            <div className="bg-gray-50 dark:bg-[#12131a] border border-gray-200 dark:border-white/10 rounded-2xl p-4 mt-4 text-right flex items-center justify-between gap-3 shadow-xs">
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">رقم الطلب (Order ID)</span>
                <span className="font-mono text-base font-black text-gray-900 dark:text-white tracking-wider">
                  {orderCode}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(createdOrder.id);
                  addToast('تم نسخ رقم الطلب بنجاح 📋', 'success');
                }}
                className="flex items-center gap-1.5 bg-white dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 border border-gray-200 dark:border-white/10 px-3 py-2 rounded-xl text-xs font-black text-gray-800 dark:text-white shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <Copy size={13} />
                <span>نسخ الرقم</span>
              </button>
            </div>
          )}
        </motion.div>

        {/* Action Buttons: WhatsApp & Direct Links */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md"
        >
          {/* Direct WhatsApp Followup CTA */}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:flex-1 bg-[#25D366] hover:bg-[#20ba59] text-white px-6 py-4 rounded-2xl font-black shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer whitespace-nowrap"
          >
            <WhatsAppIcon size={18} />
            <span>تتبع الطلب بالواتساب 💬</span>
          </a>

          <Link
            to="/profile"
            className="w-full sm:w-auto bg-gray-100 dark:bg-[#1a1d24] hover:bg-gray-200 dark:hover:bg-zinc-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white px-6 py-4 rounded-2xl font-black active:scale-95 transition-all text-xs sm:text-sm"
          >
            متابعة طلباتي
          </Link>

          <Link
            to="/"
            className="w-full sm:w-auto bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 px-5 py-4 rounded-2xl font-bold active:scale-95 transition-all text-xs sm:text-sm"
          >
            الرئيسية
          </Link>
        </motion.div>
      </div>
    );
  }

  /* â”€â”€ Available methods filter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const availableMethods = PAY_METHODS.filter(m => settings?.[m.settingKey]);
  const autoMethods      = availableMethods.filter(m => m.auto);
  const manualMethods    = availableMethods.filter(m => !m.auto);
  const selectedMethod   = PAY_METHODS.find(m => m.id === paymentMethod);
  const accountNumber    = getAccountNumber(settings, paymentMethod);

  /* â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
     Render
  â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ */
  return (
    <div className="flex-1 w-full bg-gray-50 dark:bg-[#0f1115]" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">

        {/* â”€â”€ Page header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            to="/cart"
            className="w-10 h-10 bg-white dark:bg-[#1a1d24] border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center text-gray-500 hover:text-red-700 transition-colors shadow-sm"
          >
            <ChevronRight size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white">ط¥طھظ…ط§ظ… ط§ظ„ط·ظ„ط¨</h1>
            <p className="text-[11px] font-bold text-gray-400 mt-0.5">{items.length} ظ…ظ†طھط¬ ظپظٹ ط³ظ„طھظƒ</p>
          </div>
          {/* Security badge */}
          <div className="mr-auto flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 text-emerald-700 text-[11px] font-black px-3 py-1.5 rounded-full">
            <ShieldCheck size={13} />
            ط¯ظپط¹ ط¢ظ…ظ† 100%
          </div>
        </div>

        {/* Out of stock top banner */}
        {hasOutOfStock && (
          <div className="mb-6 bg-red-500/15 border-2 border-red-500/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-600 dark:text-red-400">
            <div className="flex items-center gap-3">
              <AlertTriangle size={24} className="flex-shrink-0 animate-bounce text-red-500" />
              <div>
                <h4 className="font-black text-sm">طھظ†ط¨ظٹظ‡: ط³ظ„طھظƒ طھط­طھظˆظٹ ط¹ظ„ظ‰ ظ…ظ†طھط¬ط§طھ ظ†ظپط¯طھ ظƒظ…ظٹطھظ‡ط§!</h4>
                <p className="text-xs font-bold opacity-90">ظ„ط§ ظٹظ…ظƒظ†ظƒ ط¥طھظ…ط§ظ… ط§ظ„ط¯ظپط¹ ط­طھظ‰ طھظ‚ظˆظ… ط¨ط¥ط²ط§ظ„ط© ظ‡ط°ظ‡ ط§ظ„ظ…ظ†طھط¬ط§طھ ظ…ظ† ط³ظ„طھظƒ ط£ظˆظ„ط§ظ‹.</p>
              </div>
            </div>
            <Link to="/cart" className="bg-red-600 hover:bg-red-700 text-white text-xs font-black px-4 py-2 rounded-xl transition-colors self-start sm:self-auto">
              ط§ظ„ط¹ظˆط¯ط© ظ„ظ„ط³ظ„ط© ظˆط§ظ„ط­ط°ظپ
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* â”€â”€ RIGHT: Payment methods + dynamic panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="lg:col-span-7 space-y-5 order-2 lg:order-1">

            {/* Payment method selector */}
            <div className="bg-white dark:bg-[#1a1d24] border border-gray-100 dark:border-gray-700 rounded-3xl p-6 shadow-sm">
              <h2 className="text-base font-black text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                <CreditCard size={18} className="text-red-600" />
                ط§ط®طھط± ظˆط³ظٹظ„ط© ط§ظ„ط¯ظپط¹
              </h2>

              <LayoutGroup>
                {/* Auto methods */}
                {autoMethods.length > 0 && (
                  <div className="mb-5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <Zap size={10} className="text-emerald-500" /> ط¯ظپط¹ طھظ„ظ‚ط§ط¦ظٹ ظپظˆط±ظٹ
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {autoMethods.map(m => (
                        <PayCard
                          key={m.id}
                          method={m}
                          selected={paymentMethod === m.id}
                          onSelect={() => setPaymentMethod(m.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Manual methods */}
                {manualMethods.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <Upload size={10} /> ط¯ظپط¹ ظٹط¯ظˆظٹ (طھط£ظƒظٹط¯ ط¨ط´ط±ظٹ)
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {manualMethods.map(m => (
                        <PayCard
                          key={m.id}
                          method={m}
                          selected={paymentMethod === m.id}
                          onSelect={() => setPaymentMethod(m.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </LayoutGroup>
            </div>

            {/* â”€â”€ Dynamic panel per selected method â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <AnimatePresence mode="wait">
              {/* Visa card form */}
              {paymentMethod === 'visa' && (
                <motion.div
                  key="visa-panel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white dark:bg-[#1a1d24] border border-gray-100 dark:border-gray-700 rounded-3xl p-6 shadow-sm"
                >
                  <h3 className="text-sm font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <CreditCard size={15} className="text-blue-600" /> ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¨ط·ط§ظ‚ط©
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black text-gray-500 mb-1.5 uppercase tracking-wider">ط±ظ‚ظ… ط§ظ„ط¨ط·ط§ظ‚ط©</label>
                      <input
                        type="text"
                        className="w-full bg-gray-50 dark:bg-[#0f1115] border-2 border-transparent focus:border-blue-500 rounded-xl py-3.5 px-4 outline-none transition-all text-sm font-black text-left"
                        placeholder="0000 0000 0000 0000"
                        dir="ltr"
                        maxLength={19}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 mb-1.5 uppercase tracking-wider">طھط§ط±ظٹط® ط§ظ„ط§ظ†طھظ‡ط§ط،</label>
                      <input
                        type="text"
                        className="w-full bg-gray-50 dark:bg-[#0f1115] border-2 border-transparent focus:border-blue-500 rounded-xl py-3.5 px-4 outline-none transition-all text-sm font-black text-left"
                        placeholder="MM/YY"
                        dir="ltr"
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 mb-1.5 uppercase tracking-wider">ط±ظ…ط² CVV</label>
                      <input
                        type="password"
                        className="w-full bg-gray-50 dark:bg-[#0f1115] border-2 border-transparent focus:border-blue-500 rounded-xl py-3.5 px-4 outline-none transition-all text-sm font-black text-left"
                        placeholder="â€¢â€¢â€¢"
                        dir="ltr"
                        maxLength={4}
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-gray-400">
                    <ShieldCheck size={12} className="text-emerald-500" />
                    ط¨ظٹط§ظ†ط§طھظƒ ظ…ط­ظ…ظٹط© ط¨طھط´ظپظٹط± SSL 256-bit
                  </div>
                </motion.div>
              )}

              {/* Manual payment instructions */}
              {isManual && paymentMethod && (
                <motion.div
                  key="manual-panel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white dark:bg-[#1a1d24] border border-gray-100 dark:border-gray-700 rounded-3xl p-6 shadow-sm space-y-5"
                >
                  {/* Steps */}
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white mb-4">
                      ط®ط·ظˆط§طھ ط§ظ„ط¯ظپط¹ ط¹ط¨ط± {selectedMethod?.label}
                    </h3>
                    <div className="space-y-3">
                      {[
                        { n: 'ظ،', text: `ط­ظˆظ‘ظ„ ط§ظ„ظ…ط¨ظ„ط؛ ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹ (${formatPrice(finalPrice)}) ط¥ظ„ظ‰ ط§ظ„ط±ظ‚ظ… ط£ط¯ظ†ط§ظ‡.` },
                        { n: 'ظ¢', text: 'ط§ظ„طھظ‚ط· طµظˆط±ط© ط¥ظٹطµط§ظ„ ط§ظ„طھط­ظˆظٹظ„.' },
                        { n: 'ظ£', text: 'ط§ط±ظپط¹ ط§ظ„طµظˆط±ط© ظˆط§ظ†ظ‚ط± "طھط£ظƒظٹط¯ ط§ظ„ط¯ظپط¹" â€” ط³ظٹطµظ„ظƒ ط´ط­ظ†ظƒ ط®ظ„ط§ظ„ ط¯ظ‚ط§ط¦ظ‚.' },
                      ].map(step => (
                        <div key={step.n} className="flex items-start gap-3">
                          <div className="w-7 h-7 bg-red-700 text-white rounded-xl flex items-center justify-center font-black text-[11px] flex-shrink-0">
                            {step.n}
                          </div>
                          <p className="text-xs font-bold text-gray-600 dark:text-gray-400 leading-relaxed pt-1">{step.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Account number card */}
                  <div className="bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">
                      ط±ظ‚ظ… ط§ظ„ط­ط³ط§ط¨ / ط§ظ„ظ…ط­ظپط¸ط©
                    </p>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xl font-black tracking-widest text-gray-900 dark:text-white" dir="ltr">
                        {accountNumber}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(accountNumber);
                          addToast('طھظ… ظ†ط³ط® ط§ظ„ط±ظ‚ظ… âœ¨', 'success');
                        }}
                        className="flex items-center gap-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-[11px] px-3 py-2 rounded-xl hover:opacity-80 transition-all active:scale-95"
                      >
                        <Copy size={12} /> ظ†ط³ط®
                      </button>
                    </div>
                    {paymentMethod === 'phone-cash' && (
                      <p className="text-[10px] font-bold text-orange-600 mt-2">
                        ظپظˆط¯ط§ظپظˆظ† ظƒط§ط´ آ· ط§طھطµط§ظ„ط§طھ ظƒط§ط´ آ· ط£ظˆط±ظ†ط¬ ظƒط§ط´
                      </p>
                    )}
                  </div>

                  {/* Screenshot upload */}
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-3">
                      ط±ظپط¹ ط¥ظٹطµط§ظ„ ط§ظ„طھط­ظˆظٹظ„ <span className="text-red-600">(ظ…ط·ظ„ظˆط¨)</span>
                    </p>
                    <label
                      className={[
                        'relative flex flex-col items-center justify-center',
                        'w-full h-36 rounded-2xl border-2 border-dashed',
                        'cursor-pointer transition-all',
                        paymentScreenshot
                          ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10'
                          : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#0f1115] hover:border-red-400',
                      ].join(' ')}
                    >
                      {paymentScreenshot ? (
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle2 size={30} className="text-emerald-500" />
                          <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 max-w-[180px] truncate">
                            {paymentScreenshot.name}
                          </p>
                          <button
                            onClick={(e) => { e.preventDefault(); setPaymentScreenshot(null); }}
                            className="text-[10px] font-bold text-red-600 hover:underline"
                          >
                            طھط؛ظٹظٹط± ط§ظ„طµظˆط±ط©
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-center">
                          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                            <Upload size={18} className="text-gray-400" />
                          </div>
                          <p className="text-xs font-black text-gray-700 dark:text-gray-300">ط§ط¶ط؛ط· ظ„ط±ظپط¹ ط§ظ„ط¥ظٹطµط§ظ„</p>
                          <p className="text-[10px] font-bold text-gray-400">PNG, JPG â€” ط­طھظ‰ 5MB</p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => e.target.files?.[0] && setPaymentScreenshot(e.target.files[0])}
                      />
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* â”€â”€ LEFT: Order summary (sticky) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="lg:col-span-5 order-1 lg:order-2">
            <div className="bg-white dark:bg-[#1a1d24] border border-gray-100 dark:border-gray-700 rounded-3xl p-6 shadow-sm lg:sticky lg:top-20 space-y-5">

              {/* Items list */}
              <div>
                <h2 className="text-base font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <ShoppingBag size={16} className="text-red-600" />
                  ظ…ظ„ط®طµ ط§ظ„ط·ظ„ط¨
                </h2>
                <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                  {items.map((item, idx) => {
                    const username = item.attributes?.username || item.customerData?.player_username || (item.customerData as any)?.username;
                    const playerId = item.attributes?.id || item.customerData?.player_id;
                    const isOos = isItemOutOfStock(item);

                    return (
                      <div key={idx} className={`flex items-center gap-3 p-2 rounded-2xl transition-colors ${isOos ? 'bg-red-500/10 border border-red-500/30' : ''}`}>
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 dark:bg-[#0f1115] border border-gray-100 dark:border-gray-700 flex-shrink-0 relative">
                          <img src={item.image_url || undefined} alt="" className="w-full h-full object-cover" />
                          {isOos && (
                            <span className="absolute inset-0 bg-red-950/70 flex items-center justify-center text-white text-[9px] font-black">
                              ظ†ظپط¯
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-black text-gray-900 dark:text-white truncate">{item.title}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-bold text-gray-400">أ—{item.quantity}</span>
                            {username && (
                              <span className="text-[9px] font-black text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.2 rounded border border-purple-200 dark:border-purple-800/40 truncate max-w-[120px]" dir="ltr">
                                {username}
                              </span>
                            )}
                            {playerId && (
                              <span className="text-[9px] font-black text-red-500 bg-red-50 dark:bg-red-950/40 px-1.5 py-0.2 rounded border border-red-200 dark:border-red-800/40 truncate max-w-[100px]" dir="ltr">
                                ID: {playerId}
                              </span>
                            )}
                          </div>
                          {isOos && (
                            <p className="text-[9px] font-black text-red-600 dark:text-red-400 mt-0.5">
                              âڑ ï¸ڈ ظ†ظپط¯ ظ…ظ† ط§ظ„ظ…ط®ط²ظˆظ†
                            </p>
                          )}
                        </div>
                        <p className="text-[12px] font-black text-red-700 flex-shrink-0">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Price breakdown */}
              <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-2.5">
                <div className="flex justify-between text-xs font-bold text-gray-500">
                  <span>{formatPrice(totalPrice)}</span>
                  <span>ط§ظ„ظ…ط¬ظ…ظˆط¹ ط§ظ„ظپط±ط¹ظٹ</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-xs font-black">
                    <span className="text-emerald-600">âˆ’{formatPrice(discountAmount)}</span>
                    <span className="flex items-center gap-1 text-emerald-600">
                      <Tag size={11} /> ظƒظˆط¨ظˆظ† ({appliedCoupon.code})
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-xs font-bold text-gray-500">
                  <span className={shippingFee === 0 ? 'text-emerald-600' : ''}>
                    {shippingFee === 0 ? 'ظ…ط¬ط§ظ†ظٹ ًںژ‰' : formatPrice(shippingFee)}
                  </span>
                  <span>ط±ط³ظˆظ… ط§ظ„ط´ط­ظ† ظˆط§ظ„ظ…ط¹ط§ظ„ط¬ط©</span>
                </div>

                <div className="flex justify-between items-baseline border-t border-gray-100 dark:border-gray-700 pt-3 mt-1">
                  <span className="text-2xl font-black text-red-700 tracking-tight">
                    {formatPrice(finalPrice)}
                  </span>
                  <span className="text-sm font-black text-gray-900 dark:text-white">ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظ†ظ‡ط§ط¦ظٹ</span>
                </div>
              </div>

              {/* Terms checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-gray-300 transition-all checked:bg-red-600 checked:border-red-600 focus:ring-0"
                  />
                  <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                    <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                </div>
                <p className="text-[11px] font-bold text-gray-600 dark:text-gray-400 leading-relaxed">
                  ظ„ظ‚ط¯ ظ‚ط±ط£طھ ظˆط£ظˆط§ظپظ‚ ط¹ظ„ظ‰{' '}
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="text-red-600 font-black underline underline-offset-2 hover:text-red-800"
                  >
                    ط§ظ„ط´ط±ظˆط· ظˆط§ظ„ط£ط­ظƒط§ظ… ظˆط³ظٹط§ط³ط© ط§ظ„ط§ط³طھط±ط¬ط§ط¹
                  </button>
                </p>
              </label>

              {/* Confirm button */}
              <button
                onClick={handlePayment}
                disabled={isProcessing || isUploading || hasOutOfStock}
                className={[
                  'w-full min-h-[54px] font-black rounded-2xl',
                  'flex items-center justify-center gap-3 text-sm',
                  'transition-all active:scale-[0.98]',
                  termsAccepted && paymentMethod && !hasOutOfStock
                    ? 'bg-red-700 hover:bg-red-800 text-white shadow-lg shadow-red-700/20 cursor-pointer'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed',
                  'disabled:opacity-60',
                ].join(' ')}
              >
                {isProcessing || isUploading ? (
                  <><Loader2 size={20} className="animate-spin" /> {isUploading ? 'ط¬ط§ط±ظٹ ط§ظ„ط±ظپط¹...' : 'ط¬ط§ط±ظٹ ط§ظ„ظ…ط¹ط§ظ„ط¬ط©...'}</>
                ) : hasOutOfStock ? (
                  <><AlertTriangle size={18} className="text-red-500" /> ظٹط±ط¬ظ‰ ط¥ط²ط§ظ„ط© ط§ظ„ظ…ظ†طھط¬ط§طھ ط؛ظٹط± ط§ظ„ظ…طھظˆظپط±ط©</>
                ) : (
                  <><ShieldCheck size={18} /> طھط£ظƒظٹط¯ ط§ظ„ط¯ظپط¹ ظˆط¥طھظ…ط§ظ… ط§ظ„ط·ظ„ط¨</>
                )}
              </button>

              <p className="text-center text-[10px] font-bold text-gray-400 flex items-center justify-center gap-1.5">
                <ShieldCheck size={11} className="text-emerald-500" />
                ط¬ظ…ظٹط¹ ط§ظ„ظ…ط¯ظپظˆط¹ط§طھ ظ…ط­ظ…ظٹط© ظˆط¢ظ…ظ†ط© ط¨ط§ظ„ظƒط§ظ…ظ„
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* â”€â”€ Terms Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
              className="relative w-full max-w-lg bg-white dark:bg-[#1a1d24] rounded-3xl shadow-2xl overflow-hidden"
              dir="rtl"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <h2 className="text-lg font-black text-gray-900 dark:text-white">ط§ظ„ط´ط±ظˆط· ظˆط§ظ„ط£ط­ظƒط§ظ…</h2>
                  <p className="text-[11px] font-bold text-gray-400 mt-0.5">ظٹط±ط¬ظ‰ ط§ظ„ظ‚ط±ط§ط،ط© ط¨ط¹ظ†ط§ظٹط©</p>
                </div>
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="w-9 h-9 rounded-full bg-gray-50 dark:bg-[#0f1115] flex items-center justify-center text-gray-400 hover:text-red-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 max-h-[55vh] overflow-y-auto space-y-5">
                {[
                  { n: 'ظ،', title: 'ط³ظٹط§ط³ط© ط§ظ„ط§ط³طھط±ط¬ط§ط¹', body: 'ظ„ط§ ظٹط­ظ‚ ظ„ظ„ط¹ظ…ظٹظ„ ط·ظ„ط¨ ط§ط³طھط±ط¬ط§ط¹ ط§ظ„ظ…ط¨ظ„ط؛ ط¨ط¹ط¯ ط¨ط¯ط، ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ط·ظ„ط¨طŒ ط³ظˆط§ط، ظƒط§ظ† ط§ظ„ط¯ظپط¹ ظٹط¯ظˆظٹط§ظ‹ ط£ظˆ ظ…ظ† ط®ظ„ط§ظ„ ط¨ظˆط§ط¨ط© ط§ظ„ط¯ظپط¹ ط§ظ„ط¢ظ„ظٹط©.' },
                  { n: 'ظ¢', title: 'ط¯ظ‚ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ', body: 'ط§ظ„ط¹ظ…ظٹظ„ ظ…ط³ط¤ظˆظ„ ظ…ط³ط¤ظˆظ„ظٹط© ظƒط§ظ…ظ„ط© ط¹ظ† طµط­ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط¯ط®ظ„ط©طŒ ظ…ط«ظ„ ط§ط³ظ… ط§ظ„ظ…ط³طھط®ط¯ظ… ط£ظˆ ط§ظ„ظ€ ID ط§ظ„ط®ط§طµ ط¨ط§ظ„ط­ط³ط§ط¨.' },
                  { n: 'ظ£', title: 'ظ…ط¯ط© ط§ظ„ظ…ط¹ط§ظ„ط¬ط©', body: 'طھطھظ… ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ط·ظ„ط¨ط§طھ ظˆطھظ†ظپظٹط°ظ‡ط§ ط®ظ„ط§ظ„ ظپطھط±ط© طھطھط±ط§ظˆط­ ط¨ظٹظ† 15 ط¯ظ‚ظٹظ‚ط© ظˆ12 ط³ط§ط¹ط© ط¹ظ…ظ„ ظƒط­ط¯ ط£ظ‚طµظ‰.' },
                  { n: 'ظ¤', title: 'ط§ظ„ط¥ظ‚ط±ط§ط± ط§ظ„ظ‚ط§ظ†ظˆظ†ظٹ', body: 'ط¨ط¥طھظ…ط§ظ…ظƒ ظ„ط¹ظ…ظ„ظٹط© ط§ظ„ط´ط­ظ†طŒ ظپط£ظ†طھ طھظ‚ط± ط¨طµط­ط© ط§ظ„ط¹ظ…ظ„ظٹط© ظˆطھظˆط§ظپظ‚ ط¹ظ„ظ‰ ظƒط§ظپط© ط§ظ„ط´ط±ظˆط· ط§ظ„ظ…ط°ظƒظˆط±ط©.' },
                ].map(t => (
                  <div key={t.n} className="flex gap-4">
                    <div className="w-8 h-8 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center text-red-600 font-black text-sm flex-shrink-0">
                      {t.n}
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-gray-900 dark:text-white mb-1">{t.title}</h4>
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 leading-relaxed">{t.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-gray-50 dark:bg-[#0f1115] border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => { setTermsAccepted(true); setShowTermsModal(false); }}
                  className="w-full bg-red-700 hover:bg-red-800 text-white font-black py-4 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-red-700/20"
                >
                  ظ‚ط±ط£طھ ظˆط£ظˆط§ظپظ‚ ط¹ظ„ظ‰ ط¬ظ…ظٹط¹ ط§ظ„ط´ط±ظˆط· âœ“
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* â”€â”€â”€ PayCard sub-component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function PayCard({
  method, selected, onSelect,
}: { method: PayMethod; selected: boolean; onSelect: () => void; key?: React.Key }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'relative w-full flex items-center gap-3 p-4 rounded-2xl border-2',
        'text-right transition-all',
        selected
          ? `${method.border} ${method.bg}`
          : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-[#0f1115] hover:border-gray-300 dark:hover:border-gray-500',
      ].join(' ')}
    >
      {/* Selected ring */}
      {selected && (
        <motion.div
          layoutId="pay-ring"
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ boxShadow: '0 0 0 2px currentColor' }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        />
      )}

      {/* Icon */}
      <div className={[
        'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
        selected ? `${method.color} text-white` : 'bg-gray-200 dark:bg-gray-700 text-gray-500',
      ].join(' ')}>
        {method.icon}
      </div>

      {/* Labels */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-black ${selected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
          {method.label}
        </p>
        <p className="text-[10px] font-bold text-gray-400 truncate">{method.description}</p>
      </div>

      {/* Radio dot */}
      <div className={[
        'w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all',
        selected ? `${method.border} ${method.color}` : 'border-gray-300',
      ].join(' ')}>
        {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
      </div>
    </button>
  );
}


