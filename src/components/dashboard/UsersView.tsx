import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usersApi } from '../../services/api/usersApi';
import { 
  User, 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Search,
  MoreVertical,
  Loader2,
  RefreshCw,
  Ban,
  CheckCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { useToast } from '../../contexts/ToastContext';

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: 'owner' | 'admin' | 'user';
  is_banned?: boolean;
  updated_at: string;
}

export default function UsersView() {
  const { profile: currentProfile } = useAuth();
  const { addToast } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  const isOwner = currentProfile?.role === 'owner';
  const isAdminOrOwner = currentProfile?.role === 'owner' || currentProfile?.role === 'admin';

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await usersApi.getAllUsers();
      if (data) setUsers(data as Profile[]);
    } catch (error) {
      console.error('Error fetching users:', error);
      addToast('فشل جلب المستخدمين', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: 'owner' | 'admin' | 'user') => {
    const targetUser = users.find(u => u.id === userId);
    if (!isOwner || !targetUser || targetUser.role === 'owner') return;
    
    setUpdatingId(userId);
    try {
      await usersApi.changeUserRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      addToast('تم تغيير الرتبة بنجاح', 'success');
    } catch (error) {
      console.error(error);
      addToast('حدث خطأ أثناء تغيير الرتبة', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleBan = async (userId: string, currentBanStatus: boolean) => {
    const targetUser = users.find(u => u.id === userId);
    // Only admins/owners can ban. Owners cannot be banned.
    if (!isAdminOrOwner || !targetUser || targetUser.role === 'owner') return;

    setUpdatingId(userId);
    try {
      await usersApi.toggleUserBan(userId, currentBanStatus || false);
      setUsers(users.map(u => u.id === userId ? { ...u, is_banned: !currentBanStatus } : u));
      addToast(currentBanStatus ? 'تم فك الحظر بنجاح' : 'تم حظر المستخدم بنجاح', 'success');
    } catch (error) {
      console.error(error);
      addToast('حدث خطأ أثناء تحديث حالة الحظر', 'error');
    } finally {
      setUpdatingId(null);
    }
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
      case 'owner': return 'مالك';
      case 'admin': return 'أدمن';
      default: return 'مستخدم';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">إدارة المستخدمين</h1>
          <p className="text-zinc-500 font-medium">التحكم في الصلاحيات وحظر الحسابات</p>
        </div>
        <button 
          onClick={fetchUsers}
          className="p-3 bg-white dark:bg-[#1a1d24] text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-xl shadow-sm border border-zinc-100 dark:border-white/5 transition-all active:scale-95"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="bg-white dark:bg-[#1a1d24] border border-zinc-100 dark:border-white/5 rounded-3xl p-2 shadow-sm">
        <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="ابحث بالاسم، الإيميل، أو الـ ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-[#0f1115] text-zinc-900 dark:text-white placeholder-zinc-400 border border-zinc-200 dark:border-white/10 rounded-2xl pr-12 pl-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 dark:bg-[#0f1115] rounded-lg text-[10px] font-black text-zinc-500 uppercase">
              <User size={12} className="text-zinc-400" /> إجمالي: {users.length}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 dark:bg-[#0f1115] rounded-lg text-[10px] font-black text-zinc-500 uppercase">
              <ShieldCheck size={12} className="text-amber-600" /> أدمن
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-50 dark:bg-[#0f1115]/50 text-right border-b border-zinc-50 dark:border-white/5 text-xs font-black text-zinc-500 uppercase tracking-wider">
                <th className="px-6 py-4">المستخدم</th>
                <th className="px-6 py-4">الصلاحية</th>
                <th className="px-6 py-4">الـ (ID)</th>
                <th className="px-6 py-4">حالة الحساب</th>
                <th className="px-6 py-4 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-white/5">
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
                  className="hover:bg-zinc-50 dark:hover:bg-[#0f1115]/50 transition-colors group"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-[#1a1d24] flex items-center justify-center overflow-hidden border border-zinc-200 dark:border-white/10">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="text-zinc-400" size={20} />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-2">
                          {user.full_name || 'مستخدم مجهول'}
                          {user.is_banned && <span className="bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded uppercase">محظور</span>}
                        </div>
                        <div className="text-[10px] font-bold text-zinc-500">{user.email || 'لا يوجد إيميل'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      {getRoleIcon(user.role)}
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-[10px] text-zinc-400">
                    {user.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-bold">
                    {user.is_banned ? (
                      <span className="text-red-500">محظور ❌</span>
                    ) : (
                      <span className="text-emerald-500">نشط ✅</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-left">
                    {isAdminOrOwner ? (
                      <div className="flex items-center justify-start gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {updatingId === user.id ? (
                          <Loader2 className="w-4 h-4 text-red-600 animate-spin" />
                        ) : user.role === 'owner' ? (
                          <span className="text-[10px] font-black text-zinc-400 px-2 py-1 bg-zinc-100 dark:bg-[#1a1d24] rounded-lg">المالك لا يُعدل</span>
                        ) : (
                          <>
                            {/* Ban / Unban Button */}
                            <button
                              onClick={() => handleToggleBan(user.id, !!user.is_banned)}
                              className={`p-1.5 rounded-lg transition-all ${
                                user.is_banned 
                                  ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50' 
                                  : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50'
                              }`}
                              title={user.is_banned ? 'فك الحظر' : 'حظر المستخدم'}
                            >
                              {user.is_banned ? <CheckCircle size={18} /> : <Ban size={18} />}
                            </button>

                            {/* Role Change Buttons (Only Owner can promote to Admin) */}
                            {isOwner && (
                              <>
                                <button 
                                  onClick={() => handleRoleChange(user.id, 'admin')}
                                  disabled={user.role === 'admin'}
                                  className={`p-1.5 rounded-lg transition-all ${
                                    user.role === 'admin' ? 'bg-zinc-100 dark:bg-white/5 text-zinc-300 dark:text-zinc-600' : 'bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-900/50'
                                  }`}
                                  title="ترقية إلى أدمن"
                                >
                                  <ShieldCheck size={18} />
                                </button>
                                <button 
                                  onClick={() => handleRoleChange(user.id, 'user')}
                                  disabled={user.role === 'user'}
                                  className={`p-1.5 rounded-lg transition-all ${
                                    user.role === 'user' ? 'bg-zinc-100 dark:bg-white/5 text-zinc-300 dark:text-zinc-600' : 'bg-zinc-100 dark:bg-[#1a1d24] text-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                                  }`}
                                  title="تجريد من الصلاحيات"
                                >
                                  <Shield size={18} />
                                </button>
                              </>
                            )}
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
              <p className="text-zinc-500 font-bold">لا يوجد مستخدمين بهذا الاسم</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

