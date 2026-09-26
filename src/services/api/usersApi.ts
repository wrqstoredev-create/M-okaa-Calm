import { supabase } from '../../lib/supabaseClient';

export const usersApi = {
  // جلب جميع المستخدمين للإدارة
  async getAllUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // تغيير حالة الحظر للمستخدم (Ban / Unban)
  async toggleUserBan(userId: string, currentBanStatus: boolean) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_banned: !currentBanStatus })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // تغيير رتبة المستخدم (User / Admin)
  async changeUserRole(userId: string, newRole: 'user' | 'admin') {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

