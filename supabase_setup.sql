-- قم بنسخ هذا الكود ولصقه في Supabase SQL Editor لتجهيز قاعدة البيانات
-- هذا الكود مصمم ليعمل حتى لو كانت الجداول موجودة مسبقاً

-- 1. التأكد من وجود جدول profiles وإضافة الأعمدة الناقصة
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  full_name text,
  avatar_url text,
  email text,
  gender text check (gender in ('male', 'female', 'other'))
);

-- إضافة عمود role إذا لم يكن موجوداً
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='role') then
    alter table public.profiles add column role text check (role in ('owner', 'admin', 'user')) default 'user';
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='email') then
    alter table public.profiles add column email text;
  end if;
end $$;

-- 2. إعداد الحماية (RLS) لجدول profiles
alter table profiles enable row level security;

drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

drop policy if exists "Users can update own profile." on profiles;
create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

drop policy if exists "Owner can update any profile role." on profiles;
create policy "Owner can update any profile role." on profiles
  for update using (
    exists (
      select 1 from profiles where id = auth.uid() and role = 'owner'
    )
    and role != 'owner' -- منع تغيير رتبة أي مالك (بما في ذلك المالك نفسه)
  );

-- 3. وظيفة إنشاء الملف الشخصي تلقائياً عند التسجيل
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role, email)
  values (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), 
    new.raw_user_meta_data->>'avatar_url',
    'user',
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. إنشاء الجداول الأخرى (إذا لم تكن موجودة)
create table if not exists slides (
  id uuid default uuid_generate_v4() primary key,
  image_url text not null,
  title text,
  subtitle text,
  button_text text,
  button_link text,
  image_link text,
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists settings (
  id int primary key default 1,
  store_name text default 'متجر الألعاب الدولي',
  store_description text default 'وجهتك الأولى لشحن الألعاب والبطاقات الرقمية',
  support_email text default 'support@example.com',
  crypto_wallet_address text,
  enable_2fa boolean default false,
  order_notifications boolean default true,
  dark_mode boolean default false,
  high_contrast boolean default false,
  font_size text default 'medium',
  dashboard_password text,
  phone_cash_number text default '01091215161',
  instapay_id text default 'MOKAA@INSTAPAY',
  fawry_number text default '123456',
  enable_visa boolean default true,
  enable_apple_pay boolean default true,
  enable_phone_cash boolean default true,
  enable_instapay boolean default true,
  enable_fawry boolean default true,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  constraint one_row check (id = 1)
);

-- تحديث الأعمدة الناقصة في حال كان الجدول موجوداً مسبقاً
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name='settings' and column_name='enable_2fa') then
    alter table public.settings add column enable_2fa boolean default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='settings' and column_name='order_notifications') then
    alter table public.settings add column order_notifications boolean default true;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='settings' and column_name='dark_mode') then
    alter table public.settings add column dark_mode boolean default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='settings' and column_name='high_contrast') then
    alter table public.settings add column high_contrast boolean default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='settings' and column_name='font_size') then
    alter table public.settings add column font_size text default 'medium';
  end if;
  if not exists (select 1 from information_schema.columns where table_name='settings' and column_name='dashboard_password') then
    alter table public.settings add column dashboard_password text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='settings' and column_name='phone_cash_number') then
    alter table public.settings add column phone_cash_number text default '01091215161';
  end if;
  if not exists (select 1 from information_schema.columns where table_name='settings' and column_name='instapay_id') then
    alter table public.settings add column instapay_id text default 'MOKAA@INSTAPAY';
  end if;
  if not exists (select 1 from information_schema.columns where table_name='settings' and column_name='fawry_number') then
    alter table public.settings add column fawry_number text default '123456';
  end if;
  if not exists (select 1 from information_schema.columns where table_name='settings' and column_name='enable_visa') then
    alter table public.settings add column enable_visa boolean default true;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='settings' and column_name='enable_apple_pay') then
    alter table public.settings add column enable_apple_pay boolean default true;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='settings' and column_name='enable_phone_cash') then
    alter table public.settings add column enable_phone_cash boolean default true;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='settings' and column_name='enable_instapay') then
    alter table public.settings add column enable_instapay boolean default true;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='settings' and column_name='enable_fawry') then
    alter table public.settings add column enable_fawry boolean default true;
  end if;
end $$;

