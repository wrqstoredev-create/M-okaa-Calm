
export type DashboardTab = 'stats' | 'orders' | 'settings' | 'users' | 'inventory' | 'products' | 'slides' | 'support' | 'sections' | 'games' | 'comments' | 'promo_banners' | 'sponsored_cards' | 'coupons';

export interface DashboardStat {
  label: string;
  value: string | number;
  change: number;
  icon: string;
  trend: 'up' | 'down' | 'neutral';
}

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean;
  contactEmail: string;
  currency: string;
}
