import type { Courier, CourierOrder, CourierStatsSummary } from "@/lib/types/courier";

async function parseJson<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || "Request failed");
  }
  return data as T;
}

export async function fetchCourierProfile(): Promise<Courier | null> {
  const res = await fetch("/api/courier/profile");
  const data = await parseJson<{ profile: Courier | null }>(res);
  return data.profile;
}

export async function setCourierOnlineStatus(
  status: "online" | "offline" | "busy"
): Promise<boolean> {
  const res = await fetch("/api/courier/status", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  await parseJson(res);
  return true;
}

export async function fetchCourierStats(): Promise<CourierStatsSummary> {
  const res = await fetch("/api/courier/stats");
  return parseJson<CourierStatsSummary>(res);
}

export async function fetchAvailableOrders(): Promise<unknown[]> {
  const res = await fetch("/api/courier/orders?type=available");
  const data = await parseJson<{ orders: unknown[] }>(res);
  return data.orders || [];
}

export async function fetchCourierOrders(): Promise<CourierOrder[]> {
  const res = await fetch("/api/courier/orders?type=assigned");
  const data = await parseJson<{ orders: CourierOrder[] }>(res);
  return data.orders || [];
}

export async function acceptCourierOrder(orderId: string): Promise<void> {
  const res = await fetch(`/api/courier/orders/${orderId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "accept" }),
  });
  await parseJson(res);
}

export async function updateCourierOrderStatus(
  orderId: string,
  status: "accepted" | "picked_up" | "in_delivery" | "delivered" | "cancelled" | "failed"
): Promise<void> {
  const res = await fetch(`/api/courier/orders/${orderId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  await parseJson(res);
}

export async function fetchCourierEarnings(
  period: "daily" | "weekly" | "monthly" = "daily"
): Promise<unknown[]> {
  const res = await fetch(`/api/courier/earnings?period=${period}`);
  const data = await parseJson<{ earnings: unknown[] }>(res);
  return data.earnings || [];
}
