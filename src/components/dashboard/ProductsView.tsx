import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreVertical, Edit2, Trash2, ExternalLink, Package, Star, Sparkles, Loader2, AlertCircle, Fingerprint, User, Share2, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabaseClient';
import { Product } from '../../types/products';
import ProductModal from './ProductModal';

export default function ProductsView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setProducts(data || []);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'حدث خطأ أثناء تحميل المنتجات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const { data, error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .select();

      if (deleteError) throw deleteError;
      
      if (!data || data.length === 0) {
        throw new Error('فشل الحذف من قاعدة البيانات. قد يكون المنتج مرتبطاً بطلبات سابقة أو قيود حماية (RLS).');
      }
      
      setProducts(products.filter(p => p.id !== id));
      setDeletingProductId(null);
    } catch (err: any) {
      alert('خطأ أثناء الحذف: ' + (err.message || 'حدث خطأ غير متوقع'));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.game_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
        <p className="text-zinc-500 font-bold">جاري تحميل المنتجات...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12" dir="rtl">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-[#1a1d24] p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-zinc-900 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-zinc-900/20">
            <Package size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white">إدارة المنتجات</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">إجمالي {products.length} من العناصر في المتجر</p>
            </div>
          </div>
        </div>

        <button 
          onClick={() => {
            setEditingProduct(null);
            setIsModalOpen(true);
          }}
          className="bg-red-600 hover:bg-red-700 text-white font-black px-8 h-14 rounded-2xl shadow-xl shadow-red-600/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
        >
          <Plus size={20} />
          إضافة منتج جديد
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-red-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="البحث بالاسم أو اللعبة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-[#1a1d24] border border-zinc-100 rounded-2xl pr-14 pl-6 h-14 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-red-600/5 focus:border-red-600 transition-all shadow-sm"
          />
        </div>
        <button className="h-14 px-6 bg-white dark:bg-[#1a1d24] border border-zinc-100 rounded-2xl text-zinc-600 flex items-center gap-3 font-bold hover:bg-zinc-50 dark:bg-[#0f1115] transition-all shadow-sm">
          <Filter size={18} />
          تصفية
        </button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredProducts.map((product) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={product.id}
              className="bg-white dark:bg-[#1a1d24] rounded-[2.5rem] border border-zinc-100 p-6 shadow-sm hover:shadow-xl hover:shadow-zinc-200/50 transition-all group relative"
            >
              {/* Product Image */}
              <div className="aspect-[4/3] bg-zinc-50 dark:bg-[#0f1115] rounded-[2rem] mb-6 overflow-hidden relative border border-zinc-100">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-300">
                    <Package size={48} strokeWidth={1} />
                  </div>
                )}
                
                {/* Activation Indicators */}
                <div className="absolute bottom-4 right-4 flex gap-1.5 translate-y-12 transition-transform duration-500 group-hover:translate-y-0">
                  {product.require_player_id && (
                    <div className="w-7 h-7 bg-white dark:bg-[#1a1d24]/90 backdrop-blur shadow-sm rounded-lg flex items-center justify-center text-red-600" title="يتطلب آيدي">
                      <Fingerprint size={14} />
                    </div>
                  )}
                  {product.require_username && (
                    <div className="w-7 h-7 bg-white dark:bg-[#1a1d24]/90 backdrop-blur shadow-sm rounded-lg flex items-center justify-center text-red-600" title="يتطلب اسم المستخدم">
                      <User size={14} />
                    </div>
                  )}
                  {product.require_social_link && (
                    <div className="w-7 h-7 bg-white dark:bg-[#1a1d24]/90 backdrop-blur shadow-sm rounded-lg flex items-center justify-center text-red-600" title="يتطلب رابط حساب">
                      <Share2 size={14} />
                    </div>
                  )}
                  {product.require_phone_number && (
                    <div className="w-7 h-7 bg-white dark:bg-[#1a1d24]/90 backdrop-blur shadow-sm rounded-lg flex items-center justify-center text-red-600" title="يتطلب رقم هاتف">
                      <Phone size={14} />
                    </div>
                  )}
                </div>
                
                {/* Badges */}
                <div className="absolute top-4 inset-x-4 flex flex-col gap-2 pointer-events-none">
                  <div className="flex items-center justify-between">
                    {product.discount_badge && (
                      <div className="px-3 py-1 bg-red-600 text-white text-[10px] font-black rounded-lg shadow-lg">
                        {product.discount_badge}
                      </div>
                    )}
                    <div className="flex gap-2">
                      {product.is_featured && (
                        <div className="w-8 h-8 bg-amber-500 text-white rounded-lg flex items-center justify-center shadow-lg">
                          <Star size={14} />
                        </div>
                      )}
                      {product.is_new && (
                        <div className="w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center shadow-lg">
                          <Sparkles size={14} />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {product.game_name && (
                    <div className="self-end px-3 py-1.5 bg-zinc-900/80 backdrop-blur text-white text-[9px] font-black rounded-lg shadow-xl border border-white/10 uppercase tracking-widest">
                      {product.game_name}
                    </div>
                  )}
                </div>
              </div>

              {/* Product Details */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{product.game_name || 'بدون فئة'}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xl font-black text-zinc-900 dark:text-white">{product.price}</span>
                    <span className="text-[10px] font-black text-zinc-400 uppercase">د.ل</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 border-y border-zinc-50/80 py-1.5 my-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 font-bold">المخزون المتوفر:</span>
                    <span className={`px-2 py-0.5 rounded-md font-black text-[10px] ${
                      product.stock === undefined || product.stock === null 
                        ? 'bg-zinc-100 dark:bg-[#1a1d24] text-zinc-650' 
                        : product.stock <= 0 
                          ? 'bg-red-55/70 text-red-700 border border-red-200' 
                          : product.stock <= 5 
                            ? 'bg-amber-55/70 text-amber-700 border border-amber-200' 
                            : 'bg-green-55/70 text-green-700 border border-green-200'
                    }`}>
                      {product.stock === undefined || product.stock === null ? 'غير محدود ♾️' : `${product.stock} وحدات`}
                    </span>
                  </div>
                  {product.robo_coins_bonus !== undefined && product.robo_coins_bonus > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-red-650 font-bold">بونص Robux الهدية:</span>
                      <span className="font-black text-[10px] text-red-700 bg-red-50/80 px-2 py-0.5 rounded-md">
                        🪙 {product.robo_coins_bonus} Robux
                      </span>
                    </div>
                  )}
                  {product.robux_quantity !== undefined && product.robux_quantity > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-600 font-bold">حجم شحن Robux:</span>
                      <span className="font-black text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                        🎮 {product.robux_quantity} Robux
                      </span>
                    </div>
                  )}
                  {product.bundle_quantity !== undefined && product.bundle_quantity > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-blue-600 font-bold">كمية الحزمة:</span>
                      <span className="font-black text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        📦 {product.bundle_quantity} وحدة
                      </span>
                    </div>
                  )}
                  {product.bundle_quantity !== undefined && product.bundle_quantity > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-600 font-bold">سعر الـ 100 وحدة:</span>
                      <span className="font-black text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        {((product.price / product.bundle_quantity) * 100).toFixed(2)} د.ل
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-black text-zinc-900 dark:text-white text-lg leading-tight group-hover:text-red-600 transition-colors line-clamp-1">{product.title}</h3>
                  <p className="text-[10px] text-zinc-500 font-bold mt-1 line-clamp-2 leading-relaxed">
                    {product.description || 'لا يوجد وصف متاح لهذا المنتج حالياً.'}
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button 
                    onClick={() => {
                      setEditingProduct(product);
                      setIsModalOpen(true);
                    }}
                    className="flex-1 bg-zinc-900 hover:bg-black text-white h-11 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all"
                  >
                    <Edit2 size={14} />
                    تعديل
                  </button>
                  <button 
                    onClick={() => setDeletingProductId(product.id)}
                    className="w-11 h-11 border border-zinc-100 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl flex items-center justify-center transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredProducts.length === 0 && (
        <div className="bg-white dark:bg-[#1a1d24] rounded-[2.5rem] border border-zinc-100 p-16 text-center space-y-6">
          <div className="w-24 h-24 bg-zinc-50 dark:bg-[#0f1115] rounded-full flex items-center justify-center text-zinc-300 mx-auto">
            <Search size={48} />
          </div>
          <div>
            <h3 className="text-xl font-black text-zinc-900 dark:text-white">لم نجد أي نتائج</h3>
            <p className="text-zinc-500 font-medium mt-2">حاول البحث بكلمات أخرى أو أضف منتجاً جديداً للمتجر.</p>
          </div>
          <button 
            onClick={() => setSearchQuery('')}
            className="text-red-600 font-black text-sm hover:underline"
          >
            إعادة تعيين البحث
          </button>
        </div>
      )}

      {/* Product Modal */}
      <ProductModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={fetchProducts}
        product={editingProduct}
      />

      {/* Professional Deletion Dialog */}
      <AnimatePresence>
        {deletingProductId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setDeletingProductId(null)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-[#1a1d24] w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-zinc-100 text-center"
            >
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-600 mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2">تأكيد الحذف النهائي</h3>
              <p className="text-zinc-500 font-bold text-sm leading-relaxed mb-8">
                هل أنت متأكد من رغبتك في حذف هذا المنتج نهائياً؟ 
                <br />
                <span className="text-red-600">هذا الإجراء لا يمكن التراجع عنه.</span>
              </p>
              
              <div className="flex gap-3">
                <button
                  disabled={isDeleting}
                  onClick={() => setDeletingProductId(null)}
                  className="flex-1 h-14 rounded-2xl border border-zinc-200 text-zinc-600 font-black hover:bg-zinc-50 dark:bg-[#0f1115] transition-all disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  disabled={isDeleting}
                  onClick={() => handleDelete(deletingProductId)}
                  className="flex-1 h-14 rounded-2xl bg-red-600 text-white font-black shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 size={20} className="animate-spin" /> : 'حذف نهائي'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
