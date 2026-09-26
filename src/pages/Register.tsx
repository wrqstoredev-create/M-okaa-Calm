/**
 * Register.tsx — GamePay
 *
 * Features over original:
 * • AuthLayout split-screen wrapper
 * • Google & Discord OAuth buttons (same as Login)
 * • Arabic field validation (name, email format, password rules)
 * • Password strength meter (4 levels: ضعيفة / متوسطة / جيدة / قوية)
 * • Show/hide password for both password fields
 * • Confirm-password match check in real-time
 * • Success state: shows confirmation message before redirecting
 * • All original signUp + OAuth logic preserved
 */

import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api/authApi';
import { motion, AnimatePresence } from 'motion/react';
import {
  Eye, EyeOff, Mail, Lock, User, AlertCircle,
  Loader2, CheckCircle2, ShieldCheck,
} from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import RippleButton from '../components/ui/RippleButton';

/* ── Error mapper ────────────────────────────────────────────────────────── */
function mapError(msg: string): string {
  if (msg.includes('already registered') || msg.includes('User already registered'))
    return 'هذا البريد الإلكتروني مسجّل بالفعل — جرّب تسجيل الدخول';
  if (msg.includes('Password should be'))
    return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
  if (msg.includes('Invalid email'))
    return 'صيغة البريد الإلكتروني غير صحيحة';
  if (msg.includes('Too many requests'))
    return 'محاولات كثيرة — يرجى الانتظار قليلاً';
  if (msg.includes('network'))
    return 'خطأ في الاتصال — تحقق من الإنترنت';
  return msg;
}

/* ── Password strength ───────────────────────────────────────────────────── */
type StrengthLevel = 0 | 1 | 2 | 3 | 4;

function calcStrength(pw: string): StrengthLevel {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8)          score++;
  if (pw.length >= 12)         score++;
  if (/[A-Z]/.test(pw))       score++;
  if (/[0-9]/.test(pw))       score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(4, score) as StrengthLevel;
}

const STRENGTH_CONFIG: Record<StrengthLevel, { label: string; color: string; barColor: string }> = {
  0: { label: '',       color: '',                   barColor: 'bg-gray-200' },
  1: { label: 'ضعيفة', color: 'text-red-600',       barColor: 'bg-red-500' },
  2: { label: 'متوسطة',color: 'text-amber-600',     barColor: 'bg-amber-500' },
  3: { label: 'جيدة',  color: 'text-blue-600',      barColor: 'bg-blue-500' },
  4: { label: 'قوية ✓', color: 'text-emerald-600',  barColor: 'bg-emerald-500' },
};

function PasswordStrengthMeter({ password }: { password: string }) {
  const level = calcStrength(password);
  const cfg   = STRENGTH_CONFIG[level];
  if (!password) return null;
  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((bar) => (
          <div key={bar} className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: bar <= level ? '100%' : '0%' }}
              transition={{ duration: 0.25, delay: bar * 0.06 }}
              className={`h-full rounded-full ${bar <= level ? cfg.barColor : ''}`}
            />
          </div>
        ))}
      </div>
      <p className={`text-[10px] font-black text-right ${cfg.color}`}>
        قوة كلمة المرور: {cfg.label}
      </p>
    </div>
  );
}

/* ── Field wrapper ───────────────────────────────────────────────────────── */
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

