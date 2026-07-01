
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  BarChart3, 
  Settings, 
  Users, 
  Package, 
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Store,
  ShoppingBag,
  Ticket,
  Image as ImageIcon,
  Headphones,
  Layout,
  MessageSquare
} from 'lucide-react';
import { motion } from 'motion/react';
import { DashboardTab } from '../../types/dashboard';

interface SidebarProps {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const menuItems = [
  { id: 'stats' as DashboardTab, label: 'الإحصائيات', icon: BarChart3 },
  { id: 'orders' as DashboardTab, label: 'الطلبات', icon: ShoppingBag },
  { id: 'products' as DashboardTab, label: 'إدارة المنتجات', icon: Package },
  { id: 'sections' as DashboardTab, label: 'الأقسام الرئيسية', icon: Layout },
  { id: 'games' as DashboardTab, label: 'إدارة الألعاب', icon: LayoutDashboard },
  { id: 'comments' as DashboardTab, label: 'التعليقات والتقييمات', icon: MessageSquare },
  { id: 'coupons' as DashboardTab, label: 'أكواد الخصم', icon: Ticket },
  { id: 'slides' as DashboardTab, label: 'السلايدر الرئيسي', icon: ImageIcon },
  { id: 'promo_banners' as DashboardTab, label: 'البنرات الترويجية', icon: ImageIcon },
  { id: 'sponsored_cards' as DashboardTab, label: 'البطاقات المدعومة', icon: ImageIcon },
  { id: 'support' as DashboardTab, label: 'الدعم الفني', icon: Headphones },
  { id: 'users' as DashboardTab, label: 'المستخدمين', icon: Users },
  { id: 'settings' as DashboardTab, label: 'إعدادات الموقع', icon: Settings },
];

export default function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }: SidebarProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 260 : 80 }}
      className="bg-zinc-950/90 backdrop-blur-xl border-l border-white/5 h-screen sticky top-0 flex flex-col z-50 transition-all duration-300"
    >
      {/* Logo Area */}
      <div className="p-6 flex items-center justify-between border-b border-zinc-900">
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <LayoutDashboard size={18} className="text-white" />
            </div>
            <span className="font-black text-white tracking-tighter">لوحة التحكم</span>
          </motion.div>
        )}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-400 transition-colors"
        >
          {isOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar overflow-x-hidden">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`
                w-full flex items-center gap-3 p-3 rounded-xl transition-all relative group
                ${isActive ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}
                cursor-pointer
              `}
            >
              <Icon size={20} />
              {isOpen && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-bold text-sm"
                >
                  {item.label}
                </motion.span>
              )}
              
              {!isOpen && (
                <div className="absolute right-full mr-4 px-2 py-1 bg-zinc-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60]">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-900 space-y-2">
        <button 
          onClick={() => navigate('/')}
          className="w-full flex items-center gap-3 p-3 rounded-xl text-zinc-400 hover:bg-zinc-900 hover:text-white transition-all border border-transparent hover:border-zinc-800"
        >
          <Store size={20} />
          {isOpen && <span className="font-bold text-sm">العودة للمتجر</span>}
        </button>

        <button 
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 p-3 rounded-xl text-zinc-500 hover:bg-red-950/20 hover:text-red-500 transition-all"
        >
          <LogOut size={20} />
          {isOpen && <span className="font-bold text-sm">تسجيل الخروج</span>}
        </button>
      </div>
    </motion.aside>
  );
}
