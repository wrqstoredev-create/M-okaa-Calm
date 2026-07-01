import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('تنبيه: بيانات Supabase غير مكتملة في ملف .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// اختبار الاتصال بشكل مؤقت
async function testConnection() {
  try {
    const { error } = await supabase.from('products').select('id').limit(1);
    if (error) {
       console.error('❌ فشل الاتصال بـ Supabase:', error.message);
    } else {
       console.log('✅ تم الاتصال بـ Supabase بنجاح!');
    }
  } catch (err) {
    console.error('❌ خطأ غير متوقع أثناء الاتصال بـ Supabase:', err);
  }
}

testConnection();
