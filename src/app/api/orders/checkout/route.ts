import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_CITY } from "@/lib/config";

interface CheckoutItem {
  menu_item_id: string;
  quantity: number;
  price: number;
}

export async function POST(request: NextRequest) {
  const result = await withAuth(async (userId) => {
    const body = await request.json();
    const {
      restaurant_id,
      items,
      address_text,
      apartment,
      comment,
      coupon_code,
      payment_method = "cash",
      delivery_price = 0,
    } = body as {
      restaurant_id: string;
      items: CheckoutItem[];
      address_text: string;
      apartment?: string;
      comment?: string;
      coupon_code?: string;
      payment_method?: string;
      delivery_price?: number;
    };

    if (!restaurant_id || !items?.length || !address_text) {
      return NextResponse.json({ error: "Неполные данные заказа" }, { status: 400 });
    }

    const admin = createAdminClient();
    const totalAmount = items.reduce((s, i) => s + i.price * i.quantity, 0);
    let discountAmount = 0;
    let appliedCoupon: string | null = null;

    if (coupon_code) {
      const { data: coupon } = await admin
        .from("coupons")
        .select("*")
        .eq("code", coupon_code.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (coupon) {
        const minOk = totalAmount >= Number(coupon.min_order_amount);
        const notExpired = !coupon.valid_to || new Date(coupon.valid_to) >= new Date();
        const hasUses = !coupon.max_uses || coupon.used_count < coupon.max_uses;

        if (minOk && notExpired && hasUses) {
          discountAmount =
            coupon.discount_type === "percent"
              ? Math.round(totalAmount * (Number(coupon.discount_value) / 100))
              : Number(coupon.discount_value);
          appliedCoupon = coupon.code;
        }
      }
    }

    const finalAmount = Math.max(0, totalAmount + delivery_price - discountAmount);
    const orderNumber =
      Date.now().toString(36).toUpperCase() +
      Math.random().toString(36).substring(2, 6).toUpperCase();

    const { data: address, error: addrError } = await admin
      .from("addresses")
      .insert({
        user_id: userId,
        address_text,
        apartment: apartment || null,
        comment: comment || null,
        is_default: false,
      })
      .select()
      .single();

    if (addrError || !address) {
      return NextResponse.json({ error: "Ошибка сохранения адреса" }, { status: 500 });
    }

    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: userId,
        restaurant_id,
        delivery_address_id: address.id,
        total_amount: totalAmount,
        delivery_price,
        final_amount: finalAmount,
        discount_amount: discountAmount,
        coupon_code: appliedCoupon,
        status: "pending",
        payment_status: "pending",
        payment_method,
        delivery_city: APP_CITY,
        comment: comment || null,
      })
      .select()
      .single();

    if (orderError || !order) {
      await admin.from("addresses").delete().eq("id", address.id);
      return NextResponse.json({ error: "Ошибка создания заказа" }, { status: 500 });
    }

    const orderItems = items.map((item) => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      price: item.price,
      total_price: item.price * item.quantity,
    }));

    const { error: itemsError } = await admin.from("order_items").insert(orderItems);

    if (itemsError) {
      await admin.from("orders").delete().eq("id", order.id);
      await admin.from("addresses").delete().eq("id", address.id);
      return NextResponse.json({ error: "Ошибка добавления позиций заказа" }, { status: 500 });
    }

    if (appliedCoupon) {
      const { data: couponRow } = await admin
        .from("coupons")
        .select("used_count")
        .eq("code", appliedCoupon)
        .single();
      if (couponRow) {
        await admin
          .from("coupons")
          .update({ used_count: (couponRow.used_count || 0) + 1 })
          .eq("code", appliedCoupon);
      }
    }

    await admin.from("order_status_history").insert({
      order_id: order.id,
      status: "pending",
      changed_by: userId,
      note: "Заказ создан",
    });

    return NextResponse.json({ order });
  });

  return result instanceof NextResponse ? result : result;
}
