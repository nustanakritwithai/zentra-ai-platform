import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { supabaseAdmin, SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase";
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
} from "./gemini";

// Simple per-request session map (keyed by a session token header)
// In production you'd use express-session + Redis, but for Render free tier this works
const sessions = new Map<string, { userId: number; storeId: number }>();

function generateToken(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Helper: get session from request
function getSession(req: Request): { userId: number; storeId: number } | null {
  const token = req.headers["x-session-token"] as string;
  if (!token) return null;
  return sessions.get(token) || null;
}

// Helper: require auth middleware-style
function requireAuth(req: Request, res: Response): { userId: number; storeId: number } | null {
  const session = getSession(req);
  if (!session) {
    res.status(401).json({ error: "กรุณาเข้าสู่ระบบ" });
    return null;
  }
  return session;
}

export async function registerRoutes(server: Server, app: Express): Promise<void> {

  // DATABASE STATUS
  app.get("/api/db/status", async (_req, res) => {
    try {
      const { data, error } = await supabaseAdmin.from("users").select("id").limit(1);
      if (error) {
        return res.json({ connected: false, mode: "memory", error: error.message, supabaseUrl: SUPABASE_URL });
      }
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
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบ" });
    const existing = await storage.getUserByEmail(email);
    if (existing) return res.status(400).json({ error: "อีเมลนี้ถูกใช้แล้ว" });
    const user = await storage.createUser({ email, password, name });
    // Generate session token
    const token = generateToken();
    // Don't create store yet — the onboarding wizard will create it
    sessions.set(token, { userId: user.id, storeId: 0 });
    res.json({ user: { ...user, password: undefined }, token });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await storage.getUserByEmail(email);
    if (!user || user.password !== password) return res.status(401).json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    // Find user's stores
    const stores = await storage.getStoresByUser(user.id);
    const storeId = stores.length > 0 ? stores[0].id : 0;
    const token = generateToken();
    sessions.set(token, { userId: user.id, storeId });
    res.json({ user: { ...user, password: undefined }, token, storeId });
  });

  app.get("/api/auth/me", async (req, res) => {
    const session = getSession(req);
    if (!session) {
      return res.status(401).json({ error: "ไม่ได้เข้าสู่ระบบ" });
    }
    const user = await storage.getUser(session.userId);
    if (!user) return res.status(401).json({ error: "ไม่พบผู้ใช้" });
    const stores = await storage.getStoresByUser(user.id);
    const storeId = stores.length > 0 ? stores[0].id : 0;
    // Update session storeId if changed
    sessions.set(req.headers["x-session-token"] as string, { userId: user.id, storeId });
    res.json({ user: { ...user, password: undefined }, storeId });
  });

  app.post("/api/auth/logout", (req, res) => {
    const token = req.headers["x-session-token"] as string;
    if (token) sessions.delete(token);
    res.json({ ok: true });
  });

  // =================== ONBOARDING / STORE SETUP ===================

  app.post("/api/onboarding/create-store", async (req, res) => {
    const session = getSession(req);
    if (!session) return res.status(401).json({ error: "กรุณาเข้าสู่ระบบ" });

    const { name, slug, description, currency, category } = req.body;
    if (!name || !slug) return res.status(400).json({ error: "กรุณากรอกชื่อร้านและ URL" });

    // Check slug uniqueness
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

    // Mark user as onboarded
    await storage.updateUser(session.userId, { onboarded: true });

    // Update session with new storeId
    const token = req.headers["x-session-token"] as string;
    sessions.set(token, { userId: session.userId, storeId: store.id });

    res.json({ store, storeId: store.id });
  });

  app.get("/api/onboarding/check-slug/:slug", async (req, res) => {
    const slug = req.params.slug.toLowerCase().replace(/[^a-z0-9-]/g, "");
    const existing = await storage.getStoreBySlug(slug);
    res.json({ available: !existing, slug });
  });

  // =================== STORES ===================

  app.get("/api/stores", async (req, res) => {
    const session = requireAuth(req, res);
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
    const session = requireAuth(req, res);
    if (!session) return;
    const store = await storage.createStore(session.userId, req.body);
    res.json(store);
  });

  app.put("/api/stores/:id", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const store = await storage.updateStore(Number(req.params.id), req.body);
    if (!store) return res.status(404).json({ error: "ไม่พบร้านค้า" });
    res.json(store);
  });

  // =================== PRODUCTS (scoped to session storeId) ===================

  app.get("/api/products", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const products = await storage.getProductsByStore(session.storeId);
    res.json(products);
  });

  app.post("/api/products", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const product = await storage.createProduct(session.storeId, req.body);
    res.json(product);
  });

  app.put("/api/products/:id", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const product = await storage.updateProduct(Number(req.params.id), req.body);
    if (!product) return res.status(404).json({ error: "ไม่พบสินค้า" });
    res.json(product);
  });

  app.delete("/api/products/:id", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const ok = await storage.deleteProduct(Number(req.params.id));
    res.json({ ok });
  });

  // =================== ORDERS ===================

  app.get("/api/orders", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const orders = await storage.getOrdersByStore(session.storeId);
    res.json(orders);
  });

  app.post("/api/orders", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const order = await storage.createOrder(session.storeId, req.body);
    res.json(order);
  });

  app.put("/api/orders/:id", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const order = await storage.updateOrder(Number(req.params.id), req.body);
    if (!order) return res.status(404).json({ error: "ไม่พบคำสั่งซื้อ" });
    res.json(order);
  });

  // =================== CUSTOMERS ===================

  app.get("/api/customers", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const customers = await storage.getCustomersByStore(session.storeId);
    res.json(customers);
  });

  app.post("/api/customers", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const customer = await storage.createCustomer(session.storeId, req.body);
    res.json(customer);
  });

  // =================== AI AGENTS ===================

  app.get("/api/ai-agents", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const agents = await storage.getAiAgentsByStore(session.storeId);
    res.json(agents);
  });

  app.put("/api/ai-agents/:id", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const agent = await storage.updateAiAgent(Number(req.params.id), req.body);
    if (!agent) return res.status(404).json({ error: "ไม่พบ AI Agent" });
    res.json(agent);
  });

  // =================== DASHBOARD ===================

  app.get("/api/dashboard/stats", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const stats = await storage.getDashboardStats(session.storeId);
    res.json(stats);
  });

  app.get("/api/dashboard/chart", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const data = await storage.getChartData(session.storeId);
    res.json(data);
  });

  // =================== AI CHAT (Gemini + Memory + RAG) ===================

  app.post("/api/ai-chat", async (req, res) => {
    try {
      const session = requireAuth(req, res);
      if (!session) return;
      const { agentType, message } = req.body;
      if (!agentType || !message) return res.status(400).json({ error: "กรุณาระบุ agentType และ message" });
      const result = await chatWithAgent(agentType, message, session.storeId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "AI ไม่สามารถตอบกลับได้" });
    }
  });

  app.get("/api/ai-chat/history/:agentType", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const history = getChatHistory(req.params.agentType, session.storeId);
    res.json(history);
  });

  app.delete("/api/ai-chat/history/:agentType", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    clearChatHistory(req.params.agentType, session.storeId);
    res.json({ ok: true });
  });

  // =================== KNOWLEDGE BASE ===================

  app.get("/api/knowledge-base", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const entries = getKnowledgeEntries(session.storeId);
    res.json(entries);
  });

  app.post("/api/knowledge-base", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const { title, content, category } = req.body;
    if (!title || !content || !category) {
      return res.status(400).json({ error: "กรุณากรอก title, content, category" });
    }
    const entry = addKnowledgeEntry(session.storeId, { title, content, category });
    res.json(entry);
  });

  app.delete("/api/knowledge-base/:id", async (req, res) => {
    const ok = deleteKnowledgeEntry(Number(req.params.id));
    res.json({ ok });
  });

  app.post("/api/knowledge-base/reindex", async (req, res) => {
    try {
      const session = requireAuth(req, res);
      if (!session) return;
      const result = await reindexStore(session.storeId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "ไม่สามารถ reindex ได้" });
    }
  });

  // MEMORY + RAG Stats
  app.get("/api/ai/stats", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const memory = getMemoryStats();
    const rag = getRAGStats(session.storeId);
    res.json({ memory, rag });
  });

  // =================== PUBLIC STOREFRONT ===================

  // Public: get store by slug (no auth needed)
  app.get("/api/public/store/:slug", async (req, res) => {
    const store = await storage.getStoreBySlug(req.params.slug);
    if (!store || store.status !== "active") return res.status(404).json({ error: "ไม่พบร้านค้า" });
    res.json({ store: { id: store.id, name: store.name, slug: store.slug, description: store.description, logo: store.logo, theme: store.theme, currency: store.currency } });
  });

  // Public: get products by store slug
  app.get("/api/public/store/:slug/products", async (req, res) => {
    const store = await storage.getStoreBySlug(req.params.slug);
    if (!store) return res.status(404).json({ error: "ไม่พบร้านค้า" });
    const products = await storage.getProductsByStore(store.id);
    res.json(products.filter((p: any) => p.status === "active"));
  });

  // Public: place order on a store
  app.post("/api/public/store/:slug/orders", async (req, res) => {
    const store = await storage.getStoreBySlug(req.params.slug);
    if (!store) return res.status(404).json({ error: "ไม่พบร้านค้า" });
    const { customerName, customerEmail, items, shippingAddress } = req.body;
    if (!customerName || !items || items.length === 0) {
      return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบ" });
    }
    const total = items.reduce((s: number, item: any) => s + (item.price * item.qty), 0);
    const order = await storage.createOrder(store.id, {
      customerName,
      customerEmail: customerEmail || "",
      total,
      status: "pending",
      items,
      shippingAddress: shippingAddress || "",
    });

    // Also create/update customer record
    if (customerEmail) {
      try {
        await storage.createCustomer(store.id, { name: customerName, email: customerEmail, phone: "" });
      } catch (_) {
        // Customer may already exist, ignore
      }
    }

    res.json(order);
  });
}
