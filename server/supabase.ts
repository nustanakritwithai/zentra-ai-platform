import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://yxuvkfliwqlfnpxhmuyj.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4dXZrZmxpd3FsZm5weGhtdXlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzMwNjAwNCwiZXhwIjoyMDg4ODgyMDA0fQ.reqCn0SRTxLgFIKlvWmHHcaBR5RjvVqXB1G7HPU_4pg";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4dXZrZmxpd3FsZm5weGhtdXlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMDYwMDQsImV4cCI6MjA4ODgyMDA0fQ._iS3oJcnSxJbkeR6cvl93fZyc0ootJrXYLFLH7NaTos";

// Admin client (service_role) — for server-side operations
export const supabaseAdmin: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Public client (anon key) — for client-side auth
export const supabaseAnon: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export { SUPABASE_URL, SUPABASE_ANON_KEY };

// Auto-migrate: create settings table if it doesn't exist
export async function ensureSettingsTable(): Promise<void> {
  try {
    // Try to read from settings — if table doesn't exist, create it
    const { error } = await supabaseAdmin.from("settings").select("key").limit(1);
    if (error && (error.message.includes("does not exist") || error.message.includes("Could not find")
        || error.code === "PGRST205" || error.code === "42P01")) {
      console.log("[Supabase] Creating settings table...");
      // Use raw SQL via RPC or just create via REST INSERT trick
      // Since we can't run raw SQL via REST, we'll create it via Supabase Management API
      // Instead, we'll store settings in a different way if the table doesn't exist
      console.log("[Supabase] ⚠ settings table not found — please create it via SQL editor:");
      console.log(`  CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW());`);
      console.log(`  ALTER TABLE settings ENABLE ROW LEVEL SECURITY;`);
      console.log(`  CREATE POLICY "settings_all" ON settings FOR ALL USING (true) WITH CHECK (true);`);
    } else {
      console.log("[Supabase] settings table exists ✓");
    }
  } catch (e: any) {
    console.log("[Supabase] Could not check settings table:", e.message);
  }
}
