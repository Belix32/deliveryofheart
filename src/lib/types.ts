export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo_url?: string | null;
  cover_url?: string | null;
  address: string;
  phone?: string | null;
  rating?: number | null;
  review_count?: number | null;
  delivery_time_min?: number | null;
  delivery_time_max?: number | null;
  delivery_price?: number | null;
  min_order?: number | null;
  is_active?: boolean | null;
  city?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Category {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  weight: string;
  is_available: boolean;
  is_special: boolean;
}

export interface Dish {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  image_url?: string;
  weight?: string;
  category?: string;
}

export interface CartItem {
  dish: Dish;
  quantity: number;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  restaurant_id: string;
  status: string;
  total_amount: number;
  delivery_price: number;
  final_amount: number;
  payment_status?: string;
  payment_method?: string;
  coupon_code?: string;
  discount_amount?: number;
  delivery_city?: string;
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  address_text: string;
  apartment?: string;
  entrance?: string;
  floor?: string;
  comment?: string;
  is_default: boolean;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  phone?: string;
  full_name?: string;
  avatar_url?: string;
  role?: string;
  is_verified?: boolean;
  created_at: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "waiting_courier"
  | "in_delivery"
  | "delivered"
  | "cancelled"
  | "accepted"
  | "onTheWay";
