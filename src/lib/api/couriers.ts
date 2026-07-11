import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { APP_CITY } from "@/lib/config";
import type { Courier, CourierOrder, CourierEarnings, CourierStatsSummary } from "@/lib/types/courier";

function db() {
  return createAdminClient();
}

// =====================================================
// COURIER PROFILE OPERATIONS
// =====================================================

/**
 * Получить профиль текущего курьера по user_id
 */
export async function getCourierProfile(userId: string): Promise<Courier | null> {
  
  const { data, error } = await db()
    .from('couriers')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    console.error('[couriers.api] getCourierProfile error:', error);
    return null;
  }
  
  return data;
}

/**
 * Получить профиль курьера по courier_id
 */
export async function getCourierProfileById(courierId: string): Promise<Courier | null> {
  
  const { data, error } = await db()
    .from('couriers')
    .select('*')
    .eq('id', courierId)
    .single();
  
  if (error) {
    console.error('[couriers.api] getCourierProfileById error:', error);
    return null;
  }
  
  return data;
}

const COURIER_PROFILE_FIELDS = [
  "name",
  "phone",
  "vehicle_type",
  "current_city",
  "avatar_url",
] as const;

function pickCourierProfileFields(data: Partial<Courier>): Partial<Courier> {
  const picked: Partial<Courier> = {};
  for (const key of COURIER_PROFILE_FIELDS) {
    if (data[key] !== undefined) {
      (picked as Record<string, unknown>)[key] = data[key];
    }
  }
  return picked;
}

/**
 * Создать/обновить профиль курьера
 */
