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
