
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  Gamepad2, 
  Settings2,
  Check,
  X,
  Loader2,
  Image as ImageIcon,
  MoreVertical,
  ExternalLink,
  Package,
  AlertCircle,
  Layout,
  ShoppingBag,
  Grid
} from 'lucide-react';
import GameProductsModal from './GameProductsModal';
import { useToast } from '../../contexts/ToastContext';

interface Game {
  id: string;
  name: string;
  image_url: string;
  is_active: boolean;
  layout_style?: string;
  created_at: string;
  product_count?: number;
}

export default function GamesView() {
  const { addToast } = useToast();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Partial<Game> | null>(null);

  const [isProductsModalOpen, setIsProductsModalOpen] = useState(false);
  const [selectedProductsGame, setSelectedProductsGame] = useState<Game | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const constraintsRef = React.useRef(null);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    setIsLoading(true);
    try {
      // Fetch games and count products for each
      let { data: gamesData, error: gamesError } = await supabase
        .from('games')
        .select(`
          *,
          products:products(id)
        `)
        .order('sort_order', { ascending: true, nullsFirst: false });

      if (gamesError) {
        // Fallback to name if sort_order doesn't exist
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('games')
          .select(`
            *,
            products:products(id)
          `)
          .order('name');
          
        if (fallbackError) throw fallbackError;
        gamesData = fallbackData;
      }

      const formattedGames = (gamesData || []).map((game: any) => ({
        ...game,
        product_count: game.products?.length || 0
      }));

      setGames(formattedGames);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGame = async () => {
    if (!editingGame?.name) return;
    setIsSaving(true);
    try {
      if (editingGame.id) {
        const { error } = await supabase
          .from('games')
          .update({
            name: editingGame.name,
            image_url: editingGame.image_url,
            is_active: editingGame.is_active,
            layout_style: editingGame.layout_style || 'grid_modern'
          })
          .eq('id', editingGame.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('games')
          .insert({
            name: editingGame.name,
            image_url: editingGame.image_url,
            is_active: editingGame.is_active ?? true,
            layout_style: editingGame.layout_style || 'grid_modern'
          });
        if (error) throw error;
      }
      
      await fetchGames();
      setIsModalOpen(false);
      setEditingGame(null);
      addToast('تم حفظ اللعبة بنجاح! 🎉', 'success');
    } catch (error: any) {
      console.error('Error saving game:', error);
      if (error?.message?.includes('layout_style') || error?.code === 'PGRST204') {
        addToast('⚠️ خطأ: حقل نمط التنسيق غير موجود بقاعدة بياناتك! يرجى تشغيل كود SQL المرفق بالتعليمات لتحديث الهيكل.', 'error');
      } else {
        addToast(`خطأ أثناء الحفظ: ${error?.message || error}`, 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    if (isDeleting) return;
    const gameToDelete = games.find(g => g.id === gameId);
    
    setIsDeleting(true);
    try {
      // 1. Detach products from this game first
      let query = supabase.from('products').update({ game_id: null, game_name: '' });
      if (gameToDelete && gameToDelete.name) {
        query = query.or(`game_id.eq.${gameId},game_name.eq."${gameToDelete.name}"`);
      } else {
        query = query.eq('game_id', gameId);
      }
      const { error: unlinkError } = await query;
        
      if (unlinkError) throw unlinkError;

      // 2. Delete the game
      const { error } = await supabase.from('games').delete().eq('id', gameId);
      if (error) throw error;
      
      addToast('تم حذف اللعبة وفصل المنتجات بنجاح ✅', 'success');
      setDeletingId(null);
      fetchGames();
    } catch (error: any) {
      console.error('Error deleting game:', error);
      addToast(`فشل حذف اللعبة: ${error.message || 'خطأ غير معروف'}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReorderGames = async (newGames: Game[]) => {
    if (searchTerm) return;
    setGames(newGames);
    try {
      const updates = newGames.map((game, index) => ({
        id: game.id,
        sort_order: index,
        name: game.name,
        image_url: game.image_url,
        is_active: game.is_active,
        layout_style: game.layout_style
      }));
      await supabase.from('games').upsert(updates);
    } catch (error) {
      console.error('Error saving game order:', error);
    }
  };

  const filteredGames = games.filter(game => 
    game.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col text-right">
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-1">إدارة الألعاب والأقسام</h2>
          <p className="text-zinc-500 font-bold text-sm">تحكم في أسماء وصور الألعاب التي تظهر في شريط التصفح وكأقسام رئيسية في المتجر.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all font-bold text-sm ${
              showHelp 
                ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                : 'bg-white dark:bg-[#1a1d24] text-zinc-600 border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:text-zinc-400'
            }`}
          >
            <AlertCircle size={18} />
            {showHelp ? 'إخفاء الشرح' : 'كيف يعمل النظام؟'}
          </button>
          
          <button 
            onClick={() => setEditingGame({ name: '', image_url: '', is_active: true })}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-black transition-all shadow-lg shadow-red-600/20 active:scale-95"
          >
            <Plus size={20} />
            إضافة لعبة جديدة
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showHelp && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-3xl p-6 text-right">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center text-blue-600 mb-2">
                    <Layout size={20} />
                  </div>
                  <h4 className="font-black text-blue-900 dark:text-blue-400">الأقسام الرئيسية</h4>
                  <p className="text-sm text-blue-800/70 dark:text-blue-300/60 leading-relaxed">
                    كل لعبة تقوم بتفعيلها هنا تظهر كـ **قسم مستقل** في الصفحة الرئيسية للمتجر بشكل تلقائي.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center text-blue-600 mb-2">
                    <ShoppingBag size={20} />
                  </div>
                  <h4 className="font-black text-blue-900 dark:text-blue-400">تخصيص المنتجات</h4>
                  <p className="text-sm text-blue-800/70 dark:text-blue-300/60 leading-relaxed">
                    استخدم زر **"تحديد المنتجات"** لاختيار السلع التي تظهر داخل هذا القسم. المنتجات غير المرتبطة بلعبة لن تظهر في الأقسام.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center text-blue-600 mb-2">
                    <Grid size={20} />
                  </div>
                  <h4 className="font-black text-blue-900 dark:text-blue-400">طريقة العرض</h4>
                  <p className="text-sm text-blue-800/70 dark:text-blue-300/60 leading-relaxed">
                    يمكنك اختيار عرض المنتجات بشكل **عرضي (Carousel)** أو **شبكة (Grid)** من خلال أيقونة الإعدادات على كرت اللعبة.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#1a1d24] p-4 rounded-3xl border border-zinc-100 shadow-sm">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text" 
            placeholder="بحث عن لعبة..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-100 rounded-2xl pr-12 pl-4 py-3.5 text-sm font-bold outline-none focus:border-red-500 transition-all shadow-sm"
          />
        </div>
        <div className="text-xs font-black text-zinc-400 uppercase tracking-widest px-2">
          إجمالي الألعاب: {games.length}
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white dark:bg-[#1a1d24] rounded-[2.5rem] border border-zinc-100 p-20 flex flex-col items-center justify-center space-y-4 shadow-sm">
          <Loader2 className="w-10 h-10 animate-spin text-red-600" />
          <p className="font-black text-zinc-400">جاري تحميل البيانات...</p>
        </div>
      ) : filteredGames.length > 0 ? (
        <Reorder.Group 
          axis="y"
          values={filteredGames} 
          onReorder={handleReorderGames}
          className="flex flex-col gap-4"
          ref={constraintsRef}
        >
          {filteredGames.map((game) => (
            <Reorder.Item 
              key={game.id}
              value={game}
              dragConstraints={constraintsRef}
              dragElastic={0.1}
              whileDrag={{ scale: 1.02, opacity: 0.9, zIndex: 50, boxShadow: '0px 20px 40px rgba(0,0,0,0.1)' }}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-[#1a1d24] rounded-2xl border border-zinc-100 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-red-900/5 transition-all duration-300 relative flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-6">
                <div className="cursor-grab active:cursor-grabbing text-zinc-300 hover:text-zinc-500 transition-colors p-2 hidden sm:block">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>
                </div>
                <div className="w-20 h-20 rounded-2xl bg-zinc-50 dark:bg-[#0f1115] border border-zinc-100 flex items-center justify-center relative overflow-hidden group-hover:border-red-100 group-hover:bg-red-50/30 transition-all duration-500 shrink-0">
                  {game.image_url ? (
                    <img src={game.image_url} alt={game.name} className="w-12 h-12 object-contain z-10 transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <Gamepad2 size={24} className="text-zinc-300" />
                  )}
                </div>

                <div className="flex flex-col justify-center gap-1.5">
                  <h3 className="text-lg font-black text-zinc-900 dark:text-white group-hover:text-red-700 transition-colors uppercase tracking-tight">{game.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${game.is_active ? 'bg-green-50 text-green-600' : 'bg-zinc-100 dark:bg-[#1a1d24] text-zinc-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${game.is_active ? 'bg-green-500' : 'bg-zinc-300'}`}></span>
                      {game.is_active ? 'نشط' : 'معطل'}
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-50 dark:bg-[#0f1115] text-zinc-500 text-[10px] font-black uppercase tracking-widest border border-zinc-100">
                      <Package size={10} />
                      {game.product_count} منتج
                    </div>
                    <span className="hidden md:inline-flex text-[10px] px-3 py-1 rounded-full bg-zinc-100 dark:bg-[#1a1d24] text-zinc-600 font-extrabold uppercase tracking-widest border border-zinc-200/50">
                      {game.layout_style === 'grid_dark_glow' ? '🌌 عتمة الجيمينج' : 
                       game.layout_style === 'compact_rows' ? '📊 صفوف الصفقات' : 
                       game.layout_style === 'bento_metro' ? '🧱 لوح بينتو' : '📱 شبكة عصرية'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setSelectedProductsGame(game);
                    setIsProductsModalOpen(true);
                  }}
                  className="bg-red-50 text-red-700 hover:bg-red-100 font-extrabold px-4 py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap"
                >
                  <Settings2 size={13} />
                  <span className="hidden sm:inline">تحديد المنتجات</span>
                </button>
                <button 
                  onClick={() => {
                    setEditingGame(game);
                    setIsModalOpen(true);
                  }}
                  className="bg-zinc-900 text-white font-black px-4 py-2.5 rounded-xl text-xs hover:bg-black transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-zinc-900/10 active:scale-95 whitespace-nowrap"
                >
                  <Edit2 size={12} />
                  <span className="hidden sm:inline">تعديل</span>
                </button>
                <button 
                  onClick={() => !isDeleting && setDeletingId(deletingId === game.id ? null : game.id)}
                  disabled={isDeleting}
                  className={`relative overflow-hidden border p-2.5 rounded-xl transition-all active:scale-95 flex items-center gap-2 ${
                    deletingId === game.id 
                      ? 'bg-red-600 border-red-600 text-white px-4' 
                      : 'bg-zinc-50 dark:bg-[#0f1115] border-zinc-100 text-zinc-400 hover:text-red-600 hover:bg-red-50'
                  } ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isDeleting && deletingId === game.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : deletingId === game.id ? (
                    <div className="flex items-center gap-2" onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteGame(game.id);
                    }}>
                      <Trash2 size={16} />
                      <span className="text-[10px] font-black uppercase tracking-tight">تأكيد؟</span>
                    </div>
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
                <div className="cursor-grab active:cursor-grabbing text-zinc-300 hover:text-zinc-500 transition-colors p-2 sm:hidden">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>
                </div>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      ) : (
        <div className="bg-white dark:bg-[#1a1d24] rounded-[2.5rem] border border-zinc-100 p-20 flex flex-col items-center justify-center text-center space-y-6 shadow-sm">
          <div className="w-20 h-20 bg-zinc-50 dark:bg-[#0f1115] rounded-[2rem] flex items-center justify-center text-zinc-200">
             <Gamepad2 size={40} />
          </div>
          <div>
            <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2">لا توجد ألعاب متوفرة</h3>
            <p className="text-zinc-500 font-bold max-w-sm mx-auto">ابدأ بإضافة أول لعبة ليتمكن العملاء من تصفح منتجاتها بسهولة.</p>
          </div>
          <button 
            onClick={() => {
              setEditingGame({ name: '', image_url: '', is_active: true });
              setIsModalOpen(true);
            }}
            className="bg-red-600 text-white font-black px-8 py-4 rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 active:scale-95"
          >
            إضافة أول لعبة الآن
          </button>
        </div>
      )}

      {/* Game Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" dir="rtl">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#1a1d24] rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-full h-2 bg-red-600"></div>
              
              <div className="flex items-center gap-4 mb-10">
                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
                  <Gamepad2 size={28} />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-zinc-900 dark:text-white">{editingGame?.id ? 'تعديل بيانات اللعبة' : 'إضافة لعبة جديدة'}</h3>
                   <p className="text-sm font-bold text-zinc-500">قم بتحديث الاسم والصورة وكيفية ظهور اللعبة.</p>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">اسم اللعبة</label>
                  <input 
                    type="text" 
                    value={editingGame?.name || ''}
                    onChange={(e) => setEditingGame({...editingGame, name: e.target.value})}
                    placeholder="مثال: Roblox, PUBG Mobile, PlayStation..."
                    className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-200 rounded-2xl px-6 py-5 outline-none focus:border-red-500 font-bold text-zinc-900 dark:text-white shadow-sm"
                  />
                  <p className="text-[10px] text-zinc-400 mt-2 font-bold px-2">يُنصح باستخدام أسماء واضحة وسهلة القراءة.</p>
                </div>

                <div>
                  <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">رابط صورة اللعبة (الشعار)</label>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                       <ImageIcon className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                       <input 
                        type="text" 
                        value={editingGame?.image_url || ''}
                        onChange={(e) => setEditingGame({...editingGame, image_url: e.target.value})}
                        placeholder="https://example.com/logo.png"
                        className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-200 rounded-2xl pr-12 pl-6 py-5 outline-none focus:border-red-500 font-bold text-zinc-900 dark:text-white shadow-sm"
                        dir="ltr"
                      />
                    </div>
                    {editingGame?.image_url && (
                      <div className="w-[66px] h-[66px] rounded-2xl bg-zinc-50 dark:bg-[#0f1115] border border-zinc-200 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm p-2">
                        <img src={editingGame.image_url} alt="Preview" className="w-full h-full object-contain" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">طريقة عرض الصفحة (نمط التنسيق)</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { id: 'grid_modern', name: 'شبكة عصرية', desc: 'تخطيط شبكي كلاسيكي أنيق وخفيف.' },
                      { id: 'grid_dark_glow', name: 'عتمة نيونية', desc: 'خلفيات سوداء مع وميض LED مخصص.' },
                      { id: 'compact_rows', name: 'صفوف سريعة', desc: 'سرد أفقي ممتاز للبيع والكميات.' },
                      { id: 'bento_metro', name: 'تحفة بينتو', desc: 'مكعبات غير متطابقة تعطي طابع فاخر.' }
                    ].map((opt) => {
                      const isSelected = (editingGame?.layout_style || 'grid_modern') === opt.id;
                      return (
                        <div 
                          key={opt.id}
                          onClick={() => setEditingGame({...editingGame, layout_style: opt.id})}
                          className={`p-3.5 rounded-2xl border cursor-pointer text-right transition-all flex flex-col justify-between h-[82px] ${
                            isSelected 
                              ? 'bg-red-50/55 border-red-500 text-red-950 shadow-sm' 
                              : 'bg-zinc-50 dark:bg-[#0f1115]/50 border-zinc-100 text-zinc-600 hover:bg-zinc-50 dark:bg-[#0f1115] hover:border-zinc-200'
                          }`}
                        >
                          <span className="text-xs font-black block">{opt.name}</span>
                          <span className="text-[9px] font-bold text-zinc-400 leading-snug line-clamp-2 mt-1">{opt.desc}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-6 bg-zinc-50 dark:bg-[#0f1115] rounded-3xl border border-zinc-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-zinc-900 dark:text-white text-sm">حالة اللعبة</h4>
                      <p className="text-[11px] font-bold text-zinc-400">تتحكم في ظهور اللعبة للعملاء في الصفحة الرئيسية.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={editingGame?.is_active}
                        onChange={(e) => setEditingGame({...editingGame, is_active: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-8 bg-zinc-200 dark:bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white dark:bg-[#1a1d24] after:border-gray-300 dark:border-gray-600 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-12">
                <button 
                  onClick={handleSaveGame}
                  disabled={isSaving || !editingGame?.name}
                  className="flex-1 bg-zinc-900 text-white font-black py-5 rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl shadow-zinc-900/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                >
                  {isSaving ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <Check size={20} />
                      {editingGame?.id ? 'حفظ التعديلات' : 'إضافة اللعبة'}
                    </>
                  )}
                </button>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-10 border-2 border-zinc-100 text-zinc-500 font-black rounded-2xl hover:bg-zinc-50 dark:bg-[#0f1115] transition-all active:scale-95"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Game Products Association Modal */}
      <AnimatePresence>
        {isProductsModalOpen && (
          <GameProductsModal 
            isOpen={isProductsModalOpen}
            onClose={() => {
              setIsProductsModalOpen(false);
              setSelectedProductsGame(null);
            }}
            game={selectedProductsGame}
            onSaved={fetchGames}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