-- إعطاء صلاحيات الوصول للإعدادات
alter table settings enable row level security;
drop policy if exists "Settings are viewable by everyone" on settings;
create policy "Settings are viewable by everyone" on settings for select using (true);
drop policy if exists "Admins and Owners can modify settings" on settings;
create policy "Admins and Owners can modify settings" on settings for all 
  using (
    exists (
      select 1 from profiles 
      where profiles.id = auth.uid() 
      and profiles.role in ('admin', 'owner')
    )
  );

-- إدراج الإعدادات الافتراضية إذا لم تكن موجودة
insert into settings (id, store_name, store_description)
values (1, 'متجر الألعاب الدولي', 'وجهتك الأولى لشحن الألعاب والبطاقات الرقمية')
on conflict (id) do nothing;

create table if not exists products (
  id uuid default gen_random_uuid() primary key,
  game_id uuid,
  title text not null,
  game_name text,
  price decimal(12,2) not null,
  old_price decimal(12,2),
  description text,
  image_url text,
  discount_badge text,
  is_featured boolean default false,
  is_new boolean default false,
  require_player_id boolean default false,
  require_username boolean default false,
  require_social_link boolean default false,
  require_phone_number boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- تحديث الأعمدة الناقصة لجدول المنتجات
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name='products' and column_name='game_id') then
    alter table public.products add column game_id uuid;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='products' and column_name='title') then
    alter table public.products add column title text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='products' and column_name='game_name') then
    alter table public.products add column game_name text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='products' and column_name='old_price') then
    alter table public.products add column old_price decimal(12,2);
  end if;
  if not exists (select 1 from information_schema.columns where table_name='products' and column_name='discount_badge') then
    alter table public.products add column discount_badge text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='products' and column_name='is_featured') then
    alter table public.products add column is_featured boolean default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='products' and column_name='is_new') then
    alter table public.products add column is_new boolean default false;
  end if;
  -- حقول المتطلبات من العميل
  if not exists (select 1 from information_schema.columns where table_name='products' and column_name='require_player_id') then
    alter table public.products add column require_player_id boolean default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='products' and column_name='require_username') then
    alter table public.products add column require_username boolean default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='products' and column_name='require_social_link') then
    alter table public.products add column require_social_link boolean default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='products' and column_name='require_phone_number') then
    alter table public.products add column require_phone_number boolean default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='products' and column_name='updated_at') then
    alter table public.products add column updated_at timestamp with time zone default timezone('utc'::text, now());
  end if;
end $$;

create table if not exists orders (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  user_id uuid references auth.users(id),
  total_price decimal(12,2) not null,
  status text check (status in ('pending', 'processing', 'completed', 'cancelled')) default 'pending',
  payment_method text,
  customer_email text,
  payment_screenshot_url text,
  fulfillment_type text check (fulfillment_type in ('link', 'data', 'document')),
  fulfillment_data text,
  fulfillment_file_url text
);

-- تحديث الأعمدة الناقصة لجدول الطلبات
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='updated_at') then
    alter table public.orders add column updated_at timestamp with time zone default timezone('utc'::text, now());
  end if;
  if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='total_price') then
    alter table public.orders add column total_price decimal(12,2) not null default 0;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='payment_method') then
    alter table public.orders add column payment_method text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='customer_email') then
    alter table public.orders add column customer_email text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='payment_screenshot_url') then
    alter table public.orders add column payment_screenshot_url text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='fulfillment_type') then
    alter table public.orders add column fulfillment_type text check (fulfillment_type in ('link', 'data', 'document'));
  end if;
  if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='fulfillment_data') then
    alter table public.orders add column fulfillment_data text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='fulfillment_file_url') then
    alter table public.orders add column fulfillment_file_url text;
  end if;
end $$;

-- 5. إعداد نظام التخزين (Storage) لصور التحويلات والمستندات
insert into storage.buckets (id, name, public) 
values ('payment-screenshots', 'payment-screenshots', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) 
values ('fulfillment-documents', 'fulfillment-documents', true)
on conflict (id) do nothing;

-- سياسات الوصول لصور التحويلات والمستندات
drop policy if exists "Screenshots are public" on storage.objects;
create policy "Screenshots are public" on storage.objects for select using (bucket_id in ('payment-screenshots', 'fulfillment-documents'));

drop policy if exists "Authenticated users can upload screenshots" on storage.objects;
create policy "Authenticated users can upload screenshots" on storage.objects for insert with check (bucket_id in ('payment-screenshots', 'fulfillment-documents'));

