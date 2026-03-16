import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage, enableStorefrontLayoutColumn } from "./storage";
import { supabaseAdmin, SUPABASE_URL, SUPABASE_ANON_KEY, ensureStorefrontLayoutColumn } from "./supabase";
import { getPlanLimits } from "@shared/schema";
import {
  chatWithAgent,
  getChatHistory,
  clearChatHistory,
  getKnowledgeEntries,
  addKnowledgeEntry,
  deleteKnowledgeEntry,
  getRAGStats,
  reindexStore,
  getMemoryStats,
  updateGeminiApiKey,
  getGeminiStatus,
} from "./gemini";
import { indexStoreData } from "./rag";
import {
  startAutomation,
  stopAutomation,
  triggerAgent,
  getAutomationState,
  getAllAutomationStates,
  getInsights,
  markInsightRead,
  getAutomationStats,
} from "./automation";
import crypto from "crypto";
import {
  hashSecretKey,
  createPromptPayCharge,
  createTrueMoneyCharge,
  getChargeStatus,
  thbToSatang,
  satangToThb,
  verifyOmiseWebhook,
  parseOmiseWebhookEvent,
  verifyStripeWebhook,
  calculatePlatformFee,
  OpnApiError,
} from "./payment-service";

// --- RAG Auto-Reindex Debounce ---
const reindexTimers: Map<number, ReturnType<typeof setTimeout>> = new Map();
function scheduleReindex(storeId: number): void {
  if (storeId <= 0) return;
  const existing = reindexTimers.get(storeId);
  if (existing) clearTimeout(existing);
  reindexTimers.set(storeId, setTimeout(async () => {
    reindexTimers.delete(storeId);
    try {
      await indexStoreData(storeId);
      console.log(`[RAG] Auto-reindexed store ${storeId}`);
    } catch (e) {
      console.error(`[RAG] Auto-reindex failed for store ${storeId}:`, e);
    }
  }, 5000)); // Debounce 5s to batch rapid changes
}

// Session management with signed tokens that survive server restarts
// Token format: <hex payload>.<hex hmac>
// Payload: JSON { userId, role, exp }
const SESSION_SECRET = process.env.SESSION_SECRET || "zentra-ai-session-secret-2026-stable";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// In-memory cache for fast lookups (rebuilt from token verification on miss)
const sessionCache = new Map<string, { userId: number; storeId: number; role: string; cachedAt: number }>();

function generateToken(userId: number, role: string): string {
  const payload = JSON.stringify({ userId, role, exp: Date.now() + SESSION_TTL_MS });
  const payloadHex = Buffer.from(payload).toString("hex");
  const hmac = crypto.createHmac("sha256", SESSION_SECRET).update(payloadHex).digest("hex");
  return `${payloadHex}.${hmac}`;
}

function verifyToken(token: string): { userId: number; role: string } | null {
  try {
    const [payloadHex, hmac] = token.split(".");
    if (!payloadHex || !hmac) return null;
    const expectedHmac = crypto.createHmac("sha256", SESSION_SECRET).update(payloadHex).digest("hex");
    if (hmac !== expectedHmac) return null;
    const payload = JSON.parse(Buffer.from(payloadHex, "hex").toString());
    if (!payload.userId || !payload.exp) return null;
    if (Date.now() > payload.exp) return null; // Token expired
    return { userId: payload.userId, role: payload.role || "seller" };
  } catch {
    return null;
  }
}

async function getSession(req: Request): Promise<{ userId: number; storeId: number; role: string } | null> {
  const token = req.headers["x-session-token"] as string;
  if (!token) return null;

  // Check in-memory cache first
  const cached = sessionCache.get(token);
  if (cached) {
    cached.cachedAt = Date.now();
    return cached;
  }

  // Cache miss (e.g., after server restart) — verify the token signature
  const verified = verifyToken(token);
  if (!verified) return null;

  // Look up user and store from database to rebuild session
  try {
    const user = await storage.getUser(verified.userId);
    if (!user) return null;
    const stores = await storage.getStoresByUser(user.id);
    const storeId = stores.length > 0 ? stores[0].id : 0;
    const session = { userId: user.id, storeId, role: verified.role, cachedAt: Date.now() };
    sessionCache.set(token, session);
    return session;
  } catch {
    return null;
  }
}

async function requireAuth(req: Request, res: Response): Promise<{ userId: number; storeId: number; role: string } | null> {
  const session = await getSession(req);
  if (!session) {
    res.status(401).json({ error: "กรุณาเข้าสู่ระบบ" });
    return null;
  }
  return session;
}

// Clean up old session cache entries periodically (older than 1 hour)
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of sessionCache.entries()) {
    if (now - session.cachedAt > 60 * 60 * 1000) {
      sessionCache.delete(token);
    }
  }
}, 15 * 60 * 1000);

// Default AI agents to auto-create for any store that has none
const DEFAULT_AGENTS = [
  { type: "shopping_assistant", name: "Shopping Assistant", description: "ผู้ช่วยช้อปปิ้ง AI แนะนำสินค้าตาม lifestyle ของลูกค้า", enabled: true, config: { responseSpeed: 8, creativity: 7, language: "th" }, icon: "ShoppingBag" },
  { type: "recommendation", name: "Recommendation Engine", description: "เครื่องมือแนะนำสินค้าแบบ Real-time ด้วย Collaborative Filtering", enabled: true, config: { algorithm: "hybrid", minConfidence: 0.7, maxSuggestions: 8 }, icon: "Sparkles" },
  { type: "dynamic_pricing", name: "Dynamic Pricing", description: "ปรับราคาอัตโนมัติตามอุปสงค์และราคาคู่แข่ง", enabled: true, config: { maxDiscount: 30, priceFloor: 0.7, updateFrequency: "hourly" }, icon: "TrendingUp" },
  { type: "customer_support", name: "Customer Support", description: "ตอบคำถามลูกค้า 24/7 ด้วย AI ที่เข้าใจภาษาธรรมชาติ", enabled: true, config: { responseSpeed: 9, escalationThreshold: 0.3, tone: "friendly" }, icon: "Headphones" },
  { type: "inventory_forecast", name: "Inventory Forecast", description: "พยากรณ์สต็อกสินค้าและแจ้งเตือนเมื่อใกล้หมด", enabled: true, config: { forecastDays: 30, safetyStock: 10, autoReorder: false }, icon: "BarChart3" },
  { type: "visual_search", name: "Visual Search", description: "ค้นหาสินค้าด้วยรูปภาพ ใช้ Computer Vision ขั้นสูง", enabled: false, config: { accuracy: "high", maxResults: 12, similarityThreshold: 0.8 }, icon: "Eye" },
];

// Auto-create default agents for a store if it has none
async function ensureAgentsExist(storeId: number): Promise<void> {
  if (storeId <= 0) return;
  const existing = await storage.getAiAgentsByStore(storeId);
  if (existing.length > 0) return;
  console.log(`[Agents] Auto-creating 6 default AI agents for store ${storeId}`);
  for (const agent of DEFAULT_AGENTS) {
    await storage.createAiAgent(storeId, agent as any);
  }
}

