import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
          emailRedirectTo: window.location.origin
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'فشل إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 bg-gray-50 dark:bg-[#0f1115]">
      <div className="bg-white dark:bg-[#1a1d24] w-full max-w-md p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-red-700 tracking-tighter mb-2">Mokaa<span className="text-black dark:text-white">STORE</span></h1>
          <h2 className="text-xl font-bold">إنشاء حساب جديد</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">انضم إلينا واستمتع بأفضل عروض الشحن</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 text-xs font-bold rounded-md text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">الاسم الكامل</label>
            <input 
              type="text" 
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-md py-2.5 px-3 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700" 
              placeholder="أحمد محمد" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">البريد الإلكتروني</label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-md py-2.5 px-3 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 text-left" 
              placeholder="example@mail.com" 
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">كلمة المرور</label>
            <input 
              type="password" 
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-md py-2.5 px-3 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 text-left" 
              placeholder="••••••••" 
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">تأكيد كلمة المرور</label>
            <input 
              type="password" 
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-md py-2.5 px-3 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 text-left" 
              placeholder="••••••••" 
              dir="ltr"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-red-700 text-white font-bold py-2.5 rounded-md hover:bg-red-800 transition-colors mt-4 disabled:opacity-50"
          >
            {loading ? 'جاري الإنشاء...' : 'إنشاء حساب'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-500 dark:text-gray-400">لديك حساب بالفعل؟ </span>
          <Link to="/login" className="text-black dark:text-white font-bold hover:underline">دخول</Link>
        </div>
      </div>
    </div>
  );
}
