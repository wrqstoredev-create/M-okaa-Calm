import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Mail, Phone, MessageCircle, Facebook, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const TikTokIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1 .05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.04-.1z"/>
  </svg>
);

const WhatsAppIcon = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
);

export default function Footer() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from('settings').select('*').single();
      if (data) setSettings(data);
    } catch (err) {
      console.error('Error fetching settings for footer:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <footer className="bg-[#f0efef] py-10 flex justify-center">
        <Loader2 className="animate-spin text-zinc-400" size={24} />
      </footer>
    );
  }

  const discordUrl = settings?.instagram_url?.includes('instagram.com') ? 'https://discord.gg/HNss9cMfbG' : settings?.instagram_url || 'https://discord.gg/HNss9cMfbG';
  const tiktokHandle = settings?.tiktok_handle || '1m';
  const tiktokUrl = settings?.tiktok_url || `https://tiktok.com/@${tiktokHandle}`;
  const fbHandle = settings?.facebook_handle;
  const fbUrl = settings?.facebook_url;
  const waNumber = settings?.whatsapp_number || 'mokaa3';
  const phone1 = settings?.phone_primary || '+971 52 245 5439';
  const phone2 = settings?.phone_secondary || '01557957800';
  const email = settings?.support_email || 'support@games-store.ae';

  return (
    <footer className="bg-[#f0efef] text-zinc-900 dark:text-white pt-16 pb-8 px-6 border-t border-zinc-200 mt-20" dir="rtl">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-right">
        
        {/* Explore Section */}
        <div className="space-y-6">
          <h3 className="text-xl font-black text-gray-900 dark:text-white select-none">استكشف</h3>
          <ul className="space-y-3">
            <li>
              <Link to="/" className="text-red-700 hover:text-red-800 font-bold transition-colors">الرئيسية</Link>
            </li>
            {settings?.show_about_link !== false ? (
              <li>
                <Link to="/about" className="text-zinc-600 hover:text-red-700 font-bold transition-colors">من نحن</Link>
              </li>
            ) : (
              <li className="text-zinc-300 font-bold cursor-not-allowed select-none">من نحن</li>
            )}
            <li>
              <Link to="/store" className="text-zinc-600 hover:text-red-700 font-bold transition-colors">المنتجات</Link>
            </li>
            {settings?.show_terms_link !== false ? (
              <li>
                <Link to="/terms" className="text-zinc-600 hover:text-red-700 font-bold transition-colors">الشروط والاحكام</Link>
              </li>
            ) : (
              <li className="text-zinc-300 font-bold cursor-not-allowed select-none">الشروط والاحكام</li>
            )}
            {settings?.show_privacy_link !== false ? (
              <li>
                <Link to="/privacy" className="text-zinc-600 hover:text-red-700 font-bold transition-colors">سياسة الخصوصية</Link>
              </li>
            ) : (
              <li className="text-zinc-300 font-bold cursor-not-allowed select-none">سياسة الخصوصية</li>
            )}
            {settings?.show_help_link !== false ? (
              <li>
                <Link to="/help" className="text-zinc-600 hover:text-red-700 font-bold transition-colors">المساعدة</Link>
              </li>
            ) : (
              <li className="text-zinc-300 font-bold cursor-not-allowed select-none">المساعدة</li>
            )}
            {settings?.show_contact_link !== false ? (
              <li>
                 <Link to="/contact" className="text-green-700 hover:text-green-800 font-bold transition-colors">اتصل بنا</Link>
              </li>
            ) : (
              <li className="text-zinc-300 font-bold cursor-not-allowed select-none">اتصل بنا</li>
            )}
          </ul>
        </div>

        {/* Follow Us Section */}
        <div className="space-y-6">
          <h3 className="text-xl font-black text-gray-900 dark:text-white">تابعنا</h3>
          <ul className="space-y-4">
            {discordUrl && (
              <li>
                <a href={discordUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-start gap-3 text-zinc-600 hover:text-indigo-500 transition-colors group">
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                  </svg>
                  <span className="font-bold">ديسكورد المتجر</span>
                </a>
              </li>
            )}
            {tiktokHandle && (
              <li>
                <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-start gap-3 text-zinc-600 hover:text-red-700 transition-colors group">
                  <TikTokIcon size={20} />
                  <span className="font-bold">{tiktokHandle}</span>
                </a>
              </li>
            )}
            {fbHandle && (
              <li>
                <a href={fbUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-start gap-3 text-zinc-600 hover:text-red-700 transition-colors group">
                  <Facebook size={20} className="group-hover:scale-110 transition-transform" />
                  <span className="font-bold">{fbHandle}</span>
                </a>
              </li>
            )}
            {waNumber && (
              <li>
                <a href="https://wa.me/mokaa3" target="_blank" rel="noopener noreferrer" className="flex items-center justify-start gap-3 text-zinc-600 hover:text-emerald-600 transition-colors group">
                  <WhatsAppIcon size={20} className="group-hover:scale-110 transition-transform" />
                  <span className="font-bold">{waNumber}</span>
                </a>
              </li>
            )}
          </ul>
        </div>

        {/* Stay in Touch Section */}
        <div className="space-y-6">
          <h3 className="text-xl font-black text-gray-900 dark:text-white">ابق على تواصل</h3>
          <ul className="space-y-4">
            <li>
              <a href={`mailto:${email}`} className="flex items-center justify-start gap-3 text-red-700 hover:text-red-800 transition-colors group">
                <Mail size={20} className="group-hover:scale-110 transition-transform" />
                <span className="font-black">{email}</span>
              </a>
            </li>
            {phone1 && (
              <li>
                <a href={`tel:${phone1.replace(/[^0-9+]/g, '')}`} className="flex items-center justify-start gap-3 text-zinc-600 hover:text-red-700 transition-colors group">
                  <Phone size={20} className="group-hover:scale-110 transition-transform transform rotate-[-15deg]" />
                  <span className="font-bold" dir="ltr">{phone1}</span>
                </a>
              </li>
            )}
            {phone2 && (
              <li>
                <a href={`tel:${phone2.replace(/[^0-9+]/g, '')}`} className="flex items-center justify-start gap-3 text-zinc-600 hover:text-red-700 transition-colors group">
                  <Phone size={20} className="group-hover:scale-110 transition-transform" />
                  <span className="font-bold" dir="ltr">{phone2}</span>
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-zinc-200 flex flex-col md:flex-row justify-between items-center gap-4 text-zinc-500 font-bold text-xs">
        <p>© 2026 {settings?.store_name || 'GamesStore'} - جميع الحقوق محفوظة.</p>
        <div className="flex gap-6">
           {settings?.show_about_link !== false && <Link to="/about" className="hover:text-red-700 transition-colors">من نحن</Link>}
           {settings?.show_terms_link !== false && <Link to="/terms" className="hover:text-red-700 transition-colors">الشروط والأحكام</Link>}
           {settings?.show_privacy_link !== false && <Link to="/privacy" className="hover:text-red-700 transition-colors">سياسة الخصوصية</Link>}
           {settings?.show_help_link !== false && <Link to="/help" className="hover:text-red-700 transition-colors">المساعدة</Link>}
           {settings?.show_contact_link !== false && <Link to="/contact" className="hover:text-red-700 transition-colors">اتصل بنا</Link>}
        </div>
      </div>
    </footer>
  );
}
