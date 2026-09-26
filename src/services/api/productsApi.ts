import { supabase } from '../../lib/supabaseClient';
import { Product } from '../../types/products';

export const productsApi = {
  // جلب الألعاب
  async getGames() {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .order('name');
      
    if (error) throw error;
    return data;
  },

  // جلب كل المنتجات
  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data as Product[];
  },

  // جلب منتج معين
  async getProductById(id: string): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data as Product;
  },

  // جلب الأقسام
  async getCategories() {
    const { data, error } = await supabase
      .from('sections')
      .select('*')
      .order('sort_order', { ascending: true });
      
    if (error) throw error;
    return data;
  },

  // جلب التقييمات لمنتج معين
  async getProductReviews(productId: string) {
    const { data, error } = await supabase
      .from('product_comments')
      .select(`
        *,
        profiles (
          full_name,
          avatar_url
        )
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data;
  }
};
