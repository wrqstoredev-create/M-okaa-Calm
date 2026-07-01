import React, { useState, useEffect } from 'react';
import { X, Save, Image as ImageIcon, Tag, Hash, Layout, Star, Sparkles, AlertCircle, Loader2, User, Fingerprint, Share2, Phone, ShieldQuestion } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabaseClient';
import { Product } from '../../types/products';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  product?: Product | null;
}

export default function ProductModal({ isOpen, onClose, onSave, product }: ProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Product>>({
    title: '',
    game_name: '',
    price: 0,
    old_price: undefined,
    description: '',
    image_url: '',
    discount_badge: '',
    is_featured: false,
    is_new: false,
    require_player_id: false,
    require_username: false,
    require_social_link: false,
    require_phone_number: false,
    stock: undefined,
    robo_coins_bonus: 0,
    robux_quantity: 0,
    bundle_quantity: 0,
    game_id: undefined
  });

  const [games, setGames] = useState<any[]>([]);

  useEffect(() => {
    const fetchGames = async () => {
      const { data } = await supabase.from('games').select('*').order('name');
      setGames(data || []);
    };
    fetchGames();
  }, []);

  useEffect(() => {
    if (product) {
      setFormData(product);
    } else {
      setFormData({
        title: '',
        game_name: '',
        price: 0,
        description: '',
        image_url: '',
        discount_badge: '',
        is_featured: false,
        is_new: false,
        require_player_id: false,
        require_username: false,
        require_social_link: false,
        require_phone_number: false,
        stock: undefined,
        robo_coins_bonus: 0,
        robux_quantity: 0,
        bundle_quantity: 0
      });
    }
  }, [product, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (product?.id) {
        // Sanitize data to avoid updating protected columns or columns that cause issues
        const { id, created_at, updated_at, ...updateData } = formData;
        
        // Update
        const { error: updateError } = await supabase
          .from('products')
          .update({
            ...updateData,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id);
        
        if (updateError) throw updateError;
      } else {
        // Sanitize insert data
        const { id, created_at, updated_at, ...insertData } = formData;
        
        // Insert
        const { error: insertError } = await supabase
          .from('products')
          .insert([insertData]);
        
        if (insertError) throw insertError;
      }

      onSave();
      onClose();
    } catch (err: any) {
      console.error('Product Save Error:', err);
      setError(err.message || 'حدث خطأ أثناء حفظ المنتج');
    } finally {
      setLoading(false);
    }
  };

  const isRobloxCategory = !!(
    formData.game_name?.toLowerCase().includes('roblox') || 
    formData.game_name?.toLowerCase().includes('robux') || 
    formData.game_name?.includes('روبلوكس') || 
    formData.game_name?.includes('روبوكس') || 
    formData.title?.toLowerCase().includes('roblox') || 
    formData.title?.toLowerCase().includes('robux') || 
    formData.title?.includes('روبلوكس') || 
    formData.title?.includes('روبوكس')
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-2xl bg-white dark:bg-[#1a1d24] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50 dark:bg-[#0f1115]/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-600/20">
              <Layout size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white">{product ? 'تعديل منتج' : 'إضافة منتج جديد'}</h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">التحكم الكامل في تفاصيل المنتج</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:text-white hover:bg-zinc-100 dark:bg-[#1a1d24] rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <form id="product-form" onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
                <AlertCircle size={20} />
                <p className="text-xs font-bold leading-relaxed">{error}</p>
              </div>
            )}

            {/* Basic Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Tag size={16} className="text-red-600" />
                <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-widest">المعلومات الأساسية</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mr-2">اسم المنتج (العنوان)</label>
                  <input 
                    required
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="مثال: بطاقة بلايستيشن 50 دولار"
                    className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-600 transition-all text-right" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mr-2">ربط باللعبة / التصنيف الرئيسي</label>
                  <select 
                    value={formData.game_id || ''}
                    onChange={(e) => {
                      const selectedId = e.target.value || undefined;
                      const matchedGame = games.find(g => g.id === selectedId);
                      setFormData({
                        ...formData,
                        game_id: selectedId,
                        game_name: matchedGame ? matchedGame.name : ''
                      });
                    }}
                    className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-600 transition-all text-right text-zinc-800"
                  >
                    <option value="">-- غير محدد --</option>
                    {games.map(game => (
                      <option key={game.id} value={game.id}>{game.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mr-2">تسمية القسم الفرعي (تعبئة تلقائية أو مخصصة)</label>
                <input 
                  type="text"
                  value={formData.game_name || ''}
                  onChange={(e) => setFormData({...formData, game_name: e.target.value})}
                  placeholder="مثال: PLAYSTATION"
                  className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-600 transition-all text-right text-zinc-600" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mr-2">وصف المنتج</label>
                <textarea 
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="اكتب وصفاً مختصراً للمنتج..."
                  className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-600 transition-all text-right resize-none" 
                />
              </div>
            </div>

            {/* Pricing & Media */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Hash size={16} className="text-red-600" />
                  <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-widest">التسعير والرموز</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mr-2">السعر الحالي (د.ل)</label>
                    <input 
                      required
                      type="number"
                      step="any"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                      className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-100 rounded-xl px-4 py-3 text-sm font-black focus:outline-none focus:border-red-600 transition-all text-center" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mr-2">السعر القديم (اختياري)</label>
                    <input 
                      type="number"
                      step="any"
                      value={formData.old_price || ''}
                      onChange={(e) => setFormData({...formData, old_price: e.target.value ? Number(e.target.value) : undefined})}
                      className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-100 rounded-xl px-4 py-3 text-sm font-black focus:outline-none focus:border-red-600 transition-all text-center text-zinc-400" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mr-2">شعار الخصم (مثال: 10% OFF)</label>
                  <input 
                    type="text"
                    value={formData.discount_badge || ''}
                    onChange={(e) => setFormData({...formData, discount_badge: e.target.value})}
                    placeholder="سيظهر كملصق على الصورة"
                    className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-600 transition-all text-right" 
                  />
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-[#0f1115] border border-zinc-200/50 rounded-2xl space-y-3.5 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-zinc-700">تتبع وإدارة المخزون</span>
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        stock: formData.stock !== undefined && formData.stock !== null ? undefined : 20
                      })}
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border transition-all ${
                        formData.stock !== undefined && formData.stock !== null
                          ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                          : 'bg-zinc-100 dark:bg-[#1a1d24] border-zinc-300 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800'
                      }`}
                    >
                      {formData.stock !== undefined && formData.stock !== null ? 'تعطيل تتبع المخزون' : 'تفعيل تتبع المخزون'}
                    </button>
                  </div>

                  {formData.stock !== undefined && formData.stock !== null ? (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mr-1">كمية المخزون المتاحة للمنتج</label>
                      <input 
                        type="number"
                        min="0"
                        step="any"
                        value={formData.stock}
                        onChange={(e) => setFormData({...formData, stock: Number(e.target.value) || 0})}
                        placeholder="مثال: 50"
                        className="w-full bg-white dark:bg-[#1a1d24] border border-zinc-200 rounded-xl px-4 py-3 text-sm font-black focus:outline-none focus:border-red-600 transition-all text-center" 
                      />
                      <p className="text-[9px] text-zinc-400 font-bold text-center leading-normal">سيتم تنقيص هذا العدد تلقائياً فور اكتمال وتسليم طلب هذا المنتج للعميل.</p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-zinc-400 font-bold leading-relaxed">
                      💡 المخزون حالياً <span className="text-zinc-600 font-black">غير محدود ♾️</span> (مثالي للمنتجات البرمجية اللانهائية).
                    </p>
                  )}
                </div>

                <div className="p-4 bg-red-50/20 border border-red-100 rounded-2xl space-y-3 mt-2">
                  <div className="flex items-center gap-1.5 text-zinc-900 dark:text-white">
                    <span className="text-xs font-black text-red-700">🪙 المكافأة الهدية: Robux (روبوكس بونص)</span>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mr-1">عدد بونص Robux المكتسب عند شراء هذا المنتج</label>
                    <input 
                      type="number"
                      min="0"
                      step="any"
                      value={formData.robo_coins_bonus || 0}
                      onChange={(e) => setFormData({...formData, robo_coins_bonus: Number(e.target.value) || 0})}
                      placeholder="مثال: 100"
                      className="w-full bg-white dark:bg-[#1a1d24] border border-zinc-200 rounded-xl px-4 py-3 text-sm font-black focus:outline-none focus:border-red-600 transition-all text-center" 
                    />
                    <p className="text-[9px] text-zinc-400 font-bold text-center leading-normal">سيتم تلقائياً خصم عدد عملات المكافآت هذا من رصيد النظام الإجمالي فور اكتمال وتسليم هذا الطلب.</p>
                  </div>
                </div>

                {isRobloxCategory && (
                  <div className="p-4 bg-amber-50/45 border border-amber-200/60 rounded-2xl space-y-3 mt-2">
                    <div className="flex items-center gap-1.5 text-zinc-900 dark:text-white">
                      <span className="text-xs font-black text-amber-800">🎮 شحن روبوكس (الكمية المشحونة)</span>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mr-1">كمية الـ Robux التي سيحصل عليها المشتري في هذا المنتج</label>
                      <input 
                        type="number"
                        min="0"
                        step="any"
                        value={formData.robux_quantity || 0}
                        onChange={(e) => setFormData({...formData, robux_quantity: Number(e.target.value) || 0})}
                        placeholder="مثال: 1000"
                        className="w-full bg-white dark:bg-[#1a1d24] border border-amber-200 rounded-xl px-4 py-3 text-sm font-black focus:outline-none focus:border-amber-600 transition-all text-center font-mono" 
                      />
                      <p className="text-[9px] text-zinc-400 font-bold text-center leading-normal">تظهر للعملاء في تفاصيل وبطاقة المنتج لتوضيح الحجم الكلي للباقة المشحونة.</p>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-blue-50/45 border border-blue-200/60 rounded-2xl space-y-3 mt-2">
                  <div className="flex items-center justify-between gap-1.5 text-zinc-900 dark:text-white">
                    <span className="text-xs font-black text-blue-800">📦 المقياس / حجم الحزمة (وحدة)</span>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mr-1">الكمية أو حجم الشحنة بالمنتج (مثال: 500 وحدة)</label>
                    <input 
                      type="number"
                      min="0"
                      step="any"
                      value={formData.bundle_quantity || 0}
                      onChange={(e) => setFormData({...formData, bundle_quantity: Number(e.target.value) || 0})}
                      placeholder="مثال: 500"
                      className="w-full bg-white dark:bg-[#1a1d24] border border-blue-200 rounded-xl px-4 py-3 text-sm font-black focus:outline-none focus:border-blue-600 transition-all text-center font-mono" 
                    />
                    <p className="text-[9px] text-zinc-400 font-bold text-center leading-normal">
                      يفيد هذا الرقم في تمكين النظام من حساب (سعر كل 100 وحدة) تلقائياً وعرض المقياس للمستخدم.
                      {formData.bundle_quantity && formData.bundle_quantity > 0 ? (
                        <span className="block mt-1 text-emerald-600 font-black">
                         ( السعر لكل 100 وحدة سيكون: {((formData.price! / formData.bundle_quantity) * 100).toFixed(2)} د.ل )
                        </span>
                      ) : ''}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <ImageIcon size={16} className="text-red-600" />
                  <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-widest">صورة المنتج</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="w-full aspect-video bg-zinc-50 dark:bg-[#0f1115] rounded-2xl border border-dashed border-zinc-200 flex items-center justify-center overflow-hidden relative group">
                    {formData.image_url ? (
                      <>
                        <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            type="button"
                            onClick={() => setFormData({...formData, image_url: ''})}
                            className="bg-white dark:bg-[#1a1d24] text-red-600 px-4 py-2 rounded-xl text-xs font-black"
                          >
                            حذف الصورة
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-zinc-400">
                        <ImageIcon size={40} strokeWidth={1} />
                        <span className="text-[10px] font-bold uppercase">معاينة الصورة</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mr-2">رابط صورة المنتج (URL)</label>
                    <input 
                      type="url"
                      value={formData.image_url || ''}
                      onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                      placeholder="https://example.com/image.jpg"
                      className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-100 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-red-600 transition-all text-left" 
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Badges & Flags */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Star size={16} className="text-red-600" />
                <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-widest">خيارات العرض</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, is_featured: !formData.is_featured})}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${formData.is_featured ? 'bg-amber-50 border-amber-200' : 'bg-zinc-50 dark:bg-[#0f1115] border-zinc-100'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${formData.is_featured ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}>
                      <Star size={18} />
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-black ${formData.is_featured ? 'text-amber-900' : 'text-zinc-600'}`}>منتج مميز (Featured)</p>
                      <p className="text-[9px] font-bold text-zinc-400 uppercase">يظهر في قسم المميز</p>
                    </div>
                  </div>
                  <div className={`w-10 h-5 rounded-full relative transition-all ${formData.is_featured ? 'bg-amber-400' : 'bg-zinc-300'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white dark:bg-[#1a1d24] transition-all ${formData.is_featured ? 'left-5.5' : 'left-0.5'}`} />
                  </div>
                </button>

                <button 
                  type="button"
                  onClick={() => setFormData({...formData, is_new: !formData.is_new})}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${formData.is_new ? 'bg-blue-50 border-blue-200' : 'bg-zinc-50 dark:bg-[#0f1115] border-zinc-100'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${formData.is_new ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}>
                      <Sparkles size={18} />
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-black ${formData.is_new ? 'text-blue-900' : 'text-zinc-600'}`}>منتج جديد (New)</p>
                      <p className="text-[9px] font-bold text-zinc-400 uppercase">يظهر عليه ملصق "جديد"</p>
                    </div>
                  </div>
                  <div className={`w-10 h-5 rounded-full relative transition-all ${formData.is_new ? 'bg-blue-400' : 'bg-zinc-300'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white dark:bg-[#1a1d24] transition-all ${formData.is_new ? 'left-5.5' : 'left-0.5'}`} />
                  </div>
                </button>
              </div>
            </div>

            {/* Customer Requirements */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldQuestion size={16} className="text-red-600" />
                <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-widest">متطلبات العميل عند الشراء</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, require_player_id: !formData.require_player_id})}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${formData.require_player_id ? 'bg-red-50 border-red-200' : 'bg-zinc-50 dark:bg-[#0f1115] border-zinc-100'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${formData.require_player_id ? 'bg-red-600 text-white shadow-lg' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}>
                      <Fingerprint size={18} />
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-black ${formData.require_player_id ? 'text-red-900' : 'text-zinc-600'}`}>تفعيل حقل الآيدي (ID)</p>
                      <p className="text-[9px] font-bold text-zinc-400 uppercase">مطلوب لشحن الألعاب</p>
                    </div>
                  </div>
                  <div className={`w-10 h-5 rounded-full relative transition-all ${formData.require_player_id ? 'bg-red-400' : 'bg-zinc-300'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white dark:bg-[#1a1d24] transition-all ${formData.require_player_id ? 'left-5.5' : 'left-0.5'}`} />
                  </div>
                </button>

                <button 
                  type="button"
                  onClick={() => setFormData({...formData, require_username: !formData.require_username})}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${formData.require_username ? 'bg-red-50 border-red-200' : 'bg-zinc-50 dark:bg-[#0f1115] border-zinc-100'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${formData.require_username ? 'bg-red-600 text-white shadow-lg' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}>
                      <User size={18} />
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-black ${formData.require_username ? 'text-red-900' : 'text-zinc-600'}`}>تفعيل حقل اسم اللاعب</p>
                      <p className="text-[9px] font-bold text-zinc-400 uppercase">لتأكيد الحساب المستهدف</p>
                    </div>
                  </div>
                  <div className={`w-10 h-5 rounded-full relative transition-all ${formData.require_username ? 'bg-red-400' : 'bg-zinc-300'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white dark:bg-[#1a1d24] transition-all ${formData.require_username ? 'left-5.5' : 'left-0.5'}`} />
                  </div>
                </button>

                <button 
                  type="button"
                  onClick={() => setFormData({...formData, require_social_link: !formData.require_social_link})}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${formData.require_social_link ? 'bg-red-50 border-red-200' : 'bg-zinc-50 dark:bg-[#0f1115] border-zinc-100'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${formData.require_social_link ? 'bg-red-600 text-white shadow-lg' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}>
                      <Share2 size={18} />
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-black ${formData.require_social_link ? 'text-red-900' : 'text-zinc-600'}`}>تفعيل رابط الحساب</p>
                      <p className="text-[9px] font-bold text-zinc-400 uppercase">فيسبوك / تويتر / غيره</p>
                    </div>
                  </div>
                  <div className={`w-10 h-5 rounded-full relative transition-all ${formData.require_social_link ? 'bg-red-400' : 'bg-zinc-300'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white dark:bg-[#1a1d24] transition-all ${formData.require_social_link ? 'left-5.5' : 'left-0.5'}`} />
                  </div>
                </button>

                <button 
                  type="button"
                  onClick={() => setFormData({...formData, require_phone_number: !formData.require_phone_number})}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${formData.require_phone_number ? 'bg-red-50 border-red-200' : 'bg-zinc-50 dark:bg-[#0f1115] border-zinc-100'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${formData.require_phone_number ? 'bg-red-600 text-white shadow-lg' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}>
                      <Phone size={18} />
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-black ${formData.require_phone_number ? 'text-red-900' : 'text-zinc-600'}`}>تفعيل رقم الهاتف</p>
                      <p className="text-[9px] font-bold text-zinc-400 uppercase">للتواصل المباشر</p>
                    </div>
                  </div>
                  <div className={`w-10 h-5 rounded-full relative transition-all ${formData.require_phone_number ? 'bg-red-400' : 'bg-zinc-300'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white dark:bg-[#1a1d24] transition-all ${formData.require_phone_number ? 'left-5.5' : 'left-0.5'}`} />
                  </div>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-100 bg-white dark:bg-[#1a1d24] flex flex-col sm:flex-row gap-3">
          <button 
            type="submit"
            form="product-form"
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-zinc-200 dark:bg-zinc-800 text-white font-black h-14 rounded-2xl shadow-xl shadow-red-600/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <Save size={20} />
                {product ? 'حفظ التعديلات' : 'إضافة المنتج للمتجر'}
              </>
            )}
          </button>
          <button 
            onClick={onClose}
            className="px-8 bg-zinc-100 dark:bg-[#1a1d24] text-zinc-500 font-black h-14 rounded-2xl hover:bg-zinc-200 dark:bg-zinc-800 transition-all"
          >
            إلغاء
          </button>
        </div>
      </motion.div>
    </div>
  );
}
