
import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  Users, 
  CreditCard, 
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Trophy,
  AlertCircle,
  Clock,
  PackageCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabaseClient';
import { useCurrency } from '../../contexts/CurrencyContext';

const COLORS = ['#dc2626', '#18181b', '#52525b', '#71717a', '#a1a1aa'];

export default function StatsView() {
  const { formatPrice } = useCurrency();
  const [isMounted, setIsMounted] = useState(false);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalUsers: 0,
    activeOrders: 0,
    conversionRate: 0,
    recentOrders: [] as any[],
    topProducts: [] as { name: string, sales: number, count: number }[],
    todaySales: 0,
    loading: true
  });

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    let isSubscribed = true;

    async function fetchStats() {
      try {
        // Fetch total sales (sum of total_price for completed orders)
        const { data: salesData } = await supabase
          .from('orders')
          .select('total_price, created_at')
          .eq('status', 'completed');
        
        const totalSales = salesData?.reduce((sum, order) => sum + Number(order.total_price), 0) || 0;

        // Fetch total users count
        const { count: usersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Fetch active orders (pending or processing)
        const { count: activeOrdersCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .in('status', ['pending', 'processing', 'shipped']); // Expanded statuses

        // Calculate conversion rate
        const { count: totalOrdersCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true });
        
        const conversionRate = usersCount && totalOrdersCount ? (totalOrdersCount / usersCount * 100).toFixed(1) : 0;

        // Calculate Today's Sales
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todaySalesAmount = salesData?.filter(order => new Date(order.created_at) >= today)
          .reduce((sum, order) => sum + Number(order.total_price), 0) || 0;

        // Process AreaChart Data
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const currentMonth = new Date().getMonth();
        const last6Months = [];
        for (let i = 5; i >= 0; i--) {
          const m = (currentMonth - i + 12) % 12;
          last6Months.push({ name: months[m], sales: 0, index: m });
        }

        salesData?.forEach(order => {
          const orderDate = new Date(order.created_at);
          const orderMonth = orderDate.getMonth();
          const chartPoint = last6Months.find(p => p.index === orderMonth);
          if (chartPoint) {
            chartPoint.sales += Number(order.total_price);
          }
        });

        // Process Category Distribution Data & Top Performers
        const { data: categoryData } = await supabase
          .from('orders')
          .select('game_name, total_price')
          .eq('status', 'completed');

        const categoryMap: Record<string, { sales: number, count: number }> = {};
        categoryData?.forEach(order => {
          const cat = order.game_name || 'أخرى';
          if (!categoryMap[cat]) categoryMap[cat] = { sales: 0, count: 0 };
          categoryMap[cat].sales += Number(order.total_price || 0);
          categoryMap[cat].count += 1;
        });

        const topProducts = Object.entries(categoryMap)
          .map(([name, data]) => ({ name, sales: data.sales, count: data.count }))
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 3);

        const categoryChart = Object.entries(categoryMap)
          .map(([name, data]) => ({ name, value: data.sales }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);

        // Fetch Recent Orders
        const { data: latestOrders } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        if (isSubscribed) {
          setStats({
            totalSales,
            totalUsers: usersCount || 0,
            activeOrders: activeOrdersCount || 0,
            conversionRate: Number(conversionRate),
            recentOrders: latestOrders || [],
            topProducts,
            todaySales: todaySalesAmount,
            loading: false
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        if (isSubscribed) {
          setStats(prev => ({ ...prev, loading: false }));
        }
      }
    }

    fetchStats();
    return () => { isSubscribed = false; };
  }, [isMounted]);

  const statItems = useMemo(() => [
    { label: 'إجمالي المبيعات', value: formatPrice(stats.totalSales), change: stats.totalSales > 0 ? '+100%' : '0%', trend: stats.totalSales > 0 ? 'up' : 'neutral', icon: CreditCard },
    { label: 'المستخدمين المسجلين', value: stats.totalUsers.toLocaleString(), change: stats.totalUsers > 0 ? '+100%' : '0%', trend: stats.totalUsers > 0 ? 'up' : 'neutral', icon: Users },
    { label: 'الطلبات النشطة', value: stats.activeOrders.toLocaleString(), change: stats.activeOrders > 0 ? '+100%' : '0%', trend: stats.activeOrders > 0 ? 'up' : 'neutral', icon: ShoppingBag },
    { label: 'معدل التحويل', value: `${stats.conversionRate}%`, change: stats.conversionRate > 0 ? '+100%' : '0%', trend: stats.conversionRate > 0 ? 'up' : 'neutral', icon: TrendingUp },
  ], [stats.totalSales, stats.totalUsers, stats.activeOrders, stats.conversionRate, formatPrice]);

  if (stats.loading || !isMounted) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-12"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">نظرة عامة</h1>
          <p className="text-zinc-500 font-medium">متابعة أداء المتجر والعمليات الحالية</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => window.location.reload()}
            className="bg-zinc-100 dark:bg-[#1a1d24] px-4 py-2 rounded-xl text-xs font-black text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 transition-all flex items-center gap-2"
          >
             تحديث البيانات
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-[#1a1d24] p-6 rounded-[2rem] border border-zinc-100 shadow-sm hover:shadow-xl hover:shadow-zinc-200/20 transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-zinc-50 dark:bg-[#0f1115] rounded-2xl text-zinc-600 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                <stat.icon size={20} />
              </div>
              <span className={`text-[10px] font-black px-2 py-1 rounded-lg flex items-center gap-1 ${
                stat.trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 
                stat.trend === 'down' ? 'bg-red-50 text-red-600' : 'bg-zinc-50 dark:bg-[#0f1115] text-zinc-500'
              }`}>
                {stat.change}
                {stat.trend === 'up' && <ArrowUpRight size={10} />}
                {stat.trend === 'down' && <ArrowDownRight size={10} />}
              </span>
            </div>
            <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Advanced Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actionable Insights */}
        <div className="bg-white dark:bg-[#1a1d24] rounded-[2rem] border border-zinc-100 shadow-sm p-6 relative overflow-hidden flex flex-col justify-between" dir="rtl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 blur-3xl opacity-50 rounded-full translate-x-10 -translate-y-10"></div>
          
          <div>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-6 flex items-center gap-2 relative z-10">
              <AlertCircle size={20} className="text-amber-500" />
              تحديثات هامة
            </h3>
            
            <div className="space-y-4 relative z-10">
              {stats.activeOrders > 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4">
                  <div className="bg-amber-100 p-2 rounded-xl text-amber-600 mt-0.5">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-amber-900 leading-tight mb-1">طلبات بانتظار التنفيذ</h4>
                    <p className="text-[11px] font-bold text-amber-700">يوجد <strong>{stats.activeOrders}</strong> طلبات تحتاج إلى المراجعة أو الشحن. تأكد من تلبية الطلبات بأسرع وقت لزيادة معدل تحويل المتجر.</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-4">
                  <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600 mt-0.5">
                    <PackageCheck size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-emerald-900 leading-tight mb-1">جميع الطلبات مكتملة</h4>
                    <p className="text-[11px] font-bold text-emerald-700">لا توجد أي طلبات بانتظار المراجعة أو الشحن في الوقت الحالي.</p>
                  </div>
                </div>
              )}

              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-4">
                <div className="bg-blue-100 p-2 rounded-xl text-blue-600 mt-0.5">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-blue-900 leading-tight mb-1">مبيعات اليوم</h4>
                  <p className="text-[11px] font-bold text-blue-700">حققت اليوم مبيعات بقيمة <strong>{formatPrice(stats.todaySales)}</strong>.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1a1d24] rounded-[2rem] border border-zinc-100 shadow-sm p-6" dir="rtl">
           <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
             <Trophy size={20} className="text-amber-500" />
             المنتجات والخدمات الأكثر طلباً
           </h3>
           <div className="space-y-4">
              {stats.topProducts.length > 0 ? (
                stats.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-[#0f1115] rounded-2xl border border-zinc-100/50 hover:bg-zinc-100 dark:bg-[#1a1d24] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                        index === 0 ? 'bg-amber-100 text-amber-600' :
                        index === 1 ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600' :
                        'bg-orange-100 text-orange-600'
                      }`}>
                        #{index + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-zinc-900 dark:text-white">{product.name}</h4>
                        <p className="text-[11px] font-bold text-zinc-500">{product.count} طلبات مكتملة</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-black text-zinc-900 dark:text-white">{formatPrice(product.sales)}</div>
                      <div className="text-[10px] font-bold text-zinc-400">إجمالي المبيعات</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-zinc-400 font-bold text-sm bg-zinc-50 dark:bg-[#0f1115] rounded-2xl border border-dashed border-zinc-200">
                   لا توجد منتجات مباعة حتى الآن
                </div>
              )}
           </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1a1d24] rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden" dir="rtl">
        <div className="p-8 border-b border-zinc-50 flex justify-between items-center">
          <div>
            <h3 className="font-black text-zinc-900 dark:text-white">آخر العمليات</h3>
            <p className="text-[10px] font-bold text-zinc-500">قائمة بأحدث 5 طلبات في المتجر</p>
          </div>
          <button className="text-red-600 text-[12px] font-black hover:underline cursor-pointer">عرض سجل الطلبات</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right" dir="rtl">
            <thead className="bg-zinc-50 dark:bg-[#0f1115]/50">
              <tr>
                <th className="px-8 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">رقم الطلب</th>
                <th className="px-8 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">العميل</th>
                <th className="px-8 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">القيمة</th>
                <th className="px-8 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">الحالة</th>
                <th className="px-8 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {stats.recentOrders.length === 0 ? (
                <tr>
                   <td colSpan={5} className="px-8 py-12 text-center text-zinc-400 text-xs font-bold italic">لا توجد سجلات حالية</td>
                </tr>
              ) : stats.recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-zinc-50 dark:bg-[#0f1115]/30 transition-colors">
                  <td className="px-8 py-4 text-xs font-black text-zinc-900 dark:text-white">#{order.id.slice(0, 8)}</td>
                  <td className="px-8 py-4">
                     <span className="text-xs font-bold text-zinc-700 block">{order.customer_name || 'زائر'}</span>
                     <span className="text-[10px] text-zinc-400 font-medium">{order.customer_email || '-'}</span>
                  </td>
                  <td className="px-8 py-4 text-xs font-black text-zinc-900 dark:text-white">{formatPrice(order.total_price)}</td>
                  <td className="px-8 py-4">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${
                      order.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                      order.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {order.status === 'completed' ? 'مكتمل' : order.status === 'pending' ? 'معلق' : 'جاري التنفيذ'}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-[10px] font-bold text-zinc-500">
                     {new Date(order.created_at).toLocaleDateString('ar-LY')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
