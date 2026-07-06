import { z } from "zod";
import { ORDER_STATUSES } from "@/lib/order-transitions";

const uuid = z.string().uuid({ message: "Некорректный UUID" });
const nonEmptyString = z.string().trim().min(1, "Обязательное поле");

export const idQuerySchema = z.object({
  id: uuid,
});

export const userRoleIdQuerySchema = z.object({
  user_role_id: uuid,
});

export const bannerCreateSchema = z.object({
  title: nonEmptyString,
  subtitle: z.string().trim().optional().nullable(),
  image_url: nonEmptyString,
  link_url: z.string().trim().optional().nullable(),
  city: z.string().trim().optional().nullable(),
  starts_at: z.string().optional().nullable(),
  ends_at: z.string().optional().nullable(),
  is_active: z.boolean().optional().default(true),
  sort_order: z.number().int().optional(),
});

export const bannerPatchSchema = z
  .object({
    id: uuid.optional(),
    reorder: z
      .array(
        z.object({
          id: uuid,
          sort_order: z.number().int(),
        })
      )
      .optional(),
    title: z.string().trim().optional(),
    subtitle: z.string().trim().optional().nullable(),
    image_url: z.string().trim().optional(),
    link_url: z.string().trim().optional().nullable(),
    city: z.string().trim().optional().nullable(),
    starts_at: z.string().optional().nullable(),
    ends_at: z.string().optional().nullable(),
    is_active: z.boolean().optional(),
    sort_order: z.number().int().optional(),
  })
  .refine((data) => data.reorder?.length || data.id, {
    message: "Укажите id баннера или массив reorder",
    path: ["id"],
  });

