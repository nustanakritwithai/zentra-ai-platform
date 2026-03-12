-- ZENTRA AI - New Tables Migration
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/yxuvkfliwqlfnpxhmuyj/sql/new

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  image TEXT,
  parent_id INTEGER,
  sort_order INTEGER DEFAULT 0
);

-- Discounts table
CREATE TABLE IF NOT EXISTS discounts (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'percentage',
  value REAL NOT NULL,
  min_purchase REAL,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  expires_at TEXT
);

-- LINE messages table
CREATE TABLE IF NOT EXISTS line_messages (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL,
  line_user_id TEXT NOT NULL,
  direction TEXT NOT NULL,
  message_type TEXT NOT NULL,
  content TEXT,
  timestamp TEXT
);

-- Add new columns to stores
ALTER TABLE stores ADD COLUMN IF NOT EXISTS line_channel_id TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS line_channel_secret TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS line_access_token TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS payment_methods JSONB;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS bank_account JSONB;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS stripe_key TEXT;

-- Add new columns to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS compare_price REAL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost REAL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight REAL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS affiliate_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS affiliate_source TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS affiliate_commission REAL;

-- Add new columns to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal REAL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount REAL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost REAL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_proof TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add line_user_id to customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS line_user_id TEXT;

-- Enable RLS on new tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_messages ENABLE ROW LEVEL SECURITY;

-- Allow service role full access to new tables
CREATE POLICY "categories_all" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "discounts_all" ON discounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "line_messages_all" ON line_messages FOR ALL USING (true) WITH CHECK (true);
