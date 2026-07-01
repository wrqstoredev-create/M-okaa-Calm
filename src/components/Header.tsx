import { Gamepad2, ShoppingCart, User, ShieldCheck, Zap, HeadphonesIcon, LogOut, Settings, HelpCircle, UserCircle, Loader2, Heart, Phone, Instagram, Globe, Package, Coffee, Volume2, VolumeX, Moon, Sun } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency, Currency } from '../contexts/CurrencyContext';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabaseClient';

// Custom TikTok Icon (Professional Version)
const TikTokIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1 .05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.04-.1z"/>
  </svg>
);

// WhatsApp Icon
const WhatsAppIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
);

// Discord Icon
const DiscordIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
  </svg>
);

// Facebook Icon
const FacebookIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
  </svg>
);

export default function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const { currency, setCurrency, formatPrice } = useCurrency();
  const { totalItems } = useCart();
  const { favorites, toggleFavorite, removeFavorite, favoritesCount, clearFavorites } = useFavorites();
  const [storeName, setStoreName] = useState('Mokaa');
  const [roboCoinsEnabled, setRoboCoinsEnabled] = useState(false);
  const [roboCoinsBalance, setRoboCoinsBalance] = useState(5000);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const favoritesRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<any>(null);
  const [isCalmActive, setIsCalmActive] = useState(() => localStorage.getItem('calm_mode') === 'true');
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

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

  useEffect(() => {
    if (isCalmActive) {
      if (!audioRef.current) {
        audioRef.current = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3');
        audioRef.current.loop = true;
        audioRef.current.volume = 0.25;
      }
      if (!isMuted) {
        audioRef.current.play().catch(err => console.log('Audio autoplay prevented, will play on focus/click:', err));
      } else {
        audioRef.current.pause();
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
    localStorage.setItem('calm_mode', isCalmActive ? 'true' : 'false');
    window.dispatchEvent(new Event('calmModeChanged'));

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [isCalmActive, isMuted]);

  // Fetch Store Settings
  useEffect(() => {
    async function getSettings() {
      try {
        const { data } = await supabase.from('settings').select('*').single();
        if (data) {
          setSettings(data);
          if (data.store_name) {
            setStoreName(data.store_name);
          }
          setRoboCoinsEnabled(data.robo_coins_enabled ?? false);
          setRoboCoinsBalance(data.robo_coins_balance ?? 5000);
        }
      } catch (err) {
        console.error('Error fetching settings for header:', err);
      }
    }
    getSettings();

    // Query periodically to keep header balance remaining-indicator always accurate
    const interval = setInterval(getSettings, 10000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const handleLogout = async () => {
    await signOut();
    setIsDropdownOpen(false);
    navigate('/');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (favoritesRef.current && !favoritesRef.current.contains(event.target as Node)) {
        setIsFavoritesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const discordUrl = settings?.instagram_url?.includes('instagram.com') ? 'https://discord.gg/HNss9cMfbG' : settings?.instagram_url || 'https://discord.gg/HNss9cMfbG';

  return (
    <header className="border-b border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-[#1a1d24]/80 backdrop-blur-md sticky top-0 z-50 transition-all">
      {/* Main Header (Single Navigation Bar) */}
      <div className="max-w-7xl mx-auto flex items-center justify-between px-2 py-2 md:px-4 md:py-3 gap-2 md:gap-4">
        
        {/* Logo & Nav */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="flex flex-col items-start">
            <Link to="/" className="flex items-center cursor-pointer hover:opacity-90">
              <img src="https://i.postimg.cc/X7NjBvxn/content.png" alt={storeName} className="h-10 w-10 md:h-11 md:w-11 rounded-full object-cover" />
            </Link>
            <button
              onClick={() => setIsCalmActive(!isCalmActive)}
              className={`flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full border text-[8px] sm:text-[9px] font-black transition-all shadow-sm ${
                isCalmActive
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 animate-pulse'
                  : 'bg-zinc-50 dark:bg-[#0f1115] border-zinc-200 text-zinc-505 hover:bg-zinc-100 dark:bg-[#1a1d24] hover:text-zinc-800'
              }`}
              title="تفعيل وضع الهدوء وتناول الطعام"
            >
              <Coffee size={9} className={isCalmActive ? 'animate-bounce text-emerald-600' : 'text-zinc-400'} />
              <span>M̵̓̔okaa Calm</span>
            </button>
          </div>
          
          <nav className="hidden lg:flex gap-4 text-[11px] md:text-[12px] font-black items-center">
            <Link to="/" className={`${location.pathname === '/' ? 'text-red-700 border-b-2 border-red-700 pb-0.5' : 'text-gray-500 dark:text-gray-400 hover:text-red-700 transition-colors'}`}>الرئيسية</Link>
            {settings?.show_about_link !== false && (
              <Link to="/about" className={`${location.pathname === '/about' ? 'text-red-700 border-b-2 border-red-700 pb-0.5' : 'text-gray-500 dark:text-gray-400 hover:text-red-700 transition-colors'}`}>من نحن</Link>
            )}
            <Link to="/store" className={`${location.pathname === '/store' ? 'text-red-700 border-b-2 border-red-700 pb-0.5' : 'text-gray-500 dark:text-gray-400 hover:text-red-700 transition-colors'}`}>المنتجات</Link>
            {settings?.show_terms_link !== false && (
              <Link to="/terms" className={`${location.pathname === '/terms' ? 'text-red-700 border-b-2 border-red-700 pb-0.5' : 'text-gray-500 dark:text-gray-400 hover:text-red-700 transition-colors'}`}>الشروط والأحكام</Link>
            )}
            {settings?.show_privacy_link !== false && (
              <Link to="/privacy" className={`${location.pathname === '/privacy' ? 'text-red-700 border-b-2 border-red-700 pb-0.5' : 'text-gray-500 dark:text-gray-400 hover:text-red-700 transition-colors'}`}>الخصوصية</Link>
            )}
            {settings?.show_help_link !== false && (
              <Link to="/help" className={`${location.pathname === '/help' ? 'text-red-700 border-b-2 border-red-700 pb-0.5' : 'text-gray-500 dark:text-gray-400 hover:text-red-700 transition-colors'}`}>المساعدة</Link>
            )}
            {settings?.show_contact_link !== false && (
              <Link to="/contact" className={`${location.pathname === '/contact' ? 'text-red-700 border-b-2 border-red-700 pb-0.5' : 'text-gray-500 dark:text-gray-400 hover:text-red-700 transition-colors'}`}>اتصل بنا</Link>
            )}
          </nav>
        </div>

        {/* Socials & Settings */}
        <div className="hidden xl:flex items-center gap-3 px-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 group cursor-pointer">
            <a href={`tel:${(settings?.phone_primary || '01102976303').replace(/[^0-9+]/g, '')}`} className="text-[11px] font-black text-gray-800 dark:text-white group-hover:text-red-700 transition-colors" dir="ltr">
              {settings?.phone_primary || '01102976303'}
            </a>
            <Phone size={12} className="text-gray-900 dark:text-white fill-current" />
          </div>

          <div className="flex items-center gap-3 border-r border-gray-200 dark:border-gray-700 pr-3">
            <a href="https://wa.me/mokaa3" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-600 transition-colors transform hover:scale-110" title="WhatsApp">
              <WhatsAppIcon size={20} />
            </a>
            {discordUrl && (
              <a href={discordUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-indigo-500 transition-colors transform hover:scale-110" title="Discord">
                <DiscordIcon size={20} />
              </a>
            )}
            {settings?.facebook_url && (
              <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors transform hover:scale-110" title="Facebook">
                <FacebookIcon size={20} />
              </a>
            )}
            {settings?.tiktok_url && (
              <a href={settings.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-gray-900 dark:text-white hover:text-red-700 transition-colors transform hover:scale-110" title="TikTok">
                <TikTokIcon size={20} />
              </a>
            )}
          </div>
          
          {/* Currency Switcher */}
          <div className="flex items-center gap-1 bg-gray-50 dark:bg-[#0f1115] rounded-full px-2 py-1 border border-gray-100 dark:border-gray-700 ml-1">
            <Globe size={10} className="text-gray-400" />
            <select 
              value={currency} 
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="text-[10px] font-black text-gray-700 dark:text-gray-300 bg-transparent outline-none cursor-pointer"
            >
              <option value="EGY">EGY (ج.م)</option>
              <option value="SAR">SAR (ر.س)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>

          {/* Theme Toggle */}
          <button 
            onClick={() => setIsDark(!isDark)}
            className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-50 dark:bg-[#0f1115] border border-gray-100 dark:border-gray-700 dark:border-zinc-700 text-gray-500 dark:text-gray-400 hover:text-red-600 transition-all mr-1 cursor-pointer shadow-sm hover:shadow-md"
            title={isDark ? "الوضع الفاتح" : "الوضع الداكن"}
          >
            {isDark ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          {roboCoinsEnabled && (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/80 px-2.5 py-1.5 rounded-xl text-amber-800 shadow-sm text-right cursor-default select-none transition-colors" title="رصيدك المتبقي من الروبوكس">
              <span className="text-[12px]">🪙</span>
              <span className="text-[10px] font-black text-amber-900 whitespace-nowrap">متبقي:</span>
              <span className="text-[11px] font-black font-mono tracking-tight text-amber-700">{roboCoinsBalance.toLocaleString('en-US')}</span>
            </div>
          )}

          <div className="relative" ref={favoritesRef}>
            <button 
              onClick={() => setIsFavoritesOpen(!isFavoritesOpen)}
              className="relative cursor-pointer group focus:outline-none"
            >
            <div className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all border shadow-sm ${isFavoritesOpen ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white dark:bg-[#1a1d24] border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:bg-[#0f1115] dark:hover:bg-gray-700 dark:bg-gray-800 dark:hover:bg-zinc-800 dark:bg-zinc-800 text-gray-800 dark:text-white hover:border-gray-200 dark:border-gray-700 hover:shadow-md'}`}>
                <Heart className={`w-6 h-6 ${isFavoritesOpen ? 'fill-red-500 text-red-600' : 'text-gray-700 dark:text-gray-300'}`} />
              </div>
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-700 text-white text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-black border-2 border-white group-hover:scale-110 transition-transform animate-pulse">
                  {favoritesCount}
                </span>
              )}
            </button>

            {/* Favorites Dropdown Drawer */}
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
                  <div className="p-4 border-b border-gray-50 bg-gray-50 dark:bg-[#0f1115]/50 flex items-center justify-between">
                    <span className="text-xs font-black text-gray-500 dark:text-gray-400">
                      قائمة المفضلة ({favoritesCount})
                    </span>
                    <button 
                      onClick={clearFavorites}
                      className="text-[10px] font-black text-red-600 hover:text-red-800 transition-colors"
                      disabled={favoritesCount === 0}
                    >
                      مسح الكل
                    </button>
                  </div>

                  <div className="p-2 max-h-[350px] overflow-y-auto space-y-1.5 scrollbar-thin">
                    {favorites.length > 0 ? (
                      favorites.map((prod) => (
                        <div 
                          key={prod.id} 
                          className="flex items-center justify-between gap-3 p-2 hover:bg-gray-50 dark:bg-[#0f1115] dark:hover:bg-gray-700 dark:bg-gray-800 dark:hover:bg-zinc-800 dark:bg-zinc-800 rounded-xl transition-all border border-transparent hover:border-gray-100 dark:border-gray-700"
                        >
                          {/* Left: Remove Button & Details */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFavorite(prod.id);
                              }}
                              className="text-gray-300 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-all"
                              title="إزالة من المفضلة"
                            >
                              <Heart className="w-4 h-4 fill-red-550 text-red-550" />
                            </button>
                            
                            <button
                              onClick={() => {
                                setIsFavoritesOpen(false);
                                navigate(`/product/${prod.id}`);
                              }}
                              className="bg-red-700 hover:bg-red-800 text-white text-[10px] font-black px-3 py-1.5 rounded-lg transition-all active:scale-95 whitespace-nowrap"
                            >
                              طلب المنتج
                            </button>
                          </div>

                          {/* Right: Info and Image */}
                          <div 
                            className="flex items-center gap-3 cursor-pointer min-w-0"
                            onClick={() => {
                              setIsFavoritesOpen(false);
                              navigate(`/product/${prod.id}`);
                            }}
                          >
                            <div className="text-right min-w-0">
                              <p className="text-xs font-black text-gray-950 dark:text-white truncate max-w-[140px] md:max-w-[200px]">
                                {prod.title}
                              </p>
                              {prod.game_name && (
                                <p className="text-[9px] font-bold text-gray-400 mt-0.5">
                                  {prod.game_name}
                                </p>
                              )}
                              <p className="text-[11px] font-extrabold text-red-700 mt-1">
                                {formatPrice(prod.price)}
                              </p>
                            </div>

                            <div className="w-11 h-11 bg-gray-50 dark:bg-[#0f1115] border border-gray-100 dark:border-gray-700 rounded-lg flex-shrink-0 flex items-center justify-center p-1 overflow-hidden">
                              <img src={prod.image_url || prod.image || null} alt="" className="w-full h-full object-contain" />
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 px-4">
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Heart className="w-6 h-6 text-red-700 fill-red-200" />
                        </div>
                        <p className="text-xs font-black text-gray-800 dark:text-white">قائمة المفضلة فارغة 💔</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1">تصفح متجرنا المميز واضغط زر ❤️ لحفظ منتجاتك المفضلة هنا!</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link to="/cart" className="relative cursor-pointer group">
            <div className="bg-white dark:bg-[#1a1d24] w-12 h-12 flex items-center justify-center rounded-xl border border-gray-100 dark:border-gray-700 group-hover:bg-gray-50 dark:bg-[#0f1115] dark:hover:bg-gray-700 dark:bg-gray-800 dark:hover:bg-zinc-800 dark:bg-zinc-800 group-hover:border-gray-200 dark:border-gray-700 transition-all shadow-sm hover:shadow-md">
              <ShoppingCart className="w-6 h-6 text-gray-700 dark:text-gray-300 group-hover:text-red-700" />
            </div>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-700 text-white text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-black border-2 border-white group-hover:scale-110 transition-transform">
                {totalItems}
              </span>
            )}
          </Link>
          
          {/* Requests Icon (Box) */}
          <Link 
            to="/profile?tab=orders" 
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-white dark:bg-[#1a1d24] border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:bg-[#0f1115] dark:hover:bg-gray-700 dark:bg-gray-800 dark:hover:bg-zinc-800 dark:bg-zinc-800 hover:border-gray-200 dark:border-gray-700 transition-all shadow-sm hover:shadow-md relative group"
            title="طلباتي"
          >
            <Package size={24} className="text-gray-600 dark:text-gray-400 group-hover:text-red-600 transition-colors" />
            <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
              !
            </div>
          </Link>

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
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-bold text-gray-400 leading-none group-hover:text-red-400 transition-colors">مرحباً بك</p>
                  <p className="text-xs font-black truncate max-w-[100px] text-gray-900 dark:text-white group-hover:text-red-700 transition-colors">{profile?.full_name || user.email?.split('@')[0]}</p>
                </div>
                {profile?.avatar_url && profile.avatar_url !== '' ? (
                  <div className="relative">
                    <img src={profile.avatar_url} alt="Profile" className="w-9 h-9 rounded-full border-2 border-white shadow-sm object-cover group-hover:border-red-200 transition-all" referrerPolicy="no-referrer" />
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-black text-xs border-2 border-white shadow-sm group-hover:bg-red-200 transition-all">
                    {user.email?.[0].toUpperCase()}
                  </div>
                )}
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <>
                    {/* Invisible invisible bridge to prevent closing when moving to dropdown */}
                    <div className="absolute top-full left-0 w-full h-2 bg-transparent"></div>
                    
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute left-0 mt-2 w-56 bg-white dark:bg-[#1a1d24] border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-gray-50 bg-gray-50 dark:bg-[#0f1115]/50 text-right">
                         <p className="text-xs font-bold text-gray-400">البريد الإلكتروني</p>
                         <p className="text-xs font-black truncate text-gray-900 dark:text-white">{user.email}</p>
                      </div>
                      <div className="py-2 p-2 space-y-1">
                        <Link 
                          to="/profile" 
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center justify-end gap-3 px-4 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all"
                        >
                           الملف الشخصي <UserCircle size={18} />
                        </Link>

                        <Link 
                          to="/profile?tab=settings" 
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center justify-end gap-3 px-4 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all"
                        >
                           إعدادات الحساب <Settings size={18} />
                        </Link>

                        {/* لوحة التحكم للمدير والمالك */}
                        {(profile?.role === 'admin' || profile?.role === 'owner') && (
                          <Link 
                            to="/dashboard" 
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center justify-end gap-3 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all border-b border-gray-50 pb-2 mb-1"
                          >
                             لوحة التحكم <ShieldCheck size={18} />
                          </Link>
                        )}

                        <Link 
                          to="/profile?tab=orders" 
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center justify-end gap-3 px-4 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all"
                        >
                           طلباتي <Package size={18} />
                        </Link>
                        <a
                          href="https://wa.me/mokaa3" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-end gap-3 px-4 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                           الدعم الفني <HeadphonesIcon size={18} />
                        </a>
                        <div className="border-t border-gray-50 my-1"></div>
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center justify-end gap-3 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                           تسجيل الخروج <LogOut size={18} />
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link to="/login" className="text-xs font-black bg-red-700 text-white px-5 py-2.5 rounded-xl hover:bg-red-800 transition-all shadow-lg shadow-red-100 active:scale-95">
              دخول
            </Link>
          )}
        </div>

      </div>

      {/* Floating Calm Environment Panel */}
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
              <p className="text-[10px] font-black text-emerald-400">مفعل: وضع موكا الهادئ ☕</p>
              <p className="text-[11px] font-bold text-zinc-300">محيط مريح ولطيف لتناول الطعام</p>
            </div>

            <div className="flex items-center gap-2 border-r border-white/10 pr-3">
              <button
                onClick={() => setIsMuted(prev => !prev)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  isMuted ? 'bg-zinc-800 text-zinc-400' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                }`}
                title={isMuted ? "تشغيل الصوت" : "كتم الصوت"}
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} className="animate-pulse" />}
              </button>
              
              <button
                onClick={() => setIsCalmActive(false)}
                className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-all text-sm font-black"
                title="إغلاق وضع الهدوء"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
