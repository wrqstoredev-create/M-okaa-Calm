
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { 
  User, 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Search,
  MoreVertical,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: 'owner' | 'admin' | 'user';
  updated_at: string;
}

export default function UsersView() {
  const { profile: currentProfile } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const isOwner = currentProfile?.role === 'owner';

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setUsers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: 'owner' | 'admin' | 'user') => {
    const targetUser = users.find(u => u.id === userId);
    if (!isOwner || !targetUser || targetUser.role === 'owner') return;
    
    setUpdatingId(userId);
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
    setUpdatingId(null);
  };

  const filteredUsers = users.filter(user => 
    (user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <ShieldAlert className="text-red-600" size={16} />;
      case 'admin': return <ShieldCheck className="text-amber-600" size={16} />;
      default: return <Shield className="text-zinc-400" size={16} />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'المالك';
      case 'admin': return 'مدير';
      default: return 'مستخدم';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">إدارة المستخدمين</h1>
          <p className="text-zinc-500 font-medium">التحكم في صلاحيات الوصول والأدوار</p>
        </div>
        <button 
          onClick={fetchUsers}
          className="p-3 bg-white dark:bg-[#1a1d24] border border-zinc-100 rounded-xl hover:bg-zinc-50 dark:bg-[#0f1115] transition-colors"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="bg-white dark:bg-[#1a1d24] rounded-3xl border border-zinc-100 shadow-sm overflow-hidden text-right" dir="rtl">
        <div className="p-6 border-b border-zinc-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative group flex-1 max-w-md">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-red-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="البحث عن مستخدم بالإسم أو المعرف..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-[#0f1115] rounded-2xl pr-12 pl-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-600/5 focus:border-red-600 border border-transparent transition-all"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 dark:bg-[#0f1115] rounded-lg text-[10px] font-black text-zinc-500 uppercase">
              <ShieldAlert size={12} className="text-red-600" /> مالك
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 dark:bg-[#0f1115] rounded-lg text-[10px] font-black text-zinc-500 uppercase">
              <ShieldCheck size={12} className="text-amber-600" /> مدير
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-50 dark:bg-[#0f1115]/50 text-right border-b border-zinc-50 text-xs font-black text-zinc-500 uppercase tracking-wider">
                <th className="px-6 py-4">المستخدم</th>
                <th className="px-6 py-4">الدور الحالي</th>
                <th className="px-6 py-4">المعرف (ID)</th>
                <th className="px-6 py-4">آخر تحديث</th>
                <th className="px-6 py-4 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Loader2 className="w-8 h-8 text-red-600 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredUsers.map((user, index) => (
                <motion.tr 
                  key={user.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="hover:bg-zinc-50 dark:bg-[#0f1115]/50 transition-colors group"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-[#1a1d24] flex items-center justify-center overflow-hidden border border-zinc-200">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="text-zinc-400" size={20} />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-black text-zinc-900 dark:text-white">{user.full_name || 'بدون إسم'}</div>
                        <div className="text-[10px] font-bold text-zinc-500">{user.email || 'لا يوجد بريد'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="flex items-center gap-2 text-xs font-bold text-zinc-700">
                      {getRoleIcon(user.role)}
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-[10px] text-zinc-400">
                    {user.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-zinc-500">
                    {new Date(user.updated_at).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-left">
                    {isOwner ? (
                      <div className="flex items-center justify-start gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {updatingId === user.id ? (
                          <Loader2 className="w-4 h-4 text-red-600 animate-spin" />
                        ) : user.role === 'owner' ? (
                          <span className="text-[10px] font-black text-zinc-400 px-2 py-1 bg-zinc-100 dark:bg-[#1a1d24] rounded-lg">رتبة محمية</span>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleRoleChange(user.id, 'admin')}
                              disabled={user.role === 'admin'}
                              className={`p-1.5 rounded-lg transition-all ${
                                user.role === 'admin' ? 'bg-zinc-100 dark:bg-[#1a1d24] text-zinc-300' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                              }`}
                              title="ترقية لمدير"
                            >
                              <ShieldCheck size={18} />
                            </button>
                            <button 
                              onClick={() => handleRoleChange(user.id, 'user')}
                              disabled={user.role === 'user'}
                              className={`p-1.5 rounded-lg transition-all ${
                                user.role === 'user' ? 'bg-zinc-100 dark:bg-[#1a1d24] text-zinc-300' : 'bg-zinc-100 dark:bg-[#1a1d24] text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800'
                              }`}
                              title="تنزيل لمستخدم"
                            >
                              <Shield size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <MoreVertical className="text-zinc-300" size={18} />
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && !loading && (
            <div className="py-20 text-center">
              <p className="text-zinc-500 font-bold">لم يتم العثور على أي مستخدمين</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
