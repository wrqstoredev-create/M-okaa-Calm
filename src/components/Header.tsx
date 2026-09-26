/**
 * Header أ¢â‚¬â€‌ GamePay
 *
 * Changes vs. original:
 * أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬
 * أ¢â‚¬آ¢ Merged all conflicting dark:bg-* classes into a consistent surface token
 *   pattern (dark:bg-[#1a1d24] / dark:bg-[#0f1115]).
 * أ¢â‚¬آ¢ Added responsive Hamburger Menu (أ¢â€°طŒ) with an animated full-screen Mobile
 *   Drawer that mirrors the desktop nav links.
 * أ¢â‚¬آ¢ Extracted repeated button / link class strings into small helper vars to
 *   keep JSX readable.
 * أ¢â‚¬آ¢ All existing features (Favorites drawer, Cart badge, Robux counter,
 *   Currency switcher, Dark-mode toggle, Calm mode, Profile dropdown أ¢â‚¬آ¦)
 *   are preserved 1-to-1.
 */

import {
  Gamepad2,
  ShoppingCart,
  User,
  ShieldCheck,
  Zap,
  HeadphonesIcon,
  LogOut,
  Settings,
  HelpCircle,
  UserCircle,
  Loader2,
  Heart,
  Phone,
  Instagram,
  Globe,
  Package,
  Coffee,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Menu,
  X,
} from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency, Currency } from '../contexts/CurrencyContext';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabaseClient';
import Tooltip from './ui/Tooltip';

/* أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬ Inline social-icon SVGs (unchanged from original) أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬ */

const TikTokIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1 .05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.04-.1z" />
  </svg>
);

const WhatsAppIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
);

const DiscordIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
  </svg>
);

const FacebookIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

/* أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬ Shared class helpers أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬ */

/** Standard icon-button: square, rounded, bordered */
const iconBtn =
  'flex items-center justify-center rounded-xl border transition-all duration-200 shadow-sm ' +
  'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 ' +
  'hover:bg-gray-50 dark:hover:bg-white/10 hover:border-red-400 dark:hover:border-red-500/40 hover:shadow-md ' +
  'text-gray-700 dark:text-gray-200 dark:hover:shadow-[0_0_15px_rgba(255,32,64,0.2)]';

/** Active nav link */
const navLinkActive = 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-500 pb-0.5 font-black drop-shadow-[0_0_8px_rgba(255,32,64,0.4)]';
/** Idle nav link */
const navLinkIdle =
  'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors font-bold';

/* أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯ */
export default function Header() {
  /* أ¢â€‌â‚¬أ¢â€‌â‚¬ State أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬ */
  const [isDropdownOpen,  setIsDropdownOpen]  = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // أ¢â€ ع¯ NEW

  const dropdownRef  = useRef<HTMLDivElement>(null);
  const favoritesRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const { user, profile, signOut }          = useAuth();
  const { currency, setCurrency, formatPrice } = useCurrency();
  const { totalItems }                      = useCart();
  const { favorites, removeFavorite, favoritesCount, clearFavorites } = useFavorites();

  const [storeName,        setStoreName]        = useState('Mokaa');
  const [roboCoinsEnabled, setRoboCoinsEnabled] = useState(false);
  const [roboCoinsBalance, setRoboCoinsBalance] = useState(5000);
  const [settings,         setSettings]         = useState<any>(null);

  const [isCalmActive, setIsCalmActive] = useState(
    () => localStorage.getItem('calm_mode') === 'true'
  );
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isDark, setIsDark] = useState(
    () => localStorage.getItem('theme') === 'dark'
  );

  /* أ¢â€‌â‚¬أ¢â€‌â‚¬ Close mobile menu on route change أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬ */
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  /* أ¢â€‌â‚¬أ¢â€‌â‚¬ Lock body scroll when mobile menu is open أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬ */
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  /* أ¢â€‌â‚¬أ¢â€‌â‚¬ Dark-mode persistence أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬ */
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  /* أ¢â€‌â‚¬أ¢â€‌â‚¬ Calm-mode audio أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬ */
  useEffect(() => {
    if (isCalmActive) {
      if (!audioRef.current) {
        audioRef.current = new Audio(
          'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
        );
        audioRef.current.loop   = true;
        audioRef.current.volume = 0.25;
      }
      if (!isMuted) {
        audioRef.current
          .play()
          .catch((err) => console.log('Audio autoplay prevented:', err));
      } else {
        audioRef.current.pause();
      }
    } else {
      audioRef.current?.pause();
    }
    localStorage.setItem('calm_mode', isCalmActive ? 'true' : 'false');
    window.dispatchEvent(new Event('calmModeChanged'));
    return () => { audioRef.current?.pause(); };
  }, [isCalmActive, isMuted]);

  /* أ¢â€‌â‚¬أ¢â€‌â‚¬ Settings fetch أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬ */
  useEffect(() => {
    async function getSettings() {
      try {
        const { data } = await supabase.from('settings').select('*').single();
        if (data) {
          setSettings(data);
          if (data.store_name) setStoreName(data.store_name);
          setRoboCoinsEnabled(data.robo_coins_enabled ?? false);
          setRoboCoinsBalance(data.robo_coins_balance ?? 5000);
        }
      } catch (err) {
        console.error('Error fetching settings for header:', err);
      }
    }
    getSettings();
    const interval = setInterval(getSettings, 10_000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  /* أ¢â€‌â‚¬أ¢â€‌â‚¬ Click-outside handler أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬ */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (favoritesRef.current && !favoritesRef.current.contains(e.target as Node)) {
        setIsFavoritesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
    setIsDropdownOpen(false);
    navigate('/');
  };

  const discordUrl =
    settings?.instagram_url?.includes('instagram.com')
      ? 'https://discord.gg/HNss9cMfbG'
      : settings?.instagram_url || 'https://discord.gg/HNss9cMfbG';

  /* أ¢â€‌â‚¬أ¢â€‌â‚¬ Nav links data أ¢â‚¬â€‌ single source used by both desktop & mobile nav أ¢â€‌â‚¬أ¢â€‌â‚¬ */
  const navLinks = [
    { to: '/',        label: 'ط·آ§ط¸â€‍ط·آ±ط·آ¦ط¸ظ¹ط·آ³ط¸ظ¹ط·آ©',      show: true },
    { to: '/about',   label: 'ط¸â€¦ط¸â€  ط¸â€ ط·آ­ط¸â€ ',        show: settings?.show_about_link   !== false },
    { to: '/store',   label: 'ط·آ§ط¸â€‍ط¸â€¦ط¸â€ ط·ع¾ط·آ¬ط·آ§ط·ع¾',      show: true },
    { to: '/terms',   label: 'ط·آ§ط¸â€‍ط·آ´ط·آ±ط¸ث†ط·آ· ط¸ث†ط·آ§ط¸â€‍ط·آ£ط·آ­ط¸ئ’ط·آ§ط¸â€¦', show: settings?.show_terms_link   !== false },
    { to: '/privacy', label: 'ط·آ§ط¸â€‍ط·آ®ط·آµط¸ث†ط·آµط¸ظ¹ط·آ©',      show: settings?.show_privacy_link  !== false },
    { to: '/help',    label: 'ط·آ§ط¸â€‍ط¸â€¦ط·آ³ط·آ§ط·آ¹ط·آ¯ط·آ©',      show: settings?.show_help_link     !== false },
    { to: '/contact', label: 'ط·آ§ط·ع¾ط·آµط¸â€‍ ط·آ¨ط¸â€ ط·آ§',      show: settings?.show_contact_link  !== false },
  ].filter((l) => l.show);

  /* أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯ */
  return (
    <>
      <header className="border-b border-gray-200/80 dark:border-white/10 shadow-sm bg-white/95 dark:bg-[#060608]/90 backdrop-blur-2xl sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-2 py-2 md:px-4 md:py-3 gap-1 md:gap-4">

          {/* أ¢â€‌â‚¬أ¢â€‌â‚¬ Logo + Calm toggle أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬ */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-start">
              <Link to="/" className="flex items-center cursor-pointer hover:opacity-90">
                <img
                  src="https://i.postimg.cc/X7NjBvxn/content.png"
                  alt={storeName}
                  className="h-10 w-10 md:h-11 md:w-11 rounded-full object-cover"
                />
              </Link>
              <button
                onClick={() => setIsCalmActive(!isCalmActive)}
                className={[
                  'flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full border',
                  'text-[8px] sm:text-[9px] font-black transition-all shadow-sm',
                  isCalmActive
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 animate-pulse'
                    : 'bg-zinc-50 dark:bg-[#0f1115] border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800',
                ].join(' ')}
                title="ط·ع¾ط¸ظ¾ط·آ¹ط¸ظ¹ط¸â€‍ ط¸ث†ط·آ¶ط·آ¹ ط·آ§ط¸â€‍ط¸â€،ط·آ¯ط¸ث†ط·طŒ"
              >
                <Coffee
                  size={9}
                  className={isCalmActive ? 'animate-bounce text-emerald-600' : 'text-zinc-400'}
                />
                <span>Mط¬آµط¬â€œط¬â€‌okaa Calm</span>
              </button>
            </div>

            {/* Desktop nav */}
            <nav className="hidden lg:flex gap-4 text-[11px] md:text-[12px] font-black items-center">
              {navLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={location.pathname === to ? navLinkActive : navLinkIdle}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* أ¢â€‌â‚¬أ¢â€‌â‚¬ Socials + Currency + Theme (xl only) أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬ */}
          <div className="hidden xl:flex items-center gap-3 px-2">
            {/* Phone */}
            <div className="flex items-center gap-1.5 group cursor-pointer">
              <a
                href={`tel:${(settings?.phone_primary || '01102976303').replace(/[^0-9+]/g, '')}`}
                className="text-[11px] font-black text-gray-800 dark:text-white group-hover:text-red-700 transition-colors"
                dir="ltr"
              >
                {settings?.phone_primary || '01102976303'}
              </a>
              <Phone size={12} className="text-gray-900 dark:text-white fill-current" />
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-3 border-r border-gray-200 dark:border-gray-700 pr-3">
              <a
                href="https://wa.me/mokaa3"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-green-600 transition-colors hover:scale-110"
                title="WhatsApp"
              >
                <WhatsAppIcon size={20} />
              </a>
              {discordUrl && (
                <a
                  href={discordUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-indigo-500 transition-colors hover:scale-110"
                  title="Discord"
                >
                  <DiscordIcon size={20} />
                </a>
              )}
              {settings?.facebook_url && (
                <a
                  href={settings.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-600 transition-colors hover:scale-110"
                  title="Facebook"
                >
                  <FacebookIcon size={20} />
                </a>
              )}
              {settings?.tiktok_url && (
                <a
                  href={settings.tiktok_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-900 dark:text-white hover:text-red-700 transition-colors hover:scale-110"
                  title="TikTok"
                >
                  <TikTokIcon size={20} />
                </a>
              )}
            </div>

            {/* Currency switcher */}
            <div className="flex items-center gap-1 bg-gray-50 dark:bg-[#0f1115] rounded-full px-2 py-1 border border-gray-100 dark:border-gray-700 ml-1">
              <Globe size={10} className="text-gray-400" />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="text-[10px] font-black text-gray-700 dark:text-gray-300 bg-transparent outline-none cursor-pointer"
              >
                <option value="EGY">EGY (ط·آ¬.ط¸â€¦)</option>
                <option value="SAR">SAR (ط·آ±.ط·آ³)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>

            {/* Theme toggle */}
            <Tooltip content={isDark ? 'ط·آ§ط¸â€‍ط·ع¾ط·آ¨ط·آ¯ط¸ظ¹ط¸â€‍ ط·آ¥ط¸â€‍ط¸â€° ط·آ§ط¸â€‍ط¸ث†ط·آ¶ط·آ¹ ط·آ§ط¸â€‍ط¸ظ¾ط·آ§ط·ع¾ط·آ­ أ¢ع©â‚¬أ¯آ¸عˆ' : 'ط·آ§ط¸â€‍ط·ع¾ط·آ¨ط·آ¯ط¸ظ¹ط¸â€‍ ط·آ¥ط¸â€‍ط¸â€° ط·آ§ط¸â€‍ط¸ث†ط·آ¶ط·آ¹ ط·آ§ط¸â€‍ط·آ¯ط·آ§ط¸ئ’ط¸â€  ظ‹ع؛إ’â„¢'} position="bottom">
              <button
                onClick={() => setIsDark(!isDark)}
                className={`${iconBtn} w-9 h-9 md:w-12 md:h-12 mr-1 cursor-pointer transition-transform active:scale-95`}
                aria-label={isDark ? 'ط·آ§ط¸â€‍ط¸ث†ط·آ¶ط·آ¹ ط·آ§ط¸â€‍ط¸ظ¾ط·آ§ط·ع¾ط·آ­' : 'ط·آ§ط¸â€‍ط¸ث†ط·آ¶ط·آ¹ ط·آ§ط¸â€‍ط·آ¯ط·آ§ط¸ئ’ط¸â€ '}
              >
                {isDark ? (
                  <Sun size={20} className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                ) : (
                  <Moon size={20} className="text-gray-700 hover:text-red-600" />
                )}
              </button>
            </Tooltip>
          </div>

          {/* أ¢â€‌â‚¬أ¢â€‌â‚¬ Action icons (all screen sizes) أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬ */}
          <div className="flex items-center gap-1 md:gap-2">

            {/* Robux balance */}
            {roboCoinsEnabled && (
              <div
                className="flex items-center gap-1 md:gap-1.5 bg-amber-50 border border-amber-200/80 px-1.5 py-1 md:px-2.5 md:py-1.5 rounded-xl text-amber-800 shadow-sm text-right cursor-default select-none"
                title="ط·آ±ط·آµط¸ظ¹ط·آ¯ط¸ئ’ ط·آ§ط¸â€‍ط¸â€¦ط·ع¾ط·آ¨ط¸â€ڑط¸ظ¹ ط¸â€¦ط¸â€  ط·آ§ط¸â€‍ط·آ±ط¸ث†ط·آ¨ط¸ث†ط¸ئ’ط·آ³"
              >
                <span className="text-[10px] md:text-[12px]">ظ‹ع؛ع¾â„¢</span>
                <span className="hidden md:inline text-[10px] font-black text-amber-900 whitespace-nowrap">
                  ط¸â€¦ط·ع¾ط·آ¨ط¸â€ڑط¸ظ¹:
                </span>
                <span className="text-[9px] md:text-[11px] font-black font-mono tracking-tight text-amber-700">
                  {roboCoinsBalance.toLocaleString('en-US')}
                </span>
              </div>
            )}

            {/* Favorites */}
            <div className="relative" ref={favoritesRef}>
              <button
                onClick={() => setIsFavoritesOpen(!isFavoritesOpen)}
                className="relative cursor-pointer group focus:outline-none"
              >
                <div
                  className={[
                    'w-9 h-9 md:w-12 md:h-12 flex items-center justify-center rounded-xl transition-all border shadow-sm',
                    isFavoritesOpen
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : `${iconBtn} hover:text-red-600`,
                  ].join(' ')}
                >
                  <Heart
                    className={`w-5 h-5 md:w-6 md:h-6 ${isFavoritesOpen ? 'fill-red-500 text-red-600' : ''}`}
                  />
                </div>
                {favoritesCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-700 text-white text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-black border-2 border-white group-hover:scale-110 transition-transform animate-pulse">
                    {favoritesCount}
                  </span>
                )}
              </button>

              {/* Favorites drawer */}
              <AnimatePresence>
                {isFavoritesOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 mt-3 w-80 md:w-96 bg-white dark:bg-[#1a1d24] border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden text-right"
                    dir="rtl"
                  >
                    {/* Header */}
                    <div className="p-4 border-b border-gray-50 dark:border-gray-700 bg-gray-50 dark:bg-[#0f1115]/50 flex items-center justify-between">
                      <span className="text-xs font-black text-gray-500 dark:text-gray-400">
                        ط¸â€ڑط·آ§ط·آ¦ط¸â€¦ط·آ© ط·آ§ط¸â€‍ط¸â€¦ط¸ظ¾ط·آ¶ط¸â€‍ط·آ© ({favoritesCount})
                      </span>
                      <button
                        onClick={clearFavorites}
                        className="text-[10px] font-black text-red-600 hover:text-red-800 transition-colors"
                        disabled={favoritesCount === 0}
                      >
                        ط¸â€¦ط·آ³ط·آ­ ط·آ§ط¸â€‍ط¸ئ’ط¸â€‍
                      </button>
                    </div>

                    {/* Items */}
                    <div className="p-2 max-h-[350px] overflow-y-auto space-y-1.5 custom-scrollbar">
                      {favorites.length > 0 ? (
                        favorites.map((prod) => (
                          <div
                            key={prod.id}
                            className="flex items-center justify-between gap-3 p-2 hover:bg-gray-50 dark:hover:bg-[#0f1115] rounded-xl transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-700"
                          >
                            {/* Remove + Order */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); removeFavorite(prod.id); }}
                                className="text-gray-300 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-all"
                                title="ط·آ¥ط·آ²ط·آ§ط¸â€‍ط·آ© ط¸â€¦ط¸â€  ط·آ§ط¸â€‍ط¸â€¦ط¸ظ¾ط·آ¶ط¸â€‍ط·آ©"
                              >
                                <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                              </button>
                              <button
                                onClick={() => { setIsFavoritesOpen(false); navigate(`/product/${prod.id}`); }}
                                className="bg-red-700 hover:bg-red-800 text-white text-[10px] font-black px-3 py-1.5 rounded-lg transition-all active:scale-95 whitespace-nowrap"
                              >
                                ط·آ·ط¸â€‍ط·آ¨ ط·آ§ط¸â€‍ط¸â€¦ط¸â€ ط·ع¾ط·آ¬
                              </button>
                            </div>

                            {/* Info + Image */}
                            <div
                              className="flex items-center gap-3 cursor-pointer min-w-0"
                              onClick={() => { setIsFavoritesOpen(false); navigate(`/product/${prod.id}`); }}
                            >
                              <div className="text-right min-w-0">
                                <p className="text-xs font-black text-gray-950 dark:text-white truncate max-w-[140px] md:max-w-[200px]">
                                  {prod.title}
                                </p>
                                {prod.game_name && (
                                  <p className="text-[9px] font-bold text-gray-400 mt-0.5">{prod.game_name}</p>
                                )}
                                <p className="text-[11px] font-extrabold text-red-700 mt-1">
                                  {formatPrice(prod.price)}
                                </p>
                              </div>
                              <div className="w-11 h-11 bg-gray-50 dark:bg-[#0f1115] border border-gray-100 dark:border-gray-700 rounded-lg flex-shrink-0 flex items-center justify-center p-1 overflow-hidden">
                                <img
                                  src={prod.image_url || prod.image || undefined}
                                  alt=""
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 px-4">
                          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Heart className="w-6 h-6 text-red-700 fill-red-200" />
                          </div>
                          <p className="text-xs font-black text-gray-800 dark:text-white">
                            ط¸â€ڑط·آ§ط·آ¦ط¸â€¦ط·آ© ط·آ§ط¸â€‍ط¸â€¦ط¸ظ¾ط·آ¶ط¸â€‍ط·آ© ط¸ظ¾ط·آ§ط·آ±ط·ط›ط·آ© ظ‹ع؛â€™â€‌
                          </p>
                          <p className="text-[10px] font-bold text-gray-400 mt-1">
                            ط·ع¾ط·آµط¸ظ¾ط·آ­ ط¸â€¦ط·ع¾ط·آ¬ط·آ±ط¸â€ ط·آ§ ط¸ث†ط·آ§ط·آ¶ط·ط›ط·آ· أ¢â€Œآ¤أ¯آ¸عˆ ط¸â€‍ط·آ­ط¸ظ¾ط·آ¸ ط¸â€¦ط¸â€ ط·ع¾ط·آ¬ط·آ§ط·ع¾ط¸ئ’ ط·آ§ط¸â€‍ط¸â€¦ط¸ظ¾ط·آ¶ط¸â€‍ط·آ© ط¸â€،ط¸â€ ط·آ§!
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Cart */}
            <Tooltip content="ط·آ³ط¸â€‍ط·آ© ط·آ§ط¸â€‍ط¸â€¦ط·آ´ط·ع¾ط·آ±ط¸ظ¹ط·آ§ط·ع¾" position="bottom">
              <Link to="/cart" className="relative cursor-pointer group">
                <div className="bg-white dark:bg-white/5 w-9 h-9 md:w-12 md:h-12 flex items-center justify-center rounded-xl border border-gray-200 dark:border-white/8 group-hover:border-red-500/40 group-hover:bg-red-50 dark:group-hover:bg-red-500/10 dark:group-hover:shadow-[0_0_15px_rgba(255,32,64,0.2)] transition-all duration-200 shadow-sm">
                  <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 text-gray-700 dark:text-gray-300 group-hover:text-red-500 transition-colors" />
                </div>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 dark:bg-red-500 dark:shadow-[0_0_8px_rgba(255,32,64,0.8)] text-white text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-black border-2 border-white dark:border-[#060608] group-hover:scale-110 transition-transform">
                    {totalItems}
                  </span>
                )}
              </Link>
            </Tooltip>

            {/* My Orders */}
            <Tooltip content="ط·آ·ط¸â€‍ط·آ¨ط·آ§ط·ع¾ط¸ظ¹" position="bottom">
              <Link
                to="/profile?tab=orders"
                className="w-9 h-9 md:w-12 md:h-12 flex items-center justify-center rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/8 hover:border-red-500/40 hover:bg-red-50 dark:hover:bg-red-500/10 dark:hover:shadow-[0_0_15px_rgba(255,32,64,0.15)] transition-all duration-200 shadow-sm relative group"
              >
                <Package className="w-5 h-5 md:w-6 md:h-6 text-gray-600 dark:text-gray-400 group-hover:text-red-500 transition-colors" />
                <div className="absolute -top-1 -right-1 bg-red-500 dark:shadow-[0_0_6px_rgba(255,32,64,0.8)] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-[#060608] shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  !
                </div>
              </Link>
            </Tooltip>

            {/* Profile / Login */}
            {user ? (
              <div
                className="relative group/profile"
                ref={dropdownRef}
                onMouseEnter={() => setIsDropdownOpen(true)}
                onMouseLeave={() => setIsDropdownOpen(false)}
              >
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 bg-white dark:bg-[#1a1d24] hover:bg-red-50 p-1.5 pr-2 rounded-xl transition-all border border-gray-100 dark:border-gray-700 hover:border-red-200 shadow-sm hover:shadow-md active:scale-95 group"
                >
                  <div className="text-right hidden sm:block min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 leading-none group-hover:text-red-400 transition-colors">
                      ط¸â€¦ط·آ±ط·آ­ط·آ¨ط·آ§ط¸â€¹ ط·آ¨ط¸ئ’
                    </p>
                    <p className="text-xs font-black truncate max-w-[100px] text-gray-900 dark:text-white group-hover:text-red-700 transition-colors">
                      {profile?.full_name || user.email?.split('@')[0]}
                    </p>
                  </div>
                  {profile?.avatar_url && profile.avatar_url !== '' ? (
                    <div className="relative shrink-0 flex-none min-w-[36px]">
                      <img
                        src={profile.avatar_url}
                        alt="Profile"
                        className="w-9 h-9 rounded-full border-2 border-white shadow-sm object-cover group-hover:border-red-200 transition-all"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 shrink-0 flex-none min-w-[36px] rounded-full bg-red-100 text-red-700 flex items-center justify-center font-black text-xs border-2 border-white shadow-sm group-hover:bg-red-200 transition-all">
                      {user.email?.[0].toUpperCase()}
                    </div>
                  )}
                </button>

                {/* Profile dropdown */}
                <AnimatePresence>
                  {isDropdownOpen && (
                    <>
                      {/* Bridge to prevent gap-close */}
                      <div className="absolute top-full left-0 w-full h-2 bg-transparent" />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute left-0 mt-2 w-56 bg-white dark:bg-[#1a1d24] border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden"
                      >
                        <div className="p-4 border-b border-gray-50 dark:border-gray-700 bg-gray-50 dark:bg-[#0f1115]/50 text-right">
                          <p className="text-xs font-bold text-gray-400">ط·آ§ط¸â€‍ط·آ¨ط·آ±ط¸ظ¹ط·آ¯ ط·آ§ط¸â€‍ط·آ¥ط¸â€‍ط¸ئ’ط·ع¾ط·آ±ط¸ث†ط¸â€ ط¸ظ¹</p>
                          <p className="text-xs font-black truncate text-gray-900 dark:text-white">
                            {user.email}
                          </p>
                        </div>
                        <div className="py-2 p-2 space-y-1">
                          {[
                            { to: '/profile',           label: 'ط·آ§ط¸â€‍ط¸â€¦ط¸â€‍ط¸ظ¾ ط·آ§ط¸â€‍ط·آ´ط·آ®ط·آµط¸ظ¹',    icon: <UserCircle size={18} /> },
                            { to: '/profile?tab=settings', label: 'ط·آ¥ط·آ¹ط·آ¯ط·آ§ط·آ¯ط·آ§ط·ع¾ ط·آ§ط¸â€‍ط·آ­ط·آ³ط·آ§ط·آ¨', icon: <Settings size={18} /> },
                            { to: '/profile?tab=orders',   label: 'ط·آ·ط¸â€‍ط·آ¨ط·آ§ط·ع¾ط¸ظ¹',          icon: <Package size={18} /> },
                          ].map(({ to, label, icon }) => (
                            <Link
                              key={to}
                              to={to}
                              onClick={() => setIsDropdownOpen(false)}
                              className="flex items-center justify-end gap-3 px-4 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all"
                            >
                              {label} {icon}
                            </Link>
                          ))}

                          {(profile?.role === 'admin' || profile?.role === 'owner') && (
                            <Link
                              to="/dashboard"
                              onClick={() => setIsDropdownOpen(false)}
                              className="flex items-center justify-end gap-3 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all border-b border-gray-50 dark:border-gray-700 pb-2 mb-1"
                            >
                              ط¸â€‍ط¸ث†ط·آ­ط·آ© ط·آ§ط¸â€‍ط·ع¾ط·آ­ط¸ئ’ط¸â€¦ <ShieldCheck size={18} />
                            </Link>
                          )}

                          <a
                            href="https://wa.me/mokaa3"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center justify-end gap-3 px-4 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all"
                          >
                            ط·آ§ط¸â€‍ط·آ¯ط·آ¹ط¸â€¦ ط·آ§ط¸â€‍ط¸ظ¾ط¸â€ ط¸ظ¹ <HeadphonesIcon size={18} />
                          </a>

                          <div className="border-t border-gray-50 dark:border-gray-700 my-1" />

                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-end gap-3 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          >
                            ط·ع¾ط·آ³ط·آ¬ط¸ظ¹ط¸â€‍ ط·آ§ط¸â€‍ط·آ®ط·آ±ط¸ث†ط·آ¬ <LogOut size={18} />
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/login"
                className="text-[10px] md:text-xs font-black bg-red-700 text-white px-3 py-1.5 md:px-5 md:py-2.5 rounded-xl hover:bg-red-800 transition-all shadow-lg shadow-red-100 active:scale-95 whitespace-nowrap"
              >
                ط·آ¯ط·آ®ط¸ث†ط¸â€‍
              </Link>
            )}

            {/* أ¢â€‌â‚¬أ¢â€‌â‚¬ Hamburger (mobile only أ¢â‚¬â€‌ shown below lg) أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬ */}
            <button
              className={`lg:hidden ${iconBtn} w-9 h-9 md:w-10 md:h-10 hover:text-red-600`}
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="ط¸ظ¾ط·ع¾ط·آ­ ط·آ§ط¸â€‍ط¸â€ڑط·آ§ط·آ¦ط¸â€¦ط·آ©"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* أ¢â€‌â‚¬أ¢â€‌â‚¬ Calm-mode floating panel أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬ */}
        <AnimatePresence>
          {isCalmActive && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="fixed bottom-6 left-6 bg-zinc-950/95 backdrop-blur-xl text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/10 z-50 flex items-center gap-4 text-right select-none"
              dir="rtl"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <Coffee size={16} className="animate-bounce" />
              </div>
              <div className="flex-grow">
                <p className="text-[10px] font-black text-emerald-400">ط¸â€¦ط¸ظ¾ط·آ¹ط¸â€کط¸â€‍: ط¸ث†ط·آ¶ط·آ¹ ط¸â€¦ط¸ث†ط¸ئ’ط·آ§ ط·آ§ط¸â€‍ط¸â€،ط·آ§ط·آ¯ط·آ¦ أ¢ع©â€¢</p>
                <p className="text-[11px] font-bold text-zinc-300">ط¸â€¦ط·آ­ط¸ظ¹ط·آ· ط¸â€¦ط·آ±ط¸ظ¹ط·آ­ ط¸ث†ط¸â€‍ط·آ·ط¸ظ¹ط¸ظ¾ ط¸â€‍ط·ع¾ط¸â€ ط·آ§ط¸ث†ط¸â€‍ ط·آ§ط¸â€‍ط·آ·ط·آ¹ط·آ§ط¸â€¦</p>
              </div>
              <div className="flex items-center gap-2 border-r border-white/10 pr-3">
                <button
                  onClick={() => setIsMuted((prev) => !prev)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    isMuted
                      ? 'bg-zinc-800 text-zinc-400'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                  }`}
                  title={isMuted ? 'ط·ع¾ط·آ´ط·ط›ط¸ظ¹ط¸â€‍ ط·آ§ط¸â€‍ط·آµط¸ث†ط·ع¾' : 'ط¸ئ’ط·ع¾ط¸â€¦ ط·آ§ط¸â€‍ط·آµط¸ث†ط·ع¾'}
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} className="animate-pulse" />}
                </button>
                <button
                  onClick={() => setIsCalmActive(false)}
                  className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-all text-sm font-black"
                  title="ط·آ¥ط·ط›ط¸â€‍ط·آ§ط¸â€ڑ ط¸ث†ط·آ¶ط·آ¹ ط·آ§ط¸â€‍ط¸â€،ط·آ¯ط¸ث†ط·طŒ"
                >
                  أ¢إ“â€¢
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯
          MOBILE MENU DRAWER أ¢â‚¬â€‌ full-screen overlay, slides from the right
          Visible on: < lg (i.e., phones & tablets)
      أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯أ¢â€¢ع¯ */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Drawer panel */}
            <motion.div
              key="mobile-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 h-full w-72 bg-white dark:bg-[#0c0c10] border-l border-gray-200 dark:border-white/10 shadow-2xl z-[70] flex flex-col lg:hidden"
              dir="rtl"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <img
                    src="https://i.postimg.cc/X7NjBvxn/content.png"
                    alt={storeName}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                  <span className="text-sm font-black text-gray-900 dark:text-white">
                    {storeName}
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-[#0f1115] text-gray-600 dark:text-gray-400 hover:bg-red-50 hover:text-red-700 transition-all"
                  aria-label="ط·آ¥ط·ط›ط¸â€‍ط·آ§ط¸â€ڑ ط·آ§ط¸â€‍ط¸â€ڑط·آ§ط·آ¦ط¸â€¦ط·آ©"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {navLinks.map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className={[
                      'flex items-center px-4 py-3 rounded-xl text-sm font-black transition-all',
                      location.pathname === to
                        ? 'bg-red-50 text-red-700 border border-red-100'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#0f1115] hover:text-red-700',
                    ].join(' ')}
                  >
                    {label}
                    {location.pathname === to && (
                      <span className="mr-auto w-1.5 h-1.5 rounded-full bg-red-600" />
                    )}
                  </Link>
                ))}
              </nav>

              {/* Drawer footer: Currency + Theme */}
              <div className="p-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
                {/* Currency */}
                <div className="flex items-center justify-between bg-gray-50 dark:bg-[#0f1115] rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-700">
                  <span className="text-xs font-black text-gray-500 dark:text-gray-400">
                    ط·آ§ط¸â€‍ط·آ¹ط¸â€¦ط¸â€‍ط·آ©
                  </span>
                  <div className="flex items-center gap-1">
                    <Globe size={12} className="text-gray-400" />
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as Currency)}
                      className="text-xs font-black text-gray-700 dark:text-gray-300 bg-transparent outline-none cursor-pointer"
                    >
                      <option value="EGY">EGY (ط·آ¬.ط¸â€¦)</option>
                      <option value="SAR">SAR (ط·آ±.ط·آ³)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                </div>

                {/* Theme toggle */}
                <button
                  onClick={() => setIsDark(!isDark)}
                  className="w-full flex items-center justify-between bg-gray-50 dark:bg-[#0f1115] rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-700 transition-all hover:border-red-200 hover:bg-red-50 dark:hover:bg-[#0f1115]"
                >
                  <span className="text-xs font-black text-gray-500 dark:text-gray-400">
                    {isDark ? 'ط·آ§ط¸â€‍ط¸ث†ط·آ¶ط·آ¹ ط·آ§ط¸â€‍ط¸ظ¾ط·آ§ط·ع¾ط·آ­' : 'ط·آ§ط¸â€‍ط¸ث†ط·آ¶ط·آ¹ ط·آ§ط¸â€‍ط·آ¯ط·آ§ط¸ئ’ط¸â€ '}
                  </span>
                  {isDark
                    ? <Sun size={18} className="text-amber-500" />
                    : <Moon size={18} className="text-indigo-500" />
                  }
                </button>

                {/* Social links */}
                <div className="flex items-center justify-center gap-4 pt-1">
                  <a href="https://wa.me/mokaa3" target="_blank" rel="noopener noreferrer"
                    className="text-gray-400 hover:text-green-600 transition-colors">
                    <WhatsAppIcon size={22} />
                  </a>
                  {discordUrl && (
                    <a href={discordUrl} target="_blank" rel="noopener noreferrer"
                      className="text-gray-400 hover:text-indigo-500 transition-colors">
                      <DiscordIcon size={22} />
                    </a>
                  )}
                  {settings?.facebook_url && (
                    <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer"
                      className="text-gray-400 hover:text-blue-600 transition-colors">
                      <FacebookIcon size={22} />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}


