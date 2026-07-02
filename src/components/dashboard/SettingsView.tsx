
import React, { useState, useEffect } from 'react';
import { Save, Globe, Lock, Bell, Palette, ShieldCheck, Loader2, CheckCircle2, XCircle, Eye, EyeOff, Smartphone, Mail, Moon, Sun, Type, Contrast, Wallet, CreditCard, Link2, Share2, Instagram, Facebook, MessageCircle, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

type SettingTab = 'general' | 'payments' | 'security' | 'notifications' | 'appearance' | 'accessibility' | 'links' | 'pages';

export default function SettingsView() {
  const { profile } = useAuth();
  const { addToast } = useToast();
  const isOwner = profile?.role === 'owner';
  const [activeTab, setActiveTab] = useState<SettingTab>('general');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [hasRoboCoinsColumns, setHasRoboCoinsColumns] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passError, setPassError] = useState('');
  const [settings, setSettings] = useState({
    store_name: '',
    store_description: '',
    support_email: '',
    crypto_wallet_address: '',
    enable_2fa: false,
    order_notifications: true,
    dark_mode: false,
    high_contrast: false,
    font_size: 'medium',
    dashboard_password: '',
    phone_cash_number: '',
    instapay_id: '',
    fawry_number: '',
    enable_visa: true,
    enable_apple_pay: true,
    enable_phone_cash: true,
    enable_instapay: true,
    enable_fawry: true,
    robo_coins_balance: 5000,
    robo_coins_enabled: true,
    shipping_fee: 0,
    is_shipping_free: false,
    free_shipping_threshold: 0,
    instagram_handle: '',
    instagram_url: '',
    tiktok_handle: '',
    tiktok_url: '',
    facebook_handle: '',
    facebook_url: '',
    whatsapp_number: '',
    phone_primary: '',
    phone_secondary: '',
    show_about_link: true,
    show_terms_link: true,
    show_privacy_link: true,
    show_help_link: true,
    show_contact_link: true,
    about_content: '',
    terms_content: '',
    privacy_content: '',
    help_content: '',
    contact_content: '',
    usd_rate: 49.50,
    sar_rate: 13.20,
    auto_currency: false
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single();
      
      if (data) {
        const hasBalance = 'robo_coins_balance' in data;
        const hasEnabled = 'robo_coins_enabled' in data;
        setHasRoboCoinsColumns(hasBalance && hasEnabled);

        let parsedUsdRate = 49.50;
        let parsedSarRate = 13.20;
        let parsedAutoCurrency = false;
        
        try {
          if (data.instagram_handle) {
            const parsed = JSON.parse(data.instagram_handle);
            if (parsed.usd) parsedUsdRate = Number(parsed.usd);
            if (parsed.sar) parsedSarRate = Number(parsed.sar);
            if (parsed.auto) parsedAutoCurrency = Boolean(parsed.auto);
          }
        } catch(e) {
          // If not valid JSON, ignore and keep defaults
        }

        setSettings({
          store_name: data.store_name || '',
          store_description: data.store_description || '',
          support_email: data.support_email || '',
          crypto_wallet_address: data.crypto_wallet_address || '',
          enable_2fa: data.enable_2fa ?? false,
          order_notifications: data.order_notifications ?? true,
          dark_mode: data.dark_mode ?? false,
          high_contrast: data.high_contrast ?? false,
          font_size: data.font_size || 'medium',
          dashboard_password: data.dashboard_password || '',
          phone_cash_number: data.phone_cash_number || '',
          instapay_id: data.instapay_id || '',
          fawry_number: data.fawry_number || '',
          enable_visa: data.enable_visa ?? true,
          enable_apple_pay: data.enable_apple_pay ?? true,
          enable_phone_cash: data.enable_phone_cash ?? true,
          enable_instapay: data.enable_instapay ?? true,
          enable_fawry: data.enable_fawry ?? true,
          robo_coins_balance: hasBalance ? (data.robo_coins_balance ?? 5000) : 5000,
          robo_coins_enabled: hasEnabled ? (data.robo_coins_enabled ?? true) : true,
          shipping_fee: data.shipping_fee ?? 0,
          is_shipping_free: data.is_shipping_free ?? false,
          free_shipping_threshold: data.free_shipping_threshold ?? 0,
          instagram_handle: data.instagram_handle || '',
          instagram_url: data.instagram_url || 'https://discord.gg/HNss9cMfbG',
          tiktok_handle: data.tiktok_handle || '1m',
          tiktok_url: data.tiktok_url || 'https://tiktok.com/@1m',
          facebook_handle: data.facebook_handle || '',
          facebook_url: data.facebook_url || '',
          whatsapp_number: data.whatsapp_number || 'mokaa3',
          phone_primary: data.phone_primary || '+971 52 245 5439',
          phone_secondary: data.phone_secondary || '01557957800',
          show_about_link: data.show_about_link ?? true,
          show_terms_link: data.show_terms_link ?? true,
          show_privacy_link: data.show_privacy_link ?? true,
          show_help_link: data.show_help_link ?? true,
          show_contact_link: data.show_contact_link ?? true,
          about_content: data.about_content || '',
          terms_content: data.terms_content || '',
          privacy_content: data.privacy_content || '',
          help_content: data.help_content || '',
          contact_content: data.contact_content || '',
          usd_rate: parsedUsdRate,
          sar_rate: parsedSarRate,
          auto_currency: parsedAutoCurrency
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setStatus('idle');
    
    try {
      // Build update payload based on supported columns to avoid database syntax errors 
      const payload: any = {
        store_name: settings.store_name,
        store_description: settings.store_description,
        support_email: settings.support_email,
        crypto_wallet_address: settings.crypto_wallet_address,
        enable_2fa: settings.enable_2fa,
        order_notifications: settings.order_notifications,
        dark_mode: settings.dark_mode,
        high_contrast: settings.high_contrast,
        font_size: settings.font_size,
        phone_cash_number: settings.phone_cash_number,
        instapay_id: settings.instapay_id,
        fawry_number: settings.fawry_number,
        enable_visa: settings.enable_visa,
        enable_apple_pay: settings.enable_apple_pay,
        enable_phone_cash: settings.enable_phone_cash,
        enable_instapay: settings.enable_instapay,
        enable_fawry: settings.enable_fawry,
        shipping_fee: settings.shipping_fee,
        is_shipping_free: settings.is_shipping_free,
        free_shipping_threshold: settings.free_shipping_threshold,
        instagram_handle: JSON.stringify({ usd: settings.usd_rate, sar: settings.sar_rate, auto: settings.auto_currency }),
        instagram_url: settings.instagram_url,
        tiktok_handle: settings.tiktok_handle,
        tiktok_url: settings.tiktok_url,
        facebook_handle: settings.facebook_handle,
        facebook_url: settings.facebook_url,
        whatsapp_number: settings.whatsapp_number,
        phone_primary: settings.phone_primary,
        phone_secondary: settings.phone_secondary,
        show_about_link: settings.show_about_link,
        show_terms_link: settings.show_terms_link,
        show_privacy_link: settings.show_privacy_link,
        show_help_link: settings.show_help_link,
        show_contact_link: settings.show_contact_link,
        about_content: settings.about_content,
        terms_content: settings.terms_content,
        privacy_content: settings.privacy_content,
        help_content: settings.help_content,
        contact_content: settings.contact_content
      };

      if (hasRoboCoinsColumns) {
        payload.robo_coins_balance = settings.robo_coins_balance;
        payload.robo_coins_enabled = settings.robo_coins_enabled;
      }

      if (settings.dashboard_password) {
        payload.dashboard_password = settings.dashboard_password;
      }

      const { error } = await supabase
        .from('settings')
        .update(payload)
        .eq('id', 1);

      if (error) throw error;
      
      setStatus('success');
      addToast('تم حفظ الإعدادات بنجاح! 🎉', 'success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setStatus('error');
      addToast('حدث خطأ أثناء حفظ الإعدادات، يرجى تشغيل سكربت SQL المحدث لتفعيل جميع الميزات ❌', 'error');
      setTimeout(() => setStatus('idle'), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    // Basic validation
    if (settings.dashboard_password && currentPassInput !== settings.dashboard_password) {
      setPassError('كلمة المرور الحالية غير صحيحة');
      return;
    }
    
    if (newPassInput.length < 4) {
      setPassError('كلمة المرور الجديدة يجب أن تكون 4 أحرف على الأقل');
      return;
    }

    setPassError('');
    setShowConfirmModal(true);
  };

  const confirmPasswordChange = async () => {
    setLoading(true);
    setShowConfirmModal(false);
    
    try {
      const { error } = await supabase
        .from('settings')
        .update({ dashboard_password: newPassInput })
        .eq('id', 1);

      if (error) throw error;

      setSettings({ ...settings, dashboard_password: newPassInput });
      setCurrentPassInput('');
      setNewPassInput('');
      
      // Clear session after password update
      sessionStorage.removeItem('dashboard_authorized');
      
      setStatus('success');
      addToast('تم تحديث كلمة المرور بنجاح 🔐', 'success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error('Password Update Error:', err);
      setStatus('error');
      addToast('فشل تحديث كلمة المرور ❌', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupStorage = () => {
    setShowCleanupModal(true);
  };

  const confirmCleanupStorage = async () => {
    setShowCleanupModal(false);
    setIsCleaning(true);
    
    try {
      const buckets = [
        { id: 'payment-screenshots', folder: 'screenshots' },
        { id: 'fulfillment-documents', folder: 'fulfilled' }
      ];

      for (const bucket of buckets) {
        // List all files in the bucket/folder
        const { data: files, error: listError } = await supabase.storage
          .from(bucket.id)
          .list(bucket.folder);

        if (listError) {
          console.warn(`Error listing bucket ${bucket.id}:`, listError);
          continue;
        }

        if (files && files.length > 0) {
          const paths = files.map(f => `${bucket.folder}/${f.name}`);
          const { error: removeError } = await supabase.storage
            .from(bucket.id)
            .remove(paths);

          if (removeError) throw removeError;
        }
      }

      addToast('تم تنظيف سعة التخزين وحذف جميع الصور والمستندات بنجاح 🗑️', 'success');
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error('Error cleaning up storage:', err);
      addToast('حدث خطأ أثناء تنظيف الملفات ❌', 'error');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    } finally {
      setIsCleaning(false);
    }
  };

  const fetchLiveRates = async () => {
    try {
      const usdRes = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const usdData = await usdRes.json();
      const usdRate = usdData.rates.EGP;
      
      const sarRes = await fetch('https://api.exchangerate-api.com/v4/latest/SAR');
      const sarData = await sarRes.json();
      const sarRate = sarData.rates.EGP;
      
      setSettings({
        ...settings,
        usd_rate: Number(usdRate.toFixed(2)),
        sar_rate: Number(sarRate.toFixed(2))
      });
      
      addToast('تم جلب الأسعار التلقائية بنجاح', 'success');
    } catch (e) {
      addToast('حدث خطأ أثناء جلب أسعار الصرف', 'error');
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
      </div>
    );
  }

  const tabs = [
    { id: 'general' as SettingTab, label: 'إعدادات عامة', icon: Globe },
    ...(isOwner ? [{ id: 'payments' as SettingTab, label: 'إعدادات الدفع', icon: Wallet }] : []),
    ...(isOwner ? [{ id: 'security' as SettingTab, label: 'الأمان', icon: ShieldCheck }] : []),
    { id: 'notifications' as SettingTab, label: 'الإشعارات', icon: Bell },
    { id: 'appearance' as SettingTab, label: 'المظهر', icon: Palette },
    { id: 'accessibility' as SettingTab, label: 'إمكانية الوصول', icon: Contrast },
    { id: 'links' as SettingTab, label: 'الروابط والتواصل', icon: Link2 },
    { id: 'pages' as SettingTab, label: 'محتوى الصفحات', icon: Type },
  ];

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500" dir="rtl">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">إعدادات الموقع</h1>
        <p className="text-zinc-500 font-medium">التحكم في إعدادات المتجر العامة والهوية والنظام</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation Sidebar */}
        <div className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id 
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                : 'text-zinc-500 hover:bg-zinc-100 dark:bg-[#1a1d24] hover:text-zinc-900 dark:text-white'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="md:col-span-2 space-y-6">
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#1a1d24] p-8 rounded-3xl border border-zinc-100 shadow-sm space-y-6"
          >
            {activeTab === 'general' && (
              <>
                <h3 className="font-black text-zinc-900 dark:text-white text-lg">المعلومات الأساسية</h3>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-zinc-500 uppercase tracking-wider">اسم المتجر</label>
                    <input 
                      type="text" 
                      value={settings.store_name}
                      onChange={(e) => setSettings({...settings, store_name: e.target.value})}
                      className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-600/10 focus:border-red-600 transition-all text-right"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-zinc-500 uppercase tracking-wider">وصف الموقع (SEO)</label>
                    <textarea 
                      rows={3}
                      value={settings.store_description}
                      onChange={(e) => setSettings({...settings, store_description: e.target.value})}
                      className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-600/10 focus:border-red-600 transition-all resize-none text-right"
                    ></textarea>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-zinc-500 uppercase tracking-wider">بريد الدعم</label>
                      <input 
                        type="email" 
                        value={settings.support_email}
                        onChange={(e) => setSettings({...settings, support_email: e.target.value})}
                        className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-600/10 focus:border-red-600 transition-all text-right"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-zinc-500 uppercase tracking-wider">محفظة Crypto</label>
                      <input 
                        type="text" 
                        placeholder="USDT / BTC Address"
                        value={settings.crypto_wallet_address}
                        onChange={(e) => setSettings({...settings, crypto_wallet_address: e.target.value})}
                        className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-600/10 focus:border-red-600 transition-all text-right"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-zinc-100 pt-6 mt-6 space-y-4">
                  <h3 className="font-black text-zinc-900 dark:text-white text-lg flex items-center gap-2">
                    <span>🪙 نظام عملات روبوكس الهدية (Robux)</span>
                  </h3>
                  <p className="text-xs text-zinc-400 font-bold leading-normal">تحكم بكافة تفاصيل برنامج مكافآت عملات Robux الموزعة تلقائياً عند طلب المنتجات.</p>
                  
                  {!hasRoboCoinsColumns ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs font-bold leading-relaxed text-right space-y-2">
                      <p className="font-black text-amber-950 flex items-center gap-1.5">
                        <span>⚠️ ميزة Robux الرقمية بحاجة لخادم قاعدة بيانات محدث</span>
                      </p>
                      <p>
                        لقد قمنا بإضافة هيكلية تتبع وإدارة رصيد بونص الـ Robux التلقائي بقاعدة البيانات. لتفعيل هذه الخصائص بالكامل وحفظ أرصدة البونص، يرجى نسخ سكربت SQL المرفق بالملف <code className="bg-amber-100 px-1.5 py-0.5 rounded text-[10px] font-mono">supabase_setup.sql</code> بجدول الإعدادات وتشغيله في **SQL Editor** الخاص بك في حساب Supabase لتنفيذ الـ ALTER TABLE للأعمدة.
                      </p>
                      <p className="text-[10px] text-amber-700">يمكنك تعديل وحفظ كافة الإعدادات والخيارات الأخرى للتحويل ومظهر المتجر بشكل آمن دون التأثر بهذا التنبيه.</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-[#0f1115] border border-zinc-150 rounded-2xl">
                        <div>
                          <span className="text-xs font-black text-zinc-700 block text-right">تفعيل نظام Robux</span>
                          <span className="text-[10px] text-zinc-400 font-bold block mt-0.5 text-right">عند تعطيله، لن تظهر بونص ومكافآت عملات Robux للعملاء على المنتجات والموقع الرئيسي.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSettings({...settings, robo_coins_enabled: !settings.robo_coins_enabled})}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            settings.robo_coins_enabled ? 'bg-red-650' : 'bg-zinc-200 dark:bg-zinc-800'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-[#1a1d24] transition-transform ${
                              settings.robo_coins_enabled ? 'translate-x-1' : 'translate-x-6'
                            }`}
                          />
                        </button>
                      </div>

                      {settings.robo_coins_enabled && (
                        <div className="p-4 bg-red-50/20 border border-red-100/50 rounded-2xl space-y-4">
                          <div className="space-y-1.5 text-right">
                            <label className="text-xs font-black text-red-800">إجمالي مخزون عملات Robux المتوفر في النظام لمكافآت بونص الشراء</label>
                            <input 
                              type="number" 
                              value={settings.robo_coins_balance}
                              onChange={(e) => setSettings({...settings, robo_coins_balance: parseInt(e.target.value) || 0})}
                              className="w-full bg-white dark:bg-[#1a1d24] border border-zinc-200 rounded-xl px-4 py-3 text-sm font-black focus:outline-none focus:ring-2 focus:ring-red-650/10 focus:border-red-600 transition-all text-center font-mono"
                              placeholder="مثال: 5000"
                            />
                            <p className="text-[10px] text-zinc-400 font-bold text-center leading-normal">تنقص هذه القيمة تلقائياً من الإجمالي بمقدار بونص المكافأة المحدد لكل منتج تم تأكيده وتسليمه بنجاح.</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}

            {activeTab === 'payments' && isOwner && (
              <>
                <h3 className="font-black text-zinc-900 dark:text-white text-lg">بوابات الدفع والحسابات</h3>
                <div className="space-y-8">
                  {/* Currency Rates Configuration */}
                  <div className="space-y-4 p-6 bg-red-50/30 rounded-[2rem] border border-red-100/50">
                    <h4 className="font-black text-zinc-900 dark:text-white text-sm mb-2 flex items-center gap-2">
                       <Globe size={16} className="text-red-600" />
                       إعدادات أسعار صرف العملات
                    </h4>
                    <p className="text-xs text-zinc-500 font-bold mb-4">حدد قيمة العملات مقابل الجنيه المصري (العملة الأساسية). سيتم تحديث أسعار المنتجات تلقائياً بناءً على هذه القيم.</p>
                    
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-[#1a1d24] rounded-2xl border border-zinc-100 shadow-sm mb-4">
                      <div>
                        <span className="text-xs font-black text-zinc-700 block text-right">المزامنة التلقائية مع جوجل</span>
                        <span className="text-[10px] text-zinc-400 font-bold block mt-0.5 text-right">تحديث أسعار الصرف تلقائياً من الإنترنت (يتم تطبيقها على المتجر مباشرة).</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettings({...settings, auto_currency: !settings.auto_currency})}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          settings.auto_currency ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-800'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.auto_currency ? '-translate-x-6' : '-translate-x-1'
                        }`} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-white dark:bg-[#1a1d24] rounded-2xl border border-zinc-100 shadow-sm">
                        <label className="text-xs font-black text-zinc-700 block mb-2">الدولار الأمريكي (USD)</label>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-zinc-400">1 دولار =</span>
                          <input 
                            type="number" 
                            value={settings.usd_rate}
                            onChange={(e) => setSettings({...settings, usd_rate: Number(e.target.value)})}
                            className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm font-bold text-left focus:outline-none focus:border-red-600"
                            min="0"
                            step="0.01"
                            disabled={settings.auto_currency}
                          />
                          <span className="text-xs font-bold text-zinc-400">ج.م</span>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-white dark:bg-[#1a1d24] rounded-2xl border border-zinc-100 shadow-sm">
                        <label className="text-xs font-black text-zinc-700 block mb-2">الريال السعودي (SAR)</label>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-zinc-400">1 ريال =</span>
                          <input 
                            type="number" 
                            value={settings.sar_rate}
                            onChange={(e) => setSettings({...settings, sar_rate: Number(e.target.value)})}
                            className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm font-bold text-left focus:outline-none focus:border-red-600"
                            min="0"
                            step="0.01"
                            disabled={settings.auto_currency}
                          />
                          <span className="text-xs font-bold text-zinc-400">ج.م</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={fetchLiveRates}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-black hover:opacity-90 transition-opacity"
                      >
                        <Globe size={14} />
                        تحديث الأسعار الآن (جوجل)
                      </button>
                    </div>
                  </div>

                  {/* Shipping Fee Configuration */}
                  <div className="space-y-4 p-6 bg-red-50/30 rounded-[2rem] border border-red-100/50">
                    <h4 className="font-black text-zinc-900 dark:text-white text-sm mb-2 flex items-center gap-2">
                       <Smartphone size={16} className="text-red-600" />
                       إعدادات رسوم المعالجة والشحن
                    </h4>
                    
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-[#1a1d24] rounded-2xl border border-zinc-100 shadow-sm">
                      <div>
                        <span className="text-xs font-black text-zinc-700 block text-right">جعل الشحن مجاني دائماً</span>
                        <span className="text-[10px] text-zinc-400 font-bold block mt-0.5 text-right">عند تفعيله، سيتم إلغاء كافة رسوم المعالجة والشحن.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettings({...settings, is_shipping_free: !settings.is_shipping_free})}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          settings.is_shipping_free ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-800'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-[#1a1d24] transition-transform ${
                            settings.is_shipping_free ? 'translate-x-1' : 'translate-x-6'
                          }`}
                        />
                      </button>
                    </div>

                    {!settings.is_shipping_free && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mr-2">قيمة رسوم المعالجة ثابتة</label>
                          <input 
                            type="number" 
                            value={settings.shipping_fee}
                            onChange={(e) => setSettings({...settings, shipping_fee: parseFloat(e.target.value) || 0})}
                            className="w-full bg-white dark:bg-[#1a1d24] border border-zinc-100 rounded-xl px-4 py-3 text-sm font-black focus:outline-none focus:border-red-600 transition-all text-right"
                            placeholder="مثال: 15.00"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mr-2">شحن مجاني عند تجاوز مبلغ (Threshold)</label>
                          <input 
                            type="number" 
                            value={settings.free_shipping_threshold}
                            onChange={(e) => setSettings({...settings, free_shipping_threshold: parseFloat(e.target.value) || 0})}
                            className="w-full bg-white dark:bg-[#1a1d24] border border-zinc-100 rounded-xl px-4 py-3 text-sm font-black focus:outline-none focus:border-red-600 transition-all text-right"
                            placeholder="مثال: 1000"
                          />
                          <p className="text-[10px] text-zinc-400 font-bold pr-2 leading-tight">سيتم إلغاء الرسوم تلقائياً إذا تجاوز إجمالي السلة هذا المبلغ.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Digital Accounts Section */}
                  <div className="space-y-4 p-6 bg-zinc-50 dark:bg-[#0f1115] rounded-[2rem] border border-zinc-100">
                    <h4 className="font-black text-zinc-900 dark:text-white text-sm mb-2 flex items-center gap-2">
                       <Wallet size={16} className="text-red-600" />
                       بيانات التحويل اليدوي
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">رقم تليفون كاش</label>
                        <input 
                          type="text" 
                          value={settings.phone_cash_number}
                          onChange={(e) => setSettings({...settings, phone_cash_number: e.target.value})}
                          className="w-full bg-white dark:bg-[#1a1d24] border border-zinc-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-600 transition-all text-right"
                          placeholder="مثال: 01091215161"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">معرف InstaPay</label>
                        <input 
                          type="text" 
                          value={settings.instapay_id}
                          onChange={(e) => setSettings({...settings, instapay_id: e.target.value})}
                          className="w-full bg-white dark:bg-[#1a1d24] border border-zinc-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-600 transition-all text-right"
                          placeholder="مثال: MOKAA@INSTAPAY"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">رقم Fawry</label>
                        <input 
                          type="text" 
                          value={settings.fawry_number}
                          onChange={(e) => setSettings({...settings, fawry_number: e.target.value})}
                          className="w-full bg-white dark:bg-[#1a1d24] border border-zinc-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-600 transition-all text-right"
                          placeholder="مثال: 123456"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Gateway Toggles Section */}
                  <div className="space-y-4">
                    <h4 className="font-black text-zinc-900 dark:text-white text-sm mb-4 px-2 italic">تفعيل / تعطيل بوابات الدفع</h4>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { id: 'enable_visa', label: 'البطاقة الائتمانية (Visa/MC)', icon: CreditCard },
                        { id: 'enable_apple_pay', label: 'Apple Pay', icon: Smartphone },
                        { id: 'enable_phone_cash', label: 'تليفون كاش', icon: Smartphone },
                        { id: 'enable_instapay', label: 'إنستا باي', icon: Smartphone },
                        { id: 'enable_fawry', label: 'فوري كاش', icon: Wallet },
                      ].map((gateway) => (
                        <div key={gateway.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-[#0f1115] rounded-2xl border border-zinc-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#1a1d24] border border-zinc-100 flex items-center justify-center text-zinc-900 dark:text-white shadow-sm">
                              <gateway.icon size={18} />
                            </div>
                            <p className="font-black text-sm text-zinc-900 dark:text-white">{gateway.label}</p>
                          </div>
                          <button 
                            onClick={() => setSettings({...settings, [gateway.id]: !settings[gateway.id as keyof typeof settings]})}
                            className={`w-12 h-6 rounded-full transition-colors relative ${settings[gateway.id as keyof typeof settings] ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-zinc-200 dark:bg-zinc-800'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white dark:bg-[#1a1d24] transition-all ${settings[gateway.id as keyof typeof settings] ? 'left-1' : 'left-7'}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Clean up Assets Section */}
                  <div className="pt-8 border-t border-zinc-100">
                    <h4 className="font-black text-red-600 text-sm mb-4 px-2 italic">إدارة الأصول وتوفير المساحة</h4>
                    <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100 space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="text-right">
                          <p className="font-black text-red-900 text-sm">حذف جميع المرفقات نهائياً</p>
                          <p className="text-[10px] font-bold text-red-700/60 leading-relaxed">
                            سيتم حذف جميع إيصالات التحويل ومستندات الشحن من قاعدة البيانات لتوفير المساحة. تأكد من مراجعة الطلبات المكتملة أولاً.
                          </p>
                        </div>
                        <button 
                          onClick={handleCleanupStorage}
                          disabled={isCleaning}
                          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl text-[12px] font-black shadow-lg shadow-red-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          {isCleaning ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                          تنظيف سعة التخزين
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'security' && isOwner && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-black text-zinc-900 dark:text-white text-lg">إعدادات الأمان</h3>
                  <div className="px-3 py-1 bg-red-50 rounded-full border border-red-100">
                    <span className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center gap-1">
                      <ShieldCheck size={12} />
                      نظام حماية مفعل
                    </span>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Dashboard Password Section */}
                  <div className="space-y-4 p-6 bg-zinc-50 dark:bg-[#0f1115] rounded-[2rem] border border-zinc-100">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-red-100 rounded-xl text-red-600">
                        <Lock size={18} />
                      </div>
                      <div>
                        <h4 className="font-black text-zinc-900 dark:text-white text-sm">كلمة مرور لوحة التحكم</h4>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase">تغيير أو إعداد قفل دخول الإدارة</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {settings.dashboard_password && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mr-2">كلمة المرور الحالية</label>
                          <div className="relative">
                            <input 
                              type={showCurrentPass ? "text" : "password"}
                              placeholder="أدخل كلمة المرور الحالية للتأكيد"
                              value={currentPassInput}
                              onChange={(e) => setCurrentPassInput(e.target.value)}
                              className="w-full bg-white dark:bg-[#1a1d24] border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-600 transition-all text-right" 
                            />
                            <button 
                              onClick={() => setShowCurrentPass(!showCurrentPass)}
                              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                            >
                              {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mr-2">
                          {settings.dashboard_password ? 'كلمة المرور الجديدة' : 'تعيين كلمة مرور جديدة'}
                        </label>
                        <div className="relative">
                          <input 
                            type={showNewPass ? "text" : "password"}
                            placeholder="كلمة مرور قوية (4 أحرف أو أكثر)"
                            value={newPassInput}
                            onChange={(e) => setNewPassInput(e.target.value)}
                            className="w-full bg-white dark:bg-[#1a1d24] border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-600 transition-all text-right" 
                          />
                          <button 
                            onClick={() => setShowNewPass(!showNewPass)}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                          >
                            {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      {passError && (
                        <p className="text-[10px] font-black text-red-600 bg-red-50 p-2 rounded-lg text-center uppercase tracking-widest border border-red-100">
                          {passError}
                        </p>
                      )}

                      <button 
                        onClick={handleUpdatePassword}
                        className="w-full py-3 bg-zinc-900 text-white rounded-xl font-black text-xs hover:bg-black transition-all shadow-lg shadow-zinc-900/10 flex items-center justify-center gap-2"
                      >
                        <ShieldCheck size={16} />
                        تحديث كلمة المرور
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-[#0f1115] rounded-2xl border border-zinc-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
                        <Smartphone size={20} />
                      </div>
                      <div>
                        <p className="font-black text-sm text-zinc-900 dark:text-white">التحقق بخطوتين (2FA)</p>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase">زيادة أمان حساب المدير</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSettings({...settings, enable_2fa: !settings.enable_2fa})}
                      className={`w-12 h-6 rounded-full transition-colors relative ${settings.enable_2fa ? 'bg-red-600' : 'bg-zinc-200 dark:bg-zinc-800'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white dark:bg-[#1a1d24] transition-all ${settings.enable_2fa ? 'left-1' : 'left-7'}`} />
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'notifications' && (
              <>
                <h3 className="font-black text-zinc-900 dark:text-white text-lg">نظام الإشعارات</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-[#0f1115] rounded-2xl border border-zinc-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white">
                        <Mail size={18} />
                      </div>
                      <div>
                        <p className="font-black text-sm text-zinc-900 dark:text-white">إشعارات الطلبات الجديدة</p>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase">استلام تنبيه عند كل عملية شراء</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSettings({...settings, order_notifications: !settings.order_notifications})}
                      className={`w-12 h-6 rounded-full transition-colors relative ${settings.order_notifications ? 'bg-zinc-900' : 'bg-zinc-200 dark:bg-zinc-800'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white dark:bg-[#1a1d24] transition-all ${settings.order_notifications ? 'left-1' : 'left-7'}`} />
                    </button>
                  </div>
                  
                  <div className="p-6 bg-indigo-50/50 border border-indigo-100 rounded-[2rem] space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                          <MessageCircle size={20} />
                        </div>
                        <div>
                          <h4 className="font-black text-indigo-900 text-sm">اختبار اتصال ديسكورد</h4>
                          <p className="text-[10px] text-indigo-700/70 font-bold">تأكد من صحة إعدادات البوت واستقبالك للرسائل</p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/config-check');
                            const data = await res.json();
                            if (res.ok) {
                              const status = `Node: ${data.node_version} | Token: ${data.discord_token_set ? '✅' : '❌'} | ID: ${data.discord_owner_id_set ? '✅' : '❌'} | Fetch: ${data.fetch_available ? '✅' : '❌'}`;
                              addToast(status, 'info');
                            } else {
                              addToast('تعذر جلب بيانات التكوين ❌', 'error');
                            }
                          } catch (e) {
                            addToast('خطأ في الاتصال بالخادم ❌', 'error');
                          }
                        }}
                        className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                        title="فحص حالة الإعدادات"
                      >
                        <ShieldCheck size={18} />
                      </button>
                    </div>
                    
                    <button 
                      onClick={async () => {
                        try {
                          addToast('جاري إرسال رسالة اختبار... 🚀', 'info');
                          const API_BASE = import.meta.env.VITE_API_URL || '';
                          const res = await fetch(`${API_BASE}/api/test-discord`, { method: 'POST' });
                          
                          const contentType = res.headers.get("content-type");
                          if (contentType && contentType.indexOf("application/json") !== -1) {
                            const data = await res.json();
                            if (res.ok) {
                              addToast(`نجح الاتصال! بوت ${data.bot_name} أرسل لك رسالة ✅`, 'success');
                            } else {
                              const errorMessage = data.details || data.message || data.error || 'فشل غير معروف';
                              addToast(`فشل الاختبار: ${errorMessage} ❌`, 'error');
                              console.error('Discord Test API Error:', data);
                            }
                          } else {
                            const textData = await res.text();
                            console.error(`Discord Test HTTP Error (Status: ${res.status}):`, textData);
                            addToast(`خطأ خادم (Status: ${res.status}). يرجى مراجعة الـ Console ❌`, 'error');
                          }
                        } catch (e: any) {
                          console.error('Fetch Exception:', e);
                          addToast(`تعذر الوصول للخادم: ${e.message} ❌`, 'error');
                        }
                      }}
                      className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95"
                    >
                      إرسال رسالة اختبار الآن
                    </button>
                  </div>
                  
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                    <p className="text-xs font-bold text-amber-800 leading-relaxed">
                      يتم إرسال الإشعارات تلقائياً إلى بريد المدير المسجل في النظام. تأكد من تفعيل خيارات التنبيه في متصفحك أيضاً.
                    </p>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'appearance' && (
              <>
                <h3 className="font-black text-zinc-900 dark:text-white text-lg">إعدادات المظهر</h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setSettings({...settings, dark_mode: false})}
                      className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${!settings.dark_mode ? 'border-red-600 bg-red-50/50' : 'border-zinc-100 bg-white dark:bg-[#1a1d24]'}`}
                    >
                      <Sun className={!settings.dark_mode ? 'text-red-600' : 'text-zinc-400'} />
                      <span className="text-sm font-black">الوضع النهاري</span>
                    </button>
                    <button 
                      onClick={() => setSettings({...settings, dark_mode: true})}
                      className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${settings.dark_mode ? 'border-red-600 bg-red-50/50' : 'border-zinc-100 bg-white dark:bg-[#1a1d24]'}`}
                    >
                      <Moon className={settings.dark_mode ? 'text-red-600' : 'text-zinc-400'} />
                      <span className="text-sm font-black">الوضع الليلي</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-wider">اللون الأساسي للهوية</h4>
                    <div className="flex gap-3">
                      {['#dc2626', '#18181b', '#059669', '#2563eb'].map(color => (
                        <div key={color} className="w-8 h-8 rounded-full border-2 border-white ring-2 ring-zinc-100 cursor-pointer transition-transform hover:scale-110" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'accessibility' && (
              <>
                <h3 className="font-black text-zinc-900 dark:text-white text-lg">سهولة الاستخدام</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-[#0f1115] rounded-2xl border border-zinc-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-600">
                        <Contrast size={20} />
                      </div>
                      <div>
                        <p className="font-black text-sm text-zinc-900 dark:text-white">تباين عالي</p>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase">تحسين وضوح النصوص للعناصر</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSettings({...settings, high_contrast: !settings.high_contrast})}
                      className={`w-12 h-6 rounded-full transition-colors relative ${settings.high_contrast ? 'bg-zinc-900' : 'bg-zinc-200 dark:bg-zinc-800'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white dark:bg-[#1a1d24] transition-all ${settings.high_contrast ? 'left-1' : 'left-7'}`} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-wider">حجم الخط الافتراضي</h4>
                    <div className="flex gap-2">
                      {['small', 'medium', 'large'].map(size => (
                        <button 
                          key={size}
                          onClick={() => setSettings({...settings, font_size: size})}
                          className={`flex-1 py-2 rounded-xl text-xs font-black border transition-all ${settings.font_size === size ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white dark:bg-[#1a1d24] text-zinc-500 border-zinc-100 hover:bg-zinc-50 dark:bg-[#0f1115]'}`}
                        >
                          {size === 'small' ? 'صغير' : size === 'medium' ? 'متوسط' : 'كبير'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'links' && (
              <>
                <h3 className="font-black text-zinc-900 dark:text-white text-lg flex items-center gap-2">
                  <Share2 className="text-red-600" size={20} />
                  روابط التواصل والصفحات
                </h3>
                
                <div className="space-y-8">
                  {/* Social Media Section */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider pr-2">منصات التواصل الاجتماعي</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Discord */}
                      <div className="space-y-2 p-4 bg-zinc-50 dark:bg-[#0f1115] rounded-2xl border border-zinc-100">
                        <div className="flex items-center gap-2 mb-1">
                          <svg className="w-4 h-4 text-indigo-500" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                          </svg>
                          <span className="text-xs font-black text-zinc-700">ديسكورد (Discord)</span>
                        </div>
                        <input 
                          type="text" 
                          placeholder="الرابط الكامل للسيرفر: https://discord.gg/..."
                          value={settings.instagram_url}
                          onChange={(e) => setSettings({...settings, instagram_url: e.target.value})}
                          className="w-full bg-white dark:bg-[#1a1d24] border border-zinc-100 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-red-600"
                        />
                      </div>

                      {/* TikTok */}
                      <div className="space-y-2 p-4 bg-zinc-50 dark:bg-[#0f1115] rounded-2xl border border-zinc-100">
                        <div className="flex items-center gap-2 mb-1">
                          <Share2 size={16} className="text-zinc-900 dark:text-white" />
                          <span className="text-xs font-black text-zinc-700">تيك توك (TikTok)</span>
                        </div>
                        <input 
                          type="text" 
                          placeholder="المعرف: 1m"
                          value={settings.tiktok_handle}
                          onChange={(e) => setSettings({...settings, tiktok_handle: e.target.value})}
                          className="w-full bg-white dark:bg-[#1a1d24] border border-zinc-100 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-red-600"
                        />
                        <input 
                          type="text" 
                          placeholder="الرابط الكامل: https://tiktok.com/@..."
                          value={settings.tiktok_url}
                          onChange={(e) => setSettings({...settings, tiktok_url: e.target.value})}
                          className="w-full bg-white dark:bg-[#1a1d24] border border-zinc-100 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-red-600"
                        />
                      </div>

                      {/* Facebook */}
                      <div className="space-y-2 p-4 bg-zinc-50 dark:bg-[#0f1115] rounded-2xl border border-zinc-100">
                        <div className="flex items-center gap-2 mb-1">
                          <Facebook size={16} className="text-blue-600" />
                          <span className="text-xs font-black text-zinc-700">فيسبوك (Facebook)</span>
                        </div>
                        <input 
                          type="text" 
                          placeholder="المعرف: GamesStore"
                          value={settings.facebook_handle}
                          onChange={(e) => setSettings({...settings, facebook_handle: e.target.value})}
                          className="w-full bg-white dark:bg-[#1a1d24] border border-zinc-100 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-red-600"
                        />
                        <input 
                          type="text" 
                          placeholder="الرابط الكامل: https://facebook.com/..."
                          value={settings.facebook_url}
                          onChange={(e) => setSettings({...settings, facebook_url: e.target.value})}
                          className="w-full bg-white dark:bg-[#1a1d24] border border-zinc-100 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-red-600"
                        />
                      </div>

                      {/* WhatsApp */}
                      <div className="space-y-2 p-4 bg-zinc-50 dark:bg-[#0f1115] rounded-2xl border border-zinc-100">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageCircle size={16} className="text-emerald-600" />
                          <span className="text-xs font-black text-zinc-700">واتساب (WhatsApp)</span>
                        </div>
                        <input 
                          type="text" 
                          placeholder="رقم الواتساب أو الرابط (مثال: mokaa3)"
                          value={settings.whatsapp_number}
                          onChange={(e) => setSettings({...settings, whatsapp_number: e.target.value})}
                          className="w-full bg-white dark:bg-[#1a1d24] border border-zinc-100 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-red-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Details Section */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider pr-2">بيانات الاتصال المباشر</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-zinc-500 mr-2">رقم الهاتف الأساسي</label>
                        <input 
                          type="text" 
                          value={settings.phone_primary}
                          onChange={(e) => setSettings({...settings, phone_primary: e.target.value})}
                          className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-600"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-zinc-500 mr-2">رقم الهاتف الثانوي</label>
                        <input 
                          type="text" 
                          value={settings.phone_secondary}
                          onChange={(e) => setSettings({...settings, phone_secondary: e.target.value})}
                          className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Navigation Display Section */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider pr-2">إظهار/إخفاء روابط التنقل</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { id: 'show_about_link', label: 'صفحة "من نحن"' },
                        { id: 'show_terms_link', label: 'صفحة "الشروط والأحكام"' },
                        { id: 'show_privacy_link', label: 'صفحة "سياسة الخصوصية"' },
                        { id: 'show_help_link', label: 'صفحة "المساعدة"' },
                        { id: 'show_contact_link', label: 'صفحة "اتصل بنا"' },
                      ].map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-[#0f1115] rounded-2xl border border-zinc-100">
                          <span className="text-xs font-black text-zinc-900 dark:text-white">{item.label}</span>
                          <button 
                            onClick={() => setSettings({...settings, [item.id as keyof typeof settings]: !settings[item.id as keyof typeof settings]})}
                            className={`w-12 h-6 rounded-full transition-colors relative ${settings[item.id as keyof typeof settings] ? 'bg-red-600' : 'bg-zinc-200 dark:bg-zinc-800'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white dark:bg-[#1a1d24] transition-all ${settings[item.id as keyof typeof settings] ? 'left-1' : 'left-7'}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'pages' && (
              <>
                <h3 className="font-black text-zinc-900 dark:text-white text-lg flex items-center gap-2">
                  <Type className="text-red-600" size={20} />
                  إدارة محتوى الصفحات
                </h3>
                
                <div className="space-y-6">
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                    <p className="text-xs font-bold text-blue-800 leading-relaxed">
                      هنا يمكنك التحكم في النص المعروض داخل الصفحات الإضافية للموقع. تدعم هذه الحقول النصوص الطويلة.
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* About Page Content */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-zinc-500 uppercase tracking-wider mr-2">محتوى صفحة "من نحن"</label>
                      <textarea 
                        rows={5}
                        placeholder="اكتب نبذة عن المتجر وأهدافه..."
                        value={settings.about_content}
                        onChange={(e) => setSettings({...settings, about_content: e.target.value})}
                        className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-600 transition-all resize-none text-right"
                      ></textarea>
                    </div>

                    {/* Terms Page Content */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-zinc-500 uppercase tracking-wider mr-2">محتوى صفحة "الشروط والأحكام"</label>
                      <textarea 
                        rows={5}
                        placeholder="اكتب شروط الاستخدام والقوانين المتبعة..."
                        value={settings.terms_content}
                        onChange={(e) => setSettings({...settings, terms_content: e.target.value})}
                        className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-600 transition-all resize-none text-right"
                      ></textarea>
                    </div>

                    {/* Privacy Page Content */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-zinc-500 uppercase tracking-wider mr-2">محتوى صفحة "سياسة الخصوصية"</label>
                      <textarea 
                        rows={5}
                        placeholder="كيفية التعامل مع بيانات العملاء..."
                        value={settings.privacy_content}
                        onChange={(e) => setSettings({...settings, privacy_content: e.target.value})}
                        className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-600 transition-all resize-none text-right"
                      ></textarea>
                    </div>

                    {/* Help Page Content */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-zinc-500 uppercase tracking-wider mr-2">محتوى صفحة "المساعدة"</label>
                      <textarea 
                        rows={5}
                        placeholder="إرشادات عامة وأجوبة للأسئلة الشائعة..."
                        value={settings.help_content}
                        onChange={(e) => setSettings({...settings, help_content: e.target.value})}
                        className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-600 transition-all resize-none text-right"
                      ></textarea>
                    </div>

                    {/* Contact Page Content */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-zinc-500 uppercase tracking-wider mr-2">نص صفحة "اتصل بنا"</label>
                      <textarea 
                        rows={3}
                        placeholder="نص توضيحي لطرق التواصل..."
                        value={settings.contact_content}
                        onChange={(e) => setSettings({...settings, contact_content: e.target.value})}
                        className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-zinc-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-600 transition-all resize-none text-right"
                      ></textarea>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Footer Actions */}
            <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <AnimatePresence mode="wait">
                   {status === 'success' && (
                     <motion.div 
                       initial={{ opacity: 0, scale: 0.5 }} 
                       animate={{ opacity: 1, scale: 1 }} 
                       exit={{ opacity: 0 }}
                       className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg"
                     >
                       <CheckCircle2 size={16} />
                       <span className="text-[10px] font-black uppercase">تم الحفظ بنجاح</span>
                     </motion.div>
                   )}
                   {status === 'error' && (
                     <motion.div 
                       initial={{ opacity: 0, scale: 0.5 }} 
                       animate={{ opacity: 1, scale: 1 }} 
                       exit={{ opacity: 0 }}
                       className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1.5 rounded-lg"
                     >
                       <XCircle size={16} />
                       <span className="text-[10px] font-black uppercase">فشل في الحفظ</span>
                     </motion.div>
                   )}
                 </AnimatePresence>
              </div>
              <button 
                onClick={handleSave}
                disabled={loading}
                className="bg-red-600 text-white font-black px-6 py-3 rounded-xl hover:bg-red-700 transition-all flex items-center gap-2 shadow-lg shadow-red-600/20 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
                حفظ الإعدادات
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#1a1d24] rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
              dir="rtl"
            >
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-red-50 rounded-full blur-3xl opacity-50"></div>
              
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mx-auto shadow-inner">
                  <ShieldCheck size={32} />
                </div>
                
                <div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white">تأكيد التغيير</h3>
                  <p className="text-sm text-zinc-500 font-bold mt-1 leading-relaxed">
                    هل أنت متأكد من رغبتك في تغيير كلمة مرور لوحة التحكم؟ سيتم تسجيل خروجك وتحتاج لإدخال الكلمة الجديدة.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={confirmPasswordChange}
                    className="flex-1 bg-zinc-900 text-white font-black h-12 rounded-xl hover:bg-black transition-all"
                  >
                    نعم، تأكيد
                  </button>
                  <button 
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 bg-zinc-100 dark:bg-[#1a1d24] text-zinc-500 font-black h-12 rounded-xl hover:bg-zinc-200 dark:bg-zinc-800 transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cleanup Confirmation Modal */}
      <AnimatePresence>
        {showCleanupModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCleanupModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#1a1d24] rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
              dir="rtl"
            >
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-red-50 rounded-full blur-3xl opacity-50"></div>
              
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mx-auto shadow-inner relative z-10">
                  <XCircle size={32} />
                </div>
                
                <div className="relative z-10">
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white">حذف المرفقات</h3>
                  <p className="text-sm text-zinc-500 font-bold mt-2 leading-relaxed">
                    هل أنت متأكد من حذف جميع إيصالات التحويل ومستندات الشحن؟ <br />
                    <span className="text-red-500 font-black">هذا الإجراء لا يمكن التراجع عنه!</span>
                  </p>
                </div>

                <div className="flex gap-3 relative z-10">
                  <button 
                    onClick={confirmCleanupStorage}
                    className="flex-1 bg-red-600 text-white font-black h-12 rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                  >
                    نعم، حذف نهائي
                  </button>
                  <button 
                    onClick={() => setShowCleanupModal(false)}
                    className="flex-1 bg-zinc-100 dark:bg-[#1a1d24] text-zinc-500 font-black h-12 rounded-xl hover:bg-zinc-200 dark:bg-zinc-800 transition-all"
                  >
                    تراجع
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


