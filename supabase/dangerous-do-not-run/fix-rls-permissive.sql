-- !!! DANGEROUS — DO NOT RUN IN PRODUCTION (opens RLS) !!!
-- See README.md in this folder.

-- PERMISSIVE FIX - Run this in Supabase SQL Editor
-- This completely opens INSERT for orders, addresses, and order_items

-- Orders - allow INSERT
DROP POLICY IF EXISTS "orders_insert" ON orders;
DROP POLICY IF EXISTS "orders_user_insert" ON orders;
CREATE POLICY "orders_insert_any" ON orders
    FOR INSERT WITH CHECK (true);

-- Addresses - allow INSERT  
DROP POLICY IF EXISTS "addresses_insert" ON addresses;
DROP POLICY IF EXISTS "addresses_insert_own" ON addresses;
CREATE POLICY "addresses_insert_any" ON addresses
    FOR INSERT WITH CHECK (true);

-- Order items - allow INSERT
DROP POLICY IF EXISTS "order_items_insert" ON order_items;
DROP POLICY IF EXISTS "order_items_insert_own" ON order_items;
CREATE POLICY "order_items_insert_any" ON order_items
    FOR INSERT WITH CHECK (true);