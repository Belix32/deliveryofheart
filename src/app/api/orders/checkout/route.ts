import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_CITY } from "@/lib/config";
import { isAllowedPaymentMethod, normalizePaymentMethod } from "@/lib/orders/payment-method";

interface CheckoutItem {
  menu_item_id: string;
  quantity: number;
  price?: number;
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
      payment_method: rawPaymentMethod = "cash",
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

    if (!restaurant_id || !items?.length || !address_text?.trim()) {
      return NextResponse.json({ error: "Неполные данные заказа" }, { status: 400 });
    }

    if (rawPaymentMethod != null && !isAllowedPaymentMethod(rawPaymentMethod)) {
      return NextResponse.json({ error: "Неверный способ оплаты" }, { status: 400 });
    }
    const payment_method = normalizePaymentMethod(rawPaymentMethod);

    const admin = createAdminClient();

    const { data: restaurant, error: restaurantError } = await admin
      .from("restaurants")
      .select("id, delivery_price, min_order_amount, is_active")
      .eq("id", restaurant_id)
      .single();

    if (restaurantError || !restaurant) {
      return NextResponse.json({ error: "Ресторан не найден" }, { status: 404 });
    }

    if (!restaurant.is_active) {
      return NextResponse.json({ error: "Ресторан временно недоступен" }, { status: 400 });
    }

    const itemIds = items.map((i) => i.menu_item_id);
    const { data: menuItems, error: menuError } = await admin
      .from("menu_items")
      .select("id, price, is_available, restaurant_id, name")
      .in("id", itemIds);

    if (menuError || !menuItems?.length) {
      return NextResponse.json({ error: "Позиции меню не найдены" }, { status: 400 });
    }

    const validatedItems: {
      menu_item_id: string;
      quantity: number;
      price: number;
      total_price: number;
    }[] = [];

    let totalAmount = 0;

    for (const item of items) {
      const menuItem = menuItems.find((m) => m.id === item.menu_item_id);
      if (!menuItem || menuItem.restaurant_id !== restaurant_id) {
        return NextResponse.json(
          { error: "Некорректная позиция в заказе" },
          { status: 400 }
        );
      }
      if (!menuItem.is_available) {
        return NextResponse.json(
          { error: `«${menuItem.name}» недоступно для заказа` },
          { status: 400 }
        );
      }

      const quantity = Math.max(1, Math.min(99, Math.floor(Number(item.quantity) || 1)));
      const price = Number(menuItem.price);
      totalAmount += price * quantity;
      validatedItems.push({
        menu_item_id: menuItem.id,
        quantity,
        price,
        total_price: price * quantity,
      });
    }

    const minOrder = Number(restaurant.min_order_amount) || 0;
    if (minOrder > 0 && totalAmount < minOrder) {
      return NextResponse.json(
        { error: `Минимальная сумма заказа: ${minOrder} ₽` },
        { status: 400 }
      );
    }

    const deliveryPrice = Number(restaurant.delivery_price) || 0;
    let discountAmount = 0;
    let appliedCoupon: string | null = null;
    let couponRow: { used_count: number | null; max_uses: number | null } | null = null;

    if (coupon_code) {
      const { data: coupon } = await admin
        .from("coupons")
        .select("*")
        .eq("code", coupon_code.toUpperCase())
        .eq("is_active", true)
        .eq("scope", "food")
        .maybeSingle();

      if (coupon) {
        const minOk = totalAmount >= Number(coupon.min_order_amount);
        const notExpired = !coupon.valid_to || new Date(coupon.valid_to) >= new Date();
        const hasUses = !coupon.max_uses || (coupon.used_count || 0) < coupon.max_uses;

        if (minOk && notExpired && hasUses) {
          discountAmount =
            coupon.discount_type === "percent"
              ? Math.round(totalAmount * (Number(coupon.discount_value) / 100))
              : Number(coupon.discount_value);
          appliedCoupon = coupon.code;
          couponRow = {
            used_count: coupon.used_count,
            max_uses: coupon.max_uses,
          };
        }
      }
    }

    const finalAmount = Math.max(0, totalAmount + deliveryPrice - discountAmount);
    const orderNumber =
      Date.now().toString(36).toUpperCase() +
      Math.random().toString(36).substring(2, 6).toUpperCase();

    const { data: address, error: addrError } = await admin
      .from("addresses")
      .insert({
        user_id: userId,
        address_text: address_text.trim(),
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
        delivery_price: deliveryPrice,
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

    const orderItems = validatedItems.map((item) => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      price: item.price,
      total_price: item.total_price,
    }));

    const { error: itemsError } = await admin.from("order_items").insert(orderItems);

    if (itemsError) {
      await admin.from("orders").delete().eq("id", order.id);
      await admin.from("addresses").delete().eq("id", address.id);
      return NextResponse.json({ error: "Ошибка добавления позиций заказа" }, { status: 500 });
    }

    if (appliedCoupon && couponRow) {
      const nextCount = (couponRow.used_count || 0) + 1;
      let couponUpdate = admin
        .from("coupons")
        .update({ used_count: nextCount })
        .eq("code", appliedCoupon)
        .eq("used_count", couponRow.used_count ?? 0);

      if (couponRow.max_uses) {
        couponUpdate = couponUpdate.lt("used_count", couponRow.max_uses);
      }

      const { data: updatedCoupon } = await couponUpdate.select("code").maybeSingle();

      if (!updatedCoupon) {
        await admin.from("order_items").delete().eq("order_id", order.id);
        await admin.from("orders").delete().eq("id", order.id);
        await admin.from("addresses").delete().eq("id", address.id);
        return NextResponse.json(
          { error: "Купон больше недоступен" },
          { status: 400 }
        );
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