export async function upsertCourierProfile(
  userId: string,
  data: Partial<Courier>
): Promise<Courier | null> {
  
  const safeFields = pickCourierProfileFields(data);

  // Check if profile exists
  const { data: existing } = await db()
    .from('couriers')
    .select('id')
    .eq('user_id', userId)
    .single();
  
  const profileData = {
    user_id: userId,
    current_city: safeFields.current_city || APP_CITY,
    ...safeFields,
    updated_at: new Date().toISOString(),
  };
  
  let result;
  if (existing) {
    // Update existing
    result = await db()
      .from('couriers')
      .update(profileData)
      .eq('user_id', userId)
      .select()
      .single();
  } else {
    // Insert new
    result = await db()
      .from('couriers')
      .insert({
        ...profileData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
  }
  
  if (result.error) {
    console.error('[couriers.api] upsertCourierProfile error:', result.error);
    return null;
  }
  
  return result.data;
}

/**
 * Изменить статус курьера (online/offline/busy)
 */
export async function setCourierStatus(
  courierId: string,
  status: 'online' | 'offline' | 'busy'
): Promise<boolean> {
  
  const { error } = await db()
    .from('couriers')
    .update({ 
      status, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', courierId);
  
  if (error) {
    console.error('[couriers.api] setCourierStatus error:', error);
    return false;
  }
  
  return true;
}

// =====================================================
// ORDER OPERATIONS
// =====================================================

/**
 * Получить доступные заказы для курьера в городе
 */
export async function getAvailableOrders(city: string): Promise<any[]> {
  
  // Orders ready for courier pickup
  const { data, error } = await db()
    .from('orders')
    .select(`
      *,
      restaurants (name, address, phone)
    `)
    .in('status', ['waiting_courier'])
    .is('courier_id', null)
    .eq('delivery_city', city)
    .order('created_at', { ascending: false })
    .limit(50);
  
  if (error) {
    console.error('[couriers.api] getAvailableOrders error:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Получить все заказы (независимо от статуса) для курьера
 */
export async function getOrdersForCourier(courierId: string): Promise<any[]> {
  
  // Get order_ids assigned to this courier
  const { data: courierOrders } = await db()
    .from('courier_orders')
    .select('order_id')
    .eq('courier_id', courierId);
  
  if (!courierOrders || courierOrders.length === 0) {
    return [];
  }
  
  const orderIds = courierOrders.map(co => co.order_id);
  
  const { data, error } = await db()
    .from('orders')
    .select(`
      *,
      restaurants (name, address, phone)
    `)
    .in('id', orderIds)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('[couriers.api] getOrdersForCourier error:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Принять заказ (только waiting_courier в городе курьера)
 */
export async function acceptOrder(
  orderId: string,
  courierId: string,
  deliveryCity: string
): Promise<boolean> {
  const admin = db();
  const city = deliveryCity?.trim() || APP_CITY;

  const { data: claimed, error: claimError } = await admin
    .from('orders')
    .update({
      courier_id: courierId,
      status: 'in_delivery',
      updated_at: new Date().toISOString(),
      status_updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('status', 'waiting_courier')
    .eq('delivery_city', city)
    .is('courier_id', null)
    .select('id')
    .maybeSingle();

  if (claimError || !claimed) {
    console.error('[couriers.api] acceptOrder: order unavailable or already claimed');
    return false;
  }

  const { error: insertError } = await admin
    .from('courier_orders')
    .insert({
      courier_id: courierId,
      order_id: orderId,
      status: 'assigned',
    });

  if (insertError) {
    console.error('[couriers.api] acceptOrder insert error:', insertError);
    await admin
      .from('orders')
      .update({
        courier_id: null,
        status: 'waiting_courier',
        updated_at: new Date().toISOString(),
        status_updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('courier_id', courierId);
    return false;
  }

  await admin.from('order_status_history').insert({
    order_id: orderId,
    status: 'in_delivery',
    changed_by: courierId,
    note: 'Курьер принял заказ',
  });

  await setCourierStatus(courierId, 'busy');

  return true;
}

/**
 * Обновить статус заказа
 */
export async function updateOrderStatus(
  orderId: string,
  courierId: string,
  status: 'accepted' | 'picked_up' | 'in_delivery' | 'delivered' | 'cancelled' | 'failed'
): Promise<boolean> {
  
  // Find courier_order
  const { data: courierOrder } = await db()
    .from('courier_orders')
    .select('*')
    .eq('order_id', orderId)
    .eq('courier_id', courierId)
    .single();
  
  if (!courierOrder) {
    console.error('[couriers.api] updateOrderStatus: courier_order not found');
    return false;
  }
  
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };
  
  if (status === 'picked_up') {
    updateData.pickup_time = new Date().toISOString();
  } else if (status === 'delivered') {
    updateData.delivery_time = new Date().toISOString();
  }
  
  // Update courier_order
  const { error } = await db()
    .from('courier_orders')
    .update(updateData)
    .eq('id', courierOrder.id);
  
  if (error) {
    console.error('[couriers.api] updateOrderStatus error:', error);
    return false;
  }
  
  // Update main order status
  let orderStatus: string | null = null;
  if (status === "delivered") {
    orderStatus = "delivered";
  } else if (status === "cancelled" || status === "failed") {
    orderStatus = "cancelled";
  } else if (["accepted", "picked_up", "in_delivery"].includes(status)) {
    orderStatus = "in_delivery";
  }

  if (orderStatus) {
    await db()
      .from("orders")
      .update({
        status: orderStatus,
        updated_at: new Date().toISOString(),
        status_updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);
  }
  
  // If delivered, set courier back to online
  if (status === 'delivered') {
    await setCourierStatus(courierId, 'online');
  }
  
  return true;
}

// =====================================================
// COURIER ORDERS
// =====================================================

/**
 * Получить заказы курьера
 */
export async function getCourierOrders(
  courierId: string,
  status?: string
): Promise<CourierOrder[]> {
  
  let query = db()
    .from('courier_orders')
    .select(`
      *,
      orders (*, restaurants (name))
    `)
    .eq('courier_id', courierId);
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) {
    console.error('[couriers.api] getCourierOrders error:', error);
    return [];
  }
  
  return data || [];
}

// =====================================================
// EARNINGS OPERATIONS
// =====================================================

/**
 * Получить заработок курьера
 */
export async function getCourierEarnings(
  courierId: string,
  period: 'daily' | 'weekly' | 'monthly' = 'daily'
): Promise<CourierEarnings[]> {
  
  let startDate: string;
  const now = new Date();
  
  if (period === 'daily') {
    startDate = now.toISOString().split('T')[0];
  } else if (period === 'weekly') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    startDate = weekAgo.toISOString().split('T')[0];
  } else {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    startDate = monthAgo.toISOString().split('T')[0];
  }
  
  const { data, error } = await db()
    .from('courier_earnings')
    .select('*')
    .eq('courier_id', courierId)
    .gte('period_date', startDate)
    .order('period_date', { ascending: false });
  
  if (error) {
    console.error('[couriers.api] getCourierEarnings error:', error);
    return [];
  }
  
  return data || [];
}

// =====================================================
// STATS OPERATIONS
// =====================================================

/**
 * Получить статистику курьера
 */
export async function getCourierStats(courierId: string): Promise<CourierStatsSummary> {
  
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  
  // Today stats
  const { data: todayStats } = await db()
    .from('courier_stats')
    .select('orders_completed, total_earnings, total_distance_km')
    .eq('courier_id', courierId)
    .eq('stat_date', todayStr)
    .single();
  
  // Week stats
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekAgoStr = weekAgo.toISOString().split('T')[0];
  
  const { data: weekStats } = await db()
    .from('courier_stats')
    .select('orders_completed, total_earnings, total_distance_km')
    .eq('courier_id', courierId)
    .gte('stat_date', weekAgoStr);
  
  // Month stats
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const monthAgoStr = monthAgo.toISOString().split('T')[0];
  
  const { data: monthStats } = await db()
    .from('courier_stats')
    .select('orders_completed, total_earnings, total_distance_km')
    .eq('courier_id', courierId)
    .gte('stat_date', monthAgoStr);
  
  const aggregateStats = (stats: any[]) => ({
    orders_completed: stats?.reduce((sum, s) => sum + (s.orders_completed || 0), 0) || 0,
    total_earnings: stats?.reduce((sum, s) => sum + parseFloat(s.total_earnings || '0'), 0) || 0,
    total_distance_km: stats?.reduce((sum, s) => sum + parseFloat(s.total_distance_km || '0'), 0) || 0,
  });
  
  return {
    today: todayStats ? {
      orders_completed: todayStats.orders_completed || 0,
      total_earnings: parseFloat(todayStats.total_earnings || '0'),
      total_distance_km: parseFloat(todayStats.total_distance_km || '0'),
    } : { orders_completed: 0, total_earnings: 0, total_distance_km: 0 },
    week: aggregateStats(weekStats || []),
    month: aggregateStats(monthStats || []),
  };
}

// =====================================================
// ADMIN OPERATIONS
// =====================================================

/**
 * Получить всех курьеров (admin)
 */
export async function getAllCouriers(filters?: {
  status?: string;
  city?: string;
  isActive?: boolean;
}): Promise<Courier[]> {
  
  let query = db()
    .from('couriers')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.city) {
    query = query.eq('current_city', filters.city);
  }
  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('[couriers.api] getAllCouriers error:', error);
    return [];
  }
  
  return data || [];
}