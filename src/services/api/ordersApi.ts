import { supabase } from '../../lib/supabaseClient';

// انواع البيانات
export interface OrderItem {
  id: string;
  unit_price: number;
  quantity: number;
  product_id: string;
  player_id?: string;
  player_username?: string;
  player_social?: string;
  player_phone?: string;
  products: {
    title: string;
    image_url: string;
  };
}

export interface Order {
  id: string;
  created_at: string;
  total_price: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  payment_method: string;
  customer_email: string;
  payment_screenshot_url?: string;
  fulfillment_type?: 'link' | 'data' | 'document';
  fulfillment_data?: string;
  fulfillment_file_url?: string;
  user_id: string;
  order_items: OrderItem[];
}

export const ordersApi = {
  // 1. جلب كل الطلبات (للوحة التحكم)
  async getAllOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(title, image_url))')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Order[];
  },

  // 2. جلب طلبات مستخدم معين (لصفحة الحساب)
  async getUserOrders(userId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(title, image_url))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Order[];
  },

  // 3. تحديث حالة الطلب والتسليم
  async fulfillOrder(
    orderId: string, 
    status: Order['status'], 
    fulfillmentType?: Order['fulfillment_type'], 
    fulfillmentData?: string, 
    fulfillmentFileUrl?: string
  ): Promise<any> {
    const { data, error } = await supabase
      .from('orders')
      .update({
        status,
        fulfillment_type: fulfillmentType,
        fulfillment_data: fulfillmentData,
        fulfillment_file_url: fulfillmentFileUrl
      })
      .eq('id', orderId)
      .select();
      
    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('لم يتم حفظ التحديث بسبب صلاحيات قاعدة البيانات (RLS).');
    }
    return data;
  },

  // 4. حذف طلب
  async deleteOrder(orderId: string): Promise<any> {
    const { data, error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId)
      .select();
      
    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('فشل الحذف. تأكد من صلاحيات (RLS).');
    }
    return data;
  },

  // 5. رفع ملف التسليم
  async uploadFulfillmentDocument(file: File, fileName: string): Promise<string> {
    const filePath = `fulfilled/${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from('fulfillment-documents')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('fulfillment-documents')
      .getPublicUrl(filePath);
      
    return publicUrl;
  },

  // 6. خصم المخزون
  async decreaseProductStock(productId: string, quantity: number): Promise<void> {
    try {
      const { error } = await supabase.rpc('decrement_product_stock', {
        prod_id: productId,
        qty: quantity
      });
      // Fallback
      if (error) {
        const { data: prod } = await supabase.from('products').select('stock').eq('id', productId).single();
        if (prod) {
          const newStock = Math.max(0, (prod.stock || 0) - quantity);
          await supabase.from('products').update({ stock: newStock }).eq('id', productId);
        }
      }
    } catch (e) {
      console.error('Error decreasing stock', e);
    }
  },

  // 7. خصم نقاط روبو
  async decreaseRoboCoins(amount: number): Promise<void> {
    try {
      const { error } = await supabase.rpc('decrement_robo_coins', { amount });
      if (error) {
        const { data: set } = await supabase.from('settings').select('robo_coins_balance').single();
        if (set) {
          const newBal = Math.max(0, (set.robo_coins_balance || 0) - amount);
          await supabase.from('settings').update({ robo_coins_balance: newBal }).eq('id', 1);
        }
      }
    } catch (e) {
      console.error('Error decreasing robo coins', e);
    }
  }
};