export const cityCreateSchema = z.object({
  name: nonEmptyString,
  region: z.string().trim().optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

export const cityPatchSchema = z.object({
  id: uuid,
  name: z.string().trim().optional(),
  region: z.string().trim().optional().nullable(),
  is_active: z.boolean().optional(),
});

export const deliveryZoneCreateSchema = z.object({
  city_id: uuid,
  name: nonEmptyString,
  delivery_price: z.coerce.number().min(0).optional().default(0),
  min_order_amount: z.coerce.number().min(0).optional().default(0),
  is_active: z.boolean().optional().default(true),
});

export const deliveryZonePatchSchema = z.object({
  id: uuid,
  city_id: uuid.optional(),
  name: z.string().trim().optional(),
  delivery_price: z.coerce.number().min(0).optional(),
  min_order_amount: z.coerce.number().min(0).optional(),
  is_active: z.boolean().optional(),
});

export const settingsPatchSchema = z.object({
  settings: z
    .record(z.string(), z.union([z.string(), z.number()]))
    .refine((s) => Object.keys(s).length > 0, {
      message: "Укажите хотя бы одну настройку",
    }),
});

export const categoryCreateSchema = z.object({
  name: nonEmptyString,
  restaurant_id: uuid,
  sort_order: z.number().int().optional().default(0),
  is_active: z.boolean().optional().default(true),
});

export const categoryPatchSchema = z
  .object({
    id: uuid,
    name: z.string().trim().optional(),
    restaurant_id: uuid.optional(),
    sort_order: z.number().int().optional(),
    is_active: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.restaurant_id !== undefined ||
      data.sort_order !== undefined ||
      data.is_active !== undefined,
    { message: "Нет полей для обновления", path: ["id"] }
  );

export const couponCreateSchema = z.object({
  code: nonEmptyString,
  description: z.string().optional().nullable(),
  discount_type: z.enum(["percent", "fixed"], {
    message: "Тип скидки: percent или fixed",
  }),
  discount_value: z.coerce.number().positive("Размер скидки должен быть больше 0"),
  min_order_amount: z.coerce.number().min(0).optional(),
  max_uses: z.coerce.number().int().positive().optional().nullable(),
  valid_to: z.string().optional().nullable(),
  is_active: z.boolean().optional().default(true),
  scope: z.enum(["food", "grocery", "all"]).optional().default("food"),
});

export const couponPatchSchema = z.object({
  id: uuid,
  code: z.string().trim().optional(),
  description: z.string().optional().nullable(),
  discount_type: z.enum(["percent", "fixed"]).optional(),
  discount_value: z.coerce.number().positive().optional(),
  min_order_amount: z.coerce.number().min(0).optional(),
  max_uses: z.coerce.number().int().positive().optional().nullable(),
  valid_to: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
  scope: z.enum(["food", "grocery", "all"]).optional(),
});

export const restaurantCreateSchema = z.object({
  name: nonEmptyString,
  address: nonEmptyString,
  slug: z.string().trim().optional(),
  phone: z.string().trim().optional().nullable(),
  description: z.string().optional().nullable(),
  delivery_time_min: z.coerce.number().int().optional(),
  delivery_time_max: z.coerce.number().int().optional(),
  delivery_price: z.coerce.number().min(0).optional(),
  city: z.string().trim().optional(),
  is_active: z.boolean().optional().default(true),
});

export const restaurantPatchSchema = z
  .object({
    id: uuid,
    name: z.string().trim().optional(),
    address: z.string().trim().optional(),
    slug: z.string().trim().optional(),
    phone: z.string().trim().optional().nullable(),
    description: z.string().optional().nullable(),
    delivery_time_min: z.coerce.number().int().optional(),
    delivery_time_max: z.coerce.number().int().optional(),
    delivery_price: z.coerce.number().min(0).optional(),
    city: z.string().trim().optional(),
    is_active: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.address !== undefined ||
      data.slug !== undefined ||
      data.phone !== undefined ||
      data.description !== undefined ||
      data.delivery_time_min !== undefined ||
      data.delivery_time_max !== undefined ||
      data.delivery_price !== undefined ||
      data.city !== undefined ||
      data.is_active !== undefined,
    { message: "Нет полей для обновления", path: ["id"] }
  );

export const orderPatchSchema = z.object({
  order_id: uuid,
  status: z.enum(ORDER_STATUSES, {
    message: "Недопустимый статус заказа",
  }),
  note: z.string().trim().optional(),
});

export const assignRoleSchema = z.object({
  target_user_id: uuid.optional(),
  email: z.string().email("Некорректный email").optional(),
  role_name: nonEmptyString,
  restaurant_id: uuid.optional().nullable(),
});

export const restaurantAdminAssignSchema = z
  .object({
    target_user_id: uuid.optional(),
    email: z.string().email("Некорректный email").optional(),
    role_name: z.enum(["restaurant_owner", "restaurant_admin"], {
      message: "Допустимые роли: restaurant_owner, restaurant_admin",
    }),
    restaurant_id: uuid,
  })
  .refine((data) => data.target_user_id || data.email, {
    message: "Укажите пользователя (target_user_id или email)",
    path: ["target_user_id"],
  });

export const notificationTemplateCreateSchema = z.object({
  name: nonEmptyString,
  channel: z.enum(["push", "email", "sms"], {
    message: "Канал: push, email или sms",
  }),
  subject: z.string().trim().optional().nullable(),
  body: nonEmptyString,
  is_active: z.boolean().optional().default(true),
});

export const notificationTemplatePatchSchema = z.object({
  id: uuid,
  name: z.string().trim().optional(),
  channel: z.enum(["push", "email", "sms"]).optional(),
  subject: z.string().trim().optional().nullable(),
  body: z.string().trim().optional(),
  is_active: z.boolean().optional(),
});

export const notificationCampaignCreateSchema = z.object({
  template_id: uuid.optional().nullable(),
  title: nonEmptyString,
  status: z.enum(["draft", "sent_manual"]).optional().default("draft"),
});

export const notificationCampaignPatchSchema = z.object({
  id: uuid,
  status: z.string().optional(),
});

export const courierPatchSchema = z.object({
  is_active: z.boolean(),
});