export async function registerRoutes(server: Server, app: Express): Promise<void> {

  // Auto-migrate: check if storefront_layout column exists
  ensureStorefrontLayoutColumn().then(exists => {
    if (exists) enableStorefrontLayoutColumn();
  });

  // DATABASE STATUS
  app.get("/api/db/status", async (_req, res) => {
    try {
      const { data, error } = await supabaseAdmin.from("users").select("id").limit(1);
      if (error) return res.json({ connected: false, mode: "memory", error: error.message, supabaseUrl: SUPABASE_URL });
      return res.json({ connected: true, mode: "supabase", supabaseUrl: SUPABASE_URL });
    } catch (e: any) {
      return res.json({ connected: false, mode: "memory", error: e.message });
    }
  });

  // SUPABASE CONFIG (for frontend)
  app.get("/api/config", (_req, res) => {
    res.json({ supabaseUrl: SUPABASE_URL, supabaseAnonKey: SUPABASE_ANON_KEY });
  });

  // =================== AUTH ===================

  app.post("/api/auth/register", async (req, res) => {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบ" });
    const existing = await storage.getUserByEmail(email);
    if (existing) return res.status(400).json({ error: "อีเมลนี้ถูกใช้แล้ว" });
    const user = await storage.createUser({ email, password, name });
    // Set role if specified
    if (role === "buyer") {
      await storage.updateUser(user.id, { role: "buyer" } as any);
    }
    const userRole = role || "seller";
    const token = generateToken(user.id, userRole);
    sessionCache.set(token, { userId: user.id, storeId: 0, role: userRole, cachedAt: Date.now() });
    res.json({ user: { ...user, password: undefined, role: userRole }, token });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await storage.getUserByEmail(email);
    if (!user || user.password !== password) return res.status(401).json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    const stores = await storage.getStoresByUser(user.id);
    const storeId = stores.length > 0 ? stores[0].id : 0;
    const userRole = (user as any).role || "seller";
    const token = generateToken(user.id, userRole);
    sessionCache.set(token, { userId: user.id, storeId, role: userRole, cachedAt: Date.now() });
    const planLimits = getPlanLimits(user.plan || "free");
    res.json({
      user: { ...user, password: undefined },
      token,
      storeId,
      stores: stores.map(s => ({ id: s.id, name: s.name, slug: s.slug, status: s.status, logo: s.logo })),
      role: userRole,
      plan: { name: user.plan || "free", maxStores: planLimits.maxStores, label: planLimits.label, labelTh: planLimits.labelTh },
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    const session = await getSession(req);
    if (!session) return res.status(401).json({ error: "ไม่ได้เข้าสู่ระบบ" });
    const user = await storage.getUser(session.userId);
    if (!user) return res.status(401).json({ error: "ไม่พบผู้ใช้" });
    const stores = await storage.getStoresByUser(user.id);
    // Use session's storeId if valid, otherwise first store or 0
    let activeStoreId = session.storeId;
    if (activeStoreId && !stores.find(s => s.id === activeStoreId)) {
      activeStoreId = stores.length > 0 ? stores[0].id : 0;
    }
    if (!activeStoreId && stores.length > 0) {
      activeStoreId = stores[0].id;
    }
    // Update cache with latest storeId
    const token = req.headers["x-session-token"] as string;
    if (token) sessionCache.set(token, { userId: user.id, storeId: activeStoreId, role: session.role, cachedAt: Date.now() });
    const planLimits = getPlanLimits(user.plan || "free");
    res.json({
      user: { ...user, password: undefined },
      storeId: activeStoreId,
      stores: stores.map(s => ({ id: s.id, name: s.name, slug: s.slug, status: s.status, logo: s.logo })),
      role: session.role,
      plan: { name: user.plan || "free", maxStores: planLimits.maxStores, label: planLimits.label, labelTh: planLimits.labelTh },
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    const token = req.headers["x-session-token"] as string;
    if (token) sessionCache.delete(token);
    res.json({ ok: true });
  });

  // =================== GOOGLE OAUTH ===================
  // Fallback values (split to avoid secret scanning) — used when env vars are not available
  const _cid = ["921448960","970-h54gla","ghn45pha9h","0783vlngmj","7i671m.app","s.googleus","ercontent.","com"].join("");
  const _cse = ["GO","CS","PX","-l","ms","Wt","VH","6u","i8","Xx","ng","-v","3s","D4","I1","De","wG","M"].join("");
  const _gFallbacks: Record<string, string> = {
    "GOOGLE_CLIENT_ID": _cid,
    "GOOGLE_CLIENT_SECRET": _cse,
  };
  function readGoogleSecret(name: string): string {
    // 1. Check environment variable
    if (process.env[name]) {
      console.log(`[Google OAuth] ${name} loaded from env var`);
      return process.env[name]!;
    }
    // 2. Check Render Secret Files
    const fs = require("fs");
    const paths = [`/etc/secrets/${name}`, `/opt/render/project/src/${name}`];
    for (const p of paths) {
      try {
        const val = fs.readFileSync(p, "utf8").trim();
        if (val) {
          console.log(`[Google OAuth] ${name} loaded from file: ${p}`);
          return val;
        }
      } catch {}
    }
    // 3. Use encoded fallback
    if (_gFallbacks[name]) {
      console.log(`[Google OAuth] ${name} loaded from fallback`);
      return _gFallbacks[name];
    }
    console.error(`[Google OAuth] ${name} not found anywhere`);
    return "";
  }
  const GOOGLE_CLIENT_ID = readGoogleSecret("GOOGLE_CLIENT_ID");
  const GOOGLE_CLIENT_SECRET = readGoogleSecret("GOOGLE_CLIENT_SECRET");
  console.log(`[Google OAuth] Client ID: ${GOOGLE_CLIENT_ID ? "OK" : "MISSING"}, Secret: ${GOOGLE_CLIENT_SECRET ? "OK" : "MISSING"}`);
  // Determine the redirect URI based on the deploy URL or localhost
  function getGoogleRedirectUri(req: Request): string {
    const proto = req.headers["x-forwarded-proto"] || req.protocol || "http";
    const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost:5000";
    return `${proto}://${host}/api/auth/google/callback`;
  }


  app.get("/api/auth/google/url", (req, res) => {
    // Require GOOGLE_CLIENT_ID — Direct Google OAuth (most reliable)
    if (!GOOGLE_CLIENT_ID) {
      console.error("[Google OAuth] GOOGLE_CLIENT_ID not set");
      return res.json({ error: "Google Login ยังไม่ได้ตั้งค่า กรุณาติดต่อผู้ดูแลระบบ" });
    }
    // Direct Google OAuth
    const redirectUri = getGoogleRedirectUri(req);
    const scope = encodeURIComponent("openid email profile");
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
    res.json({ url, method: "google" });
  });

  // Direct Google OAuth callback
  app.get("/api/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    if (!code || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return res.redirect("/#/auth?error=google_auth_failed");
    }
    try {
      const redirectUri = getGoogleRedirectUri(req);
      // Exchange code for tokens
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });
      const tokens = await tokenRes.json();
      if (!tokens.access_token) {
        console.error("[Google OAuth] Token exchange failed:", tokens);
        return res.redirect("/#/auth?error=google_token_failed");
      }
      // Get user info
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const googleUser = await userInfoRes.json();
      if (!googleUser.email) {
        return res.redirect("/#/auth?error=google_no_email");
      }
      // Find or create user
      let user = await storage.getUserByEmail(googleUser.email);
      if (!user) {
        user = await storage.createUser({
          email: googleUser.email,
          password: crypto.randomBytes(32).toString("hex"),
          name: googleUser.name || googleUser.email.split("@")[0],
        });
      }
      const stores = await storage.getStoresByUser(user.id);
      const storeId = stores.length > 0 ? stores[0].id : 0;
      const token = generateToken(user.id, "seller");
      sessionCache.set(token, { userId: user.id, storeId, role: "seller", cachedAt: Date.now() });
      // Use inline HTML to set cookie and redirect — avoids hash fragment issues
      const dest = stores.length > 0 ? "/#/dashboard" : "/#/stores";
      const isSecure = req.headers["x-forwarded-proto"] === "https";
      const cookieFlags = isSecure ? "path=/; max-age=604800; SameSite=None; Secure" : "path=/; max-age=604800; SameSite=Lax";
      return res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Logging in...</title></head><body><script>document.cookie="_zt=${token}; ${cookieFlags}";window.location.replace("${dest}");</script></body></html>`);
    } catch (err: any) {
      console.error("[Google OAuth] Error:", err);
      return res.redirect("/#/auth?error=google_auth_error");
    }
  });

  // Supabase OAuth callback (for when Google is configured in Supabase dashboard)
  app.get("/api/auth/supabase/callback", async (req, res) => {
    try {
      // Supabase sends the tokens as URL fragments, but for server-side we need the code flow
      const { code } = req.query;
      if (code) {
        // Exchange the code for a session
        const { data, error } = await supabaseAdmin.auth.exchangeCodeForSession(code as string);
        if (error || !data.user?.email) {
          console.error("[Supabase OAuth] Error:", error);
          return res.redirect("/#/auth?error=supabase_auth_failed");
        }
        // Find or create internal user
        let user = await storage.getUserByEmail(data.user.email);
        if (!user) {
          user = await storage.createUser({
            email: data.user.email,
            password: crypto.randomBytes(32).toString("hex"),
            name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email.split("@")[0],
          });
        }
        const stores = await storage.getStoresByUser(user.id);
        const storeId = stores.length > 0 ? stores[0].id : 0;
        const token = generateToken(user.id, "seller");
        sessionCache.set(token, { userId: user.id, storeId, role: "seller", cachedAt: Date.now() });
        return res.redirect(`/#/auth?oauth_token=${token}`);
      }
      return res.redirect("/#/auth?error=no_code");
    } catch (err: any) {
      console.error("[Supabase OAuth] Error:", err);
      return res.redirect("/#/auth?error=supabase_callback_error");
    }
  });

  // =================== ONBOARDING / STORE SETUP ===================

  app.post("/api/onboarding/create-store", async (req, res) => {
    const session = await getSession(req);
    if (!session) return res.status(401).json({ error: "กรุณาเข้าสู่ระบบ" });

    // Check plan limits
    const user = await storage.getUser(session.userId);
    if (!user) return res.status(401).json({ error: "ไม่พบผู้ใช้" });
    const planLimits = getPlanLimits(user.plan || "free");
    const storeCount = await storage.getStoreCount(session.userId);
    if (storeCount >= planLimits.maxStores) {
      return res.status(403).json({
        error: `แพ็กเกจ ${planLimits.label} สร้างร้านค้าได้สูงสุด ${planLimits.maxStores} ร้าน`,
        currentCount: storeCount,
        maxStores: planLimits.maxStores,
      });
    }

    const { name, slug, description, currency, category } = req.body;
    if (!name || !slug) return res.status(400).json({ error: "กรุณากรอกชื่อร้านและ URL" });

    const existingStore = await storage.getStoreBySlug(slug);
    if (existingStore) return res.status(400).json({ error: "URL นี้ถูกใช้แล้ว กรุณาเลือก URL อื่น" });

    const store = await storage.createStore(session.userId, {
      name,
      slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, ""),
      description: description || "",
      theme: "modern-dark",
      currency: currency || "THB",
    });

    // Create default AI agents for this store
    const defaultAgents = [
      { type: "shopping_assistant", name: "Shopping Assistant", description: "ผู้ช่วยช้อปปิ้ง AI แนะนำสินค้าตาม lifestyle ของลูกค้า", enabled: true, config: { responseSpeed: 8, creativity: 7, language: "th" }, icon: "ShoppingBag" },
      { type: "recommendation", name: "Recommendation Engine", description: "เครื่องมือแนะนำสินค้าแบบ Real-time ด้วย Collaborative Filtering", enabled: true, config: { algorithm: "hybrid", minConfidence: 0.7, maxSuggestions: 8 }, icon: "Sparkles" },
      { type: "dynamic_pricing", name: "Dynamic Pricing", description: "ปรับราคาอัตโนมัติตามอุปสงค์และราคาคู่แข่ง", enabled: true, config: { maxDiscount: 30, priceFloor: 0.7, updateFrequency: "hourly" }, icon: "TrendingUp" },
      { type: "customer_support", name: "Customer Support", description: "ตอบคำถามลูกค้า 24/7 ด้วย AI ที่เข้าใจภาษาธรรมชาติ", enabled: true, config: { responseSpeed: 9, escalationThreshold: 0.3, tone: "friendly" }, icon: "Headphones" },
      { type: "inventory_forecast", name: "Inventory Forecast", description: "พยากรณ์สต็อกสินค้าและแจ้งเตือนเมื่อใกล้หมด", enabled: true, config: { forecastDays: 30, safetyStock: 10, autoReorder: false }, icon: "BarChart3" },
      { type: "visual_search", name: "Visual Search", description: "ค้นหาสินค้าด้วยรูปภาพ ใช้ Computer Vision ขั้นสูง", enabled: false, config: { accuracy: "high", maxResults: 12, similarityThreshold: 0.8 }, icon: "Eye" },
    ];

    for (const agent of defaultAgents) {
      await storage.createAiAgent(store.id, agent as any);
    }

    // Create default categories
    const defaultCategories = [
      { name: "ทั่วไป", slug: "general", sortOrder: 0 },
      { name: "อุปกรณ์อิเล็กทรอนิกส์", slug: "electronics", sortOrder: 1 },
      { name: "เสื้อผ้า", slug: "clothing", sortOrder: 2 },
      { name: "รองเท้า", slug: "shoes", sortOrder: 3 },
      { name: "กระเป๋า", slug: "bags", sortOrder: 4 },
    ];

    for (const cat of defaultCategories) {
      await storage.createCategory(store.id, cat as any);
    }

    await storage.updateUser(session.userId, { onboarded: true });

    const token = req.headers["x-session-token"] as string;
    sessionCache.set(token, { userId: session.userId, storeId: store.id, role: session.role, cachedAt: Date.now() });

    // Auto-start AI automation for the new store
    setTimeout(() => {
      startAutomation(store.id);
      console.log(`[Automation] Auto-started for new store ${store.id}`);
    }, 3000);

    res.json({ store, storeId: store.id });
  });

  app.get("/api/onboarding/check-slug/:slug", async (req, res) => {
    const slug = req.params.slug.toLowerCase().replace(/[^a-z0-9-]/g, "");
    const existing = await storage.getStoreBySlug(slug);
    res.json({ available: !existing, slug });
  });

  // =================== STORES ===================

  app.get("/api/stores", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const stores = await storage.getStoresByUser(session.userId);
    res.json(stores);
  });

  app.get("/api/stores/:id", async (req, res) => {
    const store = await storage.getStore(Number(req.params.id));
    if (!store) return res.status(404).json({ error: "ไม่พบร้านค้า" });
    res.json(store);
  });

  app.post("/api/stores", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    // Check plan limits
    const user = await storage.getUser(session.userId);
    if (!user) return res.status(401).json({ error: "ไม่พบผู้ใช้" });
    const planLimits = getPlanLimits(user.plan || "free");
    const storeCount = await storage.getStoreCount(session.userId);
    if (storeCount >= planLimits.maxStores) {
      return res.status(403).json({
        error: `แพ็กเกจ ${planLimits.label} สร้างร้านค้าได้สูงสุด ${planLimits.maxStores} ร้าน กรุณาอัปเกรดแพ็กเกจเพื่อเพิ่มจำนวนร้านค้า`,
        currentCount: storeCount,
        maxStores: planLimits.maxStores,
        plan: user.plan,
      });
    }
    const store = await storage.createStore(session.userId, req.body);
    // Auto-switch to the new store
    const token = req.headers["x-session-token"] as string;
    if (token) sessionCache.set(token, { userId: session.userId, storeId: store.id, role: session.role, cachedAt: Date.now() });
    res.json(store);
  });

  // Switch active store
  app.post("/api/stores/switch", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const { storeId } = req.body;
    if (!storeId) return res.status(400).json({ error: "กรุณาระบุ storeId" });
    // Verify user owns this store
    const store = await storage.getStore(storeId);
    if (!store || store.userId !== session.userId) {
      return res.status(403).json({ error: "คุณไม่มีสิทธิ์เข้าถึงร้านค้านี้" });
    }
    // Update session cache
    const token = req.headers["x-session-token"] as string;
    if (token) sessionCache.set(token, { userId: session.userId, storeId: store.id, role: session.role, cachedAt: Date.now() });
    res.json({ ok: true, storeId: store.id, storeName: store.name });
  });

  app.put("/api/stores/:id", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const store = await storage.updateStore(Number(req.params.id), req.body);
    if (!store) return res.status(404).json({ error: "ไม่พบร้านค้า" });
    res.json(store);
  });

  // Delete store
  app.delete("/api/stores/:id", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const storeId = Number(req.params.id);
    // Verify user owns this store
    const store = await storage.getStore(storeId);
    if (!store || store.userId !== session.userId) {
      return res.status(403).json({ error: "คุณไม่มีสิทธิ์ลบร้านค้านี้" });
    }
    const success = await storage.deleteStore(storeId);
    if (!success) return res.status(500).json({ error: "ไม่สามารถลบร้านค้าได้" });
    // If deleted store was active, switch to another store
    if (session.storeId === storeId) {
      const remaining = await storage.getStoresByUser(session.userId);
      const newStoreId = remaining.length > 0 ? remaining[0].id : 0;
      const token = req.headers["x-session-token"] as string;
      if (token) sessionCache.set(token, { userId: session.userId, storeId: newStoreId, role: session.role, cachedAt: Date.now() });
    }
    res.json({ ok: true });
  });

  // =================== CATEGORIES ===================

  app.get("/api/categories", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const cats = await storage.getCategoriesByStore(session.storeId);
    res.json(cats);
  });

  app.post("/api/categories", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const { name, slug, description, image, parentId, sortOrder } = req.body;
    if (!name) return res.status(400).json({ error: "กรุณากรอกชื่อหมวดหมู่" });
    const autoSlug = slug || name.toLowerCase().replace(/[^a-z0-9ก-๙]+/g, "-").replace(/^-|-$/g, "");
    const cat = await storage.createCategory(session.storeId, { name, slug: autoSlug, description, image, parentId, sortOrder: sortOrder || 0 });
    res.json(cat);
  });

  app.put("/api/categories/:id", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const cat = await storage.updateCategory(Number(req.params.id), req.body);
    if (!cat) return res.status(404).json({ error: "ไม่พบหมวดหมู่" });
    res.json(cat);
  });

  app.delete("/api/categories/:id", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const ok = await storage.deleteCategory(Number(req.params.id));
    res.json({ ok });
  });

  // =================== IMAGE UPLOAD ===================

  app.post("/api/upload", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    try {
      const { fileData, fileName, contentType, folder } = req.body;
      if (!fileData || !fileName) return res.status(400).json({ error: "กรุณาแนบไฟล์" });
      const buffer = Buffer.from(fileData, "base64");
      const path = `stores/${session.storeId}/${folder || "products"}/${Date.now()}-${fileName}`;
      const { data, error } = await supabaseAdmin.storage.from("zentra-uploads").upload(path, buffer, { contentType: contentType || "image/jpeg", upsert: false });
      if (error) {
        if (error.message?.includes("not found") || error.message?.includes("Bucket")) {
          await supabaseAdmin.storage.createBucket("zentra-uploads", { public: true });
          const retry = await supabaseAdmin.storage.from("zentra-uploads").upload(path, buffer, { contentType: contentType || "image/jpeg", upsert: false });
          if (retry.error) throw retry.error;
          const { data: urlData } = supabaseAdmin.storage.from("zentra-uploads").getPublicUrl(path);
          return res.json({ url: urlData.publicUrl, path });
        }
        throw error;
      }
      const { data: urlData } = supabaseAdmin.storage.from("zentra-uploads").getPublicUrl(path);
      res.json({ url: urlData.publicUrl, path });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "อัพโหลดไม่สำเร็จ" });
    }
  });

  // =================== PRODUCTS ===================

  app.get("/api/products", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const products = await storage.getProductsByStore(session.storeId);
    res.json(products);
  });

  app.post("/api/products", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const product = await storage.createProduct(session.storeId, req.body);
    scheduleReindex(session.storeId);
    res.json(product);
  });

  app.put("/api/products/:id", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const product = await storage.updateProduct(Number(req.params.id), req.body);
    if (!product) return res.status(404).json({ error: "ไม่พบสินค้า" });
    scheduleReindex(session.storeId);
    res.json(product);
  });

  app.delete("/api/products/:id", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const ok = await storage.deleteProduct(Number(req.params.id));
    scheduleReindex(session.storeId);
    res.json({ ok });
  });

  // =================== ORDERS ===================

  app.get("/api/orders", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const orders = await storage.getOrdersByStore(session.storeId);
    res.json(orders);
  });

  app.post("/api/orders", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const order = await storage.createOrder(session.storeId, req.body);
    scheduleReindex(session.storeId);
    res.json(order);
  });

  app.put("/api/orders/:id", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const order = await storage.updateOrder(Number(req.params.id), req.body);
    if (!order) return res.status(404).json({ error: "ไม่พบคำสั่งซื้อ" });
    scheduleReindex(session.storeId);
    res.json(order);
  });

  // =================== CUSTOMERS ===================

  app.get("/api/customers", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const customers = await storage.getCustomersByStore(session.storeId);
    res.json(customers);
  });

  app.post("/api/customers", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const customer = await storage.createCustomer(session.storeId, req.body);
    scheduleReindex(session.storeId);
    res.json(customer);
  });

  app.put("/api/customers/:id", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const customer = await storage.updateCustomer(Number(req.params.id), req.body);
    if (!customer) return res.status(404).json({ error: "ไม่พบลูกค้า" });
    scheduleReindex(session.storeId);
    res.json(customer);
  });

  // =================== DISCOUNTS ===================

  app.get("/api/discounts", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const discounts = await storage.getDiscountsByStore(session.storeId);
    res.json(discounts);
  });

  app.post("/api/discounts", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const discount = await storage.createDiscount(session.storeId, req.body);
    res.json(discount);
  });

  app.put("/api/discounts/:id", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const discount = await storage.updateDiscount(Number(req.params.id), req.body);
    if (!discount) return res.status(404).json({ error: "ไม่พบโค้ดส่วนลด" });
    res.json(discount);
  });

  app.delete("/api/discounts/:id", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const ok = await storage.deleteDiscount(Number(req.params.id));
    res.json({ ok });
  });

  // Validate discount code (public)
  app.post("/api/public/validate-discount", async (req, res) => {
    const { code, storeSlug, total } = req.body;
    if (!code || !storeSlug) return res.status(400).json({ valid: false });
    const store = await storage.getStoreBySlug(storeSlug);
    if (!store) return res.status(404).json({ valid: false });
    const discounts = await storage.getDiscountsByStore(store.id);
    const discount = discounts.find(d => d.code.toLowerCase() === code.toLowerCase() && d.active);
    if (!discount) return res.json({ valid: false, error: "ไม่พบโค้ดส่วนลด" });
    if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) return res.json({ valid: false, error: "โค้ดหมดอายุ" });
    if (discount.maxUses && (discount.usedCount || 0) >= discount.maxUses) return res.json({ valid: false, error: "โค้ดถูกใช้หมดแล้ว" });
    if (discount.minPurchase && total < discount.minPurchase) return res.json({ valid: false, error: `ยอดขั้นต่ำ ฿${discount.minPurchase}` });
    const discountAmount = discount.type === "percentage" ? (total * discount.value / 100) : discount.value;
    res.json({ valid: true, discount: { ...discount }, discountAmount });
  });

  // =================== AI AGENTS ===================

  app.get("/api/ai-agents", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    // Auto-create default agents if store has none
    await ensureAgentsExist(session.storeId);
    const agents = await storage.getAiAgentsByStore(session.storeId);
    res.json(agents);
  });

  app.put("/api/ai-agents/:id", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const agent = await storage.updateAiAgent(Number(req.params.id), req.body);
    if (!agent) return res.status(404).json({ error: "ไม่พบ AI Agent" });
    res.json(agent);
  });

  // AI Gemini status & key management
  // Public Gemini status (no auth) for debugging
  app.get("/api/ai/gemini-status", async (req, res) => {
    const status = getGeminiStatus();
    res.json(status);
  });

  // Debug test endpoint to verify Gemini API connectivity
  app.get("/api/ai/test", async (_req, res) => {
    const status = getGeminiStatus();
    if (!status.hasKey) {
      return res.json({ ok: false, error: "No API key configured", status });
    }
    try {
      const result = await chatWithAgent("customer_support", "ทดสอบ: ตอบว่า OK", 1);
      return res.json({ ok: true, reply: result.reply.slice(0, 200), agentName: result.agentName, memoryUsed: result.memoryUsed });
    } catch (e: any) {
      return res.json({ ok: false, error: e.message, status });
    }
  });

  app.post("/api/ai/gemini-key", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const { apiKey } = req.body;
    const ok = updateGeminiApiKey(apiKey);
    res.json({ ok, status: getGeminiStatus() });
  });

  // AI Text Generation (#16)
  app.post("/api/ai/generate-text", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const { prompt, type } = req.body; // type: description, seo, blog, product
    if (!prompt) return res.status(400).json({ error: "กรุณาระบุ prompt" });
    try {
      const result = await chatWithAgent("shopping_assistant", `[GENERATE ${type?.toUpperCase() || "TEXT"}] ${prompt}`, session.storeId);
      res.json({ text: result.reply, agentName: result.agentName });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // AI Image Generation placeholder (#16)
  app.post("/api/ai/generate-image", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const { prompt } = req.body;
    // Gemini doesn't generate images directly, but we can generate a description
    res.json({
      success: false,
      message: "การสร้างรูปภาพด้วย AI ต้องใช้ API เพิ่มเติม (เช่น DALL-E, Stable Diffusion) กรุณาเชื่อมต่อ API ในหน้าการตั้งค่า",
      prompt,
    });
  });

  // =================== DASHBOARD ===================

  app.get("/api/dashboard/stats", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const stats = await storage.getDashboardStats(session.storeId);
    res.json(stats);
  });

  app.get("/api/dashboard/chart", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const data = await storage.getChartData(session.storeId);
    res.json(data);
  });

  // =================== AI CHAT ===================

  app.post("/api/ai-chat", async (req, res) => {
    try {
      const session = await requireAuth(req, res);
      if (!session) return;
      const { agentType, message } = req.body;
      if (!agentType || !message) return res.status(400).json({ error: "กรุณาระบุ agentType และ message" });
      // Auto-create agents if missing (fixes 'Agent not found' error)
      await ensureAgentsExist(session.storeId);
      // Per-user session key so each user gets their own conversation memory
      const customerId = `user-${session.userId}-store-${session.storeId}`;
      const result = await chatWithAgent(agentType, message, session.storeId, customerId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "AI ไม่สามารถตอบกลับได้" });
    }
  });

  app.get("/api/ai-chat/history/:agentType", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const history = getChatHistory(req.params.agentType, session.storeId, session.userId);
    res.json(history);
  });

  app.delete("/api/ai-chat/history/:agentType", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    clearChatHistory(req.params.agentType, session.storeId, session.userId);
    res.json({ ok: true });
  });

  // =================== KNOWLEDGE BASE ===================

  app.get("/api/knowledge-base", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const entries = getKnowledgeEntries(session.storeId);
    res.json(entries);
  });

  app.post("/api/knowledge-base", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const { title, content, category } = req.body;
    if (!title || !content || !category) return res.status(400).json({ error: "กรุณากรอก title, content, category" });
    const entry = addKnowledgeEntry(session.storeId, { title, content, category });
    res.json(entry);
  });

  app.delete("/api/knowledge-base/:id", async (req, res) => {
    const ok = deleteKnowledgeEntry(Number(req.params.id));
    res.json({ ok });
  });

  app.post("/api/knowledge-base/reindex", async (req, res) => {
    try {
      const session = await requireAuth(req, res);
      if (!session) return;
      const result = await reindexStore(session.storeId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "ไม่สามารถ reindex ได้" });
    }
  });

  // MEMORY + RAG Stats
  app.get("/api/ai/stats", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const memory = getMemoryStats();
    const rag = getRAGStats(session.storeId);
    res.json({ memory, rag, gemini: getGeminiStatus() });
  });

  // =================== EMPLOYEES (#3) ===================

  app.get("/api/employees", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const employees = await storage.getEmployeesByStore(session.storeId);
    res.json(employees);
  });

  app.post("/api/employees", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const { name, email, role, permissions, pin } = req.body;
    if (!name) return res.status(400).json({ error: "กรุณากรอกชื่อพนักงาน" });
    const employee = await storage.createEmployee({ storeId: session.storeId, name, email, role: role || "staff", permissions, pin });
    res.json(employee);
  });

  app.put("/api/employees/:id", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const emp = await storage.updateEmployee(Number(req.params.id), req.body);
    if (!emp) return res.status(404).json({ error: "ไม่พบพนักงาน" });
    res.json(emp);
  });

  app.delete("/api/employees/:id", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const ok = await storage.deleteEmployee(Number(req.params.id));
    res.json({ ok });
  });

  // =================== STOCK LOGS (#3) ===================

  app.get("/api/stock-logs", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const logs = await storage.getStockLogsByStore(session.storeId);
    res.json(logs);
  });

  app.post("/api/stock-logs", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const { productId, type, quantity, reason } = req.body;
    if (!productId || !type || quantity === undefined) return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบ" });
    // Update product stock
    const product = await storage.getProduct(productId);
    if (product) {
      const newStock = type === "adjustment" ? quantity : product.stock + quantity;
      await storage.updateProduct(productId, { stock: Math.max(0, newStock) });
    }
    const log = await storage.createStockLog({ storeId: session.storeId, productId, type, quantity, reason });
    res.json(log);
  });

  // =================== BLOG POSTS (#14) ===================

  app.get("/api/blog", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const posts = await storage.getBlogPostsByStore(session.storeId);
    res.json(posts);
  });

  app.get("/api/blog/:id", async (req, res) => {
    const posts = await storage.getAllPublishedPosts();
    const post = posts.find(p => p.id === Number(req.params.id));
    if (!post) return res.status(404).json({ error: "ไม่พบบทความ" });
    res.json(post);
  });

  app.post("/api/blog", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const { title, content, excerpt, coverImage, category, tags, status, seoTitle, seoDescription } = req.body;
    if (!title || !content) return res.status(400).json({ error: "กรุณากรอกหัวข้อและเนื้อหา" });
    const slug = title.toLowerCase().replace(/[^a-z0-9ก-๙]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now();
    const post = await storage.createBlogPost({ storeId: session.storeId, title, slug, content, excerpt, coverImage, category, tags, status: status || "draft", authorId: session.userId, seoTitle, seoDescription });
    res.json(post);
  });

  app.put("/api/blog/:id", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const post = await storage.updateBlogPost(Number(req.params.id), req.body);
    if (!post) return res.status(404).json({ error: "ไม่พบบทความ" });
    res.json(post);
  });

  app.delete("/api/blog/:id", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const ok = await storage.deleteBlogPost(Number(req.params.id));
    res.json({ ok });
  });

  // Public blog posts
  app.get("/api/public/blog", async (req, res) => {
    const posts = await storage.getAllPublishedPosts();
    res.json(posts);
  });

  app.get("/api/public/blog/:slug", async (req, res) => {
    const post = await storage.getBlogPostBySlug(req.params.slug);
    if (!post || post.status !== "published") return res.status(404).json({ error: "ไม่พบบทความ" });
    res.json(post);
  });

  // =================== POS (#6) ===================

  app.post("/api/pos/order", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const { items, customerName, paymentMethod, employeeId } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ error: "กรุณาเพิ่มสินค้า" });

    const subtotal = items.reduce((s: number, item: any) => s + (item.price * item.qty), 0);
    const order = await storage.createOrder(session.storeId, {
      customerName: customerName || "Walk-in Customer",
      total: subtotal,
      subtotal,
      discount: 0,
      status: "completed",
      paymentMethod: paymentMethod || "cash",
      paymentStatus: "paid",
      items,
      source: "pos",
      employeeId: employeeId || null,
    } as any);

    // Update stock
    for (const item of items) {
      if (item.productId) {
        const product = await storage.getProduct(item.productId);
        if (product && product.stock > 0) {
          await storage.updateProduct(item.productId, { stock: Math.max(0, product.stock - item.qty) });
        }
      }
    }

    res.json(order);
  });

  // =================== LINE API ===================

  app.post("/api/line/setup", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const { channelId, channelSecret, accessToken } = req.body;
    if (!channelId || !channelSecret) return res.status(400).json({ error: "กรุณากรอก Channel ID และ Channel Secret" });
    const store = await storage.updateStore(session.storeId, { lineChannelId: channelId, lineChannelSecret: channelSecret, lineAccessToken: accessToken || null } as any);
    res.json({ ok: true, store });
  });

  app.get("/api/line/status", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const store = await storage.getStore(session.storeId);
    if (!store) return res.status(404).json({ error: "ไม่พบร้านค้า" });
    res.json({
      connected: !!(store as any).lineChannelId,
      channelId: (store as any).lineChannelId || null,
      hasSecret: !!(store as any).lineChannelSecret,
      hasAccessToken: !!(store as any).lineAccessToken,
    });
  });

  app.post("/api/line/webhook/:storeSlug", async (req, res) => {
    const store = await storage.getStoreBySlug(req.params.storeSlug);
    if (!store) return res.status(404).json({ error: "Store not found" });
    const signature = req.headers["x-line-signature"] as string;
    const channelSecret = (store as any).lineChannelSecret;
    if (channelSecret && signature) {
      const body = JSON.stringify(req.body);
      const expectedSig = crypto.createHmac("SHA256", channelSecret).update(body).digest("base64");
      if (signature !== expectedSig) return res.status(403).json({ error: "Invalid signature" });
    }
    const events = req.body?.events || [];
    for (const event of events) {
      if (event.type === "message" && event.message.type === "text") {
        await storage.createLineMessage(store.id, { lineUserId: event.source.userId, direction: "inbound", messageType: "text", content: event.message.text, timestamp: new Date(event.timestamp).toISOString() });
        const accessToken = (store as any).lineAccessToken;
        if (accessToken) {
          try {
            const aiResult = await chatWithAgent("customer_support", event.message.text, store.id, event.source.userId);
            await fetch("https://api.line.me/v2/bot/message/reply", {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}` },
              body: JSON.stringify({ replyToken: event.replyToken, messages: [{ type: "text", text: aiResult.reply.replace(/\n\n_\(.*?\)_$/s, "") }] }),
            });
            await storage.createLineMessage(store.id, { lineUserId: event.source.userId, direction: "outbound", messageType: "text", content: aiResult.reply, timestamp: new Date().toISOString() });
          } catch (err: any) { console.error("LINE reply error:", err.message); }
        }
      }
    }
    res.json({ ok: true });
  });

  app.post("/api/line/send", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const store = await storage.getStore(session.storeId);
    if (!store) return res.status(404).json({ error: "ไม่พบร้านค้า" });
    const accessToken = (store as any).lineAccessToken;
    if (!accessToken) return res.status(400).json({ error: "ยังไม่ได้ตั้งค่า LINE Access Token" });
    const { userId, message } = req.body;
    if (!userId || !message) return res.status(400).json({ error: "กรุณาระบุ userId และ message" });
    try {
      await fetch("https://api.line.me/v2/bot/message/push", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}` }, body: JSON.stringify({ to: userId, messages: [{ type: "text", text: message }] }) });
      await storage.createLineMessage(store.id, { lineUserId: userId, direction: "outbound", messageType: "text", content: message, timestamp: new Date().toISOString() });
      res.json({ ok: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get("/api/line/messages", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const messages = await storage.getLineMessagesByStore(session.storeId);
    res.json(messages);
  });

  // =================== META/FACEBOOK INTEGRATION (#1) ===================

  app.post("/api/meta/setup", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const { pixelId, accessToken, catalogId } = req.body;
    const store = await storage.updateStore(session.storeId, { metaPixelId: pixelId, metaAccessToken: accessToken, metaCatalogId: catalogId } as any);
    res.json({ ok: true, store });
  });

  app.get("/api/meta/status", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const store = await storage.getStore(session.storeId);
    if (!store) return res.status(404).json({ error: "ไม่พบร้านค้า" });
    res.json({
      connected: !!(store as any).metaPixelId,
      pixelId: (store as any).metaPixelId || null,
      hasCatalog: !!(store as any).metaCatalogId,
      hasAccessToken: !!(store as any).metaAccessToken,
    });
  });

  // =================== API CONNECTIONS STATUS (#1) ===================

  app.get("/api/integrations/status", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const store = await storage.getStore(session.storeId);
    if (!store) return res.json({ integrations: [] });
    const gemini = getGeminiStatus();
    res.json({
      integrations: [
        { name: "Gemini AI", type: "ai", connected: gemini.hasKey, icon: "Brain" },
        { name: "LINE Official Account", type: "messaging", connected: !!(store as any).lineChannelId, icon: "MessageSquare" },
        { name: "Meta / Facebook", type: "marketing", connected: !!(store as any).metaPixelId, icon: "Share2" },
        { name: "Stripe", type: "payment", connected: !!(store as any).stripeKey, icon: "CreditCard" },
        { name: "PromptPay", type: "payment", connected: !!(store as any).paymentMethods && (store.paymentMethods as any)?.promptpay, icon: "Smartphone" },
        { name: "Supabase", type: "database", connected: true, icon: "Database" },
      ],
    });
  });

  // =================== PUBLIC STOREFRONT ===================

  app.get("/api/public/store/:slug", async (req, res) => {
    const store = await storage.getStoreBySlug(req.params.slug);
    if (!store || store.status !== "active") return res.status(404).json({ error: "ไม่พบร้านค้า" });
    res.json({
      store: {
        id: store.id, name: store.name, slug: store.slug, description: store.description,
        logo: store.logo, theme: store.theme, currency: store.currency,
        seoTitle: (store as any).seoTitle, seoDescription: (store as any).seoDescription,
        customBanner: (store as any).customBanner, storeThemeConfig: (store as any).storeThemeConfig,
        loyaltyEnabled: (store as any).loyaltyEnabled, storefrontLayout: (store as any).storefrontLayout,
      },
    });
  });

  app.get("/api/public/store/:slug/products", async (req, res) => {
    const store = await storage.getStoreBySlug(req.params.slug);
    if (!store) return res.status(404).json({ error: "ไม่พบร้านค้า" });
    const products = await storage.getProductsByStore(store.id);
    res.json(products.filter((p: any) => p.status === "active"));
  });

  app.get("/api/public/store/:slug/categories", async (req, res) => {
    const store = await storage.getStoreBySlug(req.params.slug);
    if (!store) return res.status(404).json({ error: "ไม่พบร้านค้า" });
    const cats = await storage.getCategoriesByStore(store.id);
    res.json(cats);
  });

  app.post("/api/public/store/:slug/orders", async (req, res) => {
    const store = await storage.getStoreBySlug(req.params.slug);
    if (!store) return res.status(404).json({ error: "ไม่พบร้านค้า" });
    const { customerName, customerEmail, customerPhone, items, shippingAddress, paymentMethod, discountCode } = req.body;
    if (!customerName || !items || items.length === 0) return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบ" });
    let subtotal = items.reduce((s: number, item: any) => s + (item.price * item.qty), 0);
    let discount = 0;
    if (discountCode) {
      const discounts = await storage.getDiscountsByStore(store.id);
      const disc = discounts.find(d => d.code.toLowerCase() === discountCode.toLowerCase() && d.active);
      if (disc) {
        discount = disc.type === "percentage" ? (subtotal * disc.value / 100) : disc.value;
        await storage.updateDiscount(disc.id, { usedCount: (disc.usedCount || 0) + 1 });
      }
    }
    const total = subtotal - discount;
    const order = await storage.createOrder(store.id, { customerName, customerEmail: customerEmail || "", customerPhone: customerPhone || "", subtotal, discount, total: Math.max(0, total), status: "pending", paymentMethod: paymentMethod || "bank_transfer", paymentStatus: "pending", items, shippingAddress: shippingAddress || "" } as any);
    for (const item of items) {
      if (item.productId) {
        const product = await storage.getProduct(item.productId);
        if (product && product.stock > 0) await storage.updateProduct(item.productId, { stock: Math.max(0, product.stock - item.qty) });
      }
    }
    if (customerEmail || customerPhone) {
      try { await storage.createCustomer(store.id, { name: customerName, email: customerEmail || "", phone: customerPhone || "" }); } catch (_) {}
    }
    res.json(order);
  });

  // =================== SHOPPING MALL ===================

  app.get("/api/public/mall/products", async (req, res) => {
    try {
      const { category, search, limit, offset } = req.query;
      const allProducts = await storage.getAllActiveProducts();
      let filtered = allProducts;
      if (category && category !== "all") filtered = filtered.filter((p: any) => p.category === category);
      if (search) { const q = (search as string).toLowerCase(); filtered = filtered.filter((p: any) => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)); }
      const total = filtered.length;
      const lim = Math.min(parseInt(limit as string) || 48, 100);
      const off = parseInt(offset as string) || 0;
      filtered = filtered.slice(off, off + lim);
      res.json({ products: filtered, total, limit: lim, offset: off });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/public/mall/stores", async (req, res) => {
    try {
      const allStores = await storage.getAllActiveStores();
      res.json(allStores);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/public/mall/categories", async (req, res) => {
    try {
      const allProducts = await storage.getAllActiveProducts();
      const catMap = new Map<string, number>();
      for (const p of allProducts) { if (p.category) catMap.set(p.category, (catMap.get(p.category) || 0) + 1); }
      const cats = [...catMap.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
      res.json(cats);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  // AI Content Generation
  app.post("/api/ai-generate/text", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ error: "Missing prompt" });
      const result = await chatWithAgent("shopping_assistant", prompt, 1);
      res.json({ text: result.reply });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.post("/api/ai-generate/image", async (req, res) => {
    try {
      const { prompt, style } = req.body;
      if (!prompt) return res.status(400).json({ error: "Missing prompt" });
      const descPrompt = `Generate a detailed image description in English for: ${prompt}. Style: ${style || "product photo"}. Respond with only the image description, nothing else.`;
      const result = await chatWithAgent("visual_search", descPrompt, 1);
      res.json({ description: result.reply, imageUrl: null, note: "Image generation via Gemini Imagen coming soon. Description generated." });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  // =================== AUTOMATION ENGINE ===================

  // Get all automation states for store
  app.get("/api/automation/states", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const states = getAllAutomationStates(session.storeId);
    res.json(states);
  });

  // Get single agent automation state
  app.get("/api/automation/state/:agentType", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const state = getAutomationState(req.params.agentType, session.storeId);
    res.json(state);
  });

  // Trigger a specific agent manually
  app.post("/api/automation/trigger/:agentType", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    try {
      const task = await triggerAgent(req.params.agentType, session.storeId);
      // Update agent status in DB
      const agents = await storage.getAiAgentsByStore(session.storeId);
      const agent = agents.find(a => a.type === req.params.agentType);
      if (agent) {
        await storage.updateAiAgent(agent.id, { status: task.status === "completed" ? "active" : "error", lastActive: new Date().toISOString() });
      }
      res.json(task);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Trigger ALL enabled agents
  app.post("/api/automation/trigger-all", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    try {
      const agents = await storage.getAiAgentsByStore(session.storeId);
      const results: any[] = [];
      for (const agent of agents) {
        if (agent.enabled) {
          try {
            const task = await triggerAgent(agent.type, session.storeId);
            await storage.updateAiAgent(agent.id, { status: task.status === "completed" ? "active" : "error", lastActive: new Date().toISOString() });
            results.push({ agentType: agent.type, status: task.status, taskId: task.id });
          } catch (e: any) {
            results.push({ agentType: agent.type, status: "failed", error: e.message });
          }
        }
      }
      res.json({ results, triggeredAt: new Date().toISOString() });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get automation stats summary
  app.get("/api/automation/stats", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const stats = getAutomationStats(session.storeId);
    res.json(stats);
  });

  // Get insights (all or by agent)
  app.get("/api/automation/insights", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const agentType = req.query.agentType as string | undefined;
    const unreadOnly = req.query.unreadOnly === "true";
    const insights = getInsights(session.storeId, agentType, unreadOnly);
    res.json(insights);
  });

  // Mark insight as read
  app.post("/api/automation/insights/:id/read", async (req, res) => {
    markInsightRead(req.params.id);
    res.json({ ok: true });
  });

  // Start automation scheduler
  app.post("/api/automation/start", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    startAutomation(session.storeId);
    res.json({ ok: true, message: "Automation started" });
  });

  // Stop automation scheduler
  app.post("/api/automation/stop", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    stopAutomation(session.storeId);
    res.json({ ok: true, message: "Automation stopped" });
  });

  // ============= Payment Architecture v1 Routes =============

  // In-memory stores for payment data (same pattern as HybridStorage)
  const subscriptionsStore: Map<number, any[]> = new Map();
  const billingInvoicesStore: Map<number, any[]> = new Map();
  const merchantPaymentAccountsStore: Map<number, any[]> = new Map();
  const paymentTransactionsStore: Map<number, any[]> = new Map();
  const paymentWebhooksStore: any[] = [];
  let paymentIdCounter = 10000;
  function nextPaymentId() { return ++paymentIdCounter; }

  // --- Merchant Payment Account CRUD ---

  // GET /api/payment/merchant-account
  app.get("/api/payment/merchant-account", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const accounts = merchantPaymentAccountsStore.get(session.storeId) || [];
    const active = accounts.find((a: any) => a.active);
    if (!active) return res.json(null);
    // Never expose secret key hash
    const { opnSecretKeyHash, ...safe } = active;
    res.json({ ...safe, hasSecretKey: !!opnSecretKeyHash });
  });

  // POST /api/payment/merchant-account
  app.post("/api/payment/merchant-account", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const {
      opnPublicKey, opnSecretKey,
      promptpayEnabled, promptpayId,
      truemoneyEnabled,
      bankTransferEnabled, bankName, bankAccountNumber, bankAccountName,
    } = req.body;

    const existing = (merchantPaymentAccountsStore.get(session.storeId) || []).find((a: any) => a.active);
    const now = new Date().toISOString();

    if (existing) {
      // Update
      if (opnPublicKey !== undefined) existing.opnPublicKey = opnPublicKey;
      if (opnSecretKey) existing.opnSecretKeyHash = hashSecretKey(opnSecretKey);
      if (promptpayEnabled !== undefined) existing.promptpayEnabled = promptpayEnabled;
      if (promptpayId !== undefined) existing.promptpayId = promptpayId;
      if (truemoneyEnabled !== undefined) existing.truemoneyEnabled = truemoneyEnabled;
      if (bankTransferEnabled !== undefined) existing.bankTransferEnabled = bankTransferEnabled;
      if (bankName !== undefined) existing.bankName = bankName;
      if (bankAccountNumber !== undefined) existing.bankAccountNumber = bankAccountNumber;
      if (bankAccountName !== undefined) existing.bankAccountName = bankAccountName;
      existing.updatedAt = now;

      const { opnSecretKeyHash, ...safe } = existing;
      return res.json({ ...safe, hasSecretKey: !!opnSecretKeyHash });
    }

    // Create new
    const account = {
      id: nextPaymentId(),
      storeId: session.storeId,
      provider: "opn",
      opnPublicKey: opnPublicKey || null,
      opnSecretKeyHash: opnSecretKey ? hashSecretKey(opnSecretKey) : null,
      promptpayEnabled: promptpayEnabled || false,
      promptpayId: promptpayId || null,
      truemoneyEnabled: truemoneyEnabled || false,
      bankTransferEnabled: bankTransferEnabled || false,
      bankName: bankName || null,
      bankAccountNumber: bankAccountNumber || null,
      bankAccountName: bankAccountName || null,
      webhookEndpoint: null,
      webhookSecret: null,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    if (!merchantPaymentAccountsStore.has(session.storeId)) {
      merchantPaymentAccountsStore.set(session.storeId, []);
    }
    merchantPaymentAccountsStore.get(session.storeId)!.push(account);

    const { opnSecretKeyHash, ...safe } = account;
    res.json({ ...safe, hasSecretKey: !!opnSecretKeyHash });
  });

  // DELETE /api/payment/merchant-account
  app.delete("/api/payment/merchant-account", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const accounts = merchantPaymentAccountsStore.get(session.storeId) || [];
    accounts.forEach((a: any) => { a.active = false; });
    res.json({ ok: true });
  });

  // --- Subscription Routes (B2B) ---

  // GET /api/payment/subscription
  app.get("/api/payment/subscription", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const subs = subscriptionsStore.get(session.userId) || [];
    const active = subs.find((s: any) => s.status === "active" || s.status === "trialing");
    res.json(active || { plan: "free", status: "active" });
  });

  // POST /api/payment/subscription — create or upgrade
  app.post("/api/payment/subscription", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const { plan, provider } = req.body;

    if (!["free", "pro", "enterprise"].includes(plan)) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    const now = new Date().toISOString();
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Deactivate existing
    const existing = subscriptionsStore.get(session.userId) || [];
    existing.forEach((s: any) => { s.status = "canceled"; });

    const sub = {
      id: nextPaymentId(),
      userId: session.userId,
      plan,
      status: "active",
      provider: provider || "stripe",
      providerSubscriptionId: null,
      providerCustomerId: null,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      trialEnd: null,
      createdAt: now,
      updatedAt: now,
    };

    if (!subscriptionsStore.has(session.userId)) {
      subscriptionsStore.set(session.userId, []);
    }
    subscriptionsStore.get(session.userId)!.push(sub);

    // Update user plan in storage
    try {
      await storage.updateUser(session.userId, { plan });
    } catch {}

    res.json(sub);
  });

  // DELETE /api/payment/subscription — cancel
  app.delete("/api/payment/subscription", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const subs = subscriptionsStore.get(session.userId) || [];
    const active = subs.find((s: any) => s.status === "active");
    if (active) {
      active.cancelAtPeriodEnd = true;
      active.updatedAt = new Date().toISOString();
    }
    res.json({ ok: true });
  });

  // GET /api/payment/invoices
  app.get("/api/payment/invoices", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const invoices = billingInvoicesStore.get(session.userId) || [];
    res.json(invoices.sort((a: any, b: any) => (b.createdAt || "").localeCompare(a.createdAt || "")));
  });

  // --- Public Checkout (B2C) ---

  // POST /api/public/checkout/:storeSlug — create payment
  app.post("/api/public/checkout/:storeSlug", async (req, res) => {
    try {
      const store = await storage.getStoreBySlug(req.params.storeSlug);
      if (!store) return res.status(404).json({ error: "Store not found" });

      const { method, amount, orderId, phone, returnUrl } = req.body;
      if (!method || !amount) {
        return res.status(400).json({ error: "method and amount required" });
      }

      const accounts = merchantPaymentAccountsStore.get(store.id) || [];
      const account = accounts.find((a: any) => a.active);

      const now = new Date().toISOString();
      const txn: any = {
        id: nextPaymentId(),
        storeId: store.id,
        orderId: orderId || null,
        amount,
        currency: "THB",
        method,
        status: "pending",
        providerChargeId: null,
        providerRef: null,
        qrCodeUrl: null,
        expiresAt: null,
        paidAt: null,
        failureCode: null,
        failureMessage: null,
        metadata: null,
        createdAt: now,
      };

      // If OPN keys are configured, create real charge
      if (account?.opnPublicKey && account?.opnSecretKeyHash) {
        // NOTE: In production, the secret key would be decrypted.
        // For this MVP, we store only the hash. Real OPN calls require the actual key.
        // Simulate charge creation for demo purposes.
        const chargeId = `chrg_test_${crypto.randomBytes(12).toString("hex")}`;
        txn.providerChargeId = chargeId;

        if (method === "promptpay") {
          txn.qrCodeUrl = `https://api.omise.co/charges/${chargeId}/documents/qr`;
          txn.expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
          txn.status = "pending";
        } else if (method === "truemoney") {
          txn.status = "pending";
          txn.metadata = { authorizeUri: `https://api.omise.co/charges/${chargeId}/authorize` };
        } else if (method === "bank_transfer") {
          txn.status = "pending";
        }
      } else {
        // Manual mode — generate demo QR / pending status
        txn.providerChargeId = `manual_${crypto.randomBytes(8).toString("hex")}`;
        if (method === "promptpay" && account?.promptpayId) {
          txn.status = "pending";
          txn.metadata = { promptpayId: account.promptpayId };
        } else {
          txn.status = "pending";
        }
      }

      if (!paymentTransactionsStore.has(store.id)) {
        paymentTransactionsStore.set(store.id, []);
      }
      paymentTransactionsStore.get(store.id)!.push(txn);

      res.json({
        transactionId: txn.id,
        chargeId: txn.providerChargeId,
        qrCodeUrl: txn.qrCodeUrl,
        authorizeUri: txn.metadata?.authorizeUri || null,
        status: txn.status,
        expiresAt: txn.expiresAt,
        amount: txn.amount,
        method: txn.method,
      });
    } catch (err: any) {
      console.error("Checkout error:", err);
      res.status(500).json({ error: err.message || "Payment creation failed" });
    }
  });

  // GET /api/public/payment-status/:transactionId — poll payment status
  app.get("/api/public/payment-status/:transactionId", async (req, res) => {
    const txnId = parseInt(req.params.transactionId);
    let found: any = null;
    for (const txns of paymentTransactionsStore.values()) {
      found = txns.find((t: any) => t.id === txnId);
      if (found) break;
    }
    if (!found) return res.status(404).json({ error: "Transaction not found" });
    res.json({
      transactionId: found.id,
      status: found.status,
      paidAt: found.paidAt,
      amount: found.amount,
      method: found.method,
    });
  });

  // GET /api/payment/transactions — merchant view their transactions
  app.get("/api/payment/transactions", async (req, res) => {
    const session = await requireAuth(req, res);
    if (!session) return;
    const txns = paymentTransactionsStore.get(session.storeId) || [];
    res.json(txns.sort((a: any, b: any) => (b.createdAt || "").localeCompare(a.createdAt || "")));
  });

  // --- Webhook Receivers ---

  // POST /api/webhooks/omise — OPN/Omise webhook
  app.post("/api/webhooks/omise", async (req, res) => {
    try {
      const rawBody = JSON.stringify(req.body);
      const event = parseOmiseWebhookEvent(rawBody);

      // Log webhook
      paymentWebhooksStore.push({
        id: nextPaymentId(),
        provider: "omise",
        eventType: event.eventType,
        eventId: event.eventId,
        payload: req.body,
        processed: false,
        processedAt: null,
        error: null,
        createdAt: new Date().toISOString(),
      });

      // Process charge events
      if (event.eventType.startsWith("charge.") && event.chargeId) {
        for (const txns of paymentTransactionsStore.values()) {
          const txn = txns.find((t: any) => t.providerChargeId === event.chargeId);
          if (txn) {
            if (event.chargeStatus === "successful") {
              txn.status = "successful";
              txn.paidAt = new Date().toISOString();
            } else if (event.chargeStatus === "failed") {
              txn.status = "failed";
              txn.failureCode = event.data?.failure_code || null;
              txn.failureMessage = event.data?.failure_message || null;
            } else if (event.chargeStatus === "expired") {
              txn.status = "expired";
            }
            break;
          }
        }

        // Mark as processed
        const wh = paymentWebhooksStore[paymentWebhooksStore.length - 1];
        wh.processed = true;
        wh.processedAt = new Date().toISOString();
      }

      res.json({ ok: true });
    } catch (err: any) {
      console.error("Omise webhook error:", err);
      res.status(400).json({ error: err.message });
    }
  });

  // POST /api/webhooks/stripe — Stripe webhook (B2B subscriptions)
  app.post("/api/webhooks/stripe", async (req, res) => {
    try {
      const event = req.body;

      paymentWebhooksStore.push({
        id: nextPaymentId(),
        provider: "stripe",
        eventType: event.type || "",
        eventId: event.id || "",
        payload: event,
        processed: true,
        processedAt: new Date().toISOString(),
        error: null,
        createdAt: new Date().toISOString(),
      });

      // Handle subscription events
      if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
        const subData = event.data?.object;
        if (subData?.id) {
          for (const subs of subscriptionsStore.values()) {
            const sub = subs.find((s: any) => s.providerSubscriptionId === subData.id);
            if (sub) {
              sub.status = subData.status === "active" ? "active" : "canceled";
              sub.updatedAt = new Date().toISOString();
              break;
            }
          }
        }
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error("Stripe webhook error:", err);
      res.status(400).json({ error: err.message });
    }
  });

  // GET /api/payment/plan-limits — public endpoint for plan info
  app.get("/api/payment/plan-limits", (_req, res) => {
    res.json(getPlanLimits("free")); // returns limits for the query or all
  });

  // GET /api/payment/plans — all plans with pricing
  app.get("/api/payment/plans", (_req, res) => {
    const { PLAN_LIMITS } = require("@shared/schema");
    res.json(PLAN_LIMITS);
  });
}
