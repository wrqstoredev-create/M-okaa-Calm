import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Trash2, Edit, Save, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface Slide {
  id: string;
  image_url: string;
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
  image_link: string;
  sort_order: number;
  is_active: boolean;
}

export default function SlidesView() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { addToast } = useToast();

  const emptySlide: Partial<Slide> = {
    image_url: '',
    title: '',
    subtitle: '',
    button_text: '',
    button_link: '',
    image_link: '',
    sort_order: 0,
    is_active: true
  };

  const fetchSlides = async () => {
    try {
      const { data, error } = await supabase
        .from('slides')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      setSlides(data || []);
    } catch (err: any) {
      console.error('Error fetching slides:', err);
      // Suppress error if table doesn't exist yet, user might need to run DB
      if (err.message?.includes('does not exist')) {
         addToast('يرجى تحديث قاعدة البيانات (SQL) لإضافة جدول slides', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const handleSave = async () => {
    if (!editingSlide?.image_url) {
      addToast('الصورة مطلوبة', 'error');
      return;
    }
    setSaving(true);
    try {
      if (isAdding) {
        const { error } = await supabase.from('slides').insert([editingSlide]);
        if (error) throw error;
        addToast('تمت الإضافة بنجاح', 'success');
      } else {
        const { error } = await supabase.from('slides').update(editingSlide).eq('id', editingSlide.id);
        if (error) throw error;
        addToast('تم التحديث بنجاح', 'success');
      }
      setEditingSlide(null);
      setIsAdding(false);
      fetchSlides();
    } catch (err: any) {
      addToast('فشل الحفظ: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('slides').delete().eq('id', id);
      if (error) throw error;
      addToast('تم الحذف بنجاح', 'success');
      setDeletingId(null);
      fetchSlides();
    } catch (err: any) {
      addToast('فشل الحذف', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleActive = async (slide: Slide) => {
    try {
      const { error } = await supabase.from('slides').update({ is_active: !slide.is_active }).eq('id', slide.id);
      if (error) throw error;
      setSlides(slides.map(s => s.id === slide.id ? { ...s, is_active: !slide.is_active } : s));
    } catch (err: any) {
      addToast('فشل تحديث الحالة', 'error');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white">البنرات الإعلانية (سلايدر)</h2>
          <p className="text-zinc-500 font-medium text-sm mt-1">إدارة البنرات المتحركة في الصفحة الرئيسية</p>
        </div>
        {!editingSlide && !isAdding && (
          <button 
            onClick={() => { setIsAdding(true); setEditingSlide(emptySlide as Slide); }}
            className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-red-700 transition"
          >
            <Plus size={20} /> إضافة بنر
          </button>
        )}
      </div>

      {editingSlide || isAdding ? (
        <div className="bg-white dark:bg-[#1a1d24] rounded-[2rem] p-8 border border-zinc-100 shadow-sm">
          <h3 className="text-xl font-black mb-6">{isAdding ? 'إضافة بنر جديد' : 'تعديل البنر'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">رابط صورة البنر (URL) *</label>
                <div className="flex flex-col gap-4">
                  <input type="text" value={editingSlide?.image_url || ''} onChange={(e) => setEditingSlide({...editingSlide, image_url: e.target.value} as Slide)} placeholder="https://..." className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-red-500 text-left" dir="ltr" />
                  {editingSlide?.image_url && (
                    <div className="w-full h-32 relative rounded-xl overflow-hidden bg-black flex items-center justify-center">
                      <div 
                        className="absolute inset-0 w-full h-full opacity-50 blur-xl scale-125 bg-cover bg-center"
                        style={{ backgroundImage: `url(${editingSlide.image_url})`}} 
                      />
                      <img src={editingSlide.image_url} alt="" className="relative z-10 w-full h-full object-contain drop-shadow-lg" />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">العنوان الرئيسي</label>
                <input type="text" value={editingSlide?.title || ''} onChange={(e) => setEditingSlide({...editingSlide, title: e.target.value} as Slide)} className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-red-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">النص الفرعي</label>
                <input type="text" value={editingSlide?.subtitle || ''} onChange={(e) => setEditingSlide({...editingSlide, subtitle: e.target.value} as Slide)} className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-red-500" />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">نص الزر</label>
                <input type="text" value={editingSlide?.button_text || ''} onChange={(e) => setEditingSlide({...editingSlide, button_text: e.target.value} as Slide)} className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-red-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">رابط الزر (URL)</label>
                <input type="text" value={editingSlide?.button_link || ''} onChange={(e) => setEditingSlide({...editingSlide, button_link: e.target.value} as Slide)} className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-red-500 text-left" dir="ltr" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">رابط الصورة (URL عند النقر)</label>
                <input type="text" value={editingSlide?.image_link || ''} onChange={(e) => setEditingSlide({...editingSlide, image_link: e.target.value} as Slide)} className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-red-500 text-left" dir="ltr" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-zinc-500 mb-1">الترتيب</label>
                  <input type="number" value={editingSlide?.sort_order || 0} onChange={(e) => setEditingSlide({...editingSlide, sort_order: parseInt(e.target.value)} as Slide)} className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-red-500" />
                </div>
                <div className="flex-1 flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-3">
                    <input type="checkbox" checked={editingSlide?.is_active || false} onChange={(e) => setEditingSlide({...editingSlide, is_active: e.target.checked} as Slide)} className="w-5 h-5 accent-red-600 rounded" />
                    <span className="text-sm font-bold text-zinc-700">مفعل</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 flex gap-3">
            <button onClick={handleSave} disabled={saving} className="bg-red-600 text-white px-8 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-red-700">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={20} />} حفظ البنر
            </button>
            <button onClick={() => { setEditingSlide(null); setIsAdding(false); }} className="bg-zinc-100 dark:bg-[#1a1d24] text-zinc-600 px-8 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-zinc-200 dark:bg-zinc-800">
              <X size={20} /> إلغاء
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1a1d24] rounded-[2rem] overflow-hidden border border-zinc-100 shadow-sm">
          {slides.length === 0 ? (
            <div className="p-12 text-center">
              <ImageIcon className="w-16 h-16 text-zinc-200 mx-auto mb-4" />
              <h3 className="text-zinc-500 font-bold">لا يوجد أي بنرات حتى الآن</h3>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-zinc-50 dark:bg-[#0f1115] text-right text-xs font-black text-zinc-500 border-b border-zinc-100 uppercase tracking-widest">
                  <th className="py-4 px-6">الصورة</th>
                  <th className="py-4 px-6">العنوان</th>
                  <th className="py-4 px-6">الترتيب</th>
                  <th className="py-4 px-6">الحالة</th>
                  <th className="py-4 px-6 text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {slides.map(slide => (
                  <tr key={slide.id} className="hover:bg-zinc-50 dark:bg-[#0f1115]/50 transition">
                    <td className="py-4 px-6">
                      <img src={slide.image_url} alt="" className="w-20 h-12 object-cover rounded-lg border border-zinc-200" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-zinc-900 dark:text-white">{slide.title || 'بدون عنوان'}</div>
                      <div className="text-xs text-zinc-500 mt-1">{slide.subtitle}</div>
                    </td>
                    <td className="py-4 px-6 text-sm font-bold text-zinc-700">{slide.sort_order}</td>
                    <td className="py-4 px-6">
                      <button onClick={() => toggleActive(slide)} className={`px-3 py-1 rounded-full text-xs font-black ${slide.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {slide.is_active ? 'نشط' : 'معطل'}
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setEditingSlide(slide)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => setDeletingId(deletingId === slide.id ? null : slide.id)}
                          disabled={isDeleting}
                          className={`p-2 transition-all rounded-lg flex items-center gap-1 ${
                            deletingId === slide.id 
                              ? 'bg-red-600 text-white px-3' 
                              : 'text-red-600 hover:bg-red-50'
                          }`}
                        >
                          {deletingId === slide.id ? (
                            <div className="flex items-center gap-2" onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(slide.id);
                            }}>
                              <Trash2 size={18} />
                              <span className="text-[10px] font-black uppercase">تأكيد؟</span>
                            </div>
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
