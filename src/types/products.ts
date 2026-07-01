
export interface Product {
  id: string;
  game_id?: string;
  title: string;
  game_name?: string;
  price: number;
  old_price?: number;
  description?: string;
  image_url?: string;
  discount_badge?: string;
  is_featured: boolean;
  is_new: boolean;
  require_player_id: boolean;
  require_username: boolean;
  require_social_link: boolean;
  require_phone_number: boolean;
  stock?: number;
  robo_coins_bonus?: number;
  robux_quantity?: number;
  bundle_quantity?: number;
  created_at: string;
  updated_at?: string;
}
