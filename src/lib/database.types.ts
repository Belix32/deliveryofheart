export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          phone: string | null;
          full_name: string | null;
          avatar_url: string | null;
          role: string | null;
          is_verified: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          phone?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: string | null;
          is_verified?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          address_text: string;
          apartment: string | null;
          entrance: string | null;
          floor: string | null;
          comment: string | null;
          is_default: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          address_text: string;
          apartment?: string | null;
          entrance?: string | null;
          floor?: string | null;
          comment?: string | null;
          is_default?: boolean | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["addresses"]["Insert"]>;
      };
      restaurants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          logo_url: string | null;
          cover_url: string | null;
          address: string;
          phone: string | null;
          rating: number | null;
          review_count: number | null;
          delivery_time_min: number | null;
          delivery_time_max: number | null;
          delivery_price: number | null;
          min_order: number | null;
          is_active: boolean | null;
          city: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["restaurants"]["Row"]> & {
          name: string;
          slug: string;
          address: string;
        };
        Update: Partial<Database["public"]["Tables"]["restaurants"]["Insert"]>;
      };
      categories: {
        Row: {
          id: string;
          restaurant_id: string;
          name: string;
          sort_order: number | null;
          is_active: boolean | null;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          name: string;
          sort_order?: number | null;
          is_active?: boolean | null;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
      };
      menu_items: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          weight: string | null;
          is_available: boolean | null;
          is_special: boolean | null;
          sort_order: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          description?: string | null;
          price: number;
          image_url?: string | null;
          weight?: string | null;
          is_available?: boolean | null;
          is_special?: boolean | null;
          sort_order?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["menu_items"]["Insert"]>;
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          user_id: string;
          restaurant_id: string;
          status: string;
          delivery_address_id: string | null;
          delivery_city: string | null;
          total_amount: number | null;
          delivery_price: number | null;
          final_amount: number | null;
          discount_amount: number | null;
          coupon_code: string | null;
          payment_method: string | null;
          payment_status: string | null;
          comment: string | null;
          courier_id: string | null;
          client_name: string | null;
          client_phone: string | null;
          created_at: string | null;
          updated_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          order_number: string;
          user_id: string;
          restaurant_id: string;
          status?: string;
          delivery_address_id?: string | null;
          delivery_city?: string | null;
          total_amount?: number | null;
          delivery_price?: number | null;
          final_amount?: number | null;
          discount_amount?: number | null;
          coupon_code?: string | null;
          payment_method?: string | null;
          payment_status?: string | null;
          comment?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          menu_item_id: string;
          quantity: number;
          price: number;
          total_price: number;
          note: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          menu_item_id: string;
          quantity?: number;
          price: number;
          total_price: number;
          note?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
      };
      coupons: {
        Row: {
          id: string;
          code: string;
          description: string | null;
          discount_type: string;
          discount_value: number;
          min_order_amount: number | null;
          max_uses: number | null;
          used_count: number | null;
          is_active: boolean | null;
          valid_to: string | null;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["coupons"]["Row"]> & {
          code: string;
          discount_type: string;
          discount_value: number;
        };
        Update: Partial<Database["public"]["Tables"]["coupons"]["Insert"]>;
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          restaurant_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          restaurant_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["favorites"]["Insert"]>;
      };
      roles: {
        Row: {
          id: string;
          name: string;
          display_name: string;
          description: string | null;
          permissions: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          display_name: string;
          description?: string | null;
          permissions?: Json | null;
        };
        Update: Partial<Database["public"]["Tables"]["roles"]["Insert"]>;
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role_id: string;
          restaurant_id: string | null;
          is_active: boolean | null;
          assigned_by: string | null;
          assigned_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          role_id: string;
          restaurant_id?: string | null;
          is_active?: boolean | null;
          assigned_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["user_roles"]["Insert"]>;
      };
      couriers: {
        Row: {
          id: string;
          user_id: string;
          full_name: string | null;
          phone: string | null;
          current_city: string | null;
          is_online: boolean | null;
          is_active: boolean | null;
          vehicle_type: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["couriers"]["Row"]> & {
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["couriers"]["Insert"]>;
      };
      order_status_history: {
        Row: {
          id: string;
          order_id: string;
          status: string;
          changed_by: string | null;
          note: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          status: string;
          changed_by?: string | null;
          note?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["order_status_history"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type UserProfile = Database["public"]["Tables"]["users"]["Row"];
export type Restaurant = Database["public"]["Tables"]["restaurants"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type Address = Database["public"]["Tables"]["addresses"]["Row"];
