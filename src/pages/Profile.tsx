import React, { useState, useEffect } from 'react';
import { User, Package, LogOut, Save, Calendar, UserCheck, Clock, CheckCircle2, XCircle, ChevronLeft, Link as LinkIcon, Key, FileText, Download, Loader2, Star, Copy, Check, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../contexts/ToastContext';
import { useCurrency, Currency } from '../contexts/CurrencyContext';

interface OrderItem {
  id: string;
  unit_price: number;
  quantity: number;
  product_id: string;
  products: {
    title: string;
    image_url: string;
  };
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

export default function Profile() {
  const { user, profile, loading, signOut, updateProfile } = useAuth();
  const { addToast } = useToast();
  const { formatPriceByCurrency } = useCurrency();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'details');
  const [reviewedProducts, setReviewedProducts] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    full_name: '',
    gender: '' as 'male' | 'female' | 'other'
  });
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [unreviewedCount, setUnreviewedCount] = useState(0);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchReviews();
    }
  }, [user]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        gender: profile.gender || '',
      });
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (activeTab === 'orders' && user) {
      fetchOrders();
      fetchReviews();
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (orders.length > 0) {
      const unreviewed = orders
        .filter(o => o.status === 'completed')
        .flatMap(o => o.order_items)
        .filter(item => !reviewedProducts.has(item.product_id));
      
      // Filter unique product IDs to avoid duplicate notifications for multiple purchases of same product
      const uniqueUnreviewed = new Set(unreviewed.map(item => item.product_id));
      setUnreviewedCount(uniqueUnreviewed.size);
    }
  }, [orders, reviewedProducts]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('product_comments')
        .select('product_id')
        .eq('user_id', user?.id);
      
      if (data) {
        setReviewedProducts(new Set(data.map(r => r.product_id)));
      }
    } catch (err) {
      console.error('Error fetching user reviews:', err);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (title, image_url)
          )
        `)
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await updateProfile(formData);
    if (error) {
      addToast('فشل حفظ التغييرات ❌', 'error');
    } else {
      addToast('تم حفظ التغييرات بنجاح ✨', 'success');
    }
    setSaving(false);
  };

  const handleCopyOrderId = (id: string) => {
    const shortId = id.slice(0, 8);
    navigator.clipboard.writeText(shortId);
    setCopiedOrderId(id);
    addToast(`تم نسخ رقم الطلب #${shortId} 📋`, 'success');
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return { label: 'قيد المراجعة', color: 'text-amber-600 bg-amber-50', icon: Clock };
      case 'processing': return { label: 'قيد التجهيز', color: 'text-blue-600 bg-blue-50', icon: Loader2 };
      case 'completed': return { label: 'مكتمل / تم التسليم', color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle2 };
      case 'cancelled': return { label: 'ملغي', color: 'text-red-600 bg-red-50', icon: XCircle };
      default: return { label: status || 'غير معروف', color: 'text-zinc-600 bg-zinc-50 dark:bg-[#0f1115]', icon: Package };
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-700"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex-1 container mx-auto px-4 max-w-6xl py-8 text-right" dir="rtl">
      <div className="flex items-center gap-3 mb-10">
         <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white border-r-4 border-red-700 pr-5">حسابي</h1>
         <div className="h-px flex-1 bg-zinc-100 dark:bg-[#1a1d24]"></div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-[#1a1d24] border border-zinc-100 rounded-[2.5rem] p-8 shadow-sm text-center relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-2 bg-red-700"></div>
            <div className="w-24 h-24 bg-red-50 text-red-700 rounded-[2rem] mx-auto flex items-center justify-center mb-5 overflow-hidden border border-red-100 transition-transform group-hover:scale-105 duration-500">
               {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
               ) : (
                  <User size={40} className="stroke-[1.5]" />
               )}
            </div>
            <h2 className="font-black text-lg text-zinc-900 dark:text-white truncate px-2">{profile?.full_name || user.email?.split('@')[0]}</h2>
            <p className="text-xs font-bold text-zinc-400 mt-1 truncate px-2">{user.email}</p>
            
            <div className="mt-8 flex flex-col gap-2">
              <button 
                onClick={() => setActiveTab('details')}
                className={`flex items-center justify-between gap-3 p-5 rounded-2xl transition-all font-black text-xs ${activeTab === 'details' ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-200' : 'text-zinc-500 hover:bg-zinc-50 dark:bg-[#0f1115]'}`}
              >
                <div className="flex items-center gap-3">
                  <User size={18} />
                  <span>تفاصيل الحساب</span>
                </div>
                <ChevronLeft size={16} className={activeTab === 'details' ? 'opacity-100' : 'opacity-0'} />
              </button>
              <button 
                onClick={() => setActiveTab('orders')}
                className={`flex items-center justify-between gap-3 p-5 rounded-2xl transition-all font-black text-xs ${activeTab === 'orders' ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-200' : 'text-zinc-500 hover:bg-zinc-50 dark:bg-[#0f1115]'}`}
              >
                <div className="flex items-center gap-3">
                  <Package size={18} />
                  <span>سجل الطلبات</span>
                  {unreviewedCount > 0 && (
                    <span className="flex items-center justify-center w-5 h-5 bg-red-600 text-white text-[10px] font-black rounded-full animate-pulse">
                      {unreviewedCount}
                    </span>
                  )}
                </div>
                <ChevronLeft size={16} className={activeTab === 'orders' ? 'opacity-100' : 'opacity-0'} />
              </button>
              <button 
                onClick={() => signOut()}
                className="flex items-center gap-3 p-5 rounded-2xl text-red-500 hover:bg-red-50 transition-all font-black text-xs mt-4"
              >
                <LogOut size={18} />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-[#1a1d24] border border-zinc-100 rounded-[2.5rem] p-10 shadow-sm min-h-[500px]">
            
            {activeTab === 'details' && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="max-w-xl">
                <div className="mb-8">
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white">تعديل الملف الشخصي</h3>
                  <p className="text-sm font-bold text-zinc-400 mt-1">تحديث بياناتك الشخصية للتعامل بشكل أسرع في الطلبات القادمة</p>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">الاسم الكامل</label>
                      <input 
                        type="text" 
                        className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-100 focus:border-red-700 rounded-2xl py-4 px-6 outline-none transition-all text-sm font-black" 
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="أدخل اسمك هنا..."
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">الجنس</label>
                       <select 
                        className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-100 focus:border-red-700 rounded-2xl py-4 px-6 outline-none transition-all text-sm font-black appearance-none"
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                      >
                        <option value="">اختر الجنس</option>
                        <option value="male">ذكر</option>
                        <option value="female">أنثى</option>
                        <option value="other">آخر</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">البريد الإلكتروني</label>
                    <div className="relative">
                      <input type="email" className="w-full bg-zinc-100 dark:bg-[#1a1d24] border border-zinc-100 rounded-2xl py-4 px-6 text-zinc-500 cursor-not-allowed text-left text-sm font-black" defaultValue={user.email} disabled dir="ltr" />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white dark:bg-[#1a1d24] rounded-lg border border-zinc-100 shadow-sm">
                        <Key size={14} className="text-zinc-400" />
                      </div>
                    </div>
                    <p className="text-[9px] font-bold text-orange-600 mt-2 px-2">لا يمكن تعديل البريد الإلكتروني لأنه مرتبط بحسابك.</p>
                  </div>
                  
                  <div className="pt-4">
                    <button 
                      type="submit" 
                      disabled={saving}
                      className="bg-black text-white px-10 py-5 rounded-2xl font-black text-sm hover:bg-zinc-800 shadow-xl shadow-black/10 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                    >
                      {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
                      حفظ جميع التغييرات
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-100">
                  <div>
                    <h3 className="text-xl font-black text-zinc-900 dark:text-white">سجل الطلبات</h3>
                    <p className="text-sm font-bold text-zinc-400 mt-1">تتبع حالة طلباتك واحصل على بيانات الشحن</p>
                  </div>
                  <div className="w-12 h-12 bg-zinc-50 dark:bg-[#0f1115] rounded-2xl flex items-center justify-center text-zinc-300">
                    <Package size={24} />
                  </div>
                </div>

                {ordersLoading ? (
                  <div className="py-20 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-red-700 animate-spin" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="space-y-4">
                    <div className="relative">
                      {/* Overlay Message */}
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white dark:bg-[#1a1d24]/40 backdrop-blur-sm rounded-[2.5rem] border-2 border-dashed border-zinc-200">
                        <div className="bg-white dark:bg-[#1a1d24] p-6 rounded-[2rem] shadow-xl shadow-zinc-200/50 flex flex-col items-center text-center max-w-sm w-full mx-4">
                          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-4">
                            <Package size={32} />
                          </div>
                          <h4 className="text-lg font-black text-zinc-900 dark:text-white">لا توجد طلبات سابقة</h4>
                          <p className="text-xs font-bold text-zinc-500 mt-2 leading-relaxed">لم تقم بأي عملية شراء حتى الآن. عند إتمامك لأول طلب، ستظهر كافة تفاصيله وحالته هنا.</p>
                        </div>
                      </div>
                      
                      {/* Placeholder Skeleton Items */}
                      <div className="space-y-4 opacity-40 select-none pointer-events-none grayscale">
                        {[1, 2].map((i) => (
                           <div key={i} className="bg-white dark:bg-[#1a1d24] border border-zinc-100 rounded-[2.5rem] p-8 shadow-sm">
                             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                               <div className="flex items-start gap-6">
                                 <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-[#1a1d24] flex items-center justify-center">
                                   <div className="w-6 h-6 bg-zinc-200 dark:bg-zinc-800 rounded-md"></div>
                                 </div>
                                 <div className="space-y-3 pt-1">
                                   <div className="flex items-center gap-3">
                                      <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
                                      <div className="h-4 w-16 bg-zinc-100 dark:bg-[#1a1d24] rounded-full"></div>
                                   </div>
                                   <div className="flex items-center gap-3">
                                     <div className="h-3 w-16 bg-zinc-100 dark:bg-[#1a1d24] rounded-full"></div>
                                     <div className="h-3 w-20 bg-zinc-100 dark:bg-[#1a1d24] rounded-full"></div>
                                   </div>
                                 </div>
                               </div>
                               <div className="border-t border-zinc-50 pt-4 md:border-0 md:pt-0">
                                  <div className="h-10 w-32 bg-zinc-100 dark:bg-[#1a1d24] rounded-xl"></div>
                               </div>
                             </div>
                           </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => {
                      const status = getStatusLabel(order.status);
                      const StatusIcon = status.icon;
                      
                      return (
                        <div key={order.id} className="bg-white dark:bg-[#1a1d24] border border-zinc-100 rounded-[2.5rem] p-8 shadow-sm hover:border-red-200 transition-all group overflow-hidden relative">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-start gap-6">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${status.color}`}>
                                <StatusIcon size={24} className={order.status === 'processing' ? 'animate-spin' : ''} />
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1.5 group/id cursor-pointer" onClick={() => handleCopyOrderId(order.id)}>
                                    <p className="font-black text-zinc-900 dark:text-white">طلب #{order.id.slice(0, 8)}</p>
                                    <button 
                                      className={`p-1 rounded-md transition-all ${copiedOrderId === order.id ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-50 dark:bg-[#0f1115] text-zinc-400 group-hover/id:bg-zinc-100 dark:bg-[#1a1d24] group-hover/id:text-zinc-600'}`}
                                      title="نسخ رقم الطلب"
                                    >
                                      {copiedOrderId === order.id ? <Check size={12} /> : <Copy size={12} />}
                                    </button>
                                  </div>
                                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${status.color}`}>
                                    {status.label}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-bold text-zinc-400 mt-1">
                                  <span className="flex items-center gap-1.5"><Calendar size={12} /> {new Date(order.created_at).toLocaleDateString('ar-SA')}</span>
                                  <span className="flex items-center gap-1.5 font-black text-red-600">
                                    {(() => {
                                      const [pm, cur] = (order.payment_method || '').split('___');
                                      return formatPriceByCurrency(order.total_price, (cur as Currency) || 'EGY');
                                    })()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {order.status === 'completed' && (
                              <div className="flex flex-col md:items-end gap-2">
                                <p className="text-[10px] font-black text-emerald-600 uppercase italic">الطلب جاهز للتسليم ✨</p>
                                <div className="flex gap-2">
                                  {order.fulfillment_type === 'link' && order.fulfillment_data && (
                                    <a 
                                      href={order.fulfillment_data} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"
                                    >
                                      <LinkIcon size={14} /> رابط التفعيل
                                    </a>
                                  )}
                                  {order.fulfillment_type === 'data' && order.fulfillment_data && (
                                    <div className="flex flex-col gap-2 w-full md:w-auto">
                                      {(() => {
                                        try {
                                          const parsed = JSON.parse(order.fulfillment_data);
                                          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].email !== undefined) {
                                            return parsed.map((acc, i) => (
                                              <div key={i} className="relative group overflow-hidden rounded-xl bg-zinc-900 border border-zinc-700 shadow-sm cursor-help w-full">
                                                <div className="px-5 py-3 flex items-center justify-between gap-6 relative z-10 min-w-[250px]">
                                                  <div className="flex items-center gap-3 w-full">
                                                    <Key size={14} className="text-red-500 flex-shrink-0" />
                                                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 blur-sm group-hover:blur-none transition-all duration-300 w-full">
                                                      <span className="text-xs font-black text-white select-all bg-white dark:bg-[#1a1d24]/10 px-2 py-1 rounded">{acc.email}</span>
                                                      <span className="hidden md:block w-1 h-1 rounded-full bg-zinc-700"></span>
                                                      <span className="text-xs font-black text-red-100 select-all bg-red-500/20 px-2 py-1 rounded">{acc.password}</span>
                                                    </div>
                                                  </div>
                                                  <div className="absolute inset-0 bg-black/60 pointer-events-none group-hover:opacity-0 transition-opacity flex items-center justify-center">
                                                     <span className="text-[10px] font-black text-white uppercase tracking-widest">مرر للإظهار</span>
                                                  </div>
                                                </div>
                                              </div>
                                            ));
                                          }
                                        } catch (e) {
                                          // Not JSON, fallback
                                        }
                                        
                                        return (
                                          <div className="relative group overflow-hidden rounded-xl bg-zinc-900 border border-zinc-700 shadow-sm cursor-help">
                                            <div className="px-5 py-2.5 flex items-center gap-3 relative z-10">
                                              <Key size={14} className="text-red-500" />
                                              <span className="text-xs font-black text-white select-all blur-sm group-hover:blur-none transition-all duration-300">
                                                {order.fulfillment_data}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  )}
                                  {order.fulfillment_type === 'document' && order.fulfillment_file_url && (
                                    <a 
                                      href={order.fulfillment_file_url} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="bg-red-600 text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-red-700 shadow-lg shadow-red-100 transition-all"
                                    >
                                      <Download size={14} /> إيصال الشحن
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Order Items Summary */}
                          <div className="mt-8 pt-6 border-t border-zinc-100 flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="flex flex-wrap gap-4">
                              {order.order_items.map((item, i) => (
                                <div key={i} className="flex items-center gap-3 bg-zinc-50 dark:bg-[#0f1115] pr-2 pl-4 py-2 rounded-2xl border border-zinc-100 group/item relative">
                                  <img src={item.products?.image_url || undefined} alt="" className="w-8 h-8 rounded-lg object-cover" />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                       <p className="text-[10px] font-black text-zinc-900 dark:text-white truncate">{item.products?.title}</p>
                                       {order.status === 'completed' && (
                                         reviewedProducts.has(item.product_id) ? (
                                           <span className="flex items-center gap-0.5 text-[8px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">
                                              <CheckCircle2 size={8} /> تم التقييم
                                           </span>
                                         ) : (
                                           <button 
                                             onClick={() => navigate(`/product/${item.product_id}#reviews`)}
                                             className="flex items-center gap-1 text-[8px] font-black text-red-600 hover:text-red-700 bg-white dark:bg-[#1a1d24] hover:bg-zinc-100 dark:bg-[#1a1d24] px-2 py-1 rounded-lg border border-red-100 shadow-sm transition-all"
                                           >
                                             <Star size={8} className="fill-current" /> تقييم المنتج
                                           </button>
                                         )
                                       )}
                                    </div>
                                    <div className="flex flex-wrap gap-1 items-center mt-0.5">
                                      <span className="text-[9px] font-bold text-zinc-400">كمية: {item.quantity}</span>
                                      {(() => {
                                        const basePrice = Number(item.products?.price) || 1;
                                        const baseRobux = Number(item.products?.robux_quantity) || 0;
                                        const unitPrice = Number(item.unit_price) || basePrice;
                                        const itemRobux = baseRobux > 0 ? Math.round((unitPrice / basePrice) * baseRobux) : 0;
                                        if (itemRobux > 0) {
                                          return (
                                            <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 px-1 py-0.5 rounded text-[8px] font-black border border-amber-100">
                                              🎮 {(itemRobux * (item.quantity || 1)).toLocaleString('en-US')} Robux
                                            </span>
                                          );
                                        }
                                        return null;
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="flex-shrink-0">
                               <a 
                                 href={`https://wa.me/201557957800?text=${encodeURIComponent(`مرحباً، لدي استفسار بخصوص الطلب رقم: #${order.id.slice(0, 8)}`)}`}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="flex items-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#20bd5c] text-white rounded-xl text-[10px] font-black shadow-lg shadow-green-100 transition-all active:scale-95 group/wa"
                               >
                                 <MessageSquare size={14} className="group-hover/wa:rotate-12 transition-transform" />
                                 تواصل معنا عبر واتساب
                               </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
