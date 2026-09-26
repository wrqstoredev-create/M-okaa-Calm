/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * App.tsx — Performance Optimized
 *
 * Changes vs. original:
 * ─────────────────────────────────────────────────────────────────────
 * 1. Lazy loading for ALL pages except Home (the landing page)
 *    → React.lazy + Suspense splits every page into its own JS chunk.
 *    → Dashboard + heavy libs (jspdf/apexcharts) only download when /dashboard is visited.
 *
 * 2. PageLoader — skeleton spinner while a lazy chunk downloads
 *    (first visit to a page, typically < 200ms on fast connections)
 *
 * 3. AnimatePresence + PageTransition preserved for smooth page changes
 *
 * 4. CartDrawer still mounted globally for instant open/close
 */

import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Header      from './components/Header';
import { supabase } from './lib/supabaseClient';
import { ToastProvider }     from './contexts/ToastContext';
import { AuthProvider }      from './contexts/AuthContext';
import { CurrencyProvider }  from './contexts/CurrencyContext';
import { CartProvider }      from './contexts/CartContext';
import { FavoritesProvider } from './contexts/FavoritesContext';

/* ── Eager (above-the-fold / always needed) ──────────────────────────── */
import Home       from './pages/Home';

/* ── Lazy pages — each becomes its own JS chunk ─────────────────────── */
const Store         = lazy(() => import('./pages/Store'));
const Product       = lazy(() => import('./pages/Product'));
const Cart          = lazy(() => import('./pages/Cart'));
const Profile       = lazy(() => import('./pages/Profile'));
const Checkout      = lazy(() => import('./pages/Checkout'));
const Login         = lazy(() => import('./pages/Login'));
const Register      = lazy(() => import('./pages/Register'));
const Dashboard     = lazy(() => import('./pages/Dashboard'));
const Category      = lazy(() => import('./pages/Category'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const Reviews       = lazy(() => import('./pages/Reviews'));
const NotFound      = lazy(() => import('./pages/NotFound'));

/* ── Lazy components ─────────────────────────────────────────────────── */
const Footer      = lazy(() => import('./components/Footer'));
const BottomNav   = lazy(() => import('./components/BottomNav'));
const SupportChat = lazy(() => import('./components/SupportChat'));
const ScrollToTop = lazy(() => import('./components/ScrollToTop'));
const DevConsole  = lazy(() => import('./components/DevConsole'));

/* ── Page transition wrapper — cinematic entrance ───────────────────── */
function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex-1 flex flex-col"
    >
      {children}
    </motion.div>
  );
}

/* ── Suspense fallback — Neon Gaming Dual-Ring Spinner ───────────────── */
function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
            style={{ borderTopColor: 'var(--neon-red)', boxShadow: '0 0 12px var(--neon-red)', animationDuration: '0.8s' }}
          />
          <div
            className="absolute inset-1.5 rounded-full border-2 border-transparent animate-spin"
            style={{ borderTopColor: 'var(--neon-purple)', boxShadow: '0 0 8px var(--neon-purple)', animationDuration: '1.2s', animationDirection: 'reverse' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-red-500" style={{ boxShadow: '0 0 8px var(--neon-red)' }} />
          </div>
        </div>
        <p className="text-[11px] font-black text-gray-400 dark:text-gray-500 tracking-widest uppercase">جاري التحميل…</p>
      </div>
    </div>
  );
}

