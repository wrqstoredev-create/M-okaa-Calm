import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Trash2, Edit2, CheckCircle2, XCircle, GripVertical, Image as ImageIcon } from 'lucide-react';
import { motion, Reorder } from 'motion/react';
import { useToast } from '../../contexts/ToastContext';

interface PromoBanner {
  id: string;
  title: string;
  subtitle: string;
  hover_text: string;
  button_text: string;
  button_link: string;
  image_url: string;
  is_active: boolean;
  sort_order: number;
}

export default function PromoBannersView() {
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<PromoBanner>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { addToast } = useToast();

  const [tableMissing, setTableMissing] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('promo_banners')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) {
        if (error.code === 'PGRST205') {
          setTableMissing(true);
          console.error('Table missing:', error.message);
        } else {
          throw error;
        }
      } else {
        setTableMissing(false);
        setBanners(data || []);
      }
    } catch (err: any) {
      console.error('Error fetching banners:', err.message);
      addToast('فشل في جلب البنرات الإعلانية', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = async (newBanners: PromoBanner[]) => {
    setBanners(newBanners);
    try {
      const updates = newBanners.map((banner, index) => ({
        id: banner.id,
        sort_order: index,
        title: banner.title,
        is_active: banner.is_active
      }));
      
      const { error } = await supabase
        .from('promo_banners')
        .upsert(updates);
        
      if (error) throw error;
      addToast('تم تحديث الترتيب بنجاح', 'success');
    } catch (err: any) {
      console.error(err);
      addToast('حدث خطأ أثناء تحديث الترتيب', 'error');
      fetchBanners();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.image_url) {
      addToast('يرجى تعبئة الحقول الإلزامية', 'error');
      return;
    }

    try {
      if (isEditing) {
        const { error } = await supabase
          .from('promo_banners')
          .update(formData)
          .eq('id', isEditing);
        
        if (error) throw error;
        addToast('تم التحديث بنجاح', 'success');
      } else {
        const { error } = await supabase
          .from('promo_banners')
          .insert([{ ...formData, sort_order: banners.length }]);
          
        if (error) throw error;
        addToast('تمت الإضافة بنجاح', 'success');
      }
      
      setIsModalOpen(false);
      setIsEditing(null);
      setFormData({});
      fetchBanners();
    } catch (err: any) {
      console.error(err);
      addToast('حدث خطأ أثناء الحفظ', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (isDeleting) return;
    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from('promo_banners')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      addToast('تم الحذف بنجاح', 'success');
      setDeletingId(null);
      fetchBanners();
    } catch (err: any) {
      console.error(err);
      addToast('حدث خطأ أثناء الحذف', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('promo_banners')
        .update({ is_active: !currentStatus })
        .eq('id', id);
        
      if (error) throw error;
      addToast('تم تحديث الحالة', 'success');
      fetchBanners();
    } catch (err: any) {
      console.error(err);
      addToast('حدث خطأ أثناء التحديث', 'error');
    }
  };

  const openForm = (banner?: PromoBanner) => {
    if (banner) {
      setIsEditing(banner.id);
      setFormData(banner);
    } else {
      setIsEditing(null);
      setFormData({ is_active: true });
    }
    setIsModalOpen(true);
  };

  const constraintsRef = React.useRef(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (tableMissing) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-[2rem] p-8 text-right" dir="rtl">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <XCircle size={32} />
            <h2 className="text-2xl font-black">جدول قاعدة البيانات غير موجود</h2>
          </div>
          <p className="text-red-900/80 font-bold mb-6">
            تعذر العثور على جدول <code className="bg-red-100 rounded px-1 min-w-[200px]">promo_banners</code> في قاعدة بيانات Supabase الخاصة بك.
            يرجى نسخ الكود التالي وتشغيله في <strong>SQL Editor</strong> في حساب Supabase الخاص بك لإنشاء الجدول وإصلاح هذا الخطأ.
          </p>
          <div className="bg-zinc-900 rounded-2xl p-4 overflow-x-auto relative" dir="ltr">
            <pre className="text-teal-400 text-[11px] font-mono whitespace-pre-wrap text-left">
{`create table if not exists promo_banners (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  subtitle text,
  hover_text text,
  button_text text,
  button_link text,
  image_url text,
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table promo_banners enable row level security;

drop policy if exists "Promo banners are public" on promo_banners;
create policy "Promo banners are public" on promo_banners for select using (true);

drop policy if exists "Admins can manage promo banners" on promo_banners;
create policy "Admins can manage promo banners" on promo_banners for all
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('admin', 'owner')));`}
            </pre>
          </div>
          <button
            onClick={fetchBanners}
            className="mt-6 bg-red-600 text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-red-700 transition-all flex items-center gap-2"
          >
            <span>أعد المحاولة بعد تنفيذ الكود</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-[#1a1d24] p-6 rounded-[2rem] shadow-sm border border-zinc-100">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white">البنرات الترويجية</h2>
          <p className="text-sm font-bold text-zinc-500 mt-1">البنرات الصغيرة أسفل السلايدر</p>
        </div>
        <button
          onClick={() => openForm()}
          className="bg-zinc-900 text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-black transition-all flex items-center gap-2 shadow-xl shadow-zinc-900/20"
        >
          <Plus size={18} />
          <span>إضافة بنر</span>
        </button>
      </div>

      <div className="bg-white dark:bg-[#1a1d24] rounded-[2rem] shadow-sm border border-zinc-100 p-6 overflow-hidden" ref={constraintsRef}>
        {banners.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon size={48} className="mx-auto text-zinc-300 mb-4" />
            <p className="text-zinc-500 font-bold mb-4">لا توجد بنرات بعد، ابدأ بإضافة واحد!</p>
            <button
              onClick={() => openForm()}
              className="text-zinc-900 dark:text-white font-black hover:underline"
            >
              إضافة البنر الأول
            </button>
          </div>
        ) : (
          <Reorder.Group axis="y" values={banners} onReorder={handleDragEnd} className="flex flex-col gap-5">
            {banners.map((banner) => (
              <Reorder.Item
                key={banner.id}
                value={banner}
                dragConstraints={constraintsRef}
                dragElastic={0.1}
                whileDrag={{ scale: 1.02, opacity: 0.9, zIndex: 50, boxShadow: '0px 10px 20px rgba(0,0,0,0.1)' }}
                className="flex items-center gap-5 bg-white dark:bg-[#0f1115] border border-zinc-200 p-5 rounded-2xl cursor-grab active:cursor-grabbing hover:border-zinc-300 transition-colors relative"
              >
                <div className="text-zinc-400">
                  <GripVertical size={20} />
                </div>
                
                <div className="w-24 h-16 rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0 relative">
                  <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-black text-zinc-900 dark:text-white leading-tight mb-1">{banner.title}</h3>
                  {banner.subtitle && <p className="text-[10px] font-bold text-zinc-500">{banner.subtitle}</p>}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleStatus(banner.id, banner.is_active)}
                    className={`p-2 rounded-xl transition-all ${banner.is_active ? 'bg-green-100 text-green-700' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}
                    title={banner.is_active ? 'تعطيل' : 'تفعيل'}
                  >
                    {banner.is_active ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                  </button>
                  <button
                    onClick={() => openForm(banner)}
                    className="p-2 bg-white dark:bg-[#1a1d24] text-zinc-700 hover:text-zinc-900 dark:text-white hover:bg-zinc-100 dark:bg-[#1a1d24] rounded-xl transition-colors border border-zinc-200"
                    title="تعديل"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => setDeletingId(deletingId === banner.id ? null : banner.id)}
                    disabled={isDeleting}
                    className={`p-2 transition-all rounded-xl border border-zinc-200 ${
                      deletingId === banner.id 
                        ? 'bg-red-600 text-white border-red-600 px-3' 
                        : 'bg-white dark:bg-[#1a1d24] text-red-500 hover:text-red-700 hover:bg-red-50'
                    }`}
                    title="حذف"
                  >
                    {deletingId === banner.id ? (
                      <div className="flex items-center gap-2" onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(banner.id);
                      }}>
                        <Trash2 size={18} />
                        <span className="text-[10px] font-black uppercase">تأكيد؟</span>
                      </div>
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white dark:bg-[#1a1d24] rounded-[2rem] shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-zinc-900 dark:text-white">{isEditing ? 'تعديل البنر' : 'إضافة بنر جديد'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-red-500 transition-colors bg-zinc-100 dark:bg-[#1a1d24] p-2 rounded-xl">
                <XCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-black text-zinc-700 mb-2 uppercase tracking-wider">العنوان</label>
                  <input
                    type="text"
                    required
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-200 rounded-xl px-4 py-3 text-sm font-black focus:outline-none focus:border-zinc-900 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-zinc-700 mb-2 uppercase tracking-wider">العنوان الفرعي</label>
                  <input
                    type="text"
                    value={formData.subtitle || ''}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-200 rounded-xl px-4 py-3 text-sm font-black focus:outline-none focus:border-zinc-900 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-zinc-700 mb-2 uppercase tracking-wider">النص عند التحويم (Hover text)</label>
                <input
                  type="text"
                  value={formData.hover_text || ''}
                  onChange={(e) => setFormData({ ...formData, hover_text: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-200 rounded-xl px-4 py-3 text-sm font-black focus:outline-none focus:border-zinc-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-zinc-700 mb-2 uppercase tracking-wider">رابط الصورة (URL)</label>
                <input
                  type="url"
                  required
                  value={formData.image_url || ''}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-200 rounded-xl px-4 py-3 text-sm font-black focus:outline-none focus:border-zinc-900 transition-all"
                  dir="ltr"
                />
                {formData.image_url && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100 dark:bg-[#1a1d24] max-w-[200px]">
                    <img src={formData.image_url} alt="Preview" className="w-full h-auto object-cover max-h-32" onError={(e) => (e.currentTarget.style.display = 'none')} onLoad={(e) => (e.currentTarget.style.display = 'block')} />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-black text-zinc-700 mb-2 uppercase tracking-wider">نص الزر</label>
                  <input
                    type="text"
                    value={formData.button_text || ''}
                    onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-200 rounded-xl px-4 py-3 text-sm font-black focus:outline-none focus:border-zinc-900 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-zinc-700 mb-2 uppercase tracking-wider">رابط الزر</label>
                  <input
                    type="text"
                    value={formData.button_link || ''}
                    onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-200 rounded-xl px-4 py-3 text-sm font-black focus:outline-none focus:border-zinc-900 transition-all"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.is_active ?? true}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 accent-zinc-900"
                />
                <label htmlFor="isActive" className="text-sm font-black text-zinc-900 dark:text-white cursor-pointer">
                  البنر نشط (ظاهر للعملاء)
                </label>
              </div>

              <div className="pt-6 border-t border-zinc-100">
                <button
                  type="submit"
                  className="w-full bg-zinc-900 text-white font-black text-sm py-4 rounded-xl hover:bg-black transition-all shadow-xl shadow-zinc-900/20"
                >
                  حفظ التغييرات
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