drop policy if exists "Admin can delete screenshots" on storage.objects;
create policy "Admin can delete screenshots" on storage.objects for delete using (
  bucket_id in ('payment-screenshots', 'fulfillment-documents') 
  and exists (
    select 1 from public.profiles 
    where profiles.id = auth.uid() 
    and profiles.role in ('admin', 'owner')
  )
);

create table if not exists order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  quantity int not null default 1,
  unit_price decimal(12,2) not null,
  category text,
  player_id text,
  player_username text,
  player_social text,
  player_phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- تحديث الأعمدة الناقصة لجدول عناصر الطلبات
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name='order_items' and column_name='unit_price') then
    alter table public.order_items add column unit_price decimal(12,2) not null default 0;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='order_items' and column_name='player_id') then
    alter table public.order_items add column player_id text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='order_items' and column_name='player_username') then
    alter table public.order_items add column player_username text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='order_items' and column_name='player_social') then
    alter table public.order_items add column player_social text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='order_items' and column_name='player_phone') then
    alter table public.order_items add column player_phone text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='order_items' and column_name='created_at') then
    alter table public.order_items add column created_at timestamp with time zone default timezone('utc'::text, now());
  end if;
  if not exists (select 1 from information_schema.columns where table_name='order_items' and column_name='updated_at') then
    alter table public.order_items add column updated_at timestamp with time zone default timezone('utc'::text, now());
  end if;
end $$;

-- 5. إعداد سياسات الحماية للجداول (Policies)
-- منتجات
alter table products enable row level security;
drop policy if exists "Products are viewable by everyone" on products;
create policy "Products are viewable by everyone" on products for select using (true);
drop policy if exists "Admins and Owners can modify products" on products;
create policy "Admins and Owners can modify products" on products for all 
  using (
    exists (
      select 1 from profiles 
      where profiles.id = auth.uid() 
      and profiles.role in ('admin', 'owner')
    )
  );

-- طلبات
alter table orders enable row level security;
drop policy if exists "Admins and Owners can view all orders" on orders;
create policy "Admins and Owners can view all orders" on orders for select
  using (
    exists (
      select 1 from profiles 
      where profiles.id = auth.uid() 
      and profiles.role in ('admin', 'owner')
    )
  );
drop policy if exists "Users can view their own orders" on orders;
create policy "Users can view their own orders" on orders for select
  using (auth.uid() = user_id);
drop policy if exists "Admins and Owners can update all orders" on orders;
create policy "Admins and Owners can update all orders" on orders for update
  using (
    exists (
      select 1 from profiles 
      where profiles.id = auth.uid() 
      and profiles.role in ('admin', 'owner')
    )
  );

drop policy if exists "Users can insert their own orders" on orders;

create policy "Users can insert their own orders" on orders for insert
  with check (auth.uid() = user_id or user_id is null);

-- عناصر الطلبات
alter table order_items enable row level security;
drop policy if exists "Admins and Owners can view all order items" on order_items;
create policy "Admins and Owners can view all order items" on order_items for select
  using (
    exists (
      select 1 from profiles 
      where profiles.id = auth.uid() 
      and profiles.role in ('admin', 'owner')
    )
  );
drop policy if exists "Users can view their own order items" on order_items;
create policy "Users can view their own order items" on order_items for select
  using (exists (select 1 from orders where orders.id = order_items.order_id and (orders.user_id = auth.uid() or orders.user_id is null)));

drop policy if exists "Anyone can insert order items" on order_items;
create policy "Anyone can insert order items" on order_items for insert
  with check (true);

-- شرائح الصور (Slides)
alter table slides enable row level security;
drop policy if exists "Anyone can view active slides" on slides;
create policy "Anyone can view active slides" on slides for select
  using (is_active = true);

drop policy if exists "Admins can view all slides" on slides;
create policy "Admins can view all slides" on slides for select
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('admin', 'owner')));

drop policy if exists "Admins can insert slides" on slides;
create policy "Admins can insert slides" on slides for insert
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('admin', 'owner')));

drop policy if exists "Admins can update slides" on slides;
create policy "Admins can update slides" on slides for update
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('admin', 'owner')));

drop policy if exists "Admins can delete slides" on slides;
create policy "Admins can delete slides" on slides for delete
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('admin', 'owner')));