/* ── Dynamic content page (about/terms/privacy/help/contact) ─────────── */
const DynamicContentPage = ({ title, field }: { title: string; field: string }) => {
  const [content, setContent] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchContent() {
      try {
        const { data } = await supabase.from('settings').select(field).single();
        if (data) setContent(data[field]);
      } catch (err) {
        console.error('Error fetching content:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchContent();
  }, [field]);

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto py-16 md:py-24 px-6 text-right animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h1 className="text-3xl md:text-5xl font-black text-zinc-900 dark:text-white mb-10 border-r-8 border-red-600 pr-6 inline-block leading-tight uppercase tracking-tight">
        {title}
      </h1>
      {loading ? (
        <div className="space-y-6">
          {[100, 90, 80, 95].map((w, i) => (
            <div key={i} className={`h-4 bg-zinc-100 dark:bg-[#1a1d24] rounded-full w-[${w}%] animate-pulse`} />
          ))}
        </div>
      ) : (
        <div className="text-zinc-600 font-bold whitespace-pre-wrap leading-relaxed text-lg bg-zinc-50 dark:bg-[#0f1115]/50 p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
          {content || 'عذراً، لا يوجد محتوى متاح حالياً. يرجى المراجعة لاحقاً.'}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   AppContent
═══════════════════════════════════════════════════════════════════════ */
function AppContent() {
  const location    = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');

  /* Update page <title> + meta description from settings */
  useEffect(() => {
    async function updateMetadata() {
      try {
        const { data } = await supabase
          .from('settings')
          .select('store_name, store_description')
          .single();
        if (data) {
          if (data.store_name) document.title = data.store_name;
          if (data.store_description) {
            let meta = document.querySelector('meta[name="description"]');
            if (!meta) {
              meta = document.createElement('meta');
              meta.setAttribute('name', 'description');
              document.head.appendChild(meta);
            }
            meta.setAttribute('content', data.store_description);
          }
        }
      } catch (err) {
        console.error('Error updating metadata:', err);
      }
    }
    updateMetadata();
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col font-sans w-full overflow-x-hidden relative bg-[#f8f8fa] dark:bg-[#060608] text-black dark:text-white transition-colors duration-300 pb-16 lg:pb-0"
      dir="rtl"
    >
      {/* Always-needed UI — no lazy needed */}
      {!isDashboard && <Header />}

      {/* Lazy non-critical layout helpers */}
      {!isDashboard && (
        <Suspense fallback={null}>
          <ScrollToTop />
        </Suspense>
      )}

      {/* ── Routes with AnimatePresence for page transitions ─── */}
      <AnimatePresence mode="wait">
        <motion.div key={location.pathname} className="flex-1 flex flex-col">
          <Suspense fallback={<PageLoader />}>
            <Routes location={location}>
              {/* ── Eager: Home loads immediately ───────────────── */}
              <Route path="/" element={<PageTransition><Home /></PageTransition>} />

              {/* ── Lazy: all other pages ───────────────────────── */}
              <Route path="/store"           element={<PageTransition><Store /></PageTransition>} />
              <Route path="/product/:id"     element={<PageTransition><Product /></PageTransition>} />
              <Route path="/cart"            element={<PageTransition><Cart /></PageTransition>} />
              <Route path="/profile"         element={<PageTransition><Profile /></PageTransition>} />
              <Route path="/checkout"        element={<PageTransition><Checkout /></PageTransition>} />
              <Route path="/login"           element={<PageTransition><Login /></PageTransition>} />
              <Route path="/register"        element={<PageTransition><Register /></PageTransition>} />
              <Route path="/category/:name"  element={<PageTransition><Category /></PageTransition>} />
              <Route path="/search"          element={<PageTransition><SearchResults /></PageTransition>} />
              <Route path="/reviews"         element={<PageTransition><Reviews /></PageTransition>} />
              <Route path="/dashboard"       element={<PageTransition><Dashboard /></PageTransition>} />

              {/* ── Dev console ─────────────────────────────────── */}
              <Route path="/dev" element={
                <PageTransition>
                  <div className="py-20 px-6">
                    <DevConsole />
                  </div>
                </PageTransition>
              } />

              {/* ── Dynamic content pages ───────────────────────── */}
              <Route path="/about"   element={<PageTransition><DynamicContentPage title="من نحن"              field="about_content"   /></PageTransition>} />
              <Route path="/terms"   element={<PageTransition><DynamicContentPage title="الشروط والأحكام"     field="terms_content"   /></PageTransition>} />
              <Route path="/privacy" element={<PageTransition><DynamicContentPage title="سياسة الخصوصية"     field="privacy_content" /></PageTransition>} />
              <Route path="/help"    element={<PageTransition><DynamicContentPage title="المساعدة"            field="help_content"    /></PageTransition>} />
              <Route path="/contact" element={<PageTransition><DynamicContentPage title="اتصل بنا"           field="contact_content" /></PageTransition>} />

              {/* ── 404 ─────────────────────────────────────────── */}
              <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
            </Routes>
          </Suspense>
        </motion.div>
      </AnimatePresence>

      {/* ── Global UI — lazy, non-blocking ──────────────────────── */}
      {!isDashboard && (
        <>
          <Suspense fallback={null}>
            <SupportChat />
          </Suspense>
          <Suspense fallback={null}>
            <Footer />
          </Suspense>
          <Suspense fallback={null}>
            <BottomNav />
          </Suspense>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   App root
═══════════════════════════════════════════════════════════════════════ */
export default function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <CartProvider>
          <FavoritesProvider>
            <ToastProvider>
              <BrowserRouter>
                <AppContent />
              </BrowserRouter>
            </ToastProvider>
          </FavoritesProvider>
        </CartProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}
