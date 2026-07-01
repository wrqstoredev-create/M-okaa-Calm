
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/dashboard/Sidebar';
import StatsView from '../components/dashboard/StatsView';
import SettingsView from '../components/dashboard/SettingsView';
import UsersView from '../components/dashboard/UsersView';
import ProductsView from '../components/dashboard/ProductsView';
import OrdersView from '../components/dashboard/OrdersView';
import SlidesView from '../components/dashboard/SlidesView';
import SupportView from '../components/dashboard/SupportView';
import SectionsView from '../components/dashboard/SectionsView';
import GamesView from '../components/dashboard/GamesView';
import CommentsView from '../components/dashboard/CommentsView';
import CouponsView from '../components/dashboard/CouponsView';
import PromoBannersView from '../components/dashboard/PromoBannersView';
import SponsoredCardsView from '../components/dashboard/SponsoredCardsView';
import { DashboardTab } from '../types/dashboard';
import { Bell, Search, User, Loader2 } from 'lucide-react';
import DashboardGatekeeper from '../components/dashboard/DashboardGatekeeper';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('stats');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  // التحقق من صلاحيات المدير أو المالك
  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/');
    }
  }, [user, loading, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <DashboardGatekeeper>
      <div className="min-h-screen bg-transparent flex flex-row-reverse text-right" dir="rtl">
        {/* Sidebar - Right side for RTL */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          isOpen={sidebarOpen} 
          setIsOpen={setSidebarOpen} 
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header */}
          <header className="h-20 bg-white dark:bg-[#1a1d24]/80 backdrop-blur-md border-b border-zinc-100 flex items-center justify-between px-8 sticky top-0 z-40">
            <div className="flex items-center gap-6">
              <div className="relative group hidden md:block">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-red-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="بحث عن طلبات، عملاء..." 
                  className="bg-zinc-50 dark:bg-[#0f1115] rounded-2xl pr-12 pl-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-600/5 focus:border-red-600 border border-transparent transition-all w-64 lg:w-96"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">مباشر الأن</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2.5 bg-zinc-50 dark:bg-[#0f1115] rounded-xl text-zinc-600 hover:bg-zinc-100 dark:bg-[#1a1d24] transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-2.5 left-2.5 w-2 h-2 bg-red-600 rounded-full border-2 border-white"></span>
              </button>
              
              <div className="h-8 w-px bg-zinc-100 dark:bg-[#1a1d24] mx-2"></div>

              <div className="flex items-center gap-3">
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-black text-zinc-900 dark:text-white leading-none mb-1">{profile?.full_name || user?.email?.split('@')[0]}</p>
                  <p className="text-[10px] font-bold text-zinc-500">
                    {profile?.role === 'owner' ? 'مالك النظام' : 
                    profile?.role === 'admin' ? 'مدير النظام' : 'مستخدم'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white ring-4 ring-zinc-50 overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={20} />
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-8 relative z-10 w-full">
            <div className="max-w-7xl mx-auto">
              {activeTab === 'stats' && <StatsView />}
              {activeTab === 'settings' && <SettingsView />}
              {activeTab === 'users' && <UsersView />}
              {activeTab === 'products' && <ProductsView />}
              {activeTab === 'orders' && <OrdersView />}
              {activeTab === 'slides' && <SlidesView />}
              {activeTab === 'support' && <SupportView />}
              {activeTab === 'sections' && <SectionsView />}
              {activeTab === 'games' && <GamesView />}
              {activeTab === 'comments' && <CommentsView />}
              {activeTab === 'coupons' && <CouponsView />}
              {activeTab === 'promo_banners' && <PromoBannersView />}
              {activeTab === 'sponsored_cards' && <SponsoredCardsView />}
              
              {(activeTab === 'inventory') && (
                <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-zinc-100 dark:bg-[#1a1d24] rounded-full flex items-center justify-center text-zinc-400">
                    <Search size={32} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-zinc-900 dark:text-white">قسم قيد التطوير</h2>
                    <p className="text-zinc-500 font-medium max-w-sm">نحن نصل للأجزاء المتبقية من لوحة التحكم، سيتم تفعيل هذا القسم قريباً.</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('stats')}
                    className="bg-zinc-900 text-white font-black px-6 py-2.5 rounded-xl text-sm"
                  >
                    العودة للرئيسية
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </DashboardGatekeeper>
  );
}
