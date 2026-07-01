import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Star, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Reviews() {
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, []);

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
          products (id, title, image_url),
          profiles (full_name, email)
        `)
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const averageRating = comments.length > 0 
    ? (comments.reduce((acc, curr) => acc + curr.rating, 0) / comments.length).toFixed(1)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
          <span className="text-red-600">تقييمات</span> العملاء
        </h1>
        <div className="flex flex-col items-center justify-center gap-2">
          {comments.length > 0 ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black text-red-600">{averageRating}</span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      className={i < Math.round(Number(averageRating)) ? "fill-orange-400 text-orange-400" : "fill-gray-200 text-gray-200"}
                    />
                  ))}
                </div>
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-bold">بناءً على {comments.length} تقييم</p>
            </>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 font-bold">لا توجد تقييمات حتى الآن</p>
          )}
        </div>
      </div>

      {comments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white dark:bg-[#1a1d24] rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
              <div className="flex-grow">
                <div className="text-red-200 mb-4">
                  <MessageSquare size={32} className="fill-current opacity-20" />
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-medium mb-6 text-sm line-clamp-4">
                  "{comment.comment}"
                </p>
              </div>
              
              <div className="border-t border-gray-50 pt-4 mt-auto">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < comment.rating ? "fill-orange-400 text-orange-400" : "fill-gray-200 text-gray-200"}
                      />
                    ))}
                  </div>
                  {comment.products && (
                    <Link to={`/product/${comment.products.id}`} className="text-[10px] font-black text-red-600 hover:text-red-700 truncate max-w-[150px]">
                      {comment.products.title}
                    </Link>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-100 dark:bg-[#1a1d24] rounded-full flex items-center justify-center">
                      <span className="text-gray-600 dark:text-gray-400 font-black text-xs uppercase">
                        {comment.profiles?.full_name?.charAt(0) || 'م'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-900 dark:text-white">{comment.profiles?.full_name || 'مستخدم'}</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">{new Date(comment.created_at).toLocaleDateString('ar-SA')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 dark:bg-[#0f1115] rounded-[3rem]">
          <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">لا توجد تقييمات</h3>
          <p className="text-gray-500 dark:text-gray-400 font-bold">لم يتم إضافة أي تقييمات للعملاء حتى الآن</p>
        </div>
      )}
    </div>
  );
}
