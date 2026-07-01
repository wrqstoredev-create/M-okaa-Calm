/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import { supabase } from './lib/supabaseClient';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { CartProvider } from './contexts/CartContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import Home from './pages/Home';
import Store from './pages/Store';
import Product from './pages/Product';
import Cart from './pages/Cart';
import Profile from './pages/Profile';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Category from './pages/Category';
import SearchResults from './pages/SearchResults';
import Reviews from './pages/Reviews';
import DevConsole from './components/DevConsole';
import SupportChat from './components/SupportChat';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

// Dynamic content page component
const DynamicContentPage = ({ title, field }: { title: string, field: string }) => {
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
       <h1 className="text-3xl md:text-5xl font-black text-zinc-900 dark:text-white mb-10 border-r-8 border-red-600 pr-6 inline-block leading-tight uppercase tracking-tight">{title}</h1>
       {loading ? (
         <div className="space-y-6">
           <div className="h-4 bg-zinc-100 dark:bg-[#1a1d24] rounded-full w-full animate-pulse"></div>
           <div className="h-4 bg-zinc-100 dark:bg-[#1a1d24] rounded-full w-[90%] animate-pulse"></div>
           <div className="h-4 bg-zinc-100 dark:bg-[#1a1d24] rounded-full w-[80%] animate-pulse"></div>
           <div className="h-4 bg-zinc-100 dark:bg-[#1a1d24] rounded-full w-[95%] animate-pulse"></div>
         </div>
       ) : (
         <div className="text-zinc-600 font-bold whitespace-pre-wrap leading-relaxed text-lg bg-zinc-50 dark:bg-[#0f1115]/50 p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm shadow-zinc-200/50">
           {content || 'عذراً، لا يوجد محتوى متاح حالياً لهذه الصفحة. يرجى مراجعتها لاحقاً.'}
         </div>
       )}
    </div>
  );
};

function AppContent() {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');

  useEffect(() => {
    async function updateMetadata() {
      try {
        const { data } = await supabase.from('settings').select('store_name, store_description').single();
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
    <div className="min-h-screen flex flex-col font-sans w-full overflow-x-hidden relative bg-white dark:bg-[#1a1d24] text-black dark:text-white transition-colors duration-300" dir="rtl">
      {!isDashboard && <Header />}
      {!isDashboard && <ScrollToTop />}
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/store" element={<Store />} />
        <Route path="/product/:id" element={<Product />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/category/:name" element={<Category />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/dev" element={<div className="py-20 px-6"><DevConsole /></div>} />
        
        {/* Content Routes */}
        <Route path="/about" element={<DynamicContentPage title="من نحن" field="about_content" />} />
        <Route path="/terms" element={<DynamicContentPage title="الشروط والأحكام" field="terms_content" />} />
        <Route path="/privacy" element={<DynamicContentPage title="سياسة الخصوصية" field="privacy_content" />} />
        <Route path="/help" element={<DynamicContentPage title="المساعدة" field="help_content" />} />
        <Route path="/contact" element={<DynamicContentPage title="اتصل بنا" field="contact_content" />} />

      </Routes>

      {!isDashboard && <SupportChat />}
      {!isDashboard && <Footer />}
    </div>
  );
}

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
