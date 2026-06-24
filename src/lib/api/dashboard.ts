import { createAdminClient } from "@/lib/supabase/admin";
import { APP_CITY } from "@/lib/config";

export interface DashboardOrder {
  id: string;
  order_number: string;
  status: string;
  final_amount: number;
  created_at: string;
  restaurant_name: string | null;
}

export interface TopRestaurant {
  id: string;
  name: string;
  orders_count: number;
  revenue: number;
}

export interface DayStat {
  date: string;
  label: string;
  orders: number;
  revenue: number;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface DashboardStats {
  summary: {
    ordersToday: number;
    ordersYesterday: number;
    ordersChangePercent: number | null;
    revenueToday: number;
    revenueYesterday: number;
    revenueChangePercent: number | null;
    avgCheckToday: number;
    avgCheckYesterday: number;
    avgCheckChangePercent: number | null;
    newUsersToday: number;
    newUsersYesterday: number;
    usersChangePercent: number | null;
    pendingOrders: number;
    activeRestaurants: number;
    totalRestaurants: number;
    onlineCouriers: number;
    totalCouriers: number;
    deliveredToday: number;
    cancelledToday: number;
    city: string;
  };
  recentOrders: DashboardOrder[];
  topRestaurants: TopRestaurant[];
  revenueByDay: DayStat[];
  ordersByStatus: StatusCount[];
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }
  return Math.round(((current - previous) / previous) * 100);
}

function dayLabel(date: Date): string {
  return date.toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "short" });
}

function isBetween(iso: string, from: Date, to: Date): boolean {
  const t = new Date(iso).getTime();
  return t >= from.getTime() && t <= to.getTime();
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const admin = createAdminClient();
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const yesterdayStart = startOfDay(new Date(now.getTime() - 86400000));
  const yesterdayEnd = endOfDay(new Date(now.getTime() - 86400000));
  const weekAgo = startOfDay(new Date(now.getTime() - 6 * 86400000));

  const [
    ordersResult,
    restaurantsResult,
    couriersResult,
    usersResult,
  ] = await Promise.all([
    admin
      .from("orders")
      .select("id, order_number, status, final_amount, created_at, restaurant_id, delivery_city")
      .gte("created_at", weekAgo.toISOString())
      .order("created_at", { ascending: false }),
    admin.from("restaurants").select("id, name, is_active, city"),
    admin.from("couriers").select("id, status, is_active, current_city"),
    admin.from("users").select("id, created_at"),
  ]);

  const orders = ordersResult.data || [];
  const restaurants = restaurantsResult.data || [];
  const couriers = couriersResult.data || [];
  const users = usersResult.data || [];

  const cityOrders = orders.filter(
    (o) => !o.delivery_city || o.delivery_city === APP_CITY
  );

  const todayOrders = cityOrders.filter((o) =>
    isBetween(o.created_at, todayStart, todayEnd)
  );
  const yesterdayOrders = cityOrders.filter((o) =>
    isBetween(o.created_at, yesterdayStart, yesterdayEnd)
  );

  const revenueToday = todayOrders.reduce((s, o) => s + Number(o.final_amount || 0), 0);
  const revenueYesterday = yesterdayOrders.reduce(
    (s, o) => s + Number(o.final_amount || 0),
    0
  );

  const avgCheckToday =
    todayOrders.length > 0 ? Math.round(revenueToday / todayOrders.length) : 0;
  const avgCheckYesterday =
    yesterdayOrders.length > 0
      ? Math.round(revenueYesterday / yesterdayOrders.length)
      : 0;

  const newUsersToday = users.filter((u) =>
    isBetween(u.created_at, todayStart, todayEnd)
  ).length;
  const newUsersYesterday = users.filter((u) =>
    isBetween(u.created_at, yesterdayStart, yesterdayEnd)
  ).length;

  const restaurantMap = new Map(restaurants.map((r) => [r.id, r.name]));

  const revenueByDay: DayStat[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const from = startOfDay(d);
    const to = endOfDay(d);
    const dayOrders = cityOrders.filter((o) => isBetween(o.created_at, from, to));
    revenueByDay.push({
      date: from.toISOString().split("T")[0],
      label: dayLabel(d),
      orders: dayOrders.length,
      revenue: dayOrders.reduce((s, o) => s + Number(o.final_amount || 0), 0),
    });
  }

  const statusMap = new Map<string, number>();
  for (const o of todayOrders) {
    statusMap.set(o.status, (statusMap.get(o.status) || 0) + 1);
  }
  const ordersByStatus: StatusCount[] = Array.from(statusMap.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  const restaurantStats = new Map<string, { orders: number; revenue: number }>();
  for (const o of cityOrders) {
    if (!o.restaurant_id) continue;
    const cur = restaurantStats.get(o.restaurant_id) || { orders: 0, revenue: 0 };
    cur.orders += 1;
    cur.revenue += Number(o.final_amount || 0);
    restaurantStats.set(o.restaurant_id, cur);
  }

  const topRestaurants: TopRestaurant[] = Array.from(restaurantStats.entries())
    .map(([id, stat]) => ({
      id,
      name: restaurantMap.get(id) || "Без названия",
      orders_count: stat.orders,
      revenue: stat.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const [recentResult, pendingResult] = await Promise.all([
    admin
      .from("orders")
      .select("id, order_number, status, final_amount, created_at, restaurants(name), delivery_city")
      .order("created_at", { ascending: false })
      .limit(10),
    admin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "confirmed", "preparing", "ready", "waiting_courier"])
      .or(`delivery_city.eq.${APP_CITY},delivery_city.is.null`),
  ]);

  const recentRaw = recentResult.data;
  const pendingOrders = pendingResult.count ?? 0;

  const recentOrders: DashboardOrder[] = (recentRaw || [])
    .filter((o) => !o.delivery_city || o.delivery_city === APP_CITY)
    .map((o) => ({
      id: o.id,
      order_number: o.order_number,
      status: o.status,
      final_amount: Number(o.final_amount || 0),
      created_at: o.created_at,
      restaurant_name: (o.restaurants as { name?: string } | null)?.name ?? null,
    }));

  const cityRestaurants = restaurants.filter((r) => r.city === APP_CITY);
  const cityCouriers = couriers.filter(
    (c) => !c.current_city || c.current_city === APP_CITY
  );

  return {
    summary: {
      ordersToday: todayOrders.length,
      ordersYesterday: yesterdayOrders.length,
      ordersChangePercent: pctChange(todayOrders.length, yesterdayOrders.length),
      revenueToday,
      revenueYesterday,
      revenueChangePercent: pctChange(revenueToday, revenueYesterday),
      avgCheckToday,
      avgCheckYesterday,
      avgCheckChangePercent: pctChange(avgCheckToday, avgCheckYesterday),
      newUsersToday,
      newUsersYesterday,
      usersChangePercent: pctChange(newUsersToday, newUsersYesterday),
      pendingOrders,
      activeRestaurants: cityRestaurants.filter((r) => r.is_active).length,
      totalRestaurants: cityRestaurants.length,
      onlineCouriers: cityCouriers.filter(
        (c) => c.is_active !== false && c.status === "online"
      ).length,
      totalCouriers: cityCouriers.filter((c) => c.is_active !== false).length,
      deliveredToday: todayOrders.filter((o) => o.status === "delivered").length,
      cancelledToday: todayOrders.filter((o) => o.status === "cancelled").length,
      city: APP_CITY,
    },
    recentOrders,
    topRestaurants,
    revenueByDay,
    ordersByStatus,
  };
}
