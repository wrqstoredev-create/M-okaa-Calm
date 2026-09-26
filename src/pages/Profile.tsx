/**
 * Profile.tsx — GamePay  (full UI redesign)
 *
 * Changes vs. original:
 * ─────────────────────────────────────────────────────────────────────
 * Layout
 *   • Full-width hero header with gradient banner + avatar upload button
 *   • Horizontal tab bar (طلباتي | الإعدادات) — replaces sidebar nav
 *   • Mobile-first single-column, desktop two-column where useful
 *
 * Orders tab
 *   • Timeline-style cards with left coloured border per status
 *   • Colour-coded status badges (قيد المراجعة / مكتمل / ملغي / …)
 *   • Product chips with image + Robux badge preserved
 *   • Fulfillment reveal (link / data / document) preserved
 *   • Copy order ID + WhatsApp CTA preserved
 *   • Empty state with ghost skeleton preserved
 *
 * Settings tab  (replaces "details" tab — same Supabase logic)
 *   • Profile info section: name + gender
 *   • Password-change section: new password + confirm (Supabase updateUser)
 *   • Email field (read-only) preserved
 *
 * Avatar upload
 *   • Click avatar → file picker → uploads to supabase storage "avatars"
 *     bucket → updates profile.avatar_url via updateProfile()
 *
 * All original fetching / order logic / fulfillment rendering preserved.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  User, Package, LogOut, Save, Calendar,
  Clock, CheckCircle2, XCircle, Link as LinkIcon,
  Key, Download, Loader2, Star, Copy, Check,
  MessageSquare, Camera, Lock, ShieldCheck,
  Eye, EyeOff, Settings, AlertCircle,
} from 'lucide-react';
import { useAuth }           from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase }          from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'motion/react';
import { useToast }          from '../contexts/ToastContext';
import { useCurrency, Currency } from '../contexts/CurrencyContext';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface OrderItem {
  id: string;
  unit_price: number;
  quantity: number;
  product_id: string;
  products: { title: string; image_url: string; price?: number; robux_quantity?: number };
}

interface Order {
  id: string;
  created_at: string;
  total_price: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  payment_method: string;
  fulfillment_type?: 'link' | 'data' | 'document';
  fulfillment_data?: string;
  fulfillment_file_url?: string;
  order_items: OrderItem[];
}

type TabId = 'orders' | 'settings';

/* ─── Status config ──────────────────────────────────────────────────────── */
const STATUS_MAP = {
  pending:    { label: 'قيد المراجعة',     badge: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 border-amber-200',   bar: 'bg-amber-400',    Icon: Clock },
  processing: { label: 'قيد التجهيز',       badge: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 border-blue-200',      bar: 'bg-blue-400',     Icon: Loader2 },
  completed:  { label: 'مكتمل ✓',           badge: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 border-emerald-200', bar: 'bg-emerald-500', Icon: CheckCircle2 },
  cancelled:  { label: 'ملغي',              badge: 'bg-red-50 dark:bg-red-900/20 text-red-700 border-red-200',           bar: 'bg-red-400',      Icon: XCircle },
} as const;

function getStatus(s: string) {
  return STATUS_MAP[s as keyof typeof STATUS_MAP] ?? {
    label: s, badge: 'bg-gray-50 text-gray-600 border-gray-200', bar: 'bg-gray-300', Icon: Package,
  };
}

/* ─── Tabs config ────────────────────────────────────────────────────────── */
const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'orders',   label: 'طلباتي',   icon: <Package size={15} /> },
  { id: 'settings', label: 'الإعدادات', icon: <Settings size={15} /> },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════════════════════════════════ */
export default function Profile() {
  const { user, profile, loading, signOut, updateProfile } = useAuth();
  const { addToast }             = useToast();
  const { formatPriceByCurrency } = useCurrency();
  const navigate                 = useNavigate();
  const location                 = useLocation();

  /* ── Active tab — reads ?tab= from URL ─────────────────────────────── */
  const searchParams  = new URLSearchParams(location.search);
  const initialTab    = (searchParams.get('tab') as TabId) || 'orders';
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  /* ── Orders state ──────────────────────────────────────────────────── */
  const [orders,         setOrders]         = useState<Order[]>([]);
  const [ordersLoading,  setOrdersLoading]  = useState(false);
  const [reviewedSet,    setReviewedSet]    = useState<Set<string>>(new Set());
  const [unreviewedCnt,  setUnreviewedCnt]  = useState(0);
  const [copiedOrderId,  setCopiedOrderId]  = useState<string | null>(null);

  /* ── Settings form state ───────────────────────────────────────────── */
  const [formData, setFormData] = useState({
    full_name: '',
    gender: '' as 'male' | 'female' | 'other' | '',
  });
  const [saving, setSaving] = useState(false);

  /* Password change */
  const [pwForm,       setPwForm]       = useState({ newPw: '', confirmPw: '' });
  const [pwSaving,     setPwSaving]     = useState(false);
  const [showNewPw,    setShowNewPw]    = useState(false);
  const [showConfPw,   setShowConfPw]   = useState(false);
  const [pwError,      setPwError]      = useState('');

  /* Avatar upload */
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  /* ── Bootstrap ─────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!loading && !user) navigate('/login');
    if (profile) {
      setFormData({ full_name: profile.full_name || '', gender: profile.gender || '' });
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (user) { 
      fetchOrders(); 
      fetchReviews(); 

      // 🔄 Real-Time Sync: Listen for any updates to the user's orders (e.g. status changed by admin)
      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
          (payload) => {
            console.log('🔄 Realtime order update received:', payload);
            fetchOrders(); // Refetch to get the nested products data properly
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'orders' && user) { 
      // fetchOrders(); // Removed to avoid double fetch with the user effect
      fetchReviews(); 
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (orders.length > 0) {
      const uniqUnreviewed = new Set(
        orders
          .filter(o => o.status === 'completed')
          .flatMap(o => o.order_items)
          .filter(item => !reviewedSet.has(item.product_id))
          .map(item => item.product_id),
      );
      setUnreviewedCnt(uniqUnreviewed.size);
    }
  }, [orders, reviewedSet]);

  /* ── Fetch helpers ─────────────────────────────────────────────────── */
  const fetchReviews = async () => {
    try {
      const { data } = await supabase
        .from('product_comments').select('product_id').eq('user_id', user?.id);
      if (data) setReviewedSet(new Set(data.map(r => r.product_id)));
    } catch (err) { console.error('Error fetching reviews:', err); }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`*, order_items (*, products (title, image_url, price, robux_quantity))`)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      addToast('حدث خطأ أثناء جلب الطلبات ❌', 'error');
    } finally {
      setOrdersLoading(false);
    }
  };

  /* ── Handlers ──────────────────────────────────────────────────────── */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await updateProfile(formData as any);
    error ? addToast('فشل حفظ التغييرات ❌', 'error') : addToast('تم حفظ التغييرات ✨', 'success');
    setSaving(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (!pwForm.newPw || pwForm.newPw.length < 6) {
      setPwError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (pwForm.newPw !== pwForm.confirmPw) {
      setPwError('كلمتا المرور غير متطابقتين');
      return;
    }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pwForm.newPw });
    if (error) {
      addToast('فشل تغيير كلمة المرور ❌', 'error');
    } else {
      addToast('تم تغيير كلمة المرور بنجاح 🔒', 'success');
      setPwForm({ newPw: '', confirmPw: '' });
    }
    setPwSaving(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarUploading(true);
    try {
      const ext      = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('avatars').upload(filePath, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const { error: profileErr } = await updateProfile({ avatar_url: publicUrl } as any);
      if (profileErr) throw profileErr;
      addToast('تم تحديث الصورة الشخصية ✅', 'success');
    } catch (err) {
      console.error('Avatar upload error:', err);
      addToast('فشل رفع الصورة ❌', 'error');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleCopyOrderId = (id: string) => {
    const short = id.slice(0, 8);
    navigator.clipboard.writeText(short);
    setCopiedOrderId(id);
    addToast(`تم نسخ رقم الطلب #${short} 📋`, 'success');
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  /* ── Display name ──────────────────────────────────────────────────── */
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'المستخدم';
  const initials    = displayName.slice(0, 2);

  /* ── Loading state ─────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-red-700" />
      </div>
    );
  }
  if (!user) return null;

  /* ════════════════════════════════════════════════════════════════════
     Render
  ════════════════════════════════════════════════════════════════════ */
  return (
    <div className="flex-1 w-full bg-gray-50 dark:bg-[#0f1115]" dir="rtl">

      {/* ── Hero Header ──────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-bl from-red-700 via-red-800 to-zinc-900 overflow-hidden">
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="max-w-5xl mx-auto px-4 md:px-6 pt-10 pb-20 relative z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">

            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl overflow-hidden border-4 border-white/20 shadow-2xl bg-red-900">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={displayName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-600 to-red-900 text-white text-3xl font-black">
                    {initials}
                  </div>
                )}
                {avatarUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-3xl">
                    <Loader2 size={24} className="animate-spin text-white" />
                  </div>
                )}
              </div>

              {/* Camera button */}
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute -bottom-2 -left-2 w-9 h-9 bg-white dark:bg-[#1a1d24] border-2 border-red-700 rounded-xl flex items-center justify-center text-red-700 shadow-lg hover:bg-red-50 transition-all active:scale-90"
                title="تغيير الصورة الشخصية"
              >
                <Camera size={15} />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            {/* Name + email */}
            <div className="text-center sm:text-right flex-1 pb-1">
              <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">{displayName}</h1>
              <p className="text-white/60 text-sm font-bold mt-1">{user.email}</p>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 flex-wrap">
                {orders.length > 0 && (
                  <span className="bg-white/10 text-white text-[11px] font-black px-3 py-1 rounded-full">
                    {orders.length} طلب
                  </span>
                )}
                {unreviewedCnt > 0 && (
                  <span className="bg-amber-400 text-amber-900 text-[11px] font-black px-3 py-1 rounded-full animate-pulse">
                    {unreviewedCnt} منتجات تنتظر تقييمك ⭐
                  </span>
                )}
              </div>
            </div>

            {/* Sign out */}
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-black text-[11px] px-4 py-2.5 rounded-xl transition-all active:scale-95 border border-white/20 flex-shrink-0"
            >
              <LogOut size={14} /> تسجيل الخروج
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab bar (floats over hero bottom) ────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 -mt-12 relative z-20">
        <div className="bg-white dark:bg-[#1a1d24] rounded-3xl shadow-xl shadow-black/10 border border-gray-100 dark:border-gray-700/50 p-2 flex gap-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'relative flex-1 flex items-center justify-center gap-2',
                'py-3 rounded-2xl font-black text-[13px] transition-all',
                activeTab === tab.id
                  ? 'bg-red-700 text-white shadow-lg shadow-red-700/25'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#0f1115]',
              ].join(' ')}
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'orders' && unreviewedCnt > 0 && (
                <span className="absolute top-1.5 right-3 w-4 h-4 bg-amber-400 text-amber-900 text-[9px] font-black rounded-full flex items-center justify-center">
                  {unreviewedCnt}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab panels ───────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >

            {/* ══════════════════════════════════════════════════════════
                ORDERS TAB
            ══════════════════════════════════════════════════════════ */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                {ordersLoading ? (
                  /* Loading skeleton */
                  <div className="space-y-4 animate-pulse">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-white dark:bg-[#1a1d24] rounded-3xl p-6 border border-gray-100 dark:border-gray-700 h-28" />
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  /* Empty state */
                  <div className="bg-white dark:bg-[#1a1d24] border border-gray-100 dark:border-gray-700 rounded-3xl p-12 flex flex-col items-center gap-4 text-center">
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center">
                      <Package size={32} className="text-red-400" />
                    </div>
                    <h3 className="text-base font-black text-gray-900 dark:text-white">لا توجد طلبات سابقة</h3>
                    <p className="text-sm font-bold text-gray-400 max-w-xs leading-relaxed">
                      لم تقم بأي عملية شراء بعد. عند إتمامك لأول طلب ستظهر تفاصيله هنا.
                    </p>
                    <button
                      onClick={() => navigate('/store')}
                      className="mt-2 bg-red-700 hover:bg-red-800 text-white font-black text-sm px-6 py-3 rounded-2xl transition-all active:scale-95 shadow-lg shadow-red-700/20"
                    >
                      تصفح المتجر الآن
                    </button>
                  </div>
                ) : (
                  /* Order cards — Timeline style */
                  orders.map((order) => {
                    const st        = getStatus(order.status);
                    const StatusIcon = st.Icon;
                    const [pm, cur] = (order.payment_method || '').split('___');

                    return (
                      <div
                        key={order.id}
                        className={[
                          'bg-white dark:bg-[#1a1d24]',
                          'border border-gray-100 dark:border-gray-700',
                          'rounded-3xl overflow-hidden shadow-sm',
                          'hover:shadow-md transition-shadow',
                          'relative',
                        ].join(' ')}
                      >
                        {/* Status colour bar (left side) */}
                        <div className={`absolute top-0 right-0 w-1 h-full rounded-r-3xl ${st.bar}`} />

                        <div className="p-5 md:p-6">
                          {/* Order header */}
                          <div className="flex flex-wrap items-start gap-3 mb-4">

                            {/* Status icon + badge */}
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${st.badge} border`}>
                              <StatusIcon
                                size={18}
                                className={order.status === 'processing' ? 'animate-spin' : ''}
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              {/* Order ID + copy */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-sm text-gray-900 dark:text-white">
                                  طلب #{order.id.slice(0, 8)}
                                </span>
                                <button
                                  onClick={() => handleCopyOrderId(order.id)}
                                  className={[
                                    'w-6 h-6 rounded-lg flex items-center justify-center transition-all',
                                    copiedOrderId === order.id
                                      ? 'bg-emerald-50 text-emerald-600'
                                      : 'bg-gray-100 dark:bg-[#0f1115] text-gray-400 hover:text-gray-700',
                                  ].join(' ')}
                                  title="نسخ رقم الطلب"
                                >
                                  {copiedOrderId === order.id ? <Check size={11} /> : <Copy size={11} />}
                                </button>

                                {/* Status badge */}
                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${st.badge}`}>
                                  {st.label}
                                </span>
                              </div>

                              {/* Meta row */}
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
                                  <Calendar size={10} />
                                  {new Date(order.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                                <span className="text-[11px] font-black text-red-700">
                                  {formatPriceByCurrency(order.total_price, (cur as Currency) || 'EGY')}
                                </span>
                                {pm && (
                                  <span className="text-[10px] font-bold text-gray-400 bg-gray-50 dark:bg-[#0f1115] px-2 py-0.5 rounded-lg border border-gray-100 dark:border-gray-700">
                                    {pm}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Product chips */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {order.order_items.map((item, i) => {
                              const basePrice = Number(item.products?.price)         || 1;
                              const baseRobux = Number(item.products?.robux_quantity) || 0;
                              const unitPrice = Number(item.unit_price)              || basePrice;
                              const itemRobux = baseRobux > 0 ? Math.round((unitPrice / basePrice) * baseRobux) : 0;

                              return (
                                <div
                                  key={i}
                                  className="flex items-center gap-2 bg-gray-50 dark:bg-[#0f1115] border border-gray-100 dark:border-gray-700 pr-2 pl-3 py-1.5 rounded-2xl"
                                >
                                  {item.products?.image_url && (
                                    <img
                                      src={item.products.image_url}
                                      alt=""
                                      className="w-7 h-7 rounded-lg object-cover flex-shrink-0"
                                    />
                                  )}
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-black text-gray-900 dark:text-white truncate max-w-[100px]">
                                      {item.products?.title}
                                    </p>
                                    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                      <span className="text-[9px] font-bold text-gray-400">×{item.quantity}</span>
                                      {itemRobux > 0 && (
                                        <span className="text-[8px] font-black bg-amber-50 dark:bg-amber-900/20 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full">
                                          🎮 {(itemRobux * item.quantity).toLocaleString('en-US')} Robux
                                        </span>
                                      )}
                                      {order.status === 'completed' && (
                                        reviewedSet.has(item.product_id) ? (
                                          <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                            <CheckCircle2 size={7} /> مُقيَّم
                                          </span>
                                        ) : (
                                          <button
                                            onClick={() => navigate(`/product/${item.product_id}#reviews`)}
                                            className="text-[8px] font-black text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 hover:bg-red-100 transition-colors"
                                          >
                                            <Star size={7} className="fill-current" /> قيّم
                                          </button>
                                        )
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Fulfillment section (completed only) */}
                          {order.status === 'completed' && (
                            <div className="border-t border-gray-100 dark:border-gray-700 pt-4 flex flex-wrap items-center gap-3">
                              <p className="text-[10px] font-black text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 size={11} /> الطلب جاهز للتسليم
                              </p>

                              {order.fulfillment_type === 'link' && order.fulfillment_data && (
                                <a
                                  href={order.fulfillment_data}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black px-3 py-2 rounded-xl transition-all active:scale-95 shadow-sm"
                                >
                                  <LinkIcon size={12} /> رابط التفعيل
                                </a>
                              )}

                              {order.fulfillment_type === 'document' && order.fulfillment_file_url && (
                                <a
                                  href={order.fulfillment_file_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-black px-3 py-2 rounded-xl transition-all active:scale-95 shadow-sm"
                                >
                                  <Download size={12} /> إيصال الشحن
                                </a>
                              )}

                              {order.fulfillment_type === 'data' && order.fulfillment_data && (() => {
                                try {
                                  const parsed = JSON.parse(order.fulfillment_data);
                                  if (Array.isArray(parsed) && parsed[0]?.email) {
                                    return parsed.map((acc, i) => (
                                      <div key={i} className="group relative bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden cursor-help">
                                        <div className="px-4 py-2.5 flex items-center gap-3 relative z-10">
                                          <Key size={13} className="text-red-400 flex-shrink-0" />
                                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 blur-sm group-hover:blur-none transition-all duration-300">
                                            <span className="text-[11px] font-black text-white select-all bg-white/10 px-2 py-0.5 rounded">{acc.email}</span>
                                            <span className="text-[11px] font-black text-red-200 select-all bg-red-500/20 px-2 py-0.5 rounded">{acc.password}</span>
                                          </div>
                                        </div>
                                        <div className="absolute inset-0 bg-black/60 pointer-events-none group-hover:opacity-0 transition-opacity flex items-center justify-center">
                                          <span className="text-[9px] font-black text-white uppercase tracking-widest">مرر للإظهار</span>
                                        </div>
                                      </div>
                                    ));
                                  }
                                } catch { /* not JSON */ }
                                return (
                                  <div className="group relative bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden cursor-help">
                                    <div className="px-4 py-2.5 flex items-center gap-2 relative z-10">
                                      <Key size={13} className="text-red-400" />
                                      <span className="text-[11px] font-black text-white select-all blur-sm group-hover:blur-none transition-all duration-300">
                                        {order.fulfillment_data}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* WhatsApp */}
                              <a
                                href={`https://wa.me/201557957800?text=${encodeURIComponent(`مرحباً، لدي استفسار بخصوص الطلب رقم: #${order.id.slice(0, 8)}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mr-auto flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5c] text-white text-[11px] font-black px-3 py-2 rounded-xl transition-all active:scale-95 shadow-sm"
                              >
                                <MessageSquare size={12} /> واتساب
                              </a>
                            </div>
                          )}

                          {/* Pending / processing helper */}
                          {(order.status === 'pending' || order.status === 'processing') && (
                            <div className="border-t border-gray-100 dark:border-gray-700 pt-3 flex items-center justify-between gap-3">
                              <p className="text-[10px] font-bold text-gray-400">
                                {order.status === 'pending' ? 'طلبك قيد المراجعة من فريقنا' : 'يتم تجهيز طلبك الآن…'}
                              </p>
                              <a
                                href={`https://wa.me/201557957800?text=${encodeURIComponent(`مرحباً، لدي استفسار بخصوص الطلب رقم: #${order.id.slice(0, 8)}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5c] text-white text-[11px] font-black px-3 py-2 rounded-xl transition-all active:scale-95 shadow-sm flex-shrink-0"
                              >
                                <MessageSquare size={12} /> متابعة
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                SETTINGS TAB
            ══════════════════════════════════════════════════════════ */}
            {activeTab === 'settings' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ── Profile info card ───────────────────────────── */}
                <div className="bg-white dark:bg-[#1a1d24] border border-gray-100 dark:border-gray-700 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <User size={16} className="text-red-600" />
                    <h3 className="text-sm font-black text-gray-900 dark:text-white">المعلومات الشخصية</h3>
                  </div>

                  <form onSubmit={handleSave} className="space-y-4">
                    {/* Full name */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">الاسم الكامل</label>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="أدخل اسمك الكامل"
                        className="w-full bg-gray-50 dark:bg-[#0f1115] border-2 border-transparent focus:border-red-600 rounded-xl py-3.5 px-4 text-sm font-bold outline-none transition-all"
                      />
                    </div>

                    {/* Gender */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">الجنس</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                        className="w-full bg-gray-50 dark:bg-[#0f1115] border-2 border-transparent focus:border-red-600 rounded-xl py-3.5 px-4 text-sm font-bold outline-none transition-all appearance-none"
                      >
                        <option value="">اختر الجنس</option>
                        <option value="male">ذكر</option>
                        <option value="female">أنثى</option>
                        <option value="other">آخر</option>
                      </select>
                    </div>

                    {/* Email (read-only) */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">البريد الإلكتروني</label>
                      <div className="relative">
                        <input
                          type="email"
                          defaultValue={user.email}
                          disabled
                          dir="ltr"
                          className="w-full bg-gray-100 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-xl py-3.5 px-4 text-sm font-bold text-gray-400 cursor-not-allowed text-left"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                          <Lock size={13} className="text-gray-400" />
                        </div>
                      </div>
                      <p className="text-[9px] font-bold text-amber-600">البريد مرتبط بحسابك ولا يمكن تعديله.</p>
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full min-h-[48px] bg-red-700 hover:bg-red-800 text-white font-black text-sm rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-red-700/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {saving ? <><Loader2 size={16} className="animate-spin" /> جاري الحفظ…</> : <><Save size={16} /> حفظ التغييرات</>}
                    </button>
                  </form>
                </div>

                {/* ── Password change card ─────────────────────────── */}
                <div className="bg-white dark:bg-[#1a1d24] border border-gray-100 dark:border-gray-700 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <ShieldCheck size={16} className="text-red-600" />
                    <h3 className="text-sm font-black text-gray-900 dark:text-white">تغيير كلمة المرور</h3>
                  </div>

                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    {/* New password */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">كلمة المرور الجديدة</label>
                      <div className="relative">
                        <input
                          type={showNewPw ? 'text' : 'password'}
                          value={pwForm.newPw}
                          onChange={(e) => { setPwForm({ ...pwForm, newPw: e.target.value }); setPwError(''); }}
                          placeholder="••••••••"
                          dir="ltr"
                          className={[
                            'w-full bg-gray-50 dark:bg-[#0f1115] border-2 rounded-xl py-3.5 pl-12 pr-4 text-sm font-bold outline-none transition-all text-left placeholder:text-gray-300',
                            pwError ? 'border-red-400' : 'border-transparent focus:border-red-600',
                          ].join(' ')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPw(v => !v)}
                          tabIndex={-1}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                        >
                          {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm password */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">تأكيد كلمة المرور</label>
                      <div className="relative">
                        <input
                          type={showConfPw ? 'text' : 'password'}
                          value={pwForm.confirmPw}
                          onChange={(e) => { setPwForm({ ...pwForm, confirmPw: e.target.value }); setPwError(''); }}
                          placeholder="••••••••"
                          dir="ltr"
                          className={[
                            'w-full bg-gray-50 dark:bg-[#0f1115] border-2 rounded-xl py-3.5 pl-12 pr-4 text-sm font-bold outline-none transition-all text-left placeholder:text-gray-300',
                            pwError
                              ? 'border-red-400'
                              : pwForm.confirmPw && pwForm.confirmPw === pwForm.newPw
                                ? 'border-emerald-400 focus:border-emerald-500'
                                : 'border-transparent focus:border-red-600',
                          ].join(' ')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfPw(v => !v)}
                          tabIndex={-1}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                        >
                          {showConfPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        {pwForm.confirmPw && pwForm.confirmPw === pwForm.newPw && (
                          <CheckCircle2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                        )}
                      </div>
                    </div>

                    {/* Error message */}
                    <AnimatePresence>
                      {pwError && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center gap-2 text-red-600 text-[11px] font-bold bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl px-3 py-2"
                        >
                          <AlertCircle size={12} /> {pwError}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      type="submit"
                      disabled={pwSaving}
                      className="w-full min-h-[48px] bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 font-black text-sm rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {pwSaving
                        ? <><Loader2 size={16} className="animate-spin" /> جاري التحديث…</>
                        : <><Lock size={16} /> تحديث كلمة المرور</>
                      }
                    </button>
                  </form>

                  {/* Hint */}
                  <p className="text-[10px] font-bold text-gray-400 leading-relaxed mt-4">
                    💡 تأكد من اختيار كلمة مرور قوية تحتوي على أحرف وأرقام ورموز لحماية حسابك.
                  </p>
                </div>

                {/* ── Danger zone — sign out ───────────────────────── */}
                <div className="lg:col-span-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/40 rounded-3xl p-5 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-black text-red-800 dark:text-red-400">تسجيل الخروج من حسابك</h4>
                    <p className="text-[11px] font-bold text-red-600 dark:text-red-500 mt-0.5">ستحتاج إلى تسجيل الدخول مجدداً للوصول إلى حسابك.</p>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white font-black text-[11px] px-5 py-3 rounded-2xl transition-all active:scale-95 flex-shrink-0"
                  >
                    <LogOut size={14} /> تسجيل الخروج
                  </button>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
