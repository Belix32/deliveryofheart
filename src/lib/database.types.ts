export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          address_text: string
          apartment: string | null
          comment: string | null
          created_at: string | null
          entrance: string | null
          floor: string | null
          id: string
          is_default: boolean | null
          user_id: string
        }
        Insert: {
          address_text: string
          apartment?: string | null
          comment?: string | null
          created_at?: string | null
          entrance?: string | null
          floor?: string | null
          id?: string
          is_default?: boolean | null
          user_id: string
        }
        Update: {
          address_text?: string
          apartment?: string | null
          comment?: string | null
          created_at?: string | null
          entrance?: string | null
          floor?: string | null
          id?: string
          is_default?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      banners: {
        Row: {
          city: string | null
          created_at: string | null
          ends_at: string | null
          id: string
          image_url: string
          is_active: boolean | null
          link_url: string | null
          sort_order: number | null
          starts_at: string | null
          subtitle: string | null
          title: string
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          ends_at?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link_url?: string | null
          sort_order?: number | null
          starts_at?: string | null
          subtitle?: string | null
          title: string
        }
        Update: {
          city?: string | null
          created_at?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_url?: string | null
          sort_order?: number | null
          starts_at?: string | null
          subtitle?: string | null
          title?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          is_active: boolean | null
          name: string
          restaurant_id: string
          sort_order: number | null
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          name: string
          restaurant_id: string
          sort_order?: number | null
        }
        Update: {
          id?: string
          is_active?: boolean | null
          name?: string
          restaurant_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          region: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          region?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          region?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order_amount: number | null
          scope: Database["public"]["Enums"]["coupon_scope_enum"]
          used_count: number | null
          valid_to: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          scope?: Database["public"]["Enums"]["coupon_scope_enum"]
          used_count?: number | null
          valid_to?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          scope?: Database["public"]["Enums"]["coupon_scope_enum"]
          used_count?: number | null
          valid_to?: string | null
        }
        Relationships: []
      }
      courier_earnings: {
        Row: {
          amount: number
          courier_id: string
          courier_order_id: string | null
          created_at: string | null
          id: string
          order_id: string | null
          order_number: string | null
          period_date: string | null
          period_type: string | null
        }
        Insert: {
          amount: number
          courier_id: string
          courier_order_id?: string | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          order_number?: string | null
          period_date?: string | null
          period_type?: string | null
        }
        Update: {
          amount?: number
          courier_id?: string
          courier_order_id?: string | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          order_number?: string | null
          period_date?: string | null
          period_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courier_earnings_courier_id_fkey"
            columns: ["courier_id"]
            isOneToOne: false
            referencedRelation: "couriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courier_earnings_courier_order_id_fkey"
            columns: ["courier_order_id"]
            isOneToOne: false
            referencedRelation: "courier_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courier_earnings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      courier_orders: {
        Row: {
          courier_id: string
          created_at: string | null
          delivery_time: string | null
          distance_km: number | null
          earnings: number | null
          id: string
          notes: string | null
          order_id: string
          pickup_time: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          courier_id: string
          created_at?: string | null
          delivery_time?: string | null
          distance_km?: number | null
          earnings?: number | null
          id?: string
          notes?: string | null
          order_id: string
          pickup_time?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          courier_id?: string
          created_at?: string | null
          delivery_time?: string | null
          distance_km?: number | null
          earnings?: number | null
          id?: string
          notes?: string | null
          order_id?: string
          pickup_time?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courier_orders_courier_id_fkey"
            columns: ["courier_id"]
            isOneToOne: false
            referencedRelation: "couriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courier_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      courier_stats: {
        Row: {
          avg_delivery_time_minutes: number | null
          avg_rating: number | null
          courier_id: string
          created_at: string | null
          id: string
          orders_cancelled: number | null
          orders_completed: number | null
          stat_date: string
          total_distance_km: number | null
          total_earnings: number | null
          updated_at: string | null
        }
        Insert: {
          avg_delivery_time_minutes?: number | null
          avg_rating?: number | null
          courier_id: string
          created_at?: string | null
          id?: string
          orders_cancelled?: number | null
          orders_completed?: number | null
          stat_date: string
          total_distance_km?: number | null
          total_earnings?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_delivery_time_minutes?: number | null
          avg_rating?: number | null
          courier_id?: string
          created_at?: string | null
          id?: string
          orders_cancelled?: number | null
          orders_completed?: number | null
          stat_date?: string
          total_distance_km?: number | null
          total_earnings?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courier_stats_courier_id_fkey"
            columns: ["courier_id"]
            isOneToOne: false
            referencedRelation: "couriers"
            referencedColumns: ["id"]
          },
        ]
      }
      couriers: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          current_city: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          rating: number | null
          status: string | null
          total_deliveries: number | null
          total_earnings: number | null
          updated_at: string | null
          user_id: string | null
          vehicle_type: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          current_city?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          rating?: number | null
          status?: string | null
          total_deliveries?: number | null
          total_earnings?: number | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_type?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          current_city?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          rating?: number | null
          status?: string | null
          total_deliveries?: number | null
          total_earnings?: number | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_type?: string | null
        }
        Relationships: []
      }
      delivery_zones: {
        Row: {
          city_id: string | null
          created_at: string | null
          delivery_price: number | null
          id: string
          is_active: boolean | null
          min_order_amount: number | null
          name: string
          polygon: Json | null
        }
        Insert: {
          city_id?: string | null
          created_at?: string | null
          delivery_price?: number | null
          id?: string
          is_active?: boolean | null
          min_order_amount?: number | null
          name: string
          polygon?: Json | null
        }
        Update: {
          city_id?: string | null
          created_at?: string | null
          delivery_price?: number | null
          id?: string
          is_active?: boolean | null
          min_order_amount?: number | null
          name?: string
          polygon?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_zones_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          restaurant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          restaurant_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          restaurant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      grocery_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grocery_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "grocery_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grocery_categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "grocery_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      grocery_order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price: number
          product_id: string
          product_name: string
          quantity: number
          sku: string | null
          total_price: number
          unit: Database["public"]["Enums"]["grocery_product_unit"]
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price: number
          product_id: string
          product_name: string
          quantity: number
          sku?: string | null
          total_price: number
          unit: Database["public"]["Enums"]["grocery_product_unit"]
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price?: number
          product_id?: string
          product_name?: string
          quantity?: number
          sku?: string | null
          total_price?: number
          unit?: Database["public"]["Enums"]["grocery_product_unit"]
        }
        Relationships: [
          {
            foreignKeyName: "grocery_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grocery_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      grocery_stores: {
        Row: {
          address: string
          city: string
          cover_url: string | null
          created_at: string
          delivery_price: number
          delivery_time_max: number
          delivery_time_min: number
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          min_order_amount: number
          name: string
          owner_user_id: string
          phone: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          address: string
          city?: string
          cover_url?: string | null
          created_at?: string
          delivery_price?: number
          delivery_time_max?: number
          delivery_time_min?: number
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          min_order_amount?: number
          name: string
          owner_user_id: string
          phone?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string
          cover_url?: string | null
          created_at?: string
          delivery_price?: number
          delivery_time_max?: number
          delivery_time_min?: number
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          min_order_amount?: number
          name?: string
          owner_user_id?: string
          phone?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          category_id: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          is_special: boolean | null
          name: string
          price: number
          restaurant_id: string | null
          sort_order: number | null
          updated_at: string | null
          weight: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_special?: boolean | null
          name: string
          price: number
          restaurant_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
          weight?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_special?: boolean | null
          name?: string
          price?: number
          restaurant_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_campaigns: {
        Row: {
          created_at: string | null
          id: string
          open_count: number | null
          sent_at: string | null
          sent_count: number | null
          status: string | null
          template_id: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          open_count?: number | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string | null
          template_id?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          open_count?: number | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string | null
          template_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          body: string
          channel: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          subject: string | null
        }
        Insert: {
          body: string
          channel?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          subject?: string | null
        }
        Update: {
          body?: string
          channel?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          menu_item_id: string
          note: string | null
          order_id: string
          price: number
          quantity: number
          total_price: number
        }
        Insert: {
          id?: string
          menu_item_id: string
          note?: string | null
          order_id: string
          price: number
          quantity?: number
          total_price: number
        }
        Update: {
          id?: string
          menu_item_id?: string
          note?: string | null
          order_id?: string
          price?: number
          quantity?: number
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string | null
          id: string
          note: string | null
          order_id: string
          status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          note?: string | null
          order_id: string
          status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          note?: string | null
          order_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          comment: string | null
          completed_at: string | null
          coupon_code: string | null
          courier_id: string | null
          created_at: string | null
          delivery_address_id: string | null
          delivery_city: string | null
          delivery_price: number | null
          discount_amount: number | null
          estimated_time: string | null
          final_amount: number | null
          grocery_store_id: string | null
          id: string
          order_number: string
          order_type: Database["public"]["Enums"]["order_type_enum"]
          payment_method: string | null
          payment_status: string | null
          restaurant_id: string | null
          status: string | null
          status_updated_at: string | null
          total_amount: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          completed_at?: string | null
          coupon_code?: string | null
          courier_id?: string | null
          created_at?: string | null
          delivery_address_id?: string | null
          delivery_city?: string | null
          delivery_price?: number | null
          discount_amount?: number | null
          estimated_time?: string | null
          final_amount?: number | null
          grocery_store_id?: string | null
          id?: string
          order_number: string
          order_type?: Database["public"]["Enums"]["order_type_enum"]
          payment_method?: string | null
          payment_status?: string | null
          restaurant_id?: string | null
          status?: string | null
          status_updated_at?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comment?: string | null
          completed_at?: string | null
          coupon_code?: string | null
          courier_id?: string | null
          created_at?: string | null
          delivery_address_id?: string | null
          delivery_city?: string | null
          delivery_price?: number | null
          discount_amount?: number | null
          estimated_time?: string | null
          final_amount?: number | null
          grocery_store_id?: string | null
          id?: string
          order_number?: string
          order_type?: Database["public"]["Enums"]["order_type_enum"]
          payment_method?: string | null
          payment_status?: string | null
          restaurant_id?: string | null
          status?: string | null
          status_updated_at?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_courier_id_fkey"
            columns: ["courier_id"]
            isOneToOne: false
            referencedRelation: "couriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_delivery_address_id_fkey"
            columns: ["delivery_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_grocery_store_id_fkey"
            columns: ["grocery_store_id"]
            isOneToOne: false
            referencedRelation: "grocery_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          max_quantity: number | null
          min_quantity: number
          name: string
          old_price: number | null
          price: number
          quantity_step: number
          sku: string | null
          sort_order: number
          stock: number
          store_id: string
          unit: Database["public"]["Enums"]["grocery_product_unit"]
          updated_at: string
          weight_label: string | null
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          max_quantity?: number | null
          min_quantity?: number
          name: string
          old_price?: number | null
          price: number
          quantity_step?: number
          sku?: string | null
          sort_order?: number
          stock?: number
          store_id: string
          unit?: Database["public"]["Enums"]["grocery_product_unit"]
          updated_at?: string
          weight_label?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          max_quantity?: number | null
          min_quantity?: number
          name?: string
          old_price?: number | null
          price?: number
          quantity_step?: number
          sku?: string | null
          sort_order?: number
          stock?: number
          store_id?: string
          unit?: Database["public"]["Enums"]["grocery_product_unit"]
          updated_at?: string
          weight_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "grocery_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "grocery_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string
          city: string | null
          cover_url: string | null
          created_at: string | null
          delivery_price: number | null
          delivery_time_max: number | null
          delivery_time_min: number | null
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          min_order: number | null
          min_order_amount: number | null
          name: string
          phone: string | null
          rating: number | null
          review_count: number | null
          slug: string
          updated_at: string | null
          working_hours: Json | null
        }
        Insert: {
          address: string
          city?: string | null
          cover_url?: string | null
          created_at?: string | null
          delivery_price?: number | null
          delivery_time_max?: number | null
          delivery_time_min?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          min_order?: number | null
          min_order_amount?: number | null
          name: string
          phone?: string | null
          rating?: number | null
          review_count?: number | null
          slug: string
          updated_at?: string | null
          working_hours?: Json | null
        }
        Update: {
          address?: string
          city?: string | null
          cover_url?: string | null
          created_at?: string | null
          delivery_price?: number | null
          delivery_time_max?: number | null
          delivery_time_min?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          min_order?: number | null
          min_order_amount?: number | null
          name?: string
          phone?: string | null
          rating?: number | null
          review_count?: number | null
          slug?: string
          updated_at?: string | null
          working_hours?: Json | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          is_visible: boolean | null
          order_id: string
          rating: number
          restaurant_id: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          order_id: string
          rating: number
          restaurant_id: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          order_id?: string
          rating?: number
          restaurant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          name: string
          permissions: Json | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          name: string
          permissions?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          name?: string
          permissions?: Json | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          restaurant_id: string | null
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          restaurant_id?: string | null
          role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          restaurant_id?: string | null
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_verified: boolean | null
          phone: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_verified?: boolean | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_verified?: boolean | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_update_order_as_staff: {
        Args: { p_courier_id: string; p_restaurant_id: string }
        Returns: boolean
      }
      can_view_order_as_staff: {
        Args: { p_restaurant_id: string }
        Returns: boolean
      }
      checkout_grocery_order: {
        Args: {
          p_address_text: string
          p_apartment?: string
          p_comment?: string
          p_coupon_code?: string
          p_delivery_city?: string
          p_entrance?: string
          p_floor?: string
          p_items: Json
          p_payment_method?: string
          p_store_id: string
          p_user_id: string
        }
        Returns: string
      }
      grocery_round_to_step: {
        Args: { p_quantity: number; p_step: number }
        Returns: number
      }
      is_admin: { Args: never; Returns: boolean }
      is_courier: { Args: never; Returns: boolean }
      is_grocery_owner: { Args: never; Returns: boolean }
      is_staff_member: { Args: never; Returns: boolean }
      owns_grocery_store: { Args: { p_store_id: string }; Returns: boolean }
      restore_grocery_order_stock: {
        Args: { p_order_id: string }
        Returns: undefined
      }
    }
    Enums: {
      coupon_scope_enum: "food" | "grocery"
      grocery_product_unit: "шт" | "кг" | "л" | "уп"
      order_type_enum: "food" | "grocery"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      coupon_scope_enum: ["food", "grocery"],
      grocery_product_unit: ["шт", "кг", "л", "уп"],
      order_type_enum: ["food", "grocery"],
    },
  },
} as const


export type UserProfile = Database['public']['Tables']['users']['Row'];
export type Restaurant = Database['public']['Tables']['restaurants']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type MenuItem = Database['public']['Tables']['menu_items']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type Address = Database['public']['Tables']['addresses']['Row'];
export type GroceryStore = Database['public']['Tables']['grocery_stores']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];
export type OrderItem = Database['public']['Tables']['order_items']['Row'];
export type Review = Database['public']['Tables']['reviews']['Row'];
export type Coupon = Database['public']['Tables']['coupons']['Row'];
export type City = Database['public']['Tables']['cities']['Row'];
export type Banner = Database['public']['Tables']['banners']['Row'];
export type DeliveryZone = Database['public']['Tables']['delivery_zones']['Row'];
export type AppSetting = Database['public']['Tables']['app_settings']['Row'];
export type NotificationTemplate = Database['public']['Tables']['notification_templates']['Row'];
export type NotificationCampaign = Database['public']['Tables']['notification_campaigns']['Row'];
export type AdminAuditLog = Database['public']['Tables']['admin_audit_logs']['Row'];
