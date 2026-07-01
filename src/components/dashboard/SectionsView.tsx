
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  MoveUp, 
  MoveDown, 
  Search, 
  Package, 
  Layout, 
  Settings2,
  Check,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface Product {
  id: string;
  title: string;
  game_name: string;
  image_url: string;
  price: number;
}

interface HomeSection {
  id: string;
  title: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  section_type: string;
}

interface SectionProduct {
  id: string;
  section_id: string;
  product_id: string;
  sort_order: number;
}

export default function SectionsView() {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sectionProducts, setSectionProducts] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Partial<HomeSection> | null>(null);
  const [searchProduct, setSearchProduct] = useState('');
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [sectionsRes, productsRes, sectionProductsRes] = await Promise.all([
        supabase.from('home_sections').select('*').order('sort_order'),
        supabase.from('products').select('id, title, game_name, image_url, price').order('created_at', { ascending: false }),
        supabase.from('section_products').select('*').order('sort_order')
      ]);

      if (sectionsRes.data) setSections(sectionsRes.data);
      if (productsRes.data) setProducts(productsRes.data);
      
      const mapping: Record<string, string[]> = {};
      sectionProductsRes.data?.forEach(sp => {
        if (!mapping[sp.section_id]) mapping[sp.section_id] = [];
        mapping[sp.section_id].push(sp.product_id);
      });
      setSectionProducts(mapping);

      if (sectionsRes.data?.length > 0) {
        setActiveSectionId(sectionsRes.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching sections data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSection = async () => {
    if (!editingSection?.title) return;
    setIsSaving(true);
    try {
      if (editingSection.id) {
        const { error } = await supabase.from('home_sections').update(editingSection).eq('id', editingSection.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('home_sections').insert({
          ...editingSection,
          sort_order: sections.length
        }).select().single();
        if (error) throw error;
        if (data) setSections([...sections, data]);
      }
      fetchData();
      setIsModalOpen(false);
      setEditingSection(null);
    } catch (error: any) {
      console.error('Error saving section:', error);
      alert('حدث خطأ أثناء حفظ القسم: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await supabase.from('home_sections').delete().eq('id', id);
      setSections(sections.filter(s => s.id !== id));
      if (activeSectionId === id) setActiveSectionId(null);
      setDeletingId(null);
    } catch (error) {
      console.error('Error deleting section:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleProductInSection = async (sectionId: string, productId: string) => {
    const isCurrentlyIn = sectionProducts[sectionId]?.includes(productId);
    try {
      if (isCurrentlyIn) {
        const { error } = await supabase.from('section_products').delete().eq('section_id', sectionId).eq('product_id', productId);
        if (error) throw error;
        setSectionProducts({
          ...sectionProducts,
          [sectionId]: sectionProducts[sectionId].filter(id => id !== productId)
        });
      } else {
        const { error } = await supabase.from('section_products').insert({
          section_id: sectionId,
          product_id: productId,
          sort_order: (sectionProducts[sectionId]?.length || 0)
        });
        if (error) throw error;
        setSectionProducts({
          ...sectionProducts,
          [sectionId]: [...(sectionProducts[sectionId] || []), productId]
        });
      }
    } catch (error: any) {
      console.error('Error toggling product in section:', error);
      alert('حدث خطأ أثناء تحديث القسم: ' + error.message);
    }
  };

  const constraintsRef = React.useRef(null);

  const handleReorderSections = async (newSections: HomeSection[]) => {
    setSections(newSections);
    try {
      const updates = newSections.map((section, index) => ({
        id: section.id,
        sort_order: index,
        title: section.title,
        icon: section.icon,
        is_active: section.is_active,
        section_type: section.section_type
      }));
      
      const { error } = await supabase.from('home_sections').upsert(updates);
      if (error) throw error;
    } catch (error) {
      console.error('Error reordering sections:', error);
      fetchData(); // Revert to original order if failed
    }
  };

  const filteredProducts = products.filter(p => 
    p.title?.toLowerCase().includes(searchProduct.toLowerCase()) || 
    p.game_name?.toLowerCase().includes(searchProduct.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-1">إدارة الأقسام الرئيسية</h2>
          <p className="text-zinc-500 font-bold text-sm">تحكم في ظهور المنتجات والمجموعات في الصفحة الرئيسية للمتجر.</p>
        </div>
        <button 
          onClick={() => {
            setEditingSection({ title: '', icon: 'layouts', section_type: 'grid', is_active: true });
            setIsModalOpen(true);
          }}
          className="bg-red-600 text-white font-black px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 active:scale-95 self-start"
        >
          <Plus size={20} />
          إضافة قسم جديد
        </button>
      </div>

      <div className="bg-white dark:bg-[#1a1d24] rounded-3xl border border-zinc-100 shadow-sm overflow-hidden flex flex-col md:flex-row h-[700px]">
        {/* Left: Sections Navigation */}
        <div className="w-full md:w-80 border-l border-zinc-100 flex flex-col">
          <div className="p-6 border-b border-zinc-100">
            <h3 className="font-black text-zinc-900 dark:text-white flex items-center gap-2">
              <Layout size={18} className="text-red-600" />
              الأقسام المتوفرة
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 no-scrollbar" ref={constraintsRef}>
            <Reorder.Group axis="y" values={sections} onReorder={handleReorderSections} className="flex flex-col gap-4">
              {sections.map((section) => (
                <Reorder.Item
                  key={section.id}
                  value={section}
                  dragConstraints={constraintsRef}
                  dragElastic={0.1}
                  whileDrag={{ scale: 1.02, opacity: 0.9, zIndex: 50, boxShadow: '0px 10px 20px rgba(0,0,0,0.1)' }}
                  className={`
                    p-4 rounded-2xl transition-all border group relative cursor-grab active:cursor-grabbing bg-white dark:bg-[#1a1d24]
                    ${activeSectionId === section.id 
                      ? 'border-red-200 shadow-sm ring-1 ring-red-100' 
                      : 'border-zinc-200 hover:border-zinc-300'}
                  `}
                >
                  <div className="flex items-center justify-between">
                     <button 
                      onClick={() => setActiveSectionId(section.id)}
                      className="flex-1 text-right flex flex-col items-start cursor-pointer"
                    >
                      <p className={`font-black text-sm mb-0.5 ${activeSectionId === section.id ? 'text-red-700' : 'text-zinc-900 dark:text-white'}`}>{section.title}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-400 capitalize">Type: {section.section_type}</span>
                        <span className="text-[10px] font-bold text-zinc-400">•</span>
                        <span className={`text-[10px] font-black ${section.is_active ? 'text-green-600' : 'text-zinc-300'}`}>
                          {section.is_active ? 'نشط' : 'معطل'}
                        </span>
                      </div>
                    </button>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setEditingSection(section);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 text-zinc-400 hover:text-blue-600"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => setDeletingId(deletingId === section.id ? null : section.id)}
                        disabled={isDeleting}
                        className={`p-1.5 transition-all rounded-lg flex items-center gap-1 ${
                          deletingId === section.id 
                            ? 'bg-red-600 text-white px-2' 
                            : 'text-zinc-400 hover:text-red-600'
                        }`}
                      >
                        {deletingId === section.id ? (
                          <div className="flex items-center gap-1" onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSection(section.id);
                          }}>
                            <Trash2 size={14} />
                            <span className="text-[8px] font-black uppercase">تأكيد؟</span>
                          </div>
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        </div>

        {/* Right: Products Selection */}
        <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-[#0f1115]/30">
          {activeSectionId ? (
            <>
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-white dark:bg-[#1a1d24]">
                <div>
                   <h3 className="font-black text-zinc-900 dark:text-white">تحديد منتجات القسم</h3>
                   <p className="text-[11px] font-bold text-zinc-400 mt-0.5">اختر المنتجات التي تظهر في قسم "{sections.find(s => s.id === activeSectionId)?.title}"</p>
                </div>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="بحث في المنتجات..." 
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                    className="bg-zinc-50 dark:bg-[#0f1115] border border-zinc-100 rounded-xl pr-10 pl-4 py-2 text-xs font-bold outline-none focus:border-red-500 transition-all w-64"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredProducts.map((product) => {
                    const isSelected = sectionProducts[activeSectionId]?.includes(product.id);
                    return (
                      <button
                        key={product.id}
                        onClick={() => toggleProductInSection(activeSectionId, product.id)}
                        className={`
                          relative p-4 rounded-2xl border text-right transition-all group
                          ${isSelected 
                            ? 'bg-white dark:bg-[#1a1d24] border-red-600 shadow-md ring-1 ring-red-600' 
                            : 'bg-white dark:bg-[#1a1d24] border-zinc-200 hover:border-zinc-300 shadow-sm'}
                        `}
                      >
                        <div className="w-full aspect-square bg-zinc-50 dark:bg-[#0f1115] rounded-xl mb-3 flex items-center justify-center overflow-hidden p-2">
                           <img src={product.image_url} alt="" className="w-full h-full object-contain" />
                        </div>
                        <p className="text-zinc-500 text-[10px] font-bold mb-0.5">{product.game_name}</p>
                        <p className="text-zinc-900 dark:text-white text-xs font-black line-clamp-1">{product.title}</p>
                        
                        <div className={`
                          absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center transition-all
                          ${isSelected ? 'bg-red-600 text-white scale-100' : 'bg-transparent text-transparent scale-0'}
                        `}>
                          <Check size={14} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-50">
               <div className="w-20 h-20 bg-zinc-100 dark:bg-[#1a1d24] rounded-[2rem] flex items-center justify-center text-zinc-300 mb-6">
                  <Layout size={32} />
               </div>
               <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-1">اختر قسماً للإدارة</h3>
               <p className="text-sm font-bold text-zinc-400">قم باختيار قسم من القائمة الجانبية لإضافة المنتجات إليه.</p>
             </div>
          )}
        </div>
      </div>

      {/* Section Edit Modal */}
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
              className="relative w-full max-w-lg bg-white dark:bg-[#1a1d24] rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-full h-2 bg-red-600"></div>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
                  <Settings2 size={24} />
                </div>
                <div>
                   <h3 className="text-xl font-black text-zinc-900 dark:text-white">{editingSection?.id ? 'تعديل القسم' : 'إضافة قسم جديد'}</h3>
                   <p className="text-xs font-bold text-zinc-500">قم بتعديل بيانات القسم وكيفية ظهوره.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">عنوان القسم</label>
                  <input 
                    type="text" 
                    value={editingSection?.title || ''}
                    onChange={(e) => setEditingSection({...editingSection, title: e.target.value})}
                    placeholder="مثال: عروض خاصة، أفضل المنتجات..."
                    className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-200 rounded-2xl px-6 py-4 outline-none focus:border-red-500 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">نوع العرض</label>
                    <select 
                      value={editingSection?.section_type}
                      onChange={(e) => setEditingSection({...editingSection, section_type: e.target.value})}
                      className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-200 rounded-2xl px-4 py-4 outline-none focus:border-red-500 font-bold appearance-none cursor-pointer"
                    >
                      <option value="grid">Grid (شبكة)</option>
                      <option value="carousel">Carousel (تمرير)</option>
                      <option value="featured">Featured (مميز)</option>
                    </select>
                  </div>
                  <div>
                     <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">أيقونة القسم (Lucide)</label>
                     <input 
                      type="text" 
                      value={editingSection?.icon || ''}
                      onChange={(e) => setEditingSection({...editingSection, icon: e.target.value})}
                      placeholder="star, flame, zap..."
                      className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-200 rounded-2xl px-6 py-4 outline-none focus:border-red-500 font-bold"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-[#0f1115] rounded-2xl">
                   <input 
                    type="checkbox" 
                    id="is_active"
                    checked={editingSection?.is_active}
                    onChange={(e) => setEditingSection({...editingSection, is_active: e.target.checked})}
                    className="w-5 h-5 accent-red-600"
                  />
                  <label htmlFor="is_active" className="text-sm font-bold text-zinc-700 cursor-pointer select-none">تفعيل القسم فوراً</label>
                </div>
              </div>

              <div className="flex gap-3 mt-10">
                <button 
                  onClick={handleSaveSection}
                  disabled={isSaving || !editingSection?.title}
                  className="flex-1 bg-zinc-900 text-white font-black py-4 rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'حفظ البيانات'}
                </button>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 border border-zinc-200 text-zinc-500 font-black rounded-2xl hover:bg-zinc-50 dark:bg-[#0f1115] transition-all"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
