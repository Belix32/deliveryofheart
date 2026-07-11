import { NextResponse } from "next/server";
import { z, type ZodError, type ZodSchema } from "zod";

const FIELD_LABELS: Record<string, string> = {
  title: "Заголовок",
  subtitle: "Подзаголовок",
  image_url: "URL изображения",
  link_url: "Ссылка",
  city: "Город",
  name: "Название",
  id: "ID",
  order_id: "ID заказа",
  status: "Статус",
  target_user_id: "Пользователь",
  role_name: "Роль",
  restaurant_id: "Ресторан",
  code: "Промокод",
  discount_type: "Тип скидки",
  discount_value: "Размер скидки",
  email: "Email",
  settings: "Настройки",
  template_id: "Шаблон",
  channel: "Канал",
  body: "Текст",
  city_id: "Город",
  delivery_price: "Стоимость доставки",
  min_order_amount: "Минимальная сумма заказа",
  is_active: "Активность",
  address: "Адрес",
  slug: "Slug",
  phone: "Телефон",
  user_role_id: "ID роли пользователя",
  note: "Примечание",
  region: "Регион",
  sort_order: "Порядок сортировки",
};

function formatZodIssue(issue: ZodError["issues"][number]): string {
  const key = issue.path.join(".");
  const label = FIELD_LABELS[key] || key || "Поле";

  if (issue.code === "invalid_type") {
    const received = "received" in issue ? issue.received : undefined;
    if (received === "undefined") return `${label}: обязательное поле`;
    return `${label}: некорректный тип данных`;
  }

  if (issue.code === "too_small") {
    return `${label}: слишком короткое значение`;
  }

  if (issue.code === "invalid_value") {
    return `${label}: недопустимое значение`;
  }

  const message = issue.message;
  if (message.startsWith("Required") || message.startsWith("Expected")) {
    return `${label}: обязательное поле`;
  }

  return `${label}: ${message}`;
}

export function validationErrorResponse(error: ZodError): NextResponse {
  const errors = error.issues.map(formatZodIssue);
  return NextResponse.json(
    { error: errors[0] ?? "Некорректные данные запроса", errors },
    { status: 400 }
  );
}

export async function parseJsonBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Некорректный JSON в теле запроса" }, { status: 400 }),
    };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return { ok: false, response: validationErrorResponse(result.error) };
  }

  return { ok: true, data: result.data };
}

export function parseQuery<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>
): { ok: true; data: T } | { ok: false; response: NextResponse } {
  const raw = Object.fromEntries(searchParams.entries());
  const result = schema.safeParse(raw);
  if (!result.success) {
    return { ok: false, response: validationErrorResponse(result.error) };
  }
  return { ok: true, data: result.data };
}

export { z };
