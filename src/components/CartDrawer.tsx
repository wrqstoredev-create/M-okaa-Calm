import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  X, Trash2, ShoppingBag, ArrowLeft, ShieldCheck, 
  Check, ExternalLink, AlertTriangle, Ban, Minus, Plus 
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../contexts/AuthContext';

export default function CartDrawer() {
  const { 
    isCartDrawerOpen, 
    toggleCartDrawer, 
    closeCartDrawer, 
    items, 
    removeItem, 
    updateQuantity, 
    totalItems, 
    totalPrice 
  } = useCart();
  
  const { formatPrice } = useCurrency();
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [showTerms, setShowTerms] = useState(false);

  const handleClose = () => {
    if (toggleCartDrawer) toggleCartDrawer();
    else if (closeCartDrawer) closeCartDrawer();
  };

  const hasOutOfStockItems = items.some(
    (item) => item.stock !== undefined && item.stock !== null && Number(item.stock) <= 0
  );

  const handleCheckoutClick = () => {
    if (hasOutOfStockItems) return;
    setShowTerms(true);
  };

  const proceedToCheckout = () => {
    setShowTerms(false);
    handleClose();
    navigate('/checkout');
  };

  const goToFullCart = () => {
    handleClose();
    navigate('/cart');
  };

  return (
    <>
      <AnimatePresence>
        {isCartDrawerOpen && (
          <>
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!showTerms) handleClose();
              }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 cursor-pointer"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }} // Left side for Arabic RTL
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 left-0 bottom-0 w-full sm:w-[420px] z-50 flex flex-col bg-white dark:bg-[#09090d] border-r border-gray-200 dark:border-white/10 shadow-[20px_0_50px_rgba(0,0,0,0.6)]"
              dir="rtl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-600/10 text-red-600 flex items-center justify-center border border-red-600/20">
                    <ShoppingBag size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-gray-900 dark:text-white">سلة المشتريات</h2>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-bold">{totalItems} منتج في السلة</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors text-gray-500 dark:text-gray-400 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 custom-scrollbar">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20 opacity-60">
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                      className="w-20 h-20 rounded-3xl bg-gray-100 dark:bg-white/5 flex items-center justify-center"
                    >
                      <ShoppingBag size={40} className="text-gray-400 dark:text-gray-500" />
                    </motion.div>
                    <div>
                      <p className="font-black text-gray-800 dark:text-gray-200 text-sm">السلة فارغة حالياً</p>
                      <p className="text-xs text-gray-400 mt-1">تصفح المتجر وأضف ألعابك وبطاقاتك المفضلة</p>
                    </div>
                  </div>
                ) : (
                  items.map((item) => {
                    const itemImg = item.image_url || (item as any).product?.image_url;
                    const itemTitle = item.title || (item as any).product?.title;
                    const itemUnitPrice = Number(item.price || (item as any).unit_price || 0);
                    const isOutOfStock = item.stock !== undefined && item.stock !== null && Number(item.stock) <= 0;

                    const username = item.attributes?.username || item.customerData?.player_username || (item.customerData as any)?.username;
                    const playerId = item.attributes?.id || item.customerData?.player_id || (item.customerData as any)?.id;
                    const phone = item.attributes?.phone || item.customerData?.player_phone || (item.customerData as any)?.phone;

                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={item.id + (item.attributes?.username || '')}
                        className={`flex gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border transition-all ${
                          isOutOfStock 
                            ? 'border-red-500/50 bg-red-500/5' 
                            : 'border-gray-200/80 dark:border-white/5 hover:border-red-500/30'
                        }`}
                      >
                        {/* Image */}
                        <div className="w-16 h-16 rounded-xl bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 flex-shrink-0 p-1 flex items-center justify-center overflow-hidden relative">
                          <img
                            src={itemImg}
                            alt={itemTitle}
                            className="w-full h-full object-contain filter drop-shadow-sm"
                          />
                          {isOutOfStock && (
                            <span className="absolute inset-0 bg-red-950/80 backdrop-blur-[1px] flex items-center justify-center text-white text-[9px] font-black text-center">
                              نفد ❌
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="font-black text-xs sm:text-sm line-clamp-1 text-gray-900 dark:text-white leading-tight">
                              {itemTitle}
                            </h3>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id, item.attributes)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer flex-shrink-0"
                              title="حذف من السلة"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>

                          {/* Player Custom Attributes */}
                          {(username || playerId || phone) && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {username && (
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20" dir="ltr">
                                  User: {username}
                                </span>
                              )}
                              {playerId && (
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20" dir="ltr">
                                  ID: {playerId}
                                </span>
                              )}
                              {phone && (
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20" dir="ltr">
                                  {phone}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Out of Stock Warning Pill */}
                          {isOutOfStock && (
                            <div className="flex items-center gap-1 text-[10px] font-black text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-lg mt-1 w-fit">
                              <AlertTriangle size={11} />
                              نفدت الكمية - يرجى الحذف
                            </div>
                          )}

                          {/* Quantity & Price */}
                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-100 dark:border-white/5">
                            <div className={`flex items-center bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-lg p-0.5 ${isOutOfStock ? 'opacity-40 pointer-events-none' : ''}`}>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="w-5 h-5 flex items-center justify-center rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                              >
                                <Minus size={11} />
                              </button>
                              <span className="text-xs font-black w-6 text-center text-gray-900 dark:text-white">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-5 h-5 flex items-center justify-center rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                              >
                                <Plus size={11} />
                              </button>
                            </div>

                            <p className="font-black text-xs text-red-600 dark:text-red-400">
                              {formatPrice(itemUnitPrice * item.quantity)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Footer / Checkout */}
              {items.length > 0 && (
                <div className="p-5 bg-gray-50 dark:bg-black/60 border-t border-gray-200/80 dark:border-white/10 space-y-3">
                  {/* Total row */}
                  <div className="flex justify-between items-center text-base font-black text-gray-900 dark:text-white">
                    <span>الإجمالي التقديري</span>
                    <span className="text-red-600 dark:text-red-400 text-lg font-black">{formatPrice(totalPrice)}</span>
                  </div>

                  {/* Out of Stock Error notice */}
                  {hasOutOfStockItems && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-black">
                      <AlertTriangle size={15} className="flex-shrink-0" />
                      <span>يرجى حذف المنتجات التي نفدت كميتها أولاً للمتابعة</span>
                    </div>
                  )}

                  {profile?.is_banned ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-xs font-black text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-200 dark:border-red-900/50">
                        <Ban size={16} className="shrink-0" />
                        <p>عفواً، حسابك محظور من الشراء مؤقتاً.</p>
                      </div>
                      <a 
                        href="https://wa.me/201557957800" 
                        target="_blank" 
                        rel="noreferrer"
                        className="w-full flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white dark:text-black text-white py-3 rounded-2xl font-black transition-all active:scale-95 text-xs"
                      >
                        تواصل مع الدعم الفني
                      </a>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400">
                        <ShieldCheck size={13} className="text-emerald-500 shrink-0" />
                        <p>تسليم آمن وفوري 100% مع ضمان رسمي لحسابك</p>
                      </div>

                      {/* Main Checkout Button */}
                      <button
                        type="button"
                        onClick={handleCheckoutClick}
                        disabled={hasOutOfStockItems}
                        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm transition-all shadow-md active:scale-95 cursor-pointer ${
                          hasOutOfStockItems
                            ? 'bg-gray-300 dark:bg-white/10 text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-none'
                            : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-600/30'
                        }`}
                      >
                        <ArrowLeft size={16} />
                        إتمام الطلب والدفع
                      </button>

                      {/* Secondary View Full Cart Button */}
                      <button
                        type="button"
                        onClick={goToFullCart}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 hover:border-red-500/40 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 text-xs font-bold transition-all cursor-pointer"
                      >
                        عرض صفحة السلة الكاملة
                      </button>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Terms and Conditions Modal */}
      <AnimatePresence>
        {showTerms && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" dir="rtl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTerms(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[#181a20] border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <div>
                  <h3 className="text-lg font-black text-white">الشروط والأحكام</h3>
                  <p className="text-xs text-gray-400 mt-1">يرجى القراءة بعناية</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTerms(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body - The 4 Rules */}
              <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh] custom-scrollbar">
                
                {/* Rule 1 */}
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-red-600/20 text-red-500 font-black flex items-center justify-center shrink-0">1</div>
                  <div>
                    <h4 className="text-white font-black text-sm mb-1">سياسة الاسترجاع</h4>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      لا يحق للعميل طلب استرجاع المبلغ بعد بدء معالجة الطلب، سواء كان الدفع يدوياً أو من خلال بوابة الدفع الآلية.
                    </p>
                  </div>
                </div>

                {/* Rule 2 */}
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-red-600/20 text-red-500 font-black flex items-center justify-center shrink-0">2</div>
                  <div>
                    <h4 className="text-white font-black text-sm mb-1">دقة البيانات</h4>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      العميل مسؤول مسؤولية كاملة عن صحة البيانات المدخلة، مثل اسم المستخدم أو الـ ID الخاص بالحساب.
                    </p>
                  </div>
                </div>

                {/* Rule 3 */}
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-red-600/20 text-red-500 font-black flex items-center justify-center shrink-0">3</div>
                  <div>
                    <h4 className="text-white font-black text-sm mb-1">مدة المعالجة</h4>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      تتم معالجة الطلبات وتنفيذها فورياً أو خلال دقائق قليلة وفق ضغط السيرفر.
                    </p>
                  </div>
                </div>

                {/* Rule 4 */}
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-red-600/20 text-red-500 font-black flex items-center justify-center shrink-0">4</div>
                  <div>
                    <h4 className="text-white font-black text-sm mb-1">الإقرار القانوني</h4>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      بإتمامك لعملية الشحن، فأنت تقر بصحة العملية وتوافق على كافة الشروط المذكورة.
                    </p>
                  </div>
                </div>

                <a 
                  href="https://www.mokaa3.com/terms" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 text-xs font-bold text-red-500 hover:text-red-400 hover:underline mt-4"
                >
                  <ExternalLink size={14} />
                  قراءة جميع الشروط والأحكام بالتفصيل
                </a>

              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-white/5 bg-black/20">
                <button
                  type="button"
                  onClick={proceedToCheckout}
                  className="w-full flex items-center justify-center gap-2 bg-[#b91c1c] hover:bg-[#dc2626] text-white py-4 rounded-xl font-black transition-all active:scale-95 cursor-pointer"
                >
                  قرأت وأوافق على جميع الشروط <Check size={18} className="mr-1" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
