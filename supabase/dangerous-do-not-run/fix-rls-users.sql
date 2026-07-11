-- !!! DANGEROUS — DO NOT RUN IN PRODUCTION (opens RLS) !!!
-- See README.md in this folder.

-- Fix RLS for user table - allow INSERT for registration
-- Run in Supabase SQL Editor

-- Check existing policies and drop them if needed
DROP POLICY IF EXISTS "users_insert_any" ON users;
DROP POLICY IF EXISTS "allow_registration" ON users;

-- Create policy that allows anyone to insert (for registration)
-- This is needed because new users don't have auth.uid() yet
CREATE POLICY "users_insert_any" ON users
    FOR INSERT WITH CHECK (true);

-- Also allow SELECT for everyone (needed for login checks)
DROP POLICY IF EXISTS "users_select_all" ON users;
CREATE POLICY "users_select_all" ON users
    FOR SELECT USING (true);