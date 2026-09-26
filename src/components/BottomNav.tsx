/**
 * BottomNav — GamePay
 *
 * A fixed bottom navigation bar for mobile/tablet viewports (hidden on lg+).
 *
 * Features:
 * • 5 tabs: Home | Store | Search | Favourites | Profile
 * • Active tab highlighted with brand-red pill indicator + coloured icon.
 * • Cart/Favourite badge counters.
 * • Animated indicator slides under the active tab (layout animation).
 * • Safe-area padding for iPhone notch / home-indicator.
 * • Hidden automatically on the /dashboard route.
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Store, Search, Heart, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';

/* ─── Tab definitions ────────────────────────────────────────────────────── */

type Tab = {
  to: string;
  label: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  badgeKey?: 'cart' | 'favourites';
};

const TABS: Tab[] = [
  {
    to: '/',
    label: 'الرئيسية',
    icon:       <Home   size={22} strokeWidth={1.75} />,
    activeIcon: <Home   size={22} strokeWidth={2.5}  className="text-red-600" />,
  },
  {
    to: '/store',
    label: 'المتجر',
    icon:       <Store  size={22} strokeWidth={1.75} />,
    activeIcon: <Store  size={22} strokeWidth={2.5}  className="text-red-600" />,
  },
  {
    to: '/search',
    label: 'بحث',
    icon:       <Search size={22} strokeWidth={1.75} />,
    activeIcon: <Search size={22} strokeWidth={2.5}  className="text-red-600" />,
  },
  {
    to: '/profile?tab=favourites',
    label: 'المفضلة',
    icon:       <Heart  size={22} strokeWidth={1.75} />,
    activeIcon: <Heart  size={22} strokeWidth={2.5}  className="fill-red-600 text-red-600" />,
    badgeKey: 'favourites',
  },
  {
    to: '/profile',
    label: 'حسابي',
    icon:       <User   size={22} strokeWidth={1.75} />,
    activeIcon: <User   size={22} strokeWidth={2.5}  className="text-red-600" />,
  },
];

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function BottomNav() {
  const location   = useLocation();
  const { totalItems }     = useCart();
  const { favoritesCount } = useFavorites();

  /* Hide entirely on dashboard */
  if (location.pathname.startsWith('/dashboard')) return null;

  const badgeCounts: Record<string, number> = {
    cart:       totalItems,
    favourites: favoritesCount,
  };

  /**
   * Determine active tab:
   * • Exact match for '/' (home)
   * • Prefix match for all others (so /store/... stays active on Store tab)
   * • '/profile?tab=favourites' maps to the Favourites tab
   */
  function isActive(tab: Tab) {
    const path = location.pathname + location.search;
    if (tab.to === '/') return path === '/';
    return path.startsWith(tab.to.split('?')[0]);
  }

  return (
    <nav
      className={[
        /* Fixed at the bottom, above everything */
        'fixed bottom-0 inset-x-0 z-50',
        /* Only shown below lg */
        'lg:hidden',
        /* Background */
        'bg-white/90 dark:bg-[#1a1d24]/95 backdrop-blur-xl',
        /* Top border */
        'border-t border-gray-100 dark:border-gray-700/60',
        /* Shadow */
        'shadow-[0_-4px_20px_rgba(0,0,0,0.06)]',
        /* Safe area for iPhone home indicator */
        'pb-safe',
      ].join(' ')}
      dir="rtl"
      aria-label="القائمة الرئيسية"
    >
      <div className="flex items-stretch justify-around h-16">
        {TABS.map((tab) => {
          const active = isActive(tab);
          const badge  = tab.badgeKey ? badgeCounts[tab.badgeKey] : 0;

          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={[
                'relative flex flex-col items-center justify-center flex-1 gap-0.5',
                'text-[10px] font-black transition-colors duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500',
                active
                  ? 'text-red-600'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300',
              ].join(' ')}
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
            >
              {/* Active indicator pill (slides behind the icon) */}
              {active && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute top-1.5 w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-900/20"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              {/* Icon wrapper */}
              <div className="relative z-10">
                {active ? tab.activeIcon : tab.icon}

                {/* Badge */}
                {badge > 0 && (
                  <AnimatePresence>
                    <motion.span
                      key="badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className={[
                        'absolute -top-1.5 -left-1.5',
                        'min-w-[16px] h-4 px-1',
                        'rounded-full flex items-center justify-center',
                        'bg-red-600 text-white',
                        'text-[9px] font-black',
                        'border-2 border-white dark:border-[#1a1d24]',
                      ].join(' ')}
                    >
                      {badge > 99 ? '99+' : badge}
                    </motion.span>
                  </AnimatePresence>
                )}
              </div>

              {/* Label */}
              <span className="relative z-10 leading-none">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
