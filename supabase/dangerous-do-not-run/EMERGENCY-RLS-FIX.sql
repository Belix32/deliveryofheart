-- !!! DANGEROUS — DO NOT RUN IN PRODUCTION (opens RLS) !!!
-- See README.md in this folder.

-- =====================================================
-- EMERGENCY RLS FIX - Execute this in Supabase SQL Editor
-- =====================================================

-- Step 1: Drop ALL existing policies on orders table
DROP POLICY IF EXISTS "orders_user_select" ON orders;
DROP POLICY IF EXISTS "orders_user_insert" ON orders;
DROP POLICY IF EXISTS "orders_user_update" ON orders;
DROP POLICY IF EXISTS "orders_restaurant_admin_select" ON orders;
DROP POLICY IF EXISTS "orders_restaurant_admin_update" ON orders;
DROP POLICY IF EXISTS "orders_insert_any" ON orders;
DROP POLICY IF EXISTS "orders_insert" ON orders;
DROP POLICY IF EXISTS "Enable read access for all users" ON orders;
DROP POLICY IF EXISTS "Allow users to insert own orders" ON orders;

-- Step 2: Create OPEN policies for orders
CREATE POLICY "orders_open_all" ON orders FOR ALL USING (true) WITH CHECK (true);

-- Step 3: Drop ALL existing policies on addresses table
DROP POLICY IF EXISTS "addresses_select_own" ON addresses;
DROP POLICY IF EXISTS "addresses_insert_own" ON addresses;
DROP POLICY IF EXISTS "addresses_update_own" ON addresses;
DROP POLICY IF EXISTS "addresses_delete_own" ON addresses;
DROP POLICY IF EXISTS "addresses_insert_any" ON addresses;
DROP POLICY IF EXISTS "addresses_insert" ON addresses;
DROP POLICY IF EXISTS "Enable read access for all users" ON addresses;
DROP POLICY IF EXISTS "Allow users to insert own addresses" ON addresses;

-- Step 4: Create OPEN policies for addresses
CREATE POLICY "addresses_open_all" ON addresses FOR ALL USING (true) WITH CHECK (true);

-- Step 5: Drop ALL existing policies on order_items table
DROP POLICY IF EXISTS "order_items_select" ON order_items;
DROP POLICY IF EXISTS "order_items_insert_any" ON order_items;
DROP POLICY IF EXISTS "order_items_insert" ON order_items;
DROP POLICY IF EXISTS "Enable read access for all users" ON order_items;
DROP POLICY IF EXISTS "Allow users to insert own order_items" ON order_items;

-- Step 6: Create OPEN policies for order_items
CREATE POLICY "order_items_open_all" ON order_items FOR ALL USING (true) WITH CHECK (true);

-- Step 7: Verify policies were created
SELECT tablename, policyname, cmd, qual FROM pg_policies WHERE tablename IN ('orders', 'addresses', 'order_items');