/* ── Google / Discord icons ──────────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.054-3.03.076.076 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Register Page
═══════════════════════════════════════════════════════════════════════════ */
export default function Register() {
  const navigate = useNavigate();
  const [loading,   setLoading]   = useState(false);
  const [oauthLoad, setOauthLoad] = useState<'google' | 'discord' | null>(null);
  const [serverErr, setServerErr] = useState<string | null>(null);
  const [success,   setSuccess]   = useState(false);
  const [shakeKey,  setShakeKey]  = useState(0);

  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
  });
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({});

  const strength = useMemo(() => calcStrength(form.password), [form.password]);

  /* ── Validation ─────────────────────────────────────────────────────── */
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim())
      errs.fullName = 'الاسم الكامل مطلوب';
    else if (form.fullName.trim().length < 3)
      errs.fullName = 'الاسم يجب أن يكون 3 أحرف على الأقل';
    if (!form.email.trim())
      errs.email = 'البريد الإلكتروني مطلوب';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'صيغة البريد الإلكتروني غير صحيحة';
    if (!form.password)
      errs.password = 'كلمة المرور مطلوبة';
    else if (form.password.length < 6)
      errs.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    else if (strength < 2)
      errs.password = 'كلمة المرور ضعيفة جداً — أضف أرقاماً أو رموزاً';
    if (!form.confirmPassword)
      errs.confirmPassword = 'يرجى تأكيد كلمة المرور';
    else if (form.password !== form.confirmPassword)
      errs.confirmPassword = 'كلمتا المرور غير متطابقتين';
    return errs;
  };

  /* ── Submit ─────────────────────────────────────────────────────────── */
  const handleRegister = async (e: React.FormEvent) => {
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
      const data = await authApi.signUp(form.email.trim(), form.password, form.fullName.trim());
      if (data.user) {
        if (data.user.identities?.length === 0 || !data.session) {
          setSuccess(true);
        } else {
          navigate('/');
        }
      }
    } catch (err: any) {
      setServerErr(mapError(err.message || 'فشل إنشاء الحساب'));
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
      setServerErr(mapError(err.message || 'فشل التسجيل'));
      setOauthLoad(null);
    }
  };

  /* ── Success state ──────────────────────────────────────────────────── */
  if (success) {
    return (
      <AuthLayout>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 py-8"
          dir="rtl"
        >
          <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={40} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">
              تم إنشاء حسابك بنجاح! 🎉
            </h2>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs mx-auto">
              تحقق من بريدك الإلكتروني <strong className="text-gray-800 dark:text-gray-200">{form.email}</strong> وانقر على رابط التأكيد لتفعيل حسابك.
            </p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 rounded-2xl p-4 text-right">
            <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
              💡 لم يصلك البريد؟ تحقق من مجلد Spam أو الرسائل غير المرغوب فيها.
            </p>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white font-black text-sm px-8 py-4 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-red-700/20"
          >
            العودة لتسجيل الدخول
          </Link>
        </motion.div>
      </AuthLayout>
    );
  }

  /* ── Form render ────────────────────────────────────────────────────── */
  return (
    <AuthLayout>
      <div dir="rtl">
        {/* Header */}
        <div className="mb-7 text-right">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">
            إنشاء حساب جديد 🚀
          </h2>
          <p className="text-sm font-bold text-gray-400 mt-1">
            انضم الآن واستمتع بأفضل عروض الشحن
          </p>
        </div>

        {/* Server error */}
        <AnimatePresence>
          {serverErr && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-5 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-2xl"
            >
              <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-red-700 leading-relaxed">{serverErr}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Google (primary) ─────────────────────────────────────── */}
        <button
          onClick={() => signInWithProvider('google')}
          disabled={!!oauthLoad || loading}
          className={[
            'w-full min-h-[52px] flex items-center justify-center gap-3',
            'bg-white dark:bg-[#0f1115]',
            'border-2 border-gray-200 dark:border-gray-700',
            'hover:border-gray-300 dark:hover:border-gray-500',
            'text-gray-800 dark:text-gray-100 font-black text-sm',
            'rounded-2xl transition-all active:scale-[0.98] shadow-sm hover:shadow-md',
            'disabled:opacity-50',
          ].join(' ')}
        >
          {oauthLoad === 'google' ? <Loader2 size={20} className="animate-spin text-gray-400" /> : <GoogleIcon />}
          التسجيل باستخدام Google
        </button>

        {/* Discord */}
        <button
          onClick={() => signInWithProvider('discord')}
          disabled={!!oauthLoad || loading}
          className="w-full min-h-[48px] flex items-center justify-center gap-3 mt-3 bg-[#5865F2] hover:bg-[#4752c4] text-white font-black text-sm rounded-2xl transition-all active:scale-[0.98] shadow-sm disabled:opacity-50"
        >
          {oauthLoad === 'discord' ? <Loader2 size={18} className="animate-spin" /> : <DiscordIcon />}
          التسجيل باستخدام Discord
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-white/10" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white dark:bg-[#0c0c10] px-4 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              أو إنشاء حساب بالبريد
            </span>
          </div>
        </div>

        {/* ── Form ────────────────────────────────────────────────── */}
        <motion.form
          key={shakeKey}
          animate={shakeKey > 0 ? { x: [0, -8, 8, -5, 5, 0] } : {}}
          transition={{ duration: 0.4 }}
          onSubmit={handleRegister}
          className="space-y-4"
          noValidate
        >
          {/* Full name */}
          <Field label="الاسم الكامل" icon={<User size={13} />} error={fieldErr.fullName}>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              onFocus={() => setFieldErr(prev => ({ ...prev, fullName: '' }))}
              placeholder="أحمد محمد"
              className={[
                'w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl py-3.5 px-4 text-sm font-bold',
                'focus:outline-none focus:border-red-500 dark:focus:border-red-500 focus:shadow-[0_0_15px_rgba(255,32,64,0.25)] transition-all placeholder:text-gray-400',
                fieldErr.fullName
                  ? 'border-red-500 bg-red-50/30 dark:bg-red-950/20'
                  : '',
              ].join(' ')}
            />
          </Field>

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
                'w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl py-3.5 px-4 text-sm font-bold',
                'focus:outline-none focus:border-red-500 dark:focus:border-red-500 focus:shadow-[0_0_15px_rgba(255,32,64,0.25)] transition-all placeholder:text-gray-400 text-left',
                fieldErr.email
                  ? 'border-red-500 bg-red-50/30 dark:bg-red-950/20'
                  : '',
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
                  'w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl py-3.5 pl-12 pr-4 text-sm font-bold',
                  'focus:outline-none focus:border-red-500 dark:focus:border-red-500 focus:shadow-[0_0_15px_rgba(255,32,64,0.25)] transition-all placeholder:text-gray-400 text-left',
                  fieldErr.password
                    ? 'border-red-500 bg-red-50/30 dark:bg-red-950/20'
                    : '',
                ].join(' ')}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                tabIndex={-1}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Strength meter */}
            <PasswordStrengthMeter password={form.password} />
          </Field>

          {/* Confirm password */}
          <Field label="تأكيد كلمة المرور" icon={<ShieldCheck size={13} />} error={fieldErr.confirmPassword}>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                onFocus={() => setFieldErr(prev => ({ ...prev, confirmPassword: '' }))}
                placeholder="••••••••"
                dir="ltr"
                className={[
                  'w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl py-3.5 pl-12 pr-4 text-sm font-bold',
                  'focus:outline-none focus:border-red-500 dark:focus:border-red-500 focus:shadow-[0_0_15px_rgba(255,32,64,0.25)] transition-all placeholder:text-gray-400 text-left',
                  fieldErr.confirmPassword
                    ? 'border-red-500 bg-red-50/30 dark:bg-red-950/20'
                    : form.confirmPassword && form.confirmPassword === form.password
                      ? 'border-emerald-500 focus:border-emerald-500'
                      : '',
                ].join(' ')}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                tabIndex={-1}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              {/* Match check indicator */}
              {form.confirmPassword && form.confirmPassword === form.password && (
                <CheckCircle2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />
              )}
            </div>
          </Field>

          {/* Terms note */}
          <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 leading-relaxed text-right">
            بالتسجيل أنت توافق على{' '}
            <Link to="/terms" className="text-red-600 hover:underline">الشروط والأحكام</Link>
            {' '}و{' '}
            <Link to="/privacy" className="text-red-600 hover:underline">سياسة الخصوصية</Link>
          </p>

          {/* Submit */}
          <RippleButton
            type="submit"
            disabled={loading || !!oauthLoad}
            rippleColor="rgba(255, 255, 255, 0.4)"
            className={[
              'w-full min-h-[52px] bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500',
              'text-white font-black text-sm rounded-2xl',
              'transition-all',
              'shadow-[0_4px_20px_rgba(255,32,64,0.35)] hover:shadow-[0_0_25px_rgba(255,32,64,0.65)]',
              'disabled:opacity-50 cursor-pointer',
              'flex items-center justify-center gap-2',
            ].join(' ')}
          >
            {loading ? (
              <><Loader2 size={18} className="animate-spin" /> جاري الإنشاء...</>
            ) : 'إنشاء الحساب 🚀'}
          </RippleButton>
        </motion.form>

        {/* Login link */}
        <p className="mt-6 text-center text-sm font-bold text-gray-500 dark:text-gray-400">
          لديك حساب بالفعل؟{' '}
          <Link to="/login" className="text-red-700 font-black hover:underline">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
