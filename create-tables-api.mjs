// Use Supabase REST API to create tables via the SQL endpoint
// Supabase exposes /pg/query for the service_role key on some plans

const SUPABASE_URL = 'https://yxuvkfliwqlfnpxhmuyj.supabase.co';
const SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4dXZrZmxpd3FsZm5weGhtdXlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzMwNjAwNCwiZXhwIjoyMDg4ODgyMDA0fQ.reqCn0SRTxLgFIKlvWmHHcaBR5RjvVqXB1G7HPU_4pg';

// Method 1: Try creating the exec_sql function via REST
// We can call PostgREST rpc endpoints - but first we need a function

// Method 2: Use PostgREST schema cache reload endpoint
async function checkEndpoints() {
  const endpoints = [
    '/pg',
    '/pg/query',
    '/rest/v1/',
    '/graphql/v1',
  ];
  
  for (const ep of endpoints) {
    try {
      const res = await fetch(`${SUPABASE_URL}${ep}`, {
        headers: {
          'apikey': SERVICE_ROLE,
          'Authorization': `Bearer ${SERVICE_ROLE}`,
        }
      });
      console.log(`${ep}: ${res.status} ${(await res.text()).substring(0, 200)}`);
    } catch(e) {
      console.log(`${ep}: ERROR - ${e.message}`);
    }
  }
}

// Method 3: Use the Supabase Management API
async function tryManagementAPI() {
  // The management API is at https://api.supabase.com
  // It requires an access token, not the service_role key
  // Let's try the project's API anyway
  
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      'apikey': SERVICE_ROLE,
      'Authorization': `Bearer ${SERVICE_ROLE}`,
    }
  });
  const data = await res.json();
  console.log('Available tables/views:', JSON.stringify(data).substring(0, 500));
}

// Method 4: Use PostgREST to insert via a known function
// Actually, let me try to use a DIFFERENT approach:
// Supabase supports creating functions via the API
// We can create a plpgsql function that runs arbitrary SQL

// Step 1: Check if we can use the "system" schema
async function trySystemSchema() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/extensions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE,
      'Authorization': `Bearer ${SERVICE_ROLE}`,
    },
    body: '{}'
  });
  console.log('Extensions:', res.status, (await res.text()).substring(0, 300));
}

async function main() {
  console.log('=== Checking available endpoints ===');
  await checkEndpoints();
  
  console.log('\n=== Checking management API ===');
  await tryManagementAPI();
  
  console.log('\n=== Checking system functions ===');
  await trySystemSchema();
}

main().catch(console.error);
