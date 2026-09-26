import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, ShoppingBag, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useCurrency } from '../contexts/CurrencyContext';

export default function CartDrawer() {
  const { isCartDrawerOpen, toggleCartDrawer, items, removeItem, updateQuantity, totalItems, totalPrice } = useCart();
  const { formatPriceByCurrency } = useCurrency();
  const navigate = useNavigate();

  const handleCheckout = () => {
    toggleCartDrawer();
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isCartDrawerOpen && (
        <>
          {/* Backdrop Blur (Glassmorphism Phase 1) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleCartDrawer}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }} // Left side for Arabic RTL
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-full sm:w-[400px] z-50 flex flex-col bg-white dark:bg-oled-dark border-r border-white/10 shadow-[20px_0_50px_rgba(0,0,0,0.5)]"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600/10 text-red-600 flex items-center justify-center">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black dark:text-white">سلة المشتريات</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-bold">{totalItems} منتجات</p>
                </div>
              </div>
              <button
                onClick={toggleCartDrawer}
                className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors text-gray-500 dark:text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  >
                    <ShoppingBag size={64} className="text-gray-400 dark:text-gray-600" />
                  </motion.div>
                  <p className="font-black text-gray-500 dark:text-gray-400">السلة فارغة حالياً</p>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={item.id}
                    className="flex gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 group"
                  >
                    <img
                      src={item.product.image_url}
                      alt={item.product.title}
                      className="w-20 h-20 object-cover rounded-xl shadow-sm"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <h3 className="font-black text-sm line-clamp-2 dark:text-white leading-tight">
                          {item.product.title}
                        </h3>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-3 bg-white dark:bg-black/50 rounded-lg p-1 border border-gray-200 dark:border-white/10">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 dark:bg-white/10 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-600 transition-colors dark:text-white"
                          >
                            -
                          </button>
                          <span className="text-sm font-bold w-4 text-center dark:text-white">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 dark:bg-white/10 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-600 transition-colors dark:text-white"
                          >
                            +
                          </button>
                        </div>
                        <p className="font-black text-red-600">
                          {formatPriceByCurrency(item.unit_price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer / Checkout */}
            {items.length > 0 && (
              <div className="p-6 bg-gray-50 dark:bg-black/40 border-t border-gray-100 dark:border-white/5 space-y-4">
                <div className="flex justify-between items-center text-lg font-black dark:text-white">
                  <span>الإجمالي</span>
                  <span className="text-red-600">{formatPriceByCurrency(totalPrice)}</span>
                </div>
                
                <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-white/5 p-3 rounded-xl border border-gray-200 dark:border-white/10">
                  <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                  <p>بإتمام الطلب، أنت توافق على شروط الخدمة وسياسة الاسترجاع.</p>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-red-600/30 hover:shadow-red-600/50 hover:-translate-y-1 transition-all active:scale-95 glow-red"
                >
                  <ArrowLeft size={18} />
                  إتمام الطلب والدفع
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
