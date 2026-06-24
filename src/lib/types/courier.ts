export interface Courier {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email?: string;
  avatar_url?: string;
  status: "online" | "offline" | "busy";
  is_online?: boolean;
  current_city: string;
  vehicle_type: 'bike' | 'car' | 'walk' | 'scooter';
  rating: number;
  total_deliveries: number;
  total_earnings: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourierOrder {
  id: string;
  courier_id: string;
  order_id: string;
  status: 'pending' | 'assigned' | 'accepted' | 'picked_up' | 'in_delivery' | 'delivered' | 'cancelled' | 'failed';
  earnings: number;
  distance_km?: number;
  pickup_time?: string;
  delivery_time?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  order?: any;
}

export interface CourierEarnings {
  id: string;
  courier_id: string;
  courier_order_id?: string;
  amount: number;
  order_id?: string;
  order_number?: string;
  period_type: 'daily' | 'weekly' | 'monthly';
  period_date: string;
  created_at: string;
}

export interface CourierStats {
  id: string;
  courier_id: string;
  stat_date: string;
  orders_completed: number;
  orders_cancelled: number;
  total_earnings: number;
  total_distance_km: number;
  avg_delivery_time_minutes?: number;
  avg_rating?: number;
  created_at: string;
  updated_at: string;
}

export interface CourierStatsSummary {
  today: {
    orders_completed: number;
    total_earnings: number;
    total_distance_km: number;
  };
  week: {
    orders_completed: number;
    total_earnings: number;
    total_distance_km: number;
  };
  month: {
    orders_completed: number;
    total_earnings: number;
    total_distance_km: number;
  };
}