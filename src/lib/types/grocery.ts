export type ProductUnit = "шт" | "кг" | "л" | "уп";

export interface GroceryStore {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  city: string;
  address: string;
  phone?: string | null;
  image_url?: string | null;
  cover_url?: string | null;
  min_order_amount: number;
  delivery_price: number;
  delivery_time_min: number;
  delivery_time_max: number;
  is_active: boolean;
  sort_order?: number;
}

export interface GroceryCategory {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
}

export interface Product {
  id: string;
  store_id: string;
  category_id: string;
  name: string;
  description?: string | null;
  price: number;
  old_price?: number | null;
  unit: ProductUnit;
  quantity_step: number;
  min_quantity: number;
  max_quantity?: number | null;
  weight_label?: string | null;
  image_url?: string | null;
  stock: number;
  is_active: boolean;
}

export interface GroceryCartItem {
  product: Product;
  quantity: number;
}

export interface FoodCategoryGroup {
  name: string;
  restaurantIds: string[];
}
