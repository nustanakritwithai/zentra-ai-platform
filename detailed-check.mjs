const SUPABASE_URL = 'https://yxuvkfliwqlfnpxhmuyj.supabase.co';
const SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4dXZrZmxpd3FsZm5weGhtdXlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzMwNjAwNCwiZXhwIjoyMDg4ODgyMDA0fQ.reqCn0SRTxLgFIKlvWmHHcaBR5RjvVqXB1G7HPU_4pg';

const headers = {
  'apikey': SERVICE_ROLE,
  'Authorization': `Bearer ${SERVICE_ROLE}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

async function checkColumn(table, column) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${column}&limit=0`, { headers });
  return res.status === 200;
}

async function main() {
  // Check stores columns needed
  const storesCols = ['line_channel_id', 'line_channel_secret', 'line_access_token', 'payment_methods', 'bank_account', 'stripe_key'];
  console.log('=== STORES missing columns ===');
  for (const col of storesCols) {
    const exists = await checkColumn('stores', col);
    console.log(`  ${col}: ${exists ? 'EXISTS' : 'MISSING'}`);
  }
  
  // Check products columns needed
  const productsCols = ['compare_price', 'cost', 'images', 'low_stock_threshold', 'sku', 'barcode', 'weight', 'seo_title', 'seo_description', 'affiliate_url', 'affiliate_source', 'affiliate_commission'];
  console.log('\n=== PRODUCTS missing columns ===');
  for (const col of productsCols) {
    const exists = await checkColumn('products', col);
    console.log(`  ${col}: ${exists ? 'EXISTS' : 'MISSING'}`);
  }
  
  // Check orders columns needed
  const ordersCols = ['subtotal', 'discount', 'shipping_cost', 'payment_method', 'payment_status', 'payment_proof', 'shipping_address', 'tracking_number', 'notes'];
  console.log('\n=== ORDERS missing columns ===');
  for (const col of ordersCols) {
    const exists = await checkColumn('orders', col);
    console.log(`  ${col}: ${exists ? 'EXISTS' : 'MISSING'}`);
  }
  
  // Check customers columns needed
  const customersCols = ['line_user_id'];
  console.log('\n=== CUSTOMERS missing columns ===');
  for (const col of customersCols) {
    const exists = await checkColumn('customers', col);
    console.log(`  ${col}: ${exists ? 'EXISTS' : 'MISSING'}`);
  }
}

main().catch(console.error);
