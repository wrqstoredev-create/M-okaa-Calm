
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { ShoppingBag, Search, Filter, Loader2, Eye, CheckCircle2, XCircle, Clock, ExternalLink, Calendar, User, Mail, DollarSign, Send, Link as LinkIcon, FileText, Smartphone, Key, Plus, Trash2, Package, Download, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../../contexts/ToastContext';
import { useCurrency, Currency } from '../../contexts/CurrencyContext';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface OrderItem {
  id: string;
  unit_price: number;
  quantity: number;
  product_id: string;
  player_id?: string;
  player_username?: string;
  player_social?: string;
  player_phone?: string;
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
  customer_email: string;
  payment_screenshot_url?: string;
  fulfillment_type?: 'link' | 'data' | 'document';
  fulfillment_data?: string;
  fulfillment_file_url?: string;
  user_id: string;
  order_items: OrderItem[];
}

export default function OrdersView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);
  const { addToast } = useToast();
  const { formatPriceByCurrency } = useCurrency();
  
  // Fulfillment States
  const [fType, setFType] = useState<'link' | 'data' | 'document'>('data');
  const [fData, setFData] = useState('');
  const [fAccounts, setFAccounts] = useState([{ email: '', password: '' }]);
  const [fFile, setFFile] = useState<File | null>(null);
  const [isFulfilling, setIsFulfilling] = useState(false);

  // Delete States
  const [deleteStep, setDeleteStep] = useState(0); // 0: hidden, 1: confirm & download, 2: final delete
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (selectedOrder) {
      const savedType = selectedOrder.fulfillment_type || 'data';
      setFType(savedType);
      
      const savedData = selectedOrder.fulfillment_data || '';
      setFData(savedData);
      
      if (savedType === 'data') {
        try {
          const parsed = JSON.parse(savedData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setFAccounts(parsed);
          } else {
            setFAccounts([{ email: '', password: '' }]);
          }
        } catch {
          setFAccounts([{ email: '', password: '' }]);
        }
      } else {
        setFAccounts([{ email: '', password: '' }]);
      }
      
      setFFile(null);
    }
  }, [selectedOrder]);

  const handleFulfillment = async () => {
    if (!selectedOrder) return;
    
    let finalFData = fData;
    
    if (fType === 'data') {
      const validAccounts = fAccounts.filter(acc => acc.email.trim() && acc.password.trim());
      if (validAccounts.length === 0) {
        addToast('يرجى إدخال حساب واحد على الأقل ✍️', 'error');
        return;
      }
      finalFData = JSON.stringify(validAccounts);
    } else if (fType === 'link' && !fData) {
      addToast('يرجى إدخال الرابط ✍️', 'error');
      return;
    }

    if (fType === 'document' && !fFile && !selectedOrder.fulfillment_file_url) {
      addToast('يرجى رفع ملف التسليم 📁', 'error');
      return;
    }

    setIsFulfilling(true);
    try {
      let fileUrl = selectedOrder.fulfillment_file_url || '';

      if (fFile) {
        const fileExt = fFile.name.split('.').pop();
        const fileName = `${selectedOrder.id}_fulfillment.${fileExt}`;
        const filePath = `fulfilled/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('fulfillment-documents')
          .upload(filePath, fFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('fulfillment-documents')
          .getPublicUrl(filePath);
        
        fileUrl = publicUrl;
      }

      const { data, error } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          fulfillment_type: fType,
          fulfillment_data: finalFData,
          fulfillment_file_url: fileUrl
        })
        .eq('id', selectedOrder.id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('لم يتم حفظ التحديث بسبب صلاحيات قاعدة البيانات (RLS). يرجى التأكد من تشغيل كود SQL المطلوب للمديرين في Supabase.');
      }

      // Decrement product stock on successful fulfillment
      if (selectedOrder) {
        await decreaseStockForOrder(selectedOrder);
      }

      addToast('تم تنفيذ الطلب وشحنه للعميل بنجاح 🚀', 'success');
      fetchOrders();
      setSelectedOrder(null);
    } catch (err: any) {
      console.error('Fulfillment error:', err);
      addToast(err.message || 'فشل في تنفيذ الطلب ❌', 'error');
    } finally {
      setIsFulfilling(false);
    }
  };

  const generatePdf = async () => {
    if (!selectedOrder) return;
    setIsGeneratingPdf(true);
    try {
      const element = document.createElement('div');
      element.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 40px; direction: rtl; text-align: right; color: #000; background: #fff; width: 100%; box-sizing: border-box;">
          <h1 style="color: #dc2626; border-bottom: 2px solid #fee2e2; padding-bottom: 10px; margin-bottom: 20px;">فاتورة طلب #${selectedOrder.id.slice(0,8)}</h1>
          <div style="font-size: 14px; line-height: 1.8;">
            <p><strong>معرف الطلب:</strong> ${selectedOrder.id}</p>
            <p><strong>تاريخ الطلب:</strong> ${new Date(selectedOrder.created_at).toLocaleString('ar-EG')}</p>
            <p><strong>بريد العميل:</strong> ${selectedOrder.customer_email}</p>
            <p><strong>وسيلة الدفع:</strong> ${(selectedOrder.payment_method || '').split('___')[0]}</p>
            <p><strong>المبلغ الإجمالي:</strong> ${selectedOrder.total_price}</p>
          </div>
          
          <h2 style="margin-top: 30px; margin-bottom: 15px; font-size: 18px; border-bottom: 1px solid #fee2e2; padding-bottom: 5px;">الأصناف</h2>
          <table style="width: 100%; border-collapse: collapse; text-align: right;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">المنتج</th>
                <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">الكمية</th>
                <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">سعر الوحدة</th>
              </tr>
            </thead>
            <tbody>
              ${selectedOrder.order_items.map(item => `
                <tr>
                  <td style="padding: 10px; border: 1px solid #e2e8f0;">${item.products?.title || 'Unknown Product'}</td>
                  <td style="padding: 10px; border: 1px solid #e2e8f0;">${item.quantity}</td>
                  <td style="padding: 10px; border: 1px solid #e2e8f0;">${item.unit_price}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
      
      const opt = {
        margin:       0.5,
        filename:     `Order_${selectedOrder.id.slice(0,8)}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { 
          scale: 2, 
          useCORS: true,
          ignoreElements: (el: any) => el.tagName === 'STYLE' || el.tagName === 'LINK',
          onclone: (clonedDoc: any) => {
            const styles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
            styles.forEach((s: any) => s.remove());
          }
        },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' as const }
      };

      await html2pdf().from(element).set(opt).save();
      
      setTimeout(() => setDeleteStep(2), 1500);
      
    } catch (err: any) {
      console.error(err);
      addToast('فشل في إنشاء ملف PDF', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const performDelete = async () => {
    if (!selectedOrder) return;
    setIsDeleting(true);
    try {
      // Use select() to see if we actually deleted something
      const { data, error } = await supabase
        .from('orders')
        .delete()
        .eq('id', selectedOrder.id)
        .select();

      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error('فشل الحذف من قاعدة البيانات. قد يكون ذلك بسبب نقص صلاحيات (RLS). تأكد من تشغيل ملف fix_order_delete_policy.sql في Supabase.');
      }
      
      addToast('تم حذف الطلب نهائياً بنجاح', 'success');
      setOrders(orders.filter(o => o.id !== selectedOrder.id));
      setSelectedOrder(null);
      setDeleteStep(0);
    } catch (err: any) {
      console.error(err);
      addToast(err.message || 'حدث خطأ أثناء حذف الطلب', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      addToast('حدث خطأ أثناء جلب الطلبات ❌', 'error');
    } finally {
      setLoading(false);
    }
  };

  const decreaseStockForOrder = async (order: any) => {
    if (!order || !order.order_items || order.order_items.length === 0) return;
    
    let totalRoboCoinsToDecrement = 0;
    
    for (const item of order.order_items) {
      if (!item.product_id) continue;
      
      const qty = item.quantity || 1;
      
      // Calculate Robux amount pro-rata if it's a Robux package
      const basePrice = Number(item.products?.price) || 1;
      const baseRobux = Number(item.products?.robux_quantity) || 0;
      const unitPrice = Number(item.unit_price) || basePrice;
      const itemRobux = baseRobux > 0 ? Math.round((unitPrice / basePrice) * baseRobux) : 0;
      
      const productBonus = item.products?.robo_coins_bonus || 0;
      const deductAmount = itemRobux > 0 ? itemRobux : productBonus;
      
      if (deductAmount > 0) {
        totalRoboCoinsToDecrement += deductAmount * qty;
      }

      try {
        // Attempt to decrement stock atomically using RPC
        const { error: rpcError } = await supabase.rpc('decrement_product_stock', {
          prod_id: item.product_id,
          qty: item.quantity || 1
        });
        
        if (rpcError) {
          // Fallback to client-side decrement if RPC doesn't exist
          const { data: prod, error: selectError } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single();
            
          if (!selectError && prod && prod.stock !== null && prod.stock !== undefined) {
            const newStock = Math.max(0, prod.stock - qty);
            await supabase
              .from('products')
              .update({ stock: newStock })
              .eq('id', item.product_id);
          }
        }
      } catch (err) {
        console.error('Error updating stock for product:', item.product_id, err);
      }
    }

    if (totalRoboCoinsToDecrement > 0) {
      try {
        const { error: rpcCoinsError } = await supabase.rpc('decrement_robo_coins', {
          amount: totalRoboCoinsToDecrement
        });

        if (rpcCoinsError) {
          // Fallback to client-side decrement
          const { data: currentSettings, error: settingsError } = await supabase
            .from('settings')
            .select('*')
            .single();

          if (!settingsError && currentSettings && currentSettings.robo_coins_balance !== undefined) {
            const newBalance = Math.max(0, currentSettings.robo_coins_balance - totalRoboCoinsToDecrement);
            await supabase
              .from('settings')
              .update({ robo_coins_balance: newBalance })
              .eq('id', currentSettings.id);
          }
        }
      } catch (coinErr) {
        console.error('Error updating scale/pool for robo-coins:', coinErr);
      }
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    setUpdating(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('لم يتم تحديث الحالة. تأكد من إعداد صلاحيات RLS للطلبات في قاعدة البيانات.');
      }
      
      if (newStatus === 'completed') {
        const orderToUpdate = orders.find(o => o.id === orderId);
        if (orderToUpdate) {
          await decreaseStockForOrder(orderToUpdate);
        }
      }
      
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      addToast('تم تحديث حالة الطلب بنجاح ✨', 'success');
    } catch (err: any) {
      console.error('Error updating order status:', err);
      addToast(err.message || 'فشل في تحديث حالة الطلب ❌', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100 flex items-center gap-1.5"><Clock size={12} /> قيد المراجعة</span>;
      case 'processing':
        return <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> قيد التجهيز</span>;
      case 'completed':
        return <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1.5"><CheckCircle2 size={12} /> تم التسليم / مكتمل</span>;
      case 'cancelled':
        return <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100 flex items-center gap-1.5"><XCircle size={12} /> ملغي</span>;
      default:
        return <span className="px-3 py-1 bg-zinc-50 dark:bg-[#0f1115] text-zinc-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-zinc-100 flex items-center gap-1.5"><Package size={12} /> {status || 'غير معروف'}</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-right" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">إدارة الطلبات</h1>
          <p className="text-zinc-500 font-medium">متابعة عمليات الشراء والتحقق من التحويلات البنكية</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-red-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="ابحث برقم الطلب أو البريد..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white dark:bg-[#1a1d24] rounded-2xl pr-12 pl-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-600/5 focus:border-red-600 border border-zinc-100 shadow-sm transition-all w-64 lg:w-80"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-[#1a1d24] rounded-[2.5rem] border border-zinc-100 p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-zinc-50 dark:bg-[#0f1115] rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag size={32} className="text-zinc-300" />
          </div>
          <h3 className="text-xl font-black text-zinc-900 dark:text-white">لا يوجد طلبات حالياً</h3>
          <p className="text-zinc-500 font-medium mt-2">عندما يقوم العملاء بالشراء ستظهر طلباتهم هنا</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredOrders.map((order) => (
            <motion.div 
              layout
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="bg-white dark:bg-[#1a1d24] p-6 rounded-3xl border border-zinc-100 shadow-sm hover:border-red-200 transition-all cursor-pointer group relative overflow-hidden"
            >
              {order.payment_screenshot_url && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]"></div>
              )}
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-zinc-50 dark:bg-[#0f1115] rounded-2xl flex items-center justify-center text-zinc-400 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                    <ShoppingBag size={24} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <p className="font-black text-zinc-900 dark:text-white">طلب #{order.id.slice(0, 8)}</p>
                      {getStatusBadge(order.status)}
                      {order.payment_screenshot_url && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-[9px] font-black uppercase italic animate-pulse">يوجد مرفق</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold text-zinc-400">
                      <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(order.created_at).toLocaleDateString('ar-SA')}</span>
                      <span className="flex items-center gap-1"><User size={12} /> {order.customer_email}</span>
                      <span className="flex items-center gap-1">
                        <DollarSign size={12} /> 
                        {(() => {
                          const [pm, cur] = (order.payment_method || '').split('___');
                          return formatPriceByCurrency(order.total_price, (cur as Currency) || 'EGY');
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right ml-4">
                     <p className="text-[10px] text-zinc-400 font-black uppercase">وسيلة الدفع</p>
                     <p className="text-sm font-black text-zinc-900 dark:text-white">{(order.payment_method || '').split('___')[0]}</p>
                  </div>
                  <button className="p-3 bg-zinc-50 dark:bg-[#0f1115] rounded-xl text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-all">
                    <Eye size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-[#F9FAFB] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto max-h-[90vh]"
            >
              {/* Left Side: Receipt Image (if exists) */}
              {selectedOrder.payment_screenshot_url ? (
                <div className="w-full md:w-1/2 bg-zinc-900 relative group">
                  <img 
                    src={selectedOrder.payment_screenshot_url} 
                    alt="Payment Receipt" 
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] font-black text-white uppercase italic">إيصال التحويل المرفق</p>
                  </div>
                  <a 
                    href={selectedOrder.payment_screenshot_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="absolute bottom-4 left-4 p-3 bg-red-600 text-white rounded-xl shadow-lg hover:bg-red-700 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ExternalLink size={20} />
                  </a>
                </div>
              ) : (
                <div className="w-full md:w-1/2 bg-zinc-100 dark:bg-[#1a1d24] flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-20 h-20 bg-white dark:bg-[#1a1d24] rounded-3xl flex items-center justify-center text-zinc-300 shadow-sm mb-4">
                    <XCircle size={40} />
                  </div>
                  <h4 className="font-black text-zinc-900 dark:text-white">لا يوجد إيصال مرفق</h4>
                  <p className="text-xs font-bold text-zinc-400 mt-2 leading-relaxed">هذا الطلب تم دفعه عبر وسيلة تلقائية أو لم يتم رفع إيصال له.</p>
                </div>
              )}

              {/* Right Side: Details */}
              <div className="w-full md:w-1/2 p-8 overflow-y-auto bg-white dark:bg-[#1a1d24] flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white">تفاصيل الطلب</h3>
                    <p className="text-[10px] font-black text-zinc-400">ID: {selectedOrder.id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setDeleteStep(1)} className="p-3 bg-red-50 rounded-xl text-red-600 hover:bg-red-600 hover:text-white transition-all" title="حذف الطلب">
                      <Trash2 size={20} />
                    </button>
                    <button onClick={() => setSelectedOrder(null)} className="p-3 bg-zinc-50 dark:bg-[#0f1115] rounded-xl text-zinc-400 hover:text-red-600 transition-colors">
                      <XCircle size={20} />
                    </button>
                  </div>
                </div>

                <div className="space-y-6 flex-1">
                  {/* Status Control */}
                  <div className="bg-zinc-50 dark:bg-[#0f1115] p-6 rounded-3xl border border-zinc-100 space-y-4">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">تحديث حالة الطلب</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(['pending', 'processing', 'completed', 'cancelled'] as const).map((s) => (
                        <button
                          key={s}
                          disabled={updating || selectedOrder.status === s}
                          onClick={() => updateOrderStatus(selectedOrder.id, s)}
                          className={`
                            py-2.5 rounded-xl text-[10px] font-black transition-all border
                            ${selectedOrder.status === s 
                              ? 'bg-zinc-900 text-white border-zinc-900' 
                              : 'bg-white dark:bg-[#1a1d24] text-zinc-500 border-zinc-100 hover:border-red-200'}
                            ${updating && 'opacity-50'}
                          `}
                        >
                          {s === 'pending' ? 'قيد المراجعة' : s === 'processing' ? 'قيد التجهيز' : s === 'completed' ? 'تم التسليم / مكتمل' : 'ملغي'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">بيانات العميل</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-zinc-50 dark:bg-[#0f1115] rounded-2xl border border-zinc-100">
                        <p className="text-[9px] font-black text-zinc-400 mb-1 uppercase">البريد الإلكتروني</p>
                        <p className="text-xs font-black text-zinc-900 dark:text-white">{selectedOrder.customer_email}</p>
                      </div>
                      <div className="p-4 bg-zinc-50 dark:bg-[#0f1115] rounded-2xl border border-zinc-100">
                        <p className="text-[9px] font-black text-zinc-400 mb-1 uppercase">طريقة الدفع</p>
                        <p className="text-xs font-black text-zinc-900 dark:text-white">{(selectedOrder.payment_method || '').split('___')[0]}</p>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">الأصناف المطلوبة</h4>
                    <div className="space-y-3">
                      {selectedOrder.order_items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-[#0f1115] rounded-2xl border border-zinc-100">
                          <div className="flex items-center gap-3">
                            <img src={item.products?.image_url || undefined} alt="" className="w-10 h-10 rounded-lg object-cover" />
                            <div>
                              <p className="text-xs font-black text-zinc-900 dark:text-white">{item.products?.title}</p>
                              <div className="flex flex-wrap gap-1.5 items-center mt-1">
                                <span className="text-[10px] font-bold text-zinc-400">الكمية: {item.quantity}</span>
                                {(() => {
                                  const basePrice = Number(item.products?.price) || 1;
                                  const baseRobux = Number(item.products?.robux_quantity) || 0;
                                  const unitPrice = Number(item.unit_price) || basePrice;
                                  const itemRobux = baseRobux > 0 ? Math.round((unitPrice / basePrice) * baseRobux) : 0;
                                  if (itemRobux > 0) {
                                    return (
                                      <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[9px] font-black border border-amber-100">
                                        🎮 {(itemRobux * (item.quantity || 1)).toLocaleString('en-US')} Robux
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            </div>
                          </div>
                          <p className="text-sm font-black text-zinc-900 dark:text-white">
                             {(() => {
                               const [pm, cur] = (selectedOrder.payment_method || '').split('___');
                               return formatPriceByCurrency(item.unit_price * item.quantity, (cur as Currency) || 'EGY');
                             })()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="p-6 bg-red-600 rounded-3xl text-white flex items-center justify-between shadow-lg shadow-red-600/20">
                     <p className="font-black uppercase italic text-sm">إجمالي المبلغ</p>
                     <p className="text-2xl font-black">
                       {(() => {
                         const [pm, cur] = (selectedOrder.payment_method || '').split('___');
                         return formatPriceByCurrency(selectedOrder.total_price, (cur as Currency) || 'EGY');
                       })()}
                     </p>
                  </div>

                  {/* Fulfillment System */}
                  <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-white/5 space-y-6 mt-4">
                    <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                      <Send className="text-red-500" size={20} />
                      <h4 className="font-black text-white text-lg">نظام تنفيذ الطلب (الشحن)</h4>
                    </div>

                    <div className="flex items-center gap-2 p-1 bg-white dark:bg-[#1a1d24]/5 rounded-2xl">
                      {[
                        { id: 'data', label: 'بيانات حساب', icon: Key },
                        { id: 'document', label: 'مستند/إيصال', icon: FileText },
                        { id: 'link', label: 'رابط تفعيل', icon: LinkIcon }
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setFType(t.id as any)}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black transition-all ${fType === t.id ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white dark:bg-[#1a1d24]/5'}`}
                        >
                          <t.icon size={14} />
                          {t.label}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-4">
                      {fType === 'data' && (
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">بيانات الحسابات (إيميل / باسورد)</label>
                           {fAccounts.map((account, index) => (
                             <div key={index} className="flex gap-2 items-center bg-white dark:bg-[#1a1d24]/5 p-3 rounded-2xl border border-white/10 group focus-within:border-red-600 transition-all">
                               <input 
                                 type="text"
                                 placeholder="الإيميل / اليوزر"
                                 value={account.email}
                                 onChange={(e) => {
                                   const newAccs = [...fAccounts];
                                   newAccs[index].email = e.target.value;
                                   setFAccounts(newAccs);
                                 }}
                                 className="flex-1 bg-transparent text-white text-xs font-medium outline-none placeholder:text-zinc-600"
                               />
                               <div className="w-px h-6 bg-white dark:bg-[#1a1d24]/10"></div>
                               <input 
                                 type="text"
                                 placeholder="الباسورد"
                                 value={account.password}
                                 onChange={(e) => {
                                   const newAccs = [...fAccounts];
                                   newAccs[index].password = e.target.value;
                                   setFAccounts(newAccs);
                                 }}
                                 className="flex-1 bg-transparent text-white text-xs font-medium outline-none placeholder:text-zinc-600"
                               />
                               {fAccounts.length > 1 && (
                                  <button
                                    onClick={() => {
                                      const newAccs = fAccounts.filter((_, i) => i !== index);
                                      setFAccounts(newAccs);
                                    }}
                                    className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                               )}
                             </div>
                           ))}
                           <button
                             onClick={() => setFAccounts([...fAccounts, { email: '', password: '' }])}
                             className="w-full py-3 flex items-center justify-center gap-2 border border-dashed border-white/20 text-zinc-400 hover:text-white hover:border-white/40 rounded-2xl text-xs font-bold transition-all"
                           >
                             <Plus size={16} /> إضافة حساب آخر
                           </button>
                        </div>
                      )}

                      {fType === 'link' && (
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">رابط التفعيل أو التحقق</label>
                           <input 
                             type="url"
                             value={fData}
                             onChange={(e) => setFData(e.target.value)}
                             placeholder="https://example.com/activate/..."
                             className="w-full bg-white dark:bg-[#1a1d24]/5 border border-white/10 rounded-2xl p-4 text-white text-sm font-medium outline-none focus:border-red-600"
                           />
                        </div>
                      )}

                      {fType === 'document' && (
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">رفع الملف / إيصال الشحن</label>
                           <label className={`relative flex flex-col items-center justify-center w-full h-32 rounded-3xl border-2 border-dashed transition-all cursor-pointer ${fFile || selectedOrder.fulfillment_file_url ? 'border-red-500 bg-red-600/5' : 'border-white/10 bg-white dark:bg-[#1a1d24]/5 hover:border-red-500'}`}>
                              {fFile || selectedOrder.fulfillment_file_url ? (
                                <div className="flex flex-col items-center gap-2">
                                  <CheckCircle2 size={24} className="text-red-500" />
                                  <p className="text-[10px] font-black text-white">{fFile?.name || 'تم رفع ملف سابق'}</p>
                                  <span className="text-[9px] font-bold text-red-500 underline">تغيير الملف</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-2 text-zinc-500">
                                  <FileText size={24} />
                                  <p className="text-[10px] font-black">اضغط لرفع المستند</p>
                                </div>
                              )}
                              <input 
                                type="file" 
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => e.target.files?.[0] && setFFile(e.target.files[0])}
                              />
                           </label>
                        </div>
                      )}

                      <button
                        onClick={handleFulfillment}
                        disabled={isFulfilling || selectedOrder.status === 'completed'}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-red-600/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
                      >
                        {isFulfilling ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                        {selectedOrder.status === 'completed' ? 'تم تنفيذ هذا الطلب مسبقاً' : 'إرسال بيانات الشحن وإتمام الطلب'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteStep > 0 && selectedOrder && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => deleteStep !== 2 && setDeleteStep(0)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-[#1a1d24] rounded-[2rem] shadow-2xl p-8"
            >
              {deleteStep === 1 ? (
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle size={32} className="text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2">تأكيد حذف الطلب</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">
                      هل أنت متأكد من رغبتك في حذف هذا الطلب؟ 
                      بناءً على سياسات النظام، سيقوم السكريبت بإنشاء نسخة PDF من تفاصيل الطلب وتنزيلها ليتم الاحتفاظ بها قبل الحذف.
                    </p>
                  </div>
                  
                  <div className="pt-4 flex flex-col gap-3">
                    <button 
                      onClick={generatePdf}
                      disabled={isGeneratingPdf}
                      className="w-full py-4 bg-zinc-900 text-white rounded-xl font-black text-sm hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isGeneratingPdf ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                      تنزيل نسخة PDF للاحتفاظ بها
                    </button>
                    <button 
                      onClick={() => setDeleteStep(0)}
                      className="w-full py-4 bg-zinc-50 dark:bg-[#0f1115] text-zinc-500 rounded-xl font-black text-sm hover:bg-zinc-100 dark:bg-[#1a1d24] hover:text-zinc-900 dark:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle size={18} />
                      تراجع وإلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto relative">
                    <Trash2 size={32} className="text-red-500" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center border-2 border-white">
                      <CheckCircle2 size={14} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2">تأكيد الحذف النهائي</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">
                      تم تنزيل نسخة PDF بنجاح 📄.<br />
                      هل تريد الآن المتابعة وحذف الطلب نهائياً من قاعدة البيانات؟ لا يمكن التراجع عن هذه الخطوة.
                    </p>
                  </div>
                  
                  <div className="pt-4 flex flex-col gap-3">
                    <button 
                      onClick={performDelete}
                      disabled={isDeleting}
                      className="w-full py-4 bg-red-600 text-white rounded-xl font-black text-sm hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                      نعم، احذف الطلب نهائياً
                    </button>
                    <button 
                      onClick={() => setDeleteStep(0)}
                      className="w-full py-4 bg-zinc-50 dark:bg-[#0f1115] text-zinc-500 rounded-xl font-black text-sm hover:bg-zinc-100 dark:bg-[#1a1d24] hover:text-zinc-900 dark:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle size={18} />
                      إلغاء الحذف
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
