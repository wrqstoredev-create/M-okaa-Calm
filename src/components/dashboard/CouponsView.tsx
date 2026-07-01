import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Ticket, Loader2, AlertCircle, CheckCircle, XCircle, Wand2 } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabaseClient';

interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  is_active: boolean;
  created_at: string;
}

export default function CouponsView() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<'percentage' | 'fixed'>('percentage');
  const [newValue, setNewValue] = useState<string>('');

  const generateCode = () => {
    const prefix = 'OFF';
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const timestamp = Date.now().toString(36).substring(3, 5).toUpperCase();
    setNewCode(`${prefix}${randomPart}${timestamp}`);
  };

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setCoupons(data || []);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newValue) return;

    setIsSubmitting(true);
    try {
      const { data, error: addError } = await supabase
        .from('coupons')
        .insert([{
          code: newCode.toUpperCase().trim(),
          discount_type: newType,
          discount_value: parseFloat(newValue),
          is_active: true
        }])
        .select();

      if (addError) throw addError;
      
      setCoupons([data[0], ...coupons]);
      setNewCode('');
      setNewValue('');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إضافة الكود');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('coupons')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (updateError) throw updateError;
      setCoupons(coupons.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
    } catch (err: any) {
      alert('خطأ أثناء التحديث: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (isDeleting) return;
    setIsDeleting(true);

    try {
      const { error: deleteError } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      setCoupons(coupons.filter(c => c.id !== id));
      setDeletingId(null);
    } catch (err: any) {
      alert('خطأ أثناء الحذف: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && coupons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4 bg-white dark:bg-[#1a1d24] p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
        <div className="w-16 h-16 bg-zinc-900 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-zinc-900/20">
          <Ticket size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white">إدارة أكواد الخصم</h1>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">إنشاء وتفعيل كوبونات التخفيض</p>
        </div>
      </div>

      {/* Add Coupon Form */}
      <div className="bg-white dark:bg-[#1a1d24] p-8 rounded-[2rem] border border-zinc-100 shadow-sm">
        <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-6">إضافة كود جديد</h3>
        <form onSubmit={handleAddCoupon} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-xs font-black text-zinc-500 mr-2">رمز الكود</label>
            <div className="relative">
              <input 
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="مثال: SALE20"
                className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-100 rounded-xl h-14 px-4 pl-12 font-bold focus:outline-none focus:ring-2 focus:ring-red-600/20"
                required
              />
              <button
                type="button"
                onClick={generateCode}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-red-600 transition-colors"
                title="توليد كود تلقائي"
              >
                <Wand2 size={18} />
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-zinc-500 mr-2">نوع الخصم</label>
            <select 
              value={newType}
              onChange={(e) => setNewType(e.target.value as any)}
              className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-100 rounded-xl h-14 px-4 font-bold focus:outline-none focus:ring-2 focus:ring-red-600/20"
            >
              <option value="percentage">نسبة مئوية (%)</option>
              <option value="fixed">مبلغ ثابت (SAR)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-zinc-500 mr-2">قيمة الخصم</label>
            <input 
              type="number"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="0.00"
              className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-100 rounded-xl h-14 px-4 font-bold focus:outline-none focus:ring-2 focus:ring-red-600/20"
              required
            />
          </div>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-red-600 text-white font-black h-14 rounded-xl shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
            إضافة الكود
          </button>
        </form>
        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-sm font-bold">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </div>

      {/* Coupons Table */}
      <div className="bg-white dark:bg-[#1a1d24] rounded-[2rem] border border-zinc-100 shadow-sm overflow-hidden">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-zinc-50 dark:bg-[#0f1115] border-b border-zinc-100">
              <th className="px-6 py-4 text-xs font-black text-zinc-400 uppercase">الكود</th>
              <th className="px-6 py-4 text-xs font-black text-zinc-400 uppercase">النوع</th>
              <th className="px-6 py-4 text-xs font-black text-zinc-400 uppercase">القيمة</th>
              <th className="px-6 py-4 text-xs font-black text-zinc-400 uppercase">الحالة</th>
              <th className="px-6 py-4 text-xs font-black text-zinc-400 uppercase">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 font-bold">
                  لا توجد أكواد خصم حالياً
                </td>
              </tr>
            ) : (
              coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-zinc-50 dark:bg-[#0f1115]/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-black text-zinc-900 dark:text-white bg-zinc-100 dark:bg-[#1a1d24] px-3 py-1 rounded-lg">
                      {coupon.code}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-zinc-600">
                    {coupon.discount_type === 'percentage' ? 'نسبة مئوية' : 'مبلغ ثابت'}
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-zinc-900 dark:text-white">
                    {coupon.discount_value} {coupon.discount_type === 'percentage' ? '%' : 'ر.س'}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleToggleStatus(coupon.id, coupon.is_active)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter transition-colors ${
                        coupon.is_active 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {coupon.is_active ? <CheckCircle size={10} /> : <XCircle size={10} />}
                      {coupon.is_active ? 'نشط' : 'معطل'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => setDeletingId(deletingId === coupon.id ? null : coupon.id)}
                      disabled={isDeleting}
                      className={`p-2 transition-all rounded-lg flex items-center gap-1 ${
                        deletingId === coupon.id 
                          ? 'bg-red-600 text-white px-3' 
                          : 'text-zinc-400 hover:text-red-600'
                      }`}
                      title="حذف"
                    >
                      {deletingId === coupon.id ? (
                        <div className="flex items-center gap-2" onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(coupon.id);
                        }}>
                          <Trash2 size={18} />
                          <span className="text-[10px] font-black uppercase">تأكيد؟</span>
                        </div>
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
