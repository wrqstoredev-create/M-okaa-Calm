import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Check, X, Loader2, Package, CheckSquare, Square, RefreshCw, AlertCircle } from 'lucide-react';

interface Game {
  id: string;
  name: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
}

interface GameProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game | null;
  onSaved: () => void;
}

export default function GameProductsModal({ isOpen, onClose, game, onSaved }: GameProductsModalProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && game) {
      fetchProducts();
    }
  }, [isOpen, game]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .order('title');

      if (fetchError) throw fetchError;

      setProducts(data || []);
      
      // Filter initial selected IDs associated with this game
      if (game) {
        const initialSelected = (data || [])
          .filter((p: any) => p.game_id === game.id || (p.game_name && game.name && p.game_name.toLowerCase() === game.name.toLowerCase()))
          .map((p: any) => p.id);
        setSelectedIds(initialSelected);
      }
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.message || 'حدث خطأ أثناء تحميل المنتجات');
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = (productId: string) => {
    setSelectedIds(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId) 
        : [...prev, productId]
    );
  };

  const selectAll = () => {
    const visibleProductIds = filteredProducts.map(p => p.id);
    setSelectedIds(prev => {
      const newIds = [...prev];
      visibleProductIds.forEach(id => {
        if (!newIds.includes(id)) {
          newIds.push(id);
        }
      });
      return newIds;
    });
  };

  const deselectAll = () => {
    const visibleProductIds = filteredProducts.map(p => p.id);
    setSelectedIds(prev => prev.filter(id => !visibleProductIds.includes(id)));
  };

  const handleSave = async () => {
    if (!game) return;
    setSaving(true);
    setError(null);

    try {
      // 1. Reset game_id and game_name to null for products currently associated with this game
      const { error: resetError } = await supabase
        .from('products')
        .update({ 
          game_id: null,
          game_name: '' 
        })
        .or(`game_id.eq.${game.id},game_name.eq."${game.name}"`);

      if (resetError) throw resetError;

      // 2. Set game_id to the selected products
      if (selectedIds.length > 0) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ 
            game_id: game.id,
            game_name: game.name // Keep game name column fully synchronized
          })
          .in('id', selectedIds);

        if (updateError) throw updateError;
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Error saving associations:', err);
      setError(err.message || 'حدث خطأ أثناء حفظ التغييرات');
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.game_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen || !game) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-white dark:bg-[#1a1d24] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50 dark:bg-[#0f1115]/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-600/20">
              {game.image_url ? (
                <img referrerPolicy="no-referrer" src={game.image_url} alt={game.name} className="w-8 h-8 object-contain" />
              ) : (
                <Package size={22} />
              )}
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white">تخصيص منتجات قسم {game.name}</h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">حدد المنتجات التي تريد عرضها في قسم اللعبة بالموقع</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:text-white hover:bg-zinc-100 dark:bg-[#1a1d24] rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Info Note */}
        <div className="px-6 pt-4">
          <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4 flex items-start gap-3 text-right">
            <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
            <div className="space-y-1">
              <p className="text-sm font-black text-blue-900 dark:text-blue-400">تخصيص منتجات اللعبة</p>
              <p className="text-xs text-blue-800/70 dark:text-blue-300/60 font-bold leading-relaxed">
                المنتجات التي تختارها هنا ستظهر في صفحة قسم **"{game.name}"** في المتجر. (الأقسام الرئيسية في الصفحة الرئيسية لها إعدادات مستقلة).
              </p>
            </div>
          </div>
        </div>

        {/* Search and Quick Filters */}
        <div className="p-6 border-b border-zinc-100 space-y-4">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 focus:text-red-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder="ابحث عن منتج بالاسم أو القسم الفرعي لكتابة التخصيص..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-100 rounded-2xl pr-11 pl-4 py-3.5 text-xs font-bold focus:outline-none focus:border-red-600 transition-all text-right"
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <p className="font-bold text-zinc-500">
              تم تحديد <span className="font-black text-red-600 text-sm">{selectedIds.length}</span> من أصل {products.length} منتج متوفر
            </p>
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={selectAll}
                className="px-3 py-1.5 bg-zinc-100 dark:bg-[#1a1d24] hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-700 font-bold rounded-lg transition-all"
              >
                تحديد المعروض بالبحث
              </button>
              <button 
                type="button" 
                onClick={deselectAll}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg transition-all"
              >
                إلغاء تحديد المعروض
              </button>
            </div>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 mb-4">
              <AlertCircle size={20} />
              <p className="text-xs font-bold leading-relaxed">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
              <p className="text-zinc-500 text-xs font-bold">جاري جلب قائمة المنتجات...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-2.5">
              {filteredProducts.map((p) => {
                const isChecked = selectedIds.includes(p.id);
                // See if product is linked to another game
                const isLinkedElsewhere = p.game_id && p.game_id !== game.id;
                
                return (
                  <div 
                    key={p.id}
                    onClick={() => toggleProduct(p.id)}
                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                      isChecked 
                        ? 'bg-red-50/50 border-red-200 shadow-sm' 
                        : 'bg-zinc-50 dark:bg-[#0f1115]/30 border-zinc-100 hover:bg-zinc-50 dark:bg-[#0f1115]/80 hover:border-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Thumbnail or placeholder */}
                      <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-[#1a1d24] border border-zinc-200/50 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {p.image_url ? (
                          <img referrerPolicy="no-referrer" src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                        ) : (
                          <Package size={20} className="text-zinc-400" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="text-right">
                        <h4 className="text-sm font-black text-zinc-900 dark:text-white leading-tight line-clamp-1">{p.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-black text-zinc-500">{p.price} د.ل</span>
                          
                          {isLinkedElsewhere ? (
                            <span className="px-2 py-0.5 bg-amber-50 text-[9px] text-amber-700 font-bold border border-amber-100 rounded-full">
                              معروض في قسم: {p.game_name}
                            </span>
                          ) : p.game_id === game.id ? (
                            <span className="px-2 py-0.5 bg-green-50 text-[9px] text-green-700 font-bold border border-green-100 rounded-full">
                              مضاف حالياً هنا
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-zinc-100 dark:bg-[#1a1d24] text-[9px] text-zinc-500 font-bold border border-zinc-200/50 rounded-full">
                              غير مرتبط بقسم رئيسي
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Selector Icon */}
                    <div className="flex-shrink-0">
                      {isChecked ? (
                        <div className="w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-600/20">
                          <Check size={14} className="stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-lg border-2 border-zinc-200 hover:border-zinc-400 transition-colors bg-white dark:bg-[#1a1d24]" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-400">
              <Package size={40} className="mb-2" />
              <p className="text-xs font-bold uppercase">لم يُعثر على منتجات</p>
              <p className="text-[11px] font-medium mt-1">جرب تغيير كلمات البحث أو اذهب لقائمة المنتجات لإضافتها أولاً.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-100 bg-zinc-50 dark:bg-[#0f1115]/50 flex flex-col sm:flex-row gap-3">
          <button 
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-zinc-200 dark:bg-zinc-800 text-white font-black h-12 rounded-xl shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-sm"
          >
            {saving ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <Check size={18} />
                حفظ المنتجات المحددة داحل هذا القسم
              </>
            )}
          </button>
          <button 
            type="button"
            onClick={onClose}
            className="px-6 bg-white dark:bg-[#1a1d24] border border-zinc-200 text-zinc-500 font-semibold h-12 rounded-xl hover:bg-zinc-100 dark:bg-[#1a1d24] transition-all text-sm"
          >
            إلغاء
          </button>
        </div>
      </motion.div>
    </div>
  );
}
