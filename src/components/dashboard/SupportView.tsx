
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  User, 
  MessageCircle, 
  Clock, 
  X, 
  CheckCircle2, 
  MoreVertical,
  Loader2,
  Search,
  Filter
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  sender_email?: string;
  sender_name?: string;
}

interface Chat {
  id: string;
  user_id: string;
  status: 'open' | 'closed';
  last_message_at: string;
  created_at: string;
  user_email?: string;
  user_name?: string;
  user_avatar?: string;
  unread_count?: number;
}

export default function SupportView() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed'>('open');
  
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch chats
  useEffect(() => {
    const fetchChats = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('support_chats')
          .select('*')
          .order('last_message_at', { ascending: false });

        if (error) throw error;

        let formattedChats = [];
        if (data && data.length > 0) {
          const userIds = Array.from(new Set(data.map((chat: any) => chat.user_id).filter(Boolean)));
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, email, full_name, avatar_url')
            .in('id', userIds);

          const profilesMap = new Map((profilesData || []).map((p: any) => [p.id, p]));
          
          formattedChats = data.map((chat: any) => {
            const profileObj = profilesMap.get(chat.user_id);
            return {
              ...chat,
              user_email: profileObj?.email,
              user_name: profileObj?.full_name,
              user_avatar: profileObj?.avatar_url,
            };
          });
        }

        setChats(formattedChats);
      } catch (err) {
        console.error('Error fetching chats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChats();

    // Subscribe to new chats
    const subscription = supabase
      .channel('support_chats_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_chats' }, () => {
        fetchChats();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch messages when activeChatId changes
  useEffect(() => {
    if (!activeChatId) return;

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('support_messages')
          .select('*')
          .eq('chat_id', activeChatId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };

    fetchMessages();

    // Subscribe to new messages for this chat
    const subscription = supabase
      .channel(`chat_messages_${activeChatId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public',
        table: 'support_messages',
        filter: `chat_id=eq.${activeChatId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [activeChatId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatId || !user || isSending) return;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('support_messages')
        .insert({
          chat_id: activeChatId,
          sender_id: user.id,
          message: newMessage,
          is_admin: true
        });

      if (error) throw error;
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const toggleChatStatus = async (chatId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'open' ? 'closed' : 'open';
    try {
      const { error } = await supabase
        .from('support_chats')
        .update({ status: newStatus })
        .eq('id', chatId);

      if (error) throw error;
      
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, status: newStatus as any } : c));
    } catch (err) {
      console.error('Error updating chat status:', err);
    }
  };

  const filteredChats = chats.filter(chat => {
    const matchesSearch = 
      (chat.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (chat.user_email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || chat.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const activeChat = chats.find(c => c.id === activeChatId);

  return (
    <div className="h-[calc(100vh-160px)] flex bg-white dark:bg-[#1a1d24] rounded-3xl overflow-hidden border border-zinc-100 shadow-sm">
      {/* Chats List */}
      <div className="w-80 md:w-96 border-l border-zinc-100 flex flex-col">
        <div className="p-4 border-b border-zinc-100 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-lg text-zinc-900 dark:text-white">محادثات الدعم</h2>
            <div className="bg-red-50 text-red-600 text-[10px] font-black px-2 py-1 rounded-md uppercase">
              {chats.filter(c => c.status === 'open').length} نشط
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input 
              type="text" 
              placeholder="بحث عن مستخدم..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-transparent focus:border-red-500 rounded-xl pr-10 pl-4 py-2 text-sm font-bold outline-none transition-all"
            />
          </div>

          <div className="flex gap-2">
            {(['open', 'closed', 'all'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`
                  flex-1 py-1.5 px-3 rounded-lg text-[10px] font-black transition-all
                  ${filterStatus === status 
                    ? 'bg-zinc-900 text-white' 
                    : 'bg-zinc-100 dark:bg-[#1a1d24] text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800'}
                `}
              >
                {status === 'open' ? 'نشط' : status === 'closed' ? 'مغلق' : 'الكل'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3 opacity-50">
              <Loader2 className="w-6 h-6 animate-spin text-red-600" />
              <span className="text-xs font-bold text-zinc-500">جاري تحميل المحادثات...</span>
            </div>
          ) : filteredChats.length > 0 ? (
            filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={`
                  w-full text-right p-4 border-b border-zinc-50 transition-all flex gap-3 relative
                  ${activeChatId === chat.id ? 'bg-red-50/50' : 'hover:bg-zinc-50 dark:bg-[#0f1115]'}
                `}
              >
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-[#1a1d24] flex-shrink-0 flex items-center justify-center relative overflow-hidden">
                  {chat.user_avatar ? (
                    <img src={chat.user_avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User size={20} className="text-zinc-400" />
                  )}
                  {chat.status === 'open' && (
                    <div className="absolute top-0 left-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="font-black text-sm text-zinc-900 dark:text-white truncate pr-1">
                      {chat.user_name || chat.user_email?.split('@')[0] || 'مستخدم غير معروف'}
                    </p>
                    <span className="text-[9px] font-bold text-zinc-400 whitespace-nowrap">
                      {formatDistanceToNow(new Date(chat.last_message_at), { addSuffix: true, locale: ar })}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-bold truncate">
                    {chat.user_email}
                  </p>
                </div>
                {activeChatId === chat.id && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-red-600"></div>
                )}
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-zinc-400 space-y-4">
              <MessageCircle size={40} className="opacity-20" />
              <p className="text-xs font-black">لا توجد محادثات بهذا الفلتر</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-[#0f1115]/30">
        {activeChatId && activeChat ? (
          <>
            {/* Chat Header */}
            <header className="h-20 bg-white dark:bg-[#1a1d24] border-b border-zinc-100 flex items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-[#1a1d24] flex items-center justify-center overflow-hidden">
                  {activeChat.user_avatar ? (
                    <img src={activeChat.user_avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User size={18} className="text-zinc-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-black text-zinc-900 dark:text-white text-sm leading-none mb-1">
                    {activeChat.user_name || activeChat.user_email?.split('@')[0]}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${activeChat.status === 'open' ? 'bg-green-500' : 'bg-zinc-300'}`}></span>
                    <span className="text-[10px] font-bold text-zinc-500">
                      {activeChat.status === 'open' ? 'نشط الآن' : 'مغلق'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => toggleChatStatus(activeChat.id, activeChat.status)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all
                    ${activeChat.status === 'open' 
                      ? 'bg-zinc-100 dark:bg-[#1a1d24] text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800' 
                      : 'bg-green-50 text-green-600 hover:bg-green-100'}
                  `}
                >
                  {activeChat.status === 'open' ? (
                    <><X size={14} /> إغلاق المحادثة</>
                  ) : (
                    <><CheckCircle2 size={14} /> إعادة فتح</>
                  ) }
                </button>
                <button className="p-2.5 text-zinc-400 hover:bg-zinc-100 dark:bg-[#1a1d24] rounded-xl transition-colors">
                  <MoreVertical size={20} />
                </button>
              </div>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              <div className="flex justify-center my-4">
                <span className="bg-zinc-100 dark:bg-[#1a1d24] text-zinc-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">بداية المحادثة</span>
              </div>
              
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.is_admin ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`
                    max-w-[80%] p-4 rounded-2xl shadow-sm text-sm font-bold
                    ${msg.is_admin 
                      ? 'bg-red-600 text-white rounded-tl-none' 
                      : 'bg-white dark:bg-[#1a1d24] text-zinc-800 border border-zinc-100 rounded-tr-none'}
                  `}>
                    <p className="leading-relaxed mb-1">{msg.message}</p>
                    <div className={`text-[9px] flex items-center gap-1 ${msg.is_admin ? 'text-white/60' : 'text-zinc-400'}`}>
                      <Clock size={10} />
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white dark:bg-[#1a1d24] border-t border-zinc-100">
              {activeChat.status === 'closed' ? (
                <div className="bg-zinc-50 dark:bg-[#0f1115] border border-zinc-100 rounded-2xl p-4 text-center">
                  <p className="text-zinc-500 text-xs font-bold">هذه المحادثة مغلقة حالياً. قم بإعادة فتحها لتتمكن من الرد.</p>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <div className="flex-1 relative">
                    <textarea 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="اكتب ردك هنا..." 
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      className="w-full bg-zinc-50 dark:bg-[#0f1115] border border-transparent focus:border-red-500 rounded-2xl px-6 py-4 outline-none transition-all font-bold resize-none min-h-[56px] max-h-32"
                    />
                  </div>
                  <button 
                    disabled={!newMessage.trim() || isSending}
                    className="bg-red-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                  >
                    {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send size={24} />}
                  </button>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="w-24 h-24 bg-zinc-100 dark:bg-[#1a1d24] rounded-[2.5rem] flex items-center justify-center text-zinc-300 mb-6">
              <MessageCircle size={48} />
            </div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-2">اختر محادثة للبدء</h2>
            <p className="text-zinc-500 font-bold max-w-sm mb-8">
              قم باختيار أحد المستخدمين من القائمة الجانبية لمراجعة سجل المحادثة والرد على استفساراتهم.
            </p>
            <div className="flex gap-4">
               <div className="bg-white dark:bg-[#1a1d24] border border-zinc-100 p-4 rounded-3xl flex flex-col items-center space-y-1">
                  <span className="text-xl font-black text-red-600">{chats.filter(c => c.status === 'open').length}</span>
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">تذاكر نشطة</span>
               </div>
               <div className="bg-white dark:bg-[#1a1d24] border border-zinc-100 p-4 rounded-3xl flex flex-col items-center space-y-1">
                  <span className="text-xl font-black text-green-600">{chats.filter(c => c.status === 'closed').length}</span>
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">تم حلها</span>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
