-- ZENTRA AI — Supabase Database Setup
-- Creates all tables + seeds demo data

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  onboarded BOOLEAN NOT NULL DEFAULT false
);

-- 2. Stores table
CREATE TABLE IF NOT EXISTS stores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo TEXT,
  theme TEXT NOT NULL DEFAULT 'modern-dark',
  currency TEXT NOT NULL DEFAULT 'THB',
  status TEXT NOT NULL DEFAULT 'active'
);

-- 3. Products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id),
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  compare_price REAL,
  category TEXT,
  image TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  ai_score REAL
);

-- 4. Orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  total REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  items JSONB NOT NULL,
  shipping_address TEXT,
  created_at TEXT
);

-- 5. AI Agents table
CREATE TABLE IF NOT EXISTS ai_agents (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id),
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB,
  performance REAL,
  status TEXT NOT NULL DEFAULT 'active',
  icon TEXT
);

-- 6. Customers table
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_spent REAL NOT NULL DEFAULT 0,
  segment TEXT DEFAULT 'new'
);

-- 7. Knowledge Base table
CREATE TABLE IF NOT EXISTS knowledge_base (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'faq',
  indexed BOOLEAN NOT NULL DEFAULT false,
  created_at TEXT
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access (bypass RLS)
-- For demo, also allow anon to read/write (can tighten later)
CREATE POLICY "Allow all for service_role" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON stores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON ai_agents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON knowledge_base FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Demo user
INSERT INTO users (email, password, name, avatar, plan, onboarded) VALUES
  ('demo@zentra.ai', 'password123', 'สมชาย ใจดี', null, 'pro', true);

-- Demo store
INSERT INTO stores (user_id, name, slug, description, logo, theme, currency, status) VALUES
  (1, 'ZentraMart', 'zentramart', 'ร้านค้าออนไลน์ที่ขับเคลื่อนด้วย AI', null, 'modern-dark', 'THB', 'active');

-- Products
INSERT INTO products (store_id, name, description, price, compare_price, category, image, stock, status, ai_score) VALUES
  (1, 'Nike Air Max 270 React', 'รองเท้าวิ่งน้ำหนักเบา ระบายอากาศดี', 5990, 7490, 'รองเท้า', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', 45, 'active', 97),
  (1, 'Apple Watch Ultra 3', 'นาฬิกาอัจฉริยะรุ่นล่าสุด', 29900, 32900, 'อุปกรณ์อิเล็กทรอนิกส์', 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400', 23, 'active', 94),
  (1, 'Gucci GG Marmont Mini', 'กระเป๋าสะพายหนังแท้', 45500, 52000, 'กระเป๋า', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400', 12, 'active', 91),
  (1, 'Sony WH-1000XM6', 'หูฟังตัดเสียงรบกวนระดับพรีเมียม', 12990, 14990, 'อุปกรณ์อิเล็กทรอนิกส์', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', 67, 'active', 95),
  (1, 'เสื้อยืด Oversize Cotton', 'เสื้อยืดผ้าฝ้ายออร์แกนิก ใส่สบาย', 590, 890, 'เสื้อผ้า', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', 234, 'active', 82),
  (1, 'Samsung Galaxy S26 Ultra', 'สมาร์ทโฟนเรือธงพร้อม AI', 44900, null, 'อุปกรณ์อิเล็กทรอนิกส์', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400', 18, 'active', 96),
  (1, 'กางเกงยีนส์ Slim Fit', 'กางเกงยีนส์ทรงเข้ารูป ผ้ายืด', 1290, 1790, 'เสื้อผ้า', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400', 89, 'active', 78),
  (1, 'MacBook Pro M5 16"', 'แล็ปท็อปสำหรับมืออาชีพ', 89900, null, 'อุปกรณ์อิเล็กทรอนิกส์', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400', 8, 'draft', 88);

-- Orders
INSERT INTO orders (store_id, customer_name, customer_email, total, status, items, shipping_address, created_at) VALUES
  (1, 'นภา วงศ์สุข', 'napa@email.com', 5990, 'delivered', '[{"productId":1,"name":"Nike Air Max 270 React","price":5990,"qty":1}]'::jsonb, '123 ถ.สุขุมวิท กรุงเทพฯ 10110', '2026-03-11T10:30:00'),
  (1, 'ธนกร เจริญผล', 'thanakorn@email.com', 42890, 'shipped', '[{"productId":2,"name":"Apple Watch Ultra 3","price":29900,"qty":1},{"productId":4,"name":"Sony WH-1000XM6","price":12990,"qty":1}]'::jsonb, '456 ถ.พหลโยธิน กรุงเทพฯ 10400', '2026-03-11T14:20:00'),
  (1, 'สมหญิง แก้วใส', 'somying@email.com', 45500, 'confirmed', '[{"productId":3,"name":"Gucci GG Marmont Mini","price":45500,"qty":1}]'::jsonb, '789 ถ.เพชรบุรี กรุงเทพฯ 10310', '2026-03-12T09:15:00'),
  (1, 'วิชัย สมบัติดี', 'wichai@email.com', 1880, 'pending', '[{"productId":5,"name":"เสื้อยืด Oversize Cotton","price":590,"qty":2},{"productId":7,"name":"กางเกงยีนส์ Slim Fit","price":1290,"qty":1}]'::jsonb, '321 ถ.รัชดาภิเษก กรุงเทพฯ 10320', '2026-03-12T11:45:00'),
  (1, 'อรุณ ศรีทอง', 'arun@email.com', 44900, 'cancelled', '[{"productId":6,"name":"Samsung Galaxy S26 Ultra","price":44900,"qty":1}]'::jsonb, '654 ถ.ลาดพร้าว กรุงเทพฯ 10230', '2026-03-10T16:00:00');

-- AI Agents
INSERT INTO ai_agents (store_id, type, name, description, enabled, config, performance, status, icon) VALUES
  (1, 'shopping_assistant', 'Shopping Assistant', 'ผู้ช่วยช้อปปิ้ง AI แนะนำสินค้าตาม lifestyle ของลูกค้า', true, '{"responseSpeed":8,"creativity":7,"language":"th"}'::jsonb, 94, 'active', 'ShoppingBag'),
  (1, 'recommendation', 'Recommendation Engine', 'เครื่องมือแนะนำสินค้าแบบ Real-time ด้วย Collaborative Filtering', true, '{"algorithm":"hybrid","minConfidence":0.7,"maxSuggestions":8}'::jsonb, 91, 'active', 'Sparkles'),
  (1, 'dynamic_pricing', 'Dynamic Pricing', 'ปรับราคาอัตโนมัติตามอุปสงค์และราคาคู่แข่ง', true, '{"maxDiscount":30,"priceFloor":0.7,"updateFrequency":"hourly"}'::jsonb, 87, 'processing', 'TrendingUp'),
  (1, 'customer_support', 'Customer Support', 'ตอบคำถามลูกค้า 24/7 ด้วย AI ที่เข้าใจภาษาธรรมชาติ', true, '{"responseSpeed":9,"escalationThreshold":0.3,"tone":"friendly"}'::jsonb, 96, 'active', 'Headphones'),
  (1, 'inventory_forecast', 'Inventory Forecast', 'พยากรณ์สต็อกสินค้าและแจ้งเตือนเมื่อใกล้หมด', true, '{"forecastDays":30,"safetyStock":10,"autoReorder":false}'::jsonb, 82, 'active', 'BarChart3'),
  (1, 'visual_search', 'Visual Search', 'ค้นหาสินค้าด้วยรูปภาพ ใช้ Computer Vision ขั้นสูง', false, '{"accuracy":"high","maxResults":12,"similarityThreshold":0.8}'::jsonb, 78, 'paused', 'Eye');

-- Customers
INSERT INTO customers (store_id, name, email, phone, total_orders, total_spent, segment) VALUES
  (1, 'นภา วงศ์สุข', 'napa@email.com', '081-234-5678', 12, 45600, 'vip'),
  (1, 'ธนกร เจริญผล', 'thanakorn@email.com', '089-876-5432', 8, 128900, 'vip'),
  (1, 'สมหญิง แก้วใส', 'somying@email.com', '062-345-6789', 3, 52300, 'returning'),
  (1, 'วิชัย สมบัติดี', 'wichai@email.com', '095-111-2222', 1, 1880, 'new'),
  (1, 'อรุณ ศรีทอง', 'arun@email.com', '086-333-4444', 5, 89700, 'returning'),
  (1, 'พิมพ์ชนก ลีลา', 'pimchanok@email.com', '091-555-6666', 0, 0, 'new'),
  (1, 'กิตติ มั่นคง', 'kitti@email.com', '084-777-8888', 15, 234500, 'vip'),
  (1, 'รัตนา ดีงาม', 'rattana@email.com', '063-999-0000', 2, 7890, 'at_risk'),
  (1, 'ประสิทธิ์ พัฒนา', 'prasit@email.com', '087-111-3333', 6, 67800, 'returning'),
  (1, 'จิราภรณ์ สุขสันต์', 'jiraporn@email.com', '098-444-5555', 1, 12990, 'new');

-- Default Knowledge Base
INSERT INTO knowledge_base (store_id, title, content, category, indexed, created_at) VALUES
  (1, 'นโยบายการคืนสินค้า', 'ลูกค้าสามารถคืนสินค้าได้ภายใน 30 วันหลังจากได้รับสินค้า โดยสินค้าต้องอยู่ในสภาพสมบูรณ์ มีแท็กติดอยู่ และอยู่ในบรรจุภัณฑ์เดิม สินค้าลดราคาไม่สามารถคืนได้ ค่าจัดส่งคืนสินค้าเป็นความรับผิดชอบของลูกค้า ยกเว้นกรณีสินค้าชำรุดหรือผิดรุ่น ทางร้านจะคืนเงินภายใน 7-14 วันทำการ', 'policy', false, '2026-03-12T09:00:00'),
  (1, 'นโยบายการจัดส่ง', 'จัดส่งฟรีเมื่อมียอดสั่งซื้อ 1,000 บาทขึ้นไป ค่าจัดส่งปกติ 50-100 บาท ระยะเวลาจัดส่ง 1-3 วันทำการสำหรับกรุงเทพฯ และปริมณฑล, 3-5 วันทำการสำหรับต่างจังหวัด รองรับการจัดส่งผ่าน Kerry Express, Flash Express และ Thailand Post', 'policy', false, '2026-03-12T09:00:00'),
  (1, 'วิธีการชำระเงิน', 'รองรับการชำระเงินผ่าน บัตรเครดิต/เดบิต (Visa, Mastercard, JCB), โอนผ่านธนาคาร, พร้อมเพย์ (PromptPay), TrueMoney Wallet, และเก็บเงินปลายทาง (COD) สำหรับยอดไม่เกิน 5,000 บาท', 'faq', false, '2026-03-12T09:00:00'),
  (1, 'วิธีติดต่อเรา', 'อีเมล: support@zentra.ai | LINE: @zentramart | โทร: 02-xxx-xxxx (จันทร์-ศุกร์ 9:00-18:00) | Live Chat: ผ่านเว็บไซต์ 24/7', 'faq', false, '2026-03-12T09:00:00'),
  (1, 'โปรโมชั่นประจำเดือน มีนาคม 2026', 'ลด 20% สำหรับสินค้าอุปกรณ์อิเล็กทรอนิกส์เมื่อใช้โค้ด TECHMAR26 | ซื้อ 2 ชิ้นขึ้นไปในหมวดเสื้อผ้าลด 15% | สมาชิก VIP รับส่วนลดเพิ่ม 5% ทุกรายการ', 'guide', false, '2026-03-12T09:00:00');
