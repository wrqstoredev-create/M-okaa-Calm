import { supabase } from '../../lib/supabaseClient';

export const settingsApi = {
  async getSettings() {
    const { data, error } = await supabase.from('settings').select('*').single();
    if (error) throw error;
    return data;
  }
};

export const promoApi = {
  async validateCoupon(code: string) {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();
      
    if (error) throw error;
    return data;
  },

  async incrementCouponUsage(id: string) {
    const { error } = await supabase.rpc('increment_coupon_usage', { coupon_id: id });
    if (error) throw error;
  }
};
