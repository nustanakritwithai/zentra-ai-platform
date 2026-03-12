const SUPABASE_URL = 'https://yxuvkfliwqlfnpxhmuyj.supabase.co';
const SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4dXZrZmxpd3FsZm5weGhtdXlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzMwNjAwNCwiZXhwIjoyMDg4ODgyMDA0fQ.reqCn0SRTxLgFIKlvWmHHcaBR5RjvVqXB1G7HPU_4pg';

// Check what paths are available on Supabase
const paths = [
  '/rest/v1/',  // PostgREST - shows swagger
  '/auth/v1/',  // GoTrue auth
  '/storage/v1/',  // Storage
  '/realtime/v1/',  // Realtime
  '/functions/v1/',  // Edge Functions
];

async function main() {
  // Let's look at the Swagger spec to see all available tables
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      'apikey': SERVICE_ROLE,
      'Authorization': `Bearer ${SERVICE_ROLE}`,
    }
  });
  const swagger = await res.json();
  
  // Extract table names from paths
  const tables = Object.keys(swagger.paths || {})
    .filter(p => !p.includes('rpc/'))
    .map(p => p.replace('/', ''));
  console.log('Existing tables:', tables);
  
  // Check RPC functions
  const rpcs = Object.keys(swagger.paths || {})
    .filter(p => p.includes('rpc/'))
    .map(p => p.replace('/rpc/', ''));
  console.log('Available RPC functions:', rpcs);
  
  // Check the definitions (column details)
  const defs = swagger.definitions || {};
  for (const table of ['stores', 'products', 'orders', 'customers']) {
    if (defs[table]) {
      console.log(`\n${table} columns:`, Object.keys(defs[table].properties || {}));
    }
  }
}

main().catch(console.error);
