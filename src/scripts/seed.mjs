/**
 * Скрипт для заполнения БД Supabase
 * "Доставка от души"
 */

const SUPABASE_URL = 'https://evzfnbenxcjednelosuv.supabase.co';
const SUPABASE_KEY = 'sb_publishable__-0HTcLYBSpkmh7mw-Zo_g_4_TwIV3v';

async function fetchAPI(endpoint, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    ...options,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...options.headers
    }
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`${endpoint}: ${response.status} - ${error}`);
  }
  
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

const CITY = process.env.NEXT_PUBLIC_CITY || 'Сураж';

async function addItem(categoryId, name, desc, price, weight) {
  await fetchAPI('menu_items', {
    method: 'POST',
    body: JSON.stringify([{ category_id: categoryId, name, description: desc, price, weight, is_available: true }])
  });
}

async function seedDatabase() {
  console.log('🚀 Заполнение БД "Доставка от души"...\n');

  try {
    // Проверяем таблицы
    await fetchAPI('restaurants?select=id&limit=1');
    console.log('✅ Таблицы найдены');

    // 1. Город
    const cities = await fetchAPI('cities?select=id');
    if (cities.length === 0) {
      await fetchAPI('cities', { method: 'POST', body: JSON.stringify([{ name: CITY, region: 'Брянская область', is_active: true }]) });
      console.log('  ✅ Города добавлены');
    } else {
      console.log('  → Города уже есть');
    }

    // 2. Рестораны
    const restaurants = await fetchAPI('restaurants?select=id,slug');
    if (restaurants.length === 0) {
      await fetchAPI('restaurants', {
        method: 'POST',
        body: JSON.stringify([
          { name: 'Пельменная №1', slug: 'pelmennaya-1', description: 'Уютное заведение с домашней кухней', address: 'ул. Ленина 25', phone: '+7(48336)2-12-34', rating: 4.8, delivery_time_min: 25, delivery_time_max: 35, delivery_price: 50, min_order: 300, is_active: true, city: CITY },
          { name: 'Sushi Master', slug: 'sushi-master', description: 'Свежие роллы и суши', address: 'ул. Пушкина 10', phone: '+7(48336)2-56-78', rating: 4.9, delivery_time_min: 30, delivery_time_max: 40, delivery_price: 70, min_order: 500, is_active: true, city: CITY },
          { name: 'Pizza Napoli', slug: 'pizza-napoli', description: 'Итальянская пицца из настоящей печи', address: 'ул. Советская 15', phone: '+7(48336)2-90-12', rating: 4.7, delivery_time_min: 20, delivery_time_max: 30, delivery_price: 40, min_order: 400, is_active: true, city: CITY }
        ])
      });
      console.log('  ✅ Рестораны добавлены');
    } else {
      console.log('  → Рестораны уже есть');
    }

    // Получаем ID ресторанов
    const fetchedRestaurants = await fetchAPI('restaurants?select=id,name');
    console.log('  Рестораны:', fetchedRestaurants.map(x => x.name).join(', '));
    const r = name => fetchedRestaurants.find(x => x.name === name)?.id;
    console.log('  ID Пельменная:', r('Пельменная №1'));

    // 3. Категории
    const categories = await fetchAPI('categories?select=id');
    if (categories.length === 0) {
      await fetchAPI('categories', {
        method: 'POST',
        body: JSON.stringify([
          { restaurant_id: r('Пельменная №1'), name: 'Завтраки', sort_order: 1, is_active: true },
          { restaurant_id: r('Пельменная №1'), name: 'Обеды', sort_order: 2, is_active: true },
          { restaurant_id: r('Пельменная №1'), name: 'Ужины', sort_order: 3, is_active: true },
          { restaurant_id: r('Пельменная №1'), name: 'Напитки', sort_order: 4, is_active: true },
          { restaurant_id: r('Sushi Master'), name: 'Роллы', sort_order: 1, is_active: true },
          { restaurant_id: r('Sushi Master'), name: 'Суши', sort_order: 2, is_active: true },
          { restaurant_id: r('Sushi Master'), name: 'Закуски', sort_order: 3, is_active: true },
          { restaurant_id: r('Sushi Master'), name: 'Напитки', sort_order: 4, is_active: true },
          { restaurant_id: r('Pizza Napoli'), name: 'Пицца', sort_order: 1, is_active: true },
          { restaurant_id: r('Pizza Napoli'), name: 'Закуски', sort_order: 2, is_active: true },
          { restaurant_id: r('Pizza Napoli'), name: 'Напитки', sort_order: 3, is_active: true }
        ])
      });
      console.log('  ✅ Категории добавлены');
    } else {
      console.log('  → Категории уже есть');
    }

    // Получаем ID категорий
    const fetchedCategories = await fetchAPI('categories?select=id,name,restaurant_id');
    const cat = (restaurantName, categoryName) => {
      const rest = fetchedRestaurants.find(x => x.name === restaurantName);
      return fetchedCategories.find(x => x.name === categoryName && x.restaurant_id === rest?.id)?.id;
    };

    // 4. Блюда
    const menuItems = await fetchAPI('menu_items?select=id');
    if (menuItems.length === 0) {
      console.log('  Добавляем блюда...');
      
      // Пельменная - Завтраки
      await addItem(cat('Пельменная №1', 'Завтраки'), 'Блины со сметаной', 'Тонкие блины со свежей сметаной', 180, '200г');
      await addItem(cat('Пельменная №1', 'Завтраки'), 'Омлет с зеленью', 'Пышный омлет с укропом', 150, '150г');
      await addItem(cat('Пельменная №1', 'Завтраки'), 'Каша манная с вареньем', 'Манная каша с клубничным вареньем', 120, '250г');

      // Пельменная - Обеды
      await addItem(cat('Пельменная №1', 'Обеды'), 'Пельмени классические', 'Домашние пельмени со свининой и говядиной', 250, '300г');
      await addItem(cat('Пельменная №1', 'Обеды'), 'Солянка', 'Насыщенный мясной суп', 290, '350г');
      await addItem(cat('Пельменная №1', 'Обеды'), 'Борщ', 'Традиционный борщ со сметаной', 260, '350г');
      await addItem(cat('Пельменная №1', 'Обеды'), 'Щи из свежей капусты', 'Щи со сметаной', 240, '350г');

      // Пельменная - Ужины
      await addItem(cat('Пельменная №1', 'Ужины'), 'Вареники с картошкой', 'Вареники с картофелем и шкварками', 220, '280г');
      await addItem(cat('Пельменная №1', 'Ужины'), 'Котлета с пюре', 'Домашняя котлета с картофельным пюре', 280, '350г');
      await addItem(cat('Пельменная №1', 'Ужины'), 'Голубцы', 'Голубцы с мясом и рисом', 310, '400г');

      // Пельменная - Напитки
      await addItem(cat('Пельменная №1', 'Напитки'), 'Компот из яблок', 'Домашний компот', 80, '300мл');
      await addItem(cat('Пельменная №1', 'Напитки'), 'Чай с лимоном', 'Чёрный чай с лимоном', 60, '250мл');

      // Sushi Master - Роллы
      await addItem(cat('Sushi Master', 'Роллы'), 'Филадельфия', 'Лосось, сливочный сыр, огурец', 450, '260г');
      await addItem(cat('Sushi Master', 'Роллы'), 'Калифорния', 'Краб, авокадо, икра тобико', 380, '240г');
      await addItem(cat('Sushi Master', 'Роллы'), 'Запечённый сет', 'Ассорти запечённых роллов', 520, '400г');
      await addItem(cat('Sushi Master', 'Роллы'), 'Дракон', 'Угорь, авокадо, икра', 490, '280г');

      // Sushi Master - Суши
      await addItem(cat('Sushi Master', 'Суши'), 'Суши с лососем', 'Лосось на рисе', 180, '80г');
      await addItem(cat('Sushi Master', 'Суши'), 'Суши с тунцом', 'Свежий тунец', 200, '80г');
      await addItem(cat('Sushi Master', 'Суши'), 'Суши с угрём', 'Угорь с терияки', 220, '80г');

      // Sushi Master - Закуски
      await addItem(cat('Sushi Master', 'Закуски'), 'Салат с тунцом', 'Салат с тунцом и авокадо', 320, '250г');
      await addItem(cat('Sushi Master', 'Закуски'), 'Эби темпура', 'Креветки в кляре', 290, '150г');

      // Sushi Master - Напитки
      await addItem(cat('Sushi Master', 'Напитки'), 'Зелёный чай', 'Японский зелёный чай', 70, '250мл');

      // Pizza Napoli - Пицца
      await addItem(cat('Pizza Napoli', 'Пицца'), 'Маргарита', 'Томаты, моцарелла, базилик', 550, '450г');
      await addItem(cat('Pizza Napoli', 'Пицца'), 'Пепперони', 'Пепперони, моцарелла', 620, '480г');
      await addItem(cat('Pizza Napoli', 'Пицца'), 'Четыре сыра', 'Моцарелла, пармезан, горгонзола', 680, '500г');
      await addItem(cat('Pizza Napoli', 'Пицца'), 'Гавайская', 'Ветчина, ананас', 580, '470г');
      await addItem(cat('Pizza Napoli', 'Пицца'), 'Мясная', 'Ветчина, колбаса, бекон', 700, '520г');

      // Pizza Napoli - Закуски
      await addItem(cat('Pizza Napoli', 'Закуски'), 'Чесночные палочки', 'Хрустящие палочки', 220, '200г');
      await addItem(cat('Pizza Napoli', 'Закуски'), 'Картофель по-деревенски', 'Запечённый картофель', 180, '250г');

      // Pizza Napoli - Напитки
      await addItem(cat('Pizza Napoli', 'Напитки'), 'Кофе капучино', 'Классический капучино', 140, '250мл');
      await addItem(cat('Pizza Napoli', 'Напитки'), 'Лимонад', 'Домашний лимонад', 120, '300мл');
      
      console.log('  ✅ Блюда добавлены');
    } else {
      console.log('  → Блюда уже есть');
    }

    // 5. Пользователь
    const users = await fetchAPI('users?select=id');
    if (users.length === 0) {
      await fetchAPI('users', { method: 'POST', body: JSON.stringify([{ email: 'demo@user.com', full_name: 'Тестовый Пользователь', phone: '+79000000000' }]) });
      console.log('  ✅ Пользователь добавлен');
    } else {
      console.log('  → Пользователь уже есть');
    }

    // 6. Промокоды
    const coupons = await fetchAPI('coupons?select=id');
    if (coupons.length === 0) {
      const expiresDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      await fetchAPI('coupons', {
        method: 'POST',
        body: JSON.stringify([
          { code: 'WELCOME50', description: 'Скидка 50 руб на первый заказ', discount_type: 'fixed', discount_value: 50, min_order_amount: 300, max_uses: 100, used_count: 0, is_active: true, valid_to: expiresDate },
          { code: 'PIZZA20', description: 'Скидка 20% на пиццу', discount_type: 'percent', discount_value: 20, min_order_amount: 500, max_uses: 50, used_count: 0, is_active: true, valid_to: expiresDate }
        ])
      });
      console.log('  ✅ Промокоды добавлены');
    } else {
      console.log('  → Промокоды уже есть');
    }

    console.log('\n✅ База данных готова!');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

seedDatabase();