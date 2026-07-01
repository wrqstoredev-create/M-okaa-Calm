import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (loginError) throw loginError;
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'خطأ في تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const signInWithProvider = async (provider: 'google' | 'discord') => {
    try {
      setLoading(true);
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول');
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 bg-gray-50 dark:bg-[#0f1115]">
      <div className="bg-white dark:bg-[#1a1d24] w-full max-w-md p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-red-700 tracking-tighter mb-2">Mokaa<span className="text-black dark:text-white">STORE</span></h1>
          <h2 className="text-xl font-bold">دخول الحساب</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">مرحباً بك مجدداً في متجرك المفضل</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 text-xs font-bold rounded-md text-center">
            {error}
          </div>
        )}

        <div className="space-y-3 mb-6">
          <button 
            onClick={() => signInWithProvider('google')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-white dark:bg-[#1a1d24] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold py-2.5 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            الدخول عبر Google
          </button>
          <button 
            onClick={() => signInWithProvider('discord')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#5865F2] text-white font-bold py-2.5 rounded-md hover:bg-[#4752c4] transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.054-3.03.076.076 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.419-2.157 2.419z"/>
            </svg>
            الدخول عبر Discord
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100 dark:border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-[#1a1d24] px-2 text-gray-400">أو عبر البريد</span>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">البريد الإلكتروني</label>
            <input 
              type="email" 
              required
              value={loginData.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-md py-2.5 px-3 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 text-left" 
              placeholder="example@mail.com" 
              dir="ltr"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">كلمة المرور</label>
              <Link to="/forgot-password" className="text-[10px] text-red-700 font-bold hover:underline">نسيت كلمة المرور؟</Link>
            </div>
            <input 
              type="password" 
              required
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-md py-2.5 px-3 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 text-left" 
              placeholder="••••••••" 
              dir="ltr"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-black text-white font-bold py-2.5 rounded-md hover:bg-gray-800 transition-colors mt-2 disabled:opacity-50"
          >
            {loading ? 'جاري الدخول...' : 'دخول'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-500 dark:text-gray-400">ليس لديك حساب؟ </span>
          <Link to="/register" className="text-red-700 font-bold hover:underline">إنشاء حساب جديد</Link>
        </div>
      </div>
    </div>
  );
}
