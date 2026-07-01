import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Star, Send, Loader2, User, Edit2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface ProductCommentsProps {
  productId: string | number;
}

export default function ProductComments({ productId }: ProductCommentsProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(5);
  const [commentText, setCommentText] = useState('');
  const [userComment, setUserComment] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [eligibility, setEligibility] = useState<{ canComment: boolean; reason?: 'not_purchased' | 'already_commented' | 'not_logged_in' }>({ 
    canComment: false, 
    reason: 'not_logged_in' 
  });
  
  const { user, profile } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    fetchComments();
    if (user) {
      checkEligibility();
    } else {
      setEligibility({ canComment: false, reason: 'not_logged_in' });
    }
  }, [productId, user]);

  const checkEligibility = async () => {
    try {
      // 1. Check if already commented
      const { data: existingComment, error: commentError } = await supabase
        .from('product_comments')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingComment) {
        setUserComment(existingComment);
        setEligibility({ canComment: false, reason: 'already_commented' });
        return;
      }

      setUserComment(null);

      // 2. Check if purchased (completed order)
      const { data: purchase, error: purchaseError } = await supabase
        .from('orders')
        .select(`
          id,
          order_items!inner(product_id)
        `)
        .eq('user_id', user?.id)
        .eq('status', 'completed')
        .eq('order_items.product_id', productId)
        .limit(1);

      if (purchase && purchase.length > 0) {
        setEligibility({ canComment: true });
      } else {
        setEligibility({ canComment: false, reason: 'not_purchased' });
      }
    } catch (err) {
      console.error('Error checking comment eligibility:', err);
      setEligibility({ canComment: false });
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('product_comments')
        .select(`
          id,
          rating,
          comment,
          created_at,
          user_id,
          profiles(full_name, email)
        `)
        .eq('product_id', productId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      addToast('يجب عليك تسجيل الدخول لإضافة تعليق', 'error');
      return;
    }
    const trimmedComment = (commentText || '').trim();
    if (!trimmedComment) {
      addToast('الرجاء كتابة تعليق', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && userComment) {
        const { error } = await supabase
          .from('product_comments')
          .update({
            rating,
            comment: trimmedComment,
            is_approved: false // Re-verify if edited? Or keep approved? usually re-verify
          })
          .eq('id', userComment.id);

        if (error) throw error;
        addToast('تم تحديث تقييمك بنجاح وهو بانتظار المراجعة', 'success');
        setIsEditing(false);
      } else {
        // First check if auto-approve is enabled
        const { data: settingsData } = await supabase
          .from('comment_settings')
          .select('auto_approve')
          .eq('id', 1)
          .single();
          
        const is_approved = settingsData?.auto_approve ?? true;
        
        const { error } = await supabase.from('product_comments').insert({
          product_id: productId,
          user_id: user.id,
          rating,
          comment: trimmedComment,
          is_approved
        });

        if (error) {
          if (error.code === '23505') {
            throw new Error('لقد قمت بإضافة تعليق مسبقاً على هذا المنتج. يمكنك تعديل تعليقك الحالي بدلاً من إضافة واحد جديد.');
          }
          if (error.code === '42501') {
            throw new Error('عذراً، لا يمكنك إضافة تعليق. قد يكون تم حظر حسابك من التعليقات.');
          }
          throw error;
        }
        
        if (is_approved) {
          addToast('تمت إضافة تعليقك بنجاح', 'success');
        } else {
          addToast('تم إرسال تعليقك بنجاح وهو بانتظار المراجعة', 'success');
        }
      }
      
      setCommentText('');
      setRating(5);
      fetchComments();
      checkEligibility();
    } catch (error: any) {
      console.error('Error submitting comment:', error);
      addToast(error.message || 'حدث خطأ أثناء إضافة التعليق', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = () => {
    if (!userComment) return;
    setRating(userComment.rating);
    setCommentText(userComment.comment || '');
    setIsEditing(true);
    // Scroll to form
    const formElement = document.getElementById('review-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div id="reviews" className="bg-white dark:bg-[#1a1d24] rounded-3xl p-6 md:p-10 shadow-sm border border-gray-50 mb-16" dir="rtl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-red-50 text-red-700 rounded-xl flex items-center justify-center">
          <Star size={20} className="fill-current" />
        </div>
        <h3 className="text-xl font-black text-gray-900 dark:text-white">التقييمات والآراء</h3>
      </div>

      {/* Add/Edit Comment Form */}
      <div id="review-form" className="bg-zinc-50 dark:bg-[#0f1115] rounded-2xl p-6 mb-10 border border-zinc-100">
        {!eligibility.canComment && !isEditing ? (
          <div className="text-center py-4">
            {eligibility.reason === 'not_logged_in' ? (
              <p className="text-zinc-600 font-bold mb-2">قم بتسجيل الدخول لتتمكن من تقييم المنتج</p>
            ) : eligibility.reason === 'not_purchased' ? (
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
                 <p className="text-amber-700 font-black text-sm">يمكنك تقييم المنتج فقط بعد شرائه واكتمال جاري طلبك.</p>
                 <p className="text-amber-600 text-xs mt-1">هذا النظام لضمان مصداقية التقييمات ومنع السبام.</p>
              </div>
            ) : eligibility.reason === 'already_commented' ? (
              <div className="bg-green-50 border border-green-100 p-6 rounded-2xl flex flex-col items-center gap-4">
                 <div className="flex items-center gap-2 text-green-700">
                    <Star size={20} className="fill-current" />
                    <p className="font-black text-sm">لقد قمت بتقييم هذا المنتج مسبقاً.</p>
                 </div>
                 <div className="flex gap-3">
                   <button 
                     type="button"
                     onClick={() => startEditing()}
                     disabled={isSubmitting}
                     className="flex items-center gap-2 px-6 py-2 bg-white dark:bg-[#1a1d24] text-green-700 rounded-xl font-black text-xs border border-green-200 hover:bg-green-50 transition-colors shadow-sm disabled:opacity-50"
                   >
                     <Edit2 size={14} /> تعديل التقييم
                   </button>
                 </div>
              </div>
            ) : null}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-zinc-600">
                {isEditing ? 'تعديل التقييم:' : 'تقييمك للمنتج:'}
              </span>
              {isEditing && (
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)}
                  className="text-zinc-400 hover:text-red-500 transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            <div className="mb-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(rating)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star 
                      size={28} 
                      className={`${star <= hoverRating ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'}`} 
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="اكتب رأيك أو تجربتك مع هذا المنتج..."
                className="w-full bg-white dark:bg-[#1a1d24] border border-zinc-200 rounded-2xl p-4 min-h-[120px] text-sm font-bold outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50 transition-all resize-none"
              />
              <button
                type="submit"
                disabled={isSubmitting || !(commentText || '').trim()}
                className="absolute bottom-4 left-4 bg-red-700 text-white px-6 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-red-900/20"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="rotate-180" />}
                <span>{isEditing ? 'تحديث التقييم' : 'إرسال تقييم'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Comments List */}
      <div>
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-10 px-4">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-[#1a1d24] text-zinc-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star size={24} />
            </div>
            <p className="text-zinc-500 font-bold">لا توجد تقييمات حتى الآن. كن أول من يكتب رأيه حول هذا المنتج!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-4 p-5 rounded-2xl border border-zinc-100 bg-white dark:bg-[#1a1d24] hover:border-zinc-200 transition-colors">
                <div className="w-12 h-12 bg-zinc-100 dark:bg-[#1a1d24] text-zinc-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <User size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-zinc-900 dark:text-white text-sm">
                          {comment.profiles?.full_name || comment.profiles?.email?.split('@')[0] || 'مستخدم'}
                        </h4>
                        {comment.user_id === user?.id && (
                          <span className="text-[8px] font-black bg-zinc-900 text-white px-1.5 py-0.5 rounded-full uppercase tracking-tighter">تقييمك</span>
                        )}
                      </div>
                      
                      {comment.user_id === user?.id && (
                        <div className="flex items-center gap-2">
                          <button 
                            type="button"
                            onClick={() => startEditing()}
                            disabled={isSubmitting}
                            className="p-1.5 text-zinc-400 hover:text-red-700 transition-colors disabled:opacity-50"
                            title="تعديل"
                          >
                            <Edit2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-zinc-400">
                      {new Date(comment.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className={i < comment.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-200'} />
                    ))}
                  </div>
                  
                  <p className="text-zinc-600 text-sm font-bold leading-relaxed">{comment.comment}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
