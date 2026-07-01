
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

export default function SupportChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Fetch or create chat session
  useEffect(() => {
    if (!user || !isOpen) return;

    let subscription: any;

    const setupChat = async () => {
      setIsLoading(true);
      try {
        // Find existing chat
        let { data: chatData, error: chatError } = await supabase
          .from('support_chats')
          .select('id')
          .eq('user_id', user.id)
          .single();

        let currentChatId = chatData?.id;

        // Create new chat if not exists
        if (!currentChatId || (chatError && chatError.code === 'PGRST116')) {
          const { data: newChat, error: newChatError } = await supabase
            .from('support_chats')
            .insert([{ user_id: user.id }])
            .select()
            .single();
            
          if (newChatError) throw newChatError;
          currentChatId = newChat.id;
        }

        setChatId(currentChatId);

        // Fetch previous messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('support_messages')
          .select('*')
          .eq('chat_id', currentChatId)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;
        setMessages(messagesData || []);

        // Subscribe to new messages
        subscription = supabase
          .channel(`support_messages_${currentChatId}`)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'support_messages',
            filter: `chat_id=eq.${currentChatId}`
          }, (payload) => {
            // Check if message is already in list (for optimistic updates or self-sent)
            setMessages(prev => {
              if (prev.find(m => m.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
          })
          .subscribe();

      } catch (error) {
        console.error('Error setting up chat:', error);
      } finally {
        setIsLoading(false);
      }
    };

    setupChat();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [user, isOpen]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !chatId) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const { data: newMsg, error } = await supabase
        .from('support_messages')
        .insert([{
          chat_id: chatId,
          sender_id: user.id,
          message: messageText,
          is_admin: false
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Optimistically add message
      setMessages(prev => [...prev, newMsg]);
      
      // Update last message timestamp in chat
      await supabase
        .from('support_chats')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', chatId);
        
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="fixed bottom-24 left-6 z-[9999]" dir="rtl">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-24 left-0 w-[350px] max-w-[calc(100vw-3rem)] bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            style={{ height: '500px' }}
          >
            {/* Header */}
            <div className="bg-red-700 p-4 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white dark:bg-[#1a1d24]/20 rounded-full flex items-center justify-center">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">الدعم الفني</h3>
                  <p className="text-xs text-white/80">نحن هنا لمساعدتك</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white dark:bg-[#1a1d24]/20 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-zinc-900 overflow-y-auto p-4 flex flex-col gap-3">
              {!user ? (
                <div className="flex-1 flex items-center justify-center text-center p-6 text-zinc-400">
                  <p>يرجى تسجيل الدخول لبدء محادثة مع الدعم الفني.</p>
                </div>
              ) : isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-center p-6 text-zinc-500 text-sm">
                  <p>مرحباً بك! كيف يمكننا مساعدتك اليوم؟</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isAdmin = msg.is_admin;
                  return (
                    <div 
                      key={msg.id || index} 
                      className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                        isAdmin 
                          ? 'bg-zinc-800 text-white self-start rounded-tr-sm' 
                          : 'bg-red-700 text-white self-end rounded-tl-sm'
                      }`}
                    >
                      {msg.message}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-zinc-950 border-t border-white/10 shrink-0">
              <form onSubmit={sendMessage} className="relative flex items-center">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={!user}
                  placeholder={user ? "اكتب رسالتك هنا..." : "سجل دخولك أولاً"}
                  className="w-full bg-zinc-900 border border-white/10 rounded-full py-3 px-4 pl-12 text-sm text-white focus:outline-none focus:border-red-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!user || !newMessage.trim()}
                  className="absolute left-2 w-8 h-8 flex items-center justify-center bg-red-700 text-white rounded-full hover:bg-red-600 disabled:opacity-50 disabled:hover:bg-red-700 transition-colors"
                >
                  <Send size={16} className="rtl:-scale-x-100" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="bg-red-700 text-white w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-red-900/40 border-4 border-white relative group cursor-pointer"
      >
        {isOpen ? <X size={32} /> : <MessageCircle size={32} />}
        
        {!isOpen && (
          <>
            <div className="absolute right-full mr-4 px-4 py-2 bg-black text-white text-[10px] font-black rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap hidden sm:block">
              الدعم الفني
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 border-4 border-white rounded-full animate-pulse"></div>
          </>
        )}
      </motion.button>
    </div>
  );
}
