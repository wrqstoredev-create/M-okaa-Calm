-- 1. إضافة عمود 'is_banned' لجدول profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;

-- 2. إعطاء صلاحيات للإدارة بتعديل جدول profiles (لحظر أو فك حظر المستخدمين)
-- افتراضاً أن لديك سياسة للـ update، سنقوم بإنشاء سياسة جديدة للإدارة فقط
CREATE POLICY "Admins can update profiles" 
ON profiles
FOR UPDATE
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'owner')
);

-- 3. منع المستخدمين المحظورين من إضافة طلبات جديدة (حماية إضافية من قاعدة البيانات)
-- سنقوم بإنشاء سياسة Insert على جدول Orders تمنع المحظور من الشراء
CREATE POLICY "Prevent banned users from creating orders" 
ON orders 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND 
  (SELECT is_banned FROM profiles WHERE id = auth.uid()) = false
);

-- 4. يمكنك أيضاً تطبيق نفس السياسة على التعليقات (التقييمات)
CREATE POLICY "Prevent banned users from commenting" 
ON product_comments 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND 
  (SELECT is_banned FROM profiles WHERE id = auth.uid()) = false
);

