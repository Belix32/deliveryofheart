import { createAdminClient } from "@/lib/supabase/admin";

function db() {
  return createAdminClient();
}

/**
 * Интерфейс для истории статусов заказа
 */
export interface StatusHistory {
  id: string;
  order_id: string;
  status: string;
  changed_by: string | null;
  note: string | null;
  created_at: string;
}

/**
 * Интерфейс для заказа (расширенный)
 */
export interface RestaurantOrder {
  id: string;
  order_number: string;
  user_id: string;
  restaurant_id: string;
  status: string;
  total_amount: number;
  delivery_price: number;
  final_amount: number;
  created_at: string;
  updated_at: string | null;
  status_history: StatusHistory[];
  client_name?: string;
  client_phone?: string;
  courier_id?: string;
  // Связанные данные
  users?: {
    full_name: string;
    phone: string;
  };
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  name: string;
  quantity: number;
  price: number;
  total_price: number;
}

/**
 * Обновить статус заказа
 * @param orderId - ID заказа
 * @param status - Новый статус
 * @param note - Примечание к изменению статуса
 * @param changedBy - ID пользователя, изменившего статус
 * @returns true при успехе
 */
export async function updateOrderStatus(
  orderId: string,
  status: string,
  note?: string,
  changedBy?: string
): Promise<boolean> {
  console.log('[orders.api] updateOrderStatus called:', { orderId, status, note, changedBy });

  // Проверяем валидность статуса
  const validStatuses = [
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'waiting_courier',
    'in_delivery',
    'delivered',
    'cancelled'
  ];

  if (!validStatuses.includes(status)) {
    console.error('[orders.api] Неверный статус:', status);
    return false;
  }

  // Обновляем заказ
  const { error: updateError } = await db()
    .from('orders')
    .update({
      status,
      status_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (updateError) {
    console.error('[orders.api] Ошибка обновления заказа:', updateError);
    return false;
  }

  // Записываем историю статусов
  const { error: historyError } = await db()
    .from('order_status_history')
    .insert({
      order_id: orderId,
      status,
      changed_by: changedBy || null,
      note: note || null,
    });

  if (historyError) {
    console.error('[orders.api] Ошибка записи истории статусов:', historyError);
    // Продолжаем, даже если не удалось записать историю
  }

  console.log('[orders.api] Статус заказа успешно обновлён');
  return true;
}

/**
 * Получить заказы ресторана
 * @param restaurantId - ID ресторана
 * @param status - Фильтр по статусу (опционально)
 * @returns Массив заказов
 */
export async function getRestaurantOrders(
  restaurantId: string,
  status?: string
): Promise<RestaurantOrder[]> {
  console.log('[orders.api] getRestaurantOrders called:', { restaurantId, status });

  let query = db()
    .from('orders')
    .select(`
      *,
      users!orders_user_id_fkey(full_name, phone),
      order_items(*)
    `)
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[orders.api] Ошибка получения заказов ресторана:', error);
    return [];
  }

  console.log('[orders.api] Получено заказов:', data?.length || 0);
  return data || [];
}

/**
 * Получить историю статусов заказа
 * @param orderId - ID заказа
 * @returns Массив записей истории
 */
export async function getOrderHistory(orderId: string): Promise<StatusHistory[]> {
  console.log('[orders.api] getOrderHistory called:', orderId);

  const { data, error } = await db()
    .from('order_status_history')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[orders.api] Ошибка получения истории статусов:', error);
    return [];
  }

  return data || [];
}

/**
 * Проверить права на управление заказами ресторана
 * @param userId - ID пользователя
 * @param restaurantId - ID ресторана
 * @returns true если пользователь имеет право
 */
export async function checkRestaurantOrderAccess(
  userId: string,
  restaurantId: string
): Promise<boolean> {
  console.log('[orders.api] checkRestaurantOrderAccess called:', { userId, restaurantId });

  const { data: userRoles, error } = await db()
    .from('user_roles')
    .select('*, roles(name)')
    .eq('user_id', userId)
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true);

  if (error) {
    console.error('[orders.api] Ошибка проверки прав:', error);
    return false;
  }

  // Проверяем роль: restaurant_owner или restaurant_admin
  const hasAccess = userRoles?.some(
    (ur: any) => ur.roles?.name === 'restaurant_owner' || ur.roles?.name === 'restaurant_admin'
  );

  console.log('[orders.api] Проверка прав:', hasAccess ? 'доступ разрешён' : 'доступ запрещён');
  return hasAccess || false;
}

/**
 * Проверить, является ли пользователь администратором системы
 * @param userId - ID пользователя
 * @returns true если пользователь админ
 */
export async function checkIsAdmin(userId: string): Promise<boolean> {
  console.log('[orders.api] checkIsAdmin called:', userId);

  const { data: userRoles, error } = await db()
    .from('user_roles')
    .select('*, roles(name)')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    console.error('[orders.api] Ошибка проверки админа:', error);
    return false;
  }

  const isAdmin = userRoles?.some((ur: any) => ur.roles?.name === 'admin');
  return isAdmin || false;
}

/**
 * Получить ID ресторана для пользователя
 * @param userId - ID пользователя
 * @returns ID ресторана или null
 */
export async function getUserRestaurantId(userId: string): Promise<string | null> {
  console.log('[orders.api] getUserRestaurantId called:', userId);

  const { data: userRoles, error } = await db()
    .from('user_roles')
    .select('restaurant_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .in('role_name', ['restaurant_owner', 'restaurant_admin'])
    .single();

  if (error) {
    console.error('[orders.api] Ошибка получения restaurant_id:', error);
    return null;
  }

  return userRoles?.restaurant_id || null;
}