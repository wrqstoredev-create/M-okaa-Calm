
import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, ArrowLeft, Loader2, AlertCircle, Send, X, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabaseClient';

interface DashboardGatekeeperProps {
  children: React.ReactNode;
}

export default function DashboardGatekeeper({ children }: DashboardGatekeeperProps) {
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [dbPassword, setDbPassword] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const [showRequestAdmin, setShowRequestAdmin] = useState(false);
  const [requestUser, setRequestUser] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestError, setRequestError] = useState('');

  useEffect(() => {
    async function checkSecurity() {
      try {
        // Check session storage first
        const isAuthorized = sessionStorage.getItem('dashboard_authorized');
        if (isAuthorized === 'true') {
          setAuthorized(true);
          setLoading(false);
          return;
        }

        // Fetch dashboard password from settings
        const { data, error } = await supabase
          .from('settings')
          .select('dashboard_password')
          .single();

        // If no password is set, or if the settings record doesn't exist yet, allow access
        if (error || !data?.dashboard_password) {
          setAuthorized(true);
          setLoading(false);
          return;
        }

        setDbPassword(data.dashboard_password);
        setLoading(false);
      } catch (err) {
        console.error('Gatekeeper Error:', err);
        setLoading(false);
        setError(true);
      }
    }

    checkSecurity();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === dbPassword) {
      sessionStorage.setItem('dashboard_authorized', 'true');
      setAuthorized(true);
      setError(false);
    } else {
      setError(true);
      setAttempts(prev => prev + 1);
      setPassword('');
      // Reset error after 2 seconds
      setTimeout(() => setError(false), 2000);
    }
  };

  const handleRequestAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestUser || !requestReason) return;
    
    setRequestLoading(true);
    setRequestError('');
    
    try {
      const res = await fetch('/api/request-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: requestUser, reason: requestReason })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'فشل إرسال الطلب');
      }
      
      setRequestSuccess(true);
      setTimeout(() => {
        setShowRequestAdmin(false);
        setRequestSuccess(false);
        setRequestUser('');
        setRequestReason('');
      }, 3000);
    } catch (err: any) {
      setRequestError(err.message);
    } finally {
      setRequestLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4 bg-zinc-950">
        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
        <p className="text-zinc-500 font-black text-sm uppercase tracking-widest">جاري التحقق من أمان النظام...</p>
      </div>
    );
  }

  if (authorized) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6" dir="rtl">
      <AnimatePresence mode="wait">
        {!showRequestAdmin ? (
          <motion.div 
            key="login-form"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
          >
            {/* Background glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-600/10 blur-[100px] rounded-full"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-red-900/10 blur-[100px] rounded-full"></div>

            <div className="relative space-y-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-zinc-800 rounded-3xl flex items-center justify-center text-red-600 border border-zinc-700 shadow-inner group">
                  <Lock size={32} className="group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight">نظـام الحمـاية</h1>
                  <p className="text-zinc-500 text-sm font-bold mt-1">يُطلب إدخال كلمة مرور لوحة التحكم للمتابعة</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mr-4">كلمة المرور المسجلة للأدمن</label>
                  <div className="relative">
                    <input 
                      autoFocus
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full bg-zinc-800/50 border ${error ? 'border-red-600 ring-4 ring-red-600/10' : 'border-zinc-700'} rounded-2xl px-6 py-4 text-center text-white font-black tracking-[0.5em] focus:outline-none focus:border-red-600 transition-all placeholder:tracking-normal placeholder:text-zinc-600`}
                    />
                    <AnimatePresence>
                      {error && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="absolute -bottom-8 inset-x-0 text-center"
                        >
                          <span className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center justify-center gap-1">
                            <AlertCircle size={12} />
                            كلمة المرور غير صحيحة
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-black h-14 rounded-2xl shadow-xl shadow-red-600/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all group"
                >
                  <ShieldCheck size={20} className="group-hover:rotate-12 transition-transform" />
                  تأكيد الدخول
                </button>
              </form>

              <div className="flex items-center justify-center pt-4 gap-6">
                <button 
                  onClick={() => window.location.href = '/'}
                  className="flex items-center gap-2 text-zinc-600 hover:text-white transition-colors text-xs font-bold"
                >
                  <ArrowLeft size={14} />
                  العودة للمتجر
                </button>
                <button 
                  onClick={() => setShowRequestAdmin(true)}
                  className="flex items-center gap-2 text-zinc-600 hover:text-red-500 transition-colors text-xs font-bold"
                >
                  <MessageSquare size={14} />
                  طلب الإدارة (بوت ديسكورد)
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="request-form"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-6 left-6">
              <button 
                onClick={() => setShowRequestAdmin(false)}
                className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative space-y-8 mt-4">
              <div className="flex flex-col text-right space-y-2">
                <h2 className="text-xl font-black text-white">طلب إدارة التحكم</h2>
                <p className="text-zinc-500 text-xs font-bold">سيتم إرسال طلبك عبر بوت الديسكورد إلى مالك المتجر.</p>
              </div>

              {requestSuccess ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                    <ShieldCheck size={32} />
                  </div>
                  <div>
                    <h3 className="text-emerald-500 font-black mb-1">تم الإرسال بنجاح!</h3>
                    <p className="text-zinc-400 text-xs">تم توجيه طلبك للإدارة، يرجى الانتظار.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRequestAdmin} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mr-4 mb-2 block">الاسم</label>
                    <input 
                      required
                      type="text"
                      value={requestUser}
                      onChange={(e) => setRequestUser(e.target.value)}
                      placeholder="اسمك أو يوزرك"
                      className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl px-6 py-4 text-white font-bold tracking-wide focus:outline-none focus:border-red-600 transition-all placeholder:text-zinc-600"
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mr-4 mb-2 block">سبب الطلب</label>
                    <textarea 
                      required
                      value={requestReason}
                      onChange={(e) => setRequestReason(e.target.value)}
                      placeholder="لماذا تطلب الدخول للإدارة؟"
                      rows={3}
                      className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl px-6 py-4 text-white font-bold tracking-wide focus:outline-none focus:border-red-600 transition-all placeholder:text-zinc-600 resize-none"
                    />
                  </div>

                  {requestError && (
                    <p className="text-red-500 text-xs text-center font-bold">{requestError}</p>
                  )}

                  <button 
                    type="submit"
                    disabled={requestLoading || !requestUser || !requestReason}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black h-14 rounded-2xl shadow-xl shadow-red-600/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all mt-4"
                  >
                    {requestLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    إرسال الطلب عبر الديسكورد
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-8 text-center w-full">
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] opacity-40">MokaaStore Security Firewall v2.0</p>
      </div>
    </div>
  );
}
