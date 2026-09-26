/**
 * Login.tsx — GamePay
 *
 * Features over original:
 * • AuthLayout split-screen wrapper (banner + form panels)
 * • Google OAuth button — primary / prominent
 * • Discord OAuth button — secondary
 * • Arabic validation messages (email format, min password length)
 * • Show/hide password toggle (Eye icon)
 * • Friendly Supabase error mapping → Arabic
 * • Smooth shake animation on error
 * • All original auth logic (signInWithPassword + signInWithOAuth) preserved
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api/authApi';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';

/* ── Error mapper ────────────────────────────────────────────────────────── */
function mapError(msg: string): string {
  if (msg.includes('Invalid login credentials'))    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
  if (msg.includes('Email not confirmed'))          return 'يرجى تأكيد بريدك الإلكتروني أولاً';
  if (msg.includes('Too many requests'))            return 'محاولات كثيرة — يرجى الانتظار قليلاً';
  if (msg.includes('User not found'))               return 'لا يوجد حساب بهذا البريد الإلكتروني';
  if (msg.includes('network'))                      return 'خطأ في الاتصال — تحقق من الإنترنت';
  return msg;
}

/* ── Field component ─────────────────────────────────────────────────────── */
function Field({
  label, icon, error, children,
}: { label: string; icon: React.ReactNode; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-[11px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-wider">
        <span className="text-red-600">{icon}</span>
        {label}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-red-600 text-[10px] font-bold flex items-center gap-1"
          >
            <AlertCircle size={10} /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Google icon ─────────────────────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

/* ── Discord icon ────────────────────────────────────────────────────────── */
function DiscordIcon() {
  return (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.054-3.03.076.076 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Login Page
═══════════════════════════════════════════════════════════════════════════ */
export default function Login() {
  const navigate = useNavigate();
  const [loading,   setLoading]   = useState(false);
  const [oauthLoad, setOauthLoad] = useState<'google' | 'discord' | null>(null);
  const [serverErr, setServerErr] = useState<string | null>(null);
  const [showPass,  setShowPass]  = useState(false);
  const [shakeKey,  setShakeKey]  = useState(0);

  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({});

  /* ── Validation ─────────────────────────────────────────────────────── */
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.email.trim())
      errs.email = 'البريد الإلكتروني مطلوب';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'صيغة البريد الإلكتروني غير صحيحة';
    if (!form.password)
      errs.password = 'كلمة المرور مطلوبة';
    else if (form.password.length < 6)
      errs.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    return errs;
  };

  /* ── Email login ────────────────────────────────────────────────────── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setFieldErr(errs);
      setShakeKey(k => k + 1);
      return;
    }
    setFieldErr({});
    setLoading(true);
    setServerErr(null);
    try {
      await authApi.signInWithPassword(form.email.trim(), form.password);
      navigate('/');
    } catch (err: any) {
      setServerErr(mapError(err.message || 'خطأ في تسجيل الدخول'));
      setShakeKey(k => k + 1);
    } finally {
      setLoading(false);
    }
  };

  /* ── OAuth ──────────────────────────────────────────────────────────── */
  const signInWithProvider = async (provider: 'google' | 'discord') => {
    setOauthLoad(provider);
    setServerErr(null);
    try {
      await authApi.signInWithOAuth(provider);
    } catch (err: any) {
      setServerErr(mapError(err.message || 'فشل تسجيل الدخول'));
      setOauthLoad(null);
    }
  };

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <AuthLayout>
      <div dir="rtl">
        {/* Header */}
        <div className="mb-8 text-right">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">
            أهلاً بك مجدداً 👋
          </h2>
          <p className="text-sm font-bold text-gray-400 mt-1">
            سجّل دخولك للوصول إلى حسابك ومزاياك
          </p>
        </div>

        {/* Server error banner */}
        <AnimatePresence>
          {serverErr && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-5 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-2xl"
            >
              <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-red-700 dark:text-red-400 leading-relaxed">
                {serverErr}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Google button (primary) ───────────────────────────────── */}
        <button
          onClick={() => signInWithProvider('google')}
          disabled={!!oauthLoad || loading}
          className={[
            'w-full min-h-[52px] flex items-center justify-center gap-3',
            'bg-white dark:bg-[#0f1115]',
            'border-2 border-gray-200 dark:border-gray-700',
            'hover:border-gray-300 dark:hover:border-gray-500',
            'text-gray-800 dark:text-gray-100 font-black text-sm',
            'rounded-2xl transition-all active:scale-[0.98]',
            'shadow-sm hover:shadow-md',
            'disabled:opacity-50',
          ].join(' ')}
        >
          {oauthLoad === 'google'
            ? <Loader2 size={20} className="animate-spin text-gray-400" />
            : <GoogleIcon />
          }
          المتابعة باستخدام Google
        </button>

        {/* Discord button (secondary) */}
        <button
          onClick={() => signInWithProvider('discord')}
          disabled={!!oauthLoad || loading}
          className="w-full min-h-[48px] flex items-center justify-center gap-3 mt-3 bg-[#5865F2] hover:bg-[#4752c4] text-white font-black text-sm rounded-2xl transition-all active:scale-[0.98] shadow-sm disabled:opacity-50"
        >
          {oauthLoad === 'discord'
            ? <Loader2 size={18} className="animate-spin" />
            : <DiscordIcon />
          }
          المتابعة باستخدام Discord
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white dark:bg-[#1a1d24] px-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">
              أو عبر البريد الإلكتروني
            </span>
          </div>
        </div>

        {/* ── Email form ────────────────────────────────────────────── */}
        <motion.form
          key={shakeKey}
          animate={shakeKey > 0 ? { x: [0, -8, 8, -5, 5, 0] } : {}}
          transition={{ duration: 0.4 }}
          onSubmit={handleLogin}
          className="space-y-4"
          noValidate
        >
          {/* Email */}
          <Field label="البريد الإلكتروني" icon={<Mail size={13} />} error={fieldErr.email}>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              onFocus={() => setFieldErr(prev => ({ ...prev, email: '' }))}
              placeholder="example@mail.com"
              dir="ltr"
              className={[
                'w-full bg-gray-50 dark:bg-[#0f1115]',
                'border-2 rounded-xl py-3.5 px-4 text-sm font-bold',
                'focus:outline-none transition-all placeholder:text-gray-300 text-left',
                fieldErr.email
                  ? 'border-red-400 bg-red-50/30 focus:border-red-600'
                  : 'border-transparent focus:border-red-600',
              ].join(' ')}
            />
          </Field>

          {/* Password */}
          <Field label="كلمة المرور" icon={<Lock size={13} />} error={fieldErr.password}>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onFocus={() => setFieldErr(prev => ({ ...prev, password: '' }))}
                placeholder="••••••••"
                dir="ltr"
                className={[
                  'w-full bg-gray-50 dark:bg-[#0f1115]',
                  'border-2 rounded-xl py-3.5 pl-12 pr-4 text-sm font-bold',
                  'focus:outline-none transition-all placeholder:text-gray-300 text-left',
                  fieldErr.password
                    ? 'border-red-400 bg-red-50/30 focus:border-red-600'
                    : 'border-transparent focus:border-red-600',
                ].join(' ')}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Forgot password */}
            <div className="flex justify-start mt-1">
              <Link to="/forgot-password" className="text-[10px] font-black text-red-600 hover:underline">
                نسيت كلمة المرور؟
              </Link>
            </div>
          </Field>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !!oauthLoad}
            className={[
              'w-full min-h-[52px] bg-red-700 hover:bg-red-800',
              'text-white font-black text-sm rounded-2xl',
              'transition-all active:scale-[0.98]',
              'shadow-lg shadow-red-700/20',
              'disabled:opacity-50',
              'flex items-center justify-center gap-2',
            ].join(' ')}
          >
            {loading ? (
              <><Loader2 size={18} className="animate-spin" /> جاري الدخول...</>
            ) : 'تسجيل الدخول'}
          </button>
        </motion.form>

        {/* Register link */}
        <p className="mt-6 text-center text-sm font-bold text-gray-500 dark:text-gray-400">
          ليس لديك حساب؟{' '}
          <Link to="/register" className="text-red-700 font-black hover:underline">
            إنشاء حساب مجاني
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
