import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Trash2, Edit2, CheckCircle2, XCircle, GripVertical, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { motion, Reorder } from 'motion/react';
import { useToast } from '../../contexts/ToastContext';

interface SponsoredCard {
  id: string;
  name: string;
  image_url: string;
  target_url?: string;
  is_active: boolean;
  sort_order: number;
}

const PRESET_CARDS = [
  { name: 'PUBG Mobile', image_url: 'https://www.midasbuy.com/images/apps/pubgm/logo.png' },
  { name: 'Free Fire', image_url: 'https://www.midasbuy.com/images/apps/ff/logo.png' },
  { name: 'Valorant', image_url: 'https://w7.pngwing.com/pngs/4/220/png-transparent-valorant-logo-white-thumbnail.png' },
  { name: 'League of Legends', image_url: 'https://w7.pngwing.com/pngs/351/658/png-transparent-league-of-legends-logo-riot-games-video-game-multiplayer-online-battle-arena-league-of-legends-text-logo-video-game-thumbnail.png' },
  { name: 'iTunes', image_url: 'https://upload.wikimedia.org/wikipedia/commons/d/df/ITunes_logo.svg' },
  { name: 'Google Play', image_url: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Play_Arrow_logo.svg' },
  { name: 'Steam', image_url: 'https://upload.wikimedia.org/wikipedia/commons/8/83/Steam_icon_logo.svg' },
  { name: 'PlayStation', image_url: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Playstation_logo_colour.svg' },
  { name: 'Xbox', image_url: 'https://upload.wikimedia.org/wikipedia/commons/d/d7/Xbox_logo_%282019%29.svg' },
];

export default function SponsoredCardsView() {
  const [cards, setCards] = useState<SponsoredCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<SponsoredCard>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const { data, error } = await supabase
        .from('sponsored_cards')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      setCards(data || []);
    } catch (err: any) {
      console.error('Error fetching sponsored cards:', err.message);
      addToast('فشل في جلب البطاقات المدعومة', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = async (newCards: SponsoredCard[]) => {
    setCards(newCards);
    try {
      const updates = newCards.map((card, index) => ({
        id: card.id,
        sort_order: index,
        name: card.name,
        is_active: card.is_active
      }));
      
      const { error } = await supabase
        .from('sponsored_cards')
        .upsert(updates);
        
      if (error) throw error;
      addToast('تم تحديث الترتيب بنجاح', 'success');
    } catch (err: any) {
      console.error(err);
      addToast('حدث خطأ أثناء تحديث الترتيب', 'error');
      fetchCards();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.image_url) {
      addToast('يرجى تعبئة الحقول الإلزامية', 'error');
      return;
    }

    try {
      if (isEditing) {
        const { error } = await supabase
          .from('sponsored_cards')
          .update(formData)
          .eq('id', isEditing);
        
        if (error) throw error;
        addToast('تم التحديث بنجاح', 'success');
      } else {
        const { error } = await supabase
          .from('sponsored_cards')
          .insert([{ ...formData, sort_order: cards.length }]);
          
        if (error) throw error;
        addToast('تمت الإضافة بنجاح', 'success');
      }
      
      setIsModalOpen(false);
      setIsEditing(null);
      setFormData({});
      fetchCards();
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
        .from('sponsored_cards')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      addToast('تم الحذف بنجاح', 'success');
      setDeletingId(null);
      fetchCards();
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
        .from('sponsored_cards')
        .update({ is_active: !currentStatus })
        .eq('id', id);
        
      if (error) throw error;
      addToast('تم تحديث الحالة', 'success');
      fetchCards();
    } catch (err: any) {
      console.error(err);
      addToast('حدث خطأ أثناء التحديث', 'error');
    }
  };

  const openForm = (card?: SponsoredCard) => {
    if (card) {
      setIsEditing(card.id);
      setFormData(card);
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-[#1a1d24] p-6 rounded-[2rem] shadow-sm border border-zinc-100">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white">البطاقات المدعومة</h2>
          <p className="text-sm font-bold text-zinc-500 mt-1">إعلانات البطاقات المتحركة أسفل الموقع</p>
        </div>
        <button
          onClick={() => openForm()}
          className="bg-zinc-900 text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-black transition-all flex items-center gap-2 shadow-xl shadow-zinc-900/20"
        >
          <Plus size={18} />
          <span>إضافة بطاقة مدعومة</span>
        </button>
      </div>

      <div className="bg-white dark:bg-[#1a1d24] rounded-[2rem] shadow-sm border border-zinc-100 p-6 overflow-hidden" ref={constraintsRef}>
        {cards.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon size={48} className="mx-auto text-zinc-300 mb-4" />
            <p className="text-zinc-500 font-bold mb-4">لا توجد بطاقات حتى الآن</p>
          </div>
        ) : (
          <Reorder.Group axis="y" values={cards} onReorder={handleDragEnd} className="flex flex-col gap-5">
            {cards.map((card) => (
              <Reorder.Item
                key={card.id}
                value={card}
                dragConstraints={constraintsRef}
                dragElastic={0.1}
                whileDrag={{ scale: 1.02, opacity: 0.9, zIndex: 50, boxShadow: '0px 10px 20px rgba(0,0,0,0.1)' }}
                className="flex items-center gap-5 bg-white dark:bg-[#0f1115] border border-zinc-200 p-5 rounded-2xl cursor-grab active:cursor-grabbing hover:border-zinc-300 transition-colors relative"
              >
                <div className="text-zinc-400">
                  <GripVertical size={20} />
                </div>
                
                <div className="w-24 h-16 rounded-xl overflow-hidden bg-white dark:bg-[#1a1d24] border border-zinc-100 shrink-0 relative flex items-center justify-center p-2">
                  <img src={card.image_url} alt={card.name} className="max-w-full max-h-full object-contain filter grayscale hover:grayscale-0 transition-all" />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-black text-zinc-900 dark:text-white leading-tight mb-1">{card.name}</h3>
                  {card.target_url && (
                    <a href={card.target_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-500 hover:underline flex items-center gap-1 inline-flex">
                      <ExternalLink size={12} />
                      رابط التوجيه (تجربة)
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleStatus(card.id, card.is_active)}
                    className={`p-2 rounded-xl transition-all ${card.is_active ? 'bg-green-100 text-green-700' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}
                    title={card.is_active ? 'تعطيل' : 'تفعيل'}
                  >
                    {card.is_active ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                  </button>
                  <button
                    onClick={() => openForm(card)}
                    className="p-2 bg-white dark:bg-[#1a1d24] text-zinc-700 hover:text-zinc-900 dark:text-white hover:bg-zinc-100 dark:bg-[#1a1d24] rounded-xl transition-colors border border-zinc-200"
                    title="تعديل"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => setDeletingId(deletingId === card.id ? null : card.id)}
                    disabled={isDeleting}
                    className={`p-2 transition-all rounded-xl border border-zinc-200 ${
                      deletingId === card.id 
                        ? 'bg-red-600 text-white border-red-600 px-3' 
                        : 'bg-white dark:bg-[#1a1d24] text-red-500 hover:text-red-700 hover:bg-red-50'
                    }`}
                    title="حذف"
                  >
                    {deletingId === card.id ? (
                      <div className="flex items-center gap-2" onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(card.id);
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white dark:bg-[#1a1d24] rounded-[2rem] shadow-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-zinc-900 dark:text-white">{isEditing ? 'تعديل البطاقة' : 'إضافة بطاقة مدعومة'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-red-500 transition-colors bg-zinc-100 dark:bg-[#1a1d24] p-2 rounded-xl">
                <XCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-5">
              {!isEditing && (
                <div className="mb-4">
                  <label className="block text-xs font-black text-zinc-700 mb-2 uppercase tracking-wider">اختيار من البطاقات الجاهزة</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {PRESET_CARDS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, name: preset.name, image_url: preset.image_url })}
                        className="flex flex-col items-center gap-1 p-2 border border-zinc-200 rounded-xl hover:border-zinc-500 bg-zinc-50 dark:bg-[#0f1115] hover:bg-zinc-100 dark:bg-[#1a1d24] transition-all min-w-[80px]"
                      >
                        <img src={preset.image_url} alt={preset.name} className="h-6 w-auto object-contain filter grayscale hover:grayscale-0 transition-all" />
                        <span className="text-[10px] font-bold text-zinc-600 truncate w-full text-center">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-zinc-700 mb-2 uppercase tracking-wider">اسم البطاقة أو اللعبة</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-200 rounded-xl px-4 py-3 text-sm font-black focus:outline-none focus:border-zinc-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-zinc-700 mb-2 uppercase tracking-wider">رابط الشعار المفرغ (URL)</label>
                <input
                  type="url"
                  required
                  value={formData.image_url || ''}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-200 rounded-xl px-4 py-3 text-sm font-black focus:outline-none focus:border-zinc-900 transition-all"
                  dir="ltr"
                />
                {formData.image_url && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-zinc-200 bg-white dark:bg-[#1a1d24] p-4 max-w-[200px] flex justify-center items-center">
                    <img src={formData.image_url} alt="Preview" className="w-full h-auto object-contain max-h-16" onError={(e) => (e.currentTarget.style.display = 'none')} onLoad={(e) => (e.currentTarget.style.display = 'block')} />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-black text-zinc-700 mb-2 uppercase tracking-wider text-right flex items-center gap-2">
                  رابط التوجيه (اختياري)
                  <span className="text-[10px] text-zinc-500 font-normal">عند الضغط على البطاقة</span>
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.target_url || ''}
                  onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-200 rounded-xl px-4 py-3 text-sm font-black focus:outline-none focus:border-zinc-900 transition-all"
                  dir="ltr"
                />
                {formData.target_url && (
                  <div className="mt-2 text-xs">
                    <a href={formData.target_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 font-bold hover:underline flex items-center gap-1">
                      <ExternalLink size={12} /> معاينة الرابط
                    </a>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActiveCard"
                  checked={formData.is_active ?? true}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 accent-zinc-900"
                />
                <label htmlFor="isActiveCard" className="text-sm font-black text-zinc-900 dark:text-white cursor-pointer">
                  تفعيل العرض
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
