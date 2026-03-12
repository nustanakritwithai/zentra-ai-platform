import pg from 'pg';
const { Client } = pg;

// Try multiple connection strings
const connections = [
  {
    name: 'Direct',
    connectionString: 'postgresql://postgres:482%40RotikaMarwin@db.yxuvkfliwqlfnpxhmuyj.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
  },
  {
    name: 'Pooler 5432',
    connectionString: 'postgresql://postgres.yxuvkfliwqlfnpxhmuyj:482%40RotikaMarwin@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
  },
  {
    name: 'Pooler 6543',
    connectionString: 'postgresql://postgres.yxuvkfliwqlfnpxhmuyj:482%40RotikaMarwin@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
  }
];

for (const conn of connections) {
  console.log(`\nTrying ${conn.name}...`);
  const client = new Client({
    connectionString: conn.connectionString,
    ssl: conn.ssl,
    connectionTimeoutMillis: 10000
  });
  
  try {
    await client.connect();
    const res = await client.query('SELECT 1 as test');
    console.log(`${conn.name}: Connected! Result:`, res.rows);
    
    // Execute migration
    console.log('Running migration...');
    const migrationSQL = `
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
      
      CREATE TABLE IF NOT EXISTS line_messages (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        line_user_id TEXT NOT NULL,
        direction TEXT NOT NULL,
        message_type TEXT NOT NULL,
        content TEXT,
        timestamp TEXT
      );
      
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS line_channel_id TEXT;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS line_channel_secret TEXT;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS line_access_token TEXT;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS payment_methods JSONB;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS bank_account JSONB;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS stripe_key TEXT;
      
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
      
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal REAL;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount REAL;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost REAL;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_proof TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;
      
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS line_user_id TEXT;
    `;
    
    await client.query(migrationSQL);
    console.log('Migration completed successfully!');
    
    // Enable RLS
    await client.query(`
      ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
      ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
      ALTER TABLE line_messages ENABLE ROW LEVEL SECURITY;
    `);
    console.log('RLS enabled on new tables');
    
    // Create RLS policies for new tables
    await client.query(`
      DO $$ BEGIN
        -- Categories policies
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'categories_select') THEN
          CREATE POLICY categories_select ON categories FOR SELECT USING (true);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'categories_all') THEN
          CREATE POLICY categories_all ON categories FOR ALL USING (true) WITH CHECK (true);
        END IF;
        
        -- Discounts policies
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'discounts' AND policyname = 'discounts_select') THEN
          CREATE POLICY discounts_select ON discounts FOR SELECT USING (true);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'discounts' AND policyname = 'discounts_all') THEN
          CREATE POLICY discounts_all ON discounts FOR ALL USING (true) WITH CHECK (true);
        END IF;
        
        -- Line messages policies
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'line_messages' AND policyname = 'line_messages_select') THEN
          CREATE POLICY line_messages_select ON line_messages FOR SELECT USING (true);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'line_messages' AND policyname = 'line_messages_all') THEN
          CREATE POLICY line_messages_all ON line_messages FOR ALL USING (true) WITH CHECK (true);
        END IF;
      END $$;
    `);
    console.log('RLS policies created');
    
    // Verify
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('All tables:', tables.rows.map(r => r.table_name));
    
    await client.end();
    process.exit(0);
  } catch (err) {
    console.log(`${conn.name}: Failed -`, err.message);
    try { await client.end(); } catch(e) {}
  }
}

console.log('\nAll connection methods failed!');
process.exit(1);
