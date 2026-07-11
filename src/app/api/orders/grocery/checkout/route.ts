import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_CITY } from "@/lib/config";
import { isAllowedPaymentMethod, normalizePaymentMethod } from "@/lib/orders/payment-method";

interface GroceryCheckoutItem {
  product_id: string;
  quantity: number;
  price: number;
}

export async function POST(request: NextRequest) {
  const result = await withAuth(async (userId) => {
    const body = await request.json();
    const {
      store_id,
      items,
      address_text,
      apartment,
      entrance,
      floor,
      comment,
      coupon_code,
      payment_method: rawPaymentMethod = "cash",
    } = body as {
      store_id: string;
      items: GroceryCheckoutItem[];
      address_text: string;
      apartment?: string;
      entrance?: string;
      floor?: string;
      comment?: string;
      coupon_code?: string;
      payment_method?: string;
    };

    if (!store_id || !items?.length || !address_text?.trim()) {
      return NextResponse.json({ error: "Неполные данные заказа" }, { status: 400 });
    }

    if (rawPaymentMethod != null && !isAllowedPaymentMethod(rawPaymentMethod)) {
      return NextResponse.json({ error: "Неверный способ оплаты" }, { status: 400 });
    }
    const payment_method = normalizePaymentMethod(rawPaymentMethod);

    const admin = createAdminClient();

    const rpcItems = items.map((i) => ({
      product_id: i.product_id,
      quantity: i.quantity,
      price: i.price,
    }));

    const { data: orderId, error } = await admin.rpc("checkout_grocery_order", {
      p_user_id: userId,
      p_store_id: store_id,
      p_items: rpcItems,
      p_address_text: address_text.trim(),
      p_apartment: apartment || null,
      p_entrance: entrance || null,
      p_floor: floor || null,
      p_comment: comment || null,
      p_coupon_code: coupon_code || null,
      p_payment_method: payment_method,
      p_delivery_city: APP_CITY,
    });

    if (error) {
      console.error("checkout_grocery_order:", error);
      const msg = error.message?.includes("below minimum")
        ? "Сумма заказа ниже минимальной"
        : error.message?.includes("stock")
          ? "Недостаточно товара на складе"
          : "Ошибка оформления заказа";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { data: order } = await admin
      .from("orders")
      .select("id, order_number")
      .eq("id", orderId)
      .single();

    return NextResponse.json({ order });
  });

  return result instanceof NextResponse ? result : result;
}
