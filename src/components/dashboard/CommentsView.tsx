import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../contexts/ToastContext';
import { ShieldAlert, Trash2, CheckCircle, XCircle, Search, Clock, Save, Ban } from 'lucide-react';
import { motion } from 'motion/react';

interface Comment {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: string;
  profiles: { full_name: string; email: string };
  products: { title: string };
}

interface CommentSettings {
  auto_approve: boolean;
}

export default function CommentsView() {
  const { addToast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [settings, setSettings] = useState<CommentSettings>({ auto_approve: true });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Ban Modal State
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [banUserId, setBanUserId] = useState<string | null>(null);
  const [banDurationValue, setBanDurationValue] = useState<number>(1);
  const [banDurationUnit, setBanDurationUnit] = useState<'days'|'months'|'years'|'permanent'>('days');
  const [banReason, setBanReason] = useState('');
  const [isBanning, setIsBanning] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Fetch settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('comment_settings')
        .select('*')
        .eq('id', 1)
        .single();
        
      if (settingsData) setSettings(settingsData);

      // Fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('product_comments')
        .select(`
          *,
          profiles:user_id(full_name, email),
          products:product_id(title)
        `)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;
      setComments(commentsData || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      addToast('حدث خطأ أثناء جلب التعليقات', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAutoApprove = async () => {
    try {
      const newSettings = { auto_approve: !settings.auto_approve };
      const { error } = await supabase
        .from('comment_settings')
        .update(newSettings)
        .eq('id', 1);

      if (error) {
        // if table is empty
        await supabase.from('comment_settings').insert([{ id: 1, ...newSettings }]);
      }
      
      setSettings(newSettings);
      addToast('تم تحديث الإعدادات بنجاح', 'success');
    } catch (error) {
      console.error('Error updating settings:', error);
      addToast('حدث خطأ أثناء تحديث الإعدادات', 'error');
    }
  };

  const updateCommentStatus = async (id: string, is_approved: boolean) => {
    try {
      const { error } = await supabase
        .from('product_comments')
        .update({ is_approved })
        .eq('id', id);

      if (error) throw error;
      setComments(comments.map(c => c.id === id ? { ...c, is_approved } : c));
      addToast(is_approved ? 'تمت الموافقة على التعليق' : 'تم سحب الموافقة عن التعليق', 'success');
    } catch (error) {
      console.error('Error updating comment:', error);
      addToast('حدث خطأ أثناء تحديث حالة التعليق', 'error');
    }
  };

  const deleteComment = async (id: string) => {
    if (isDeleting) return;
    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from('product_comments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setComments(comments.filter(c => c.id !== id));
      addToast('تم حذف التعليق', 'success');
      setDeletingId(null);
    } catch (error) {
      console.error('Error deleting comment:', error);
      addToast('حدث خطأ أثناء حذف التعليق', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const openBanModal = (userId: string) => {
    setBanUserId(userId);
    setBanDurationValue(1);
    setBanDurationUnit('days');
    setBanReason('');
    setIsBanModalOpen(true);
  };

  const submitBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banUserId) return;

    try {
      setIsBanning(true);
      let bannedUntil = null;
      
      if (banDurationUnit !== 'permanent') {
        const date = new Date();
        if (banDurationUnit === 'days') date.setDate(date.getDate() + banDurationValue);
        else if (banDurationUnit === 'months') date.setMonth(date.getMonth() + banDurationValue);
        else if (banDurationUnit === 'years') date.setFullYear(date.getFullYear() + banDurationValue);
        bannedUntil = date.toISOString();
      }

      // Check if ban already exists
      const { data: existingBans } = await supabase
        .from('comment_bans')
        .select('id')
        .eq('user_id', banUserId);

      let error;
      if (existingBans && existingBans.length > 0) {
        const { error: updateError } = await supabase
          .from('comment_bans')
          .update({ banned_until: bannedUntil, reason: banReason })
          .eq('user_id', banUserId);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('comment_bans')
          .insert([{ user_id: banUserId, banned_until: bannedUntil, reason: banReason }]);
        error = insertError;
      }

      if (error) throw error;

      addToast('تم حظر المستخدم بنجاح', 'success');
      setIsBanModalOpen(false);
    } catch (error) {
      console.error('Error banning user:', error);
      addToast('حدث خطأ أثناء حظر المستخدم', 'error');
    } finally {
      setIsBanning(false);
    }
  };

  const filteredComments = comments.filter(c => 
    c.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.products?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-zinc-900/50 p-6 rounded-2xl border border-white/5">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">إدارة التعليقات</h2>
          <p className="text-zinc-400">إدارة تقييمات وتعليقات المنتجات</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleAutoApprove}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-colors ${
              settings.auto_approve 
                ? 'bg-zinc-800 text-green-400 border border-green-500/20' 
                : 'bg-zinc-800 text-yellow-400 border border-yellow-500/20'
            }`}
          >
            {settings.auto_approve ? <CheckCircle size={20} /> : <Clock size={20} />}
            <span>الموافقة التلقائية: {settings.auto_approve ? 'مفعلة' : 'متوقفة'}</span>
          </button>
        </div>
      </div>

      <div className="flex items-center bg-zinc-900/50 border border-white/5 rounded-xl px-4">
        <Search className="text-zinc-500" size={20} />
        <input
          type="text"
          placeholder="ابحث في التعليقات، المنتجات، أو المستخدمين..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent border-none text-white p-4 focus:outline-none focus:ring-0 placeholder:text-zinc-600"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredComments.map((comment) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={comment.id}
              className={`bg-zinc-900/50 border rounded-2xl p-6 transition-colors ${
                comment.is_approved ? 'border-white/5' : 'border-yellow-500/30'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    {comment.profiles?.full_name || 'مستخدم غير معروف'}
                    <span className="text-sm font-normal text-zinc-500 bg-zinc-800 px-2 py-1 rounded-md">
                      منتج: {comment.products?.title || 'غير متوفر'}
                    </span>
                  </h3>
                  <div className="flex items-center gap-1 mt-2 text-yellow-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={i < comment.rating ? 'text-yellow-500' : 'text-zinc-700'}>
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-sm text-zinc-500">
                  {new Date(comment.created_at).toLocaleDateString('ar-EG')}
                </div>
              </div>
              
              <p className="text-zinc-300 mb-6">{comment.comment}</p>
              
              <div className="flex items-center gap-4 border-t border-white/5 pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={comment.is_approved}
                    onChange={(e) => updateCommentStatus(comment.id, e.target.checked)}
                    className="w-5 h-5 rounded border-zinc-700 text-red-600 focus:ring-red-600 focus:ring-offset-zinc-900 bg-zinc-800"
                  />
                  <span className="text-white">موافق عليه</span>
                </label>
                
                <div className="flex-1"></div>
                
                <button
                  onClick={() => openBanModal(comment.user_id)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg text-orange-400 hover:bg-orange-400/10 transition-colors"
                >
                  <Ban size={16} />
                  <span>حظر المستخدم</span>
                </button>
                
                <button
                  onClick={() => !isDeleting && setDeletingId(deletingId === comment.id ? null : comment.id)}
                  disabled={isDeleting}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all ${
                    deletingId === comment.id 
                      ? 'bg-red-600 text-white' 
                      : 'text-red-400 hover:bg-red-400/10'
                  }`}
                >
                  {deletingId === comment.id ? (
                    <div className="flex items-center gap-2" onClick={(e) => {
                      e.stopPropagation();
                      deleteComment(comment.id);
                    }}>
                      <Trash2 size={16} />
                      <span>تأكيد الحذف؟</span>
                    </div>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      <span>حذف التعليق</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
          
          {filteredComments.length === 0 && (
            <div className="text-center py-12 text-zinc-500 bg-zinc-900/50 rounded-2xl border border-white/5">
              لا توجد تعليقات
            </div>
          )}
        </div>
      )}

      {/* Ban User Modal */}
      {isBanModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-950 border border-white/10 rounded-2xl p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <ShieldAlert className="text-orange-500" />
              حظر المستخدم
            </h2>
            
            <form onSubmit={submitBan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">مدة الحظر</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    disabled={banDurationUnit === 'permanent'}
                    value={banDurationValue}
                    onChange={(e) => setBanDurationValue(parseInt(e.target.value) || 1)}
                    className="w-20 bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500 disabled:opacity-50"
                  />
                  <select
                    value={banDurationUnit}
                    onChange={(e) => setBanDurationUnit(e.target.value as any)}
                    className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="days">أيام</option>
                    <option value="months">أشهر</option>
                    <option value="years">سنوات</option>
                    <option value="permanent">حظر دائم</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">السبب (اختياري)</label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-red-500 h-24 resize-none"
                  placeholder="سبب الحظر..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsBanModalOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isBanning}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                >
                  {isBanning ? 'جاري الحظر...' : 'تأكيد الحظر'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
