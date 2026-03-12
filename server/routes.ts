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
  updateGeminiApiKey,
  getGeminiStatus,
} from "./gemini";
import crypto from "crypto";

// Simple per-request session map (keyed by a session token header)
const sessions = new Map<string, { userId: number; storeId: number; createdAt: number }>();

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Helper: get session from request
function getSession(req: Request): { userId: number; storeId: number } | null {
  const token = req.headers["x-session-token"] as string;
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  // Extend session TTL on activity (24h)
  session.createdAt = Date.now();
  return session;
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

// Clean up expired sessions (older than 24h)
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (now - session.createdAt > 24 * 60 * 60 * 1000) {
      sessions.delete(token);
    }
  }
}, 60 * 60 * 1000); // Check every hour

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
    const token = generateToken();
    sessions.set(token, { userId: user.id, storeId: 0, createdAt: Date.now() });
    res.json({ user: { ...user, password: undefined }, token });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await storage.getUserByEmail(email);
    if (!user || user.password !== password) return res.status(401).json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    const stores = await storage.getStoresByUser(user.id);
    const storeId = stores.length > 0 ? stores[0].id : 0;
    const token = generateToken();
    sessions.set(token, { userId: user.id, storeId, createdAt: Date.now() });
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
    const token = req.headers["x-session-token"] as string;
    sessions.set(token, { userId: user.id, storeId, createdAt: Date.now() });
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
    sessions.set(token, { userId: session.userId, storeId: store.id, createdAt: Date.now() });

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

  // =================== CATEGORIES (per store) ===================

  app.get("/api/categories", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const cats = await storage.getCategoriesByStore(session.storeId);
    res.json(cats);
  });

  app.post("/api/categories", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const { name, slug, description, image, parentId, sortOrder } = req.body;
    if (!name) return res.status(400).json({ error: "กรุณากรอกชื่อหมวดหมู่" });
    const autoSlug = slug || name.toLowerCase().replace(/[^a-z0-9ก-๙]+/g, "-").replace(/^-|-$/g, "");
    const cat = await storage.createCategory(session.storeId, { name, slug: autoSlug, description, image, parentId, sortOrder: sortOrder || 0 });
    res.json(cat);
  });

  app.put("/api/categories/:id", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const cat = await storage.updateCategory(Number(req.params.id), req.body);
    if (!cat) return res.status(404).json({ error: "ไม่พบหมวดหมู่" });
    res.json(cat);
  });

  app.delete("/api/categories/:id", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const ok = await storage.deleteCategory(Number(req.params.id));
    res.json({ ok });
  });

  // =================== IMAGE UPLOAD (Supabase Storage) ===================

  app.post("/api/upload", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    
    try {
      const { fileData, fileName, contentType, folder } = req.body;
      if (!fileData || !fileName) return res.status(400).json({ error: "กรุณาแนบไฟล์" });

      // fileData is base64
      const buffer = Buffer.from(fileData, "base64");
      const path = `stores/${session.storeId}/${folder || "products"}/${Date.now()}-${fileName}`;

      const { data, error } = await supabaseAdmin.storage
        .from("zentra-uploads")
        .upload(path, buffer, {
          contentType: contentType || "image/jpeg",
          upsert: false,
        });

      if (error) {
        // Try creating bucket if it doesn't exist
        if (error.message?.includes("not found") || error.message?.includes("Bucket")) {
          await supabaseAdmin.storage.createBucket("zentra-uploads", { public: true });
          const retry = await supabaseAdmin.storage
            .from("zentra-uploads")
            .upload(path, buffer, { contentType: contentType || "image/jpeg", upsert: false });
          if (retry.error) throw retry.error;
          const { data: urlData } = supabaseAdmin.storage.from("zentra-uploads").getPublicUrl(path);
          return res.json({ url: urlData.publicUrl, path });
        }
        throw error;
      }

      const { data: urlData } = supabaseAdmin.storage.from("zentra-uploads").getPublicUrl(path);
      res.json({ url: urlData.publicUrl, path });
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({ error: error.message || "อัพโหลดไม่สำเร็จ" });
    }
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

  // =================== DISCOUNTS ===================

  app.get("/api/discounts", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const discounts = await storage.getDiscountsByStore(session.storeId);
    res.json(discounts);
  });

  app.post("/api/discounts", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const discount = await storage.createDiscount(session.storeId, req.body);
    res.json(discount);
  });

  app.put("/api/discounts/:id", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const discount = await storage.updateDiscount(Number(req.params.id), req.body);
    if (!discount) return res.status(404).json({ error: "ไม่พบโค้ดส่วนลด" });
    res.json(discount);
  });

  app.delete("/api/discounts/:id", async (req, res) => {
    const session = requireAuth(req, res);
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
    
    const discountAmount = discount.type === "percentage" 
      ? (total * discount.value / 100)
      : discount.value;
    
    res.json({ valid: true, discount: { ...discount }, discountAmount });
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

  // AI Gemini status & key management
  app.get("/api/ai/gemini-status", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    res.json(getGeminiStatus());
  });

  app.post("/api/ai/gemini-key", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const { apiKey } = req.body;
    const ok = updateGeminiApiKey(apiKey);
    res.json({ ok, status: getGeminiStatus() });
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
    res.json({ memory, rag, gemini: getGeminiStatus() });
  });

  // =================== LINE API INTEGRATION ===================

  // Save LINE OA credentials for a store
  app.post("/api/line/setup", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const { channelId, channelSecret, accessToken } = req.body;
    if (!channelId || !channelSecret) return res.status(400).json({ error: "กรุณากรอก Channel ID และ Channel Secret" });
    
    const store = await storage.updateStore(session.storeId, {
      lineChannelId: channelId,
      lineChannelSecret: channelSecret,
      lineAccessToken: accessToken || null,
    } as any);

    res.json({ ok: true, store });
  });

  // Get LINE OA status
  app.get("/api/line/status", async (req, res) => {
    const session = requireAuth(req, res);
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

  // LINE Webhook endpoint (receives messages from LINE)
  app.post("/api/line/webhook/:storeSlug", async (req, res) => {
    const store = await storage.getStoreBySlug(req.params.storeSlug);
    if (!store) return res.status(404).json({ error: "Store not found" });
    
    // Verify LINE signature
    const signature = req.headers["x-line-signature"] as string;
    const channelSecret = (store as any).lineChannelSecret;
    if (channelSecret && signature) {
      const body = JSON.stringify(req.body);
      const expectedSig = crypto
        .createHmac("SHA256", channelSecret)
        .update(body)
        .digest("base64");
      if (signature !== expectedSig) {
        return res.status(403).json({ error: "Invalid signature" });
      }
    }

    // Process LINE events
    const events = req.body?.events || [];
    for (const event of events) {
      if (event.type === "message" && event.message.type === "text") {
        // Log inbound message
        await storage.createLineMessage(store.id, {
          lineUserId: event.source.userId,
          direction: "inbound",
          messageType: "text",
          content: event.message.text,
          timestamp: new Date(event.timestamp).toISOString(),
        });

        // Auto-reply with AI if access token available
        const accessToken = (store as any).lineAccessToken;
        if (accessToken) {
          try {
            const aiResult = await chatWithAgent(
              "customer_support",
              event.message.text,
              store.id,
              event.source.userId
            );

            // Reply via LINE API
            await fetch("https://api.line.me/v2/bot/message/reply", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                replyToken: event.replyToken,
                messages: [{ type: "text", text: aiResult.reply.replace(/\n\n_\(.*?\)_$/s, "") }],
              }),
            });

            // Log outbound
            await storage.createLineMessage(store.id, {
              lineUserId: event.source.userId,
              direction: "outbound",
              messageType: "text",
              content: aiResult.reply,
              timestamp: new Date().toISOString(),
            });
          } catch (err: any) {
            console.error("LINE reply error:", err.message);
          }
        }
      }
    }

    res.json({ ok: true });
  });

  // Send LINE message manually
  app.post("/api/line/send", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const store = await storage.getStore(session.storeId);
    if (!store) return res.status(404).json({ error: "ไม่พบร้านค้า" });
    
    const accessToken = (store as any).lineAccessToken;
    if (!accessToken) return res.status(400).json({ error: "ยังไม่ได้ตั้งค่า LINE Access Token" });

    const { userId, message } = req.body;
    if (!userId || !message) return res.status(400).json({ error: "กรุณาระบุ userId และ message" });

    try {
      await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          to: userId,
          messages: [{ type: "text", text: message }],
        }),
      });

      await storage.createLineMessage(store.id, {
        lineUserId: userId,
        direction: "outbound",
        messageType: "text",
        content: message,
        timestamp: new Date().toISOString(),
      });

      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get LINE messages
  app.get("/api/line/messages", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const messages = await storage.getLineMessagesByStore(session.storeId);
    res.json(messages);
  });

  // =================== PUBLIC STOREFRONT ===================

  app.get("/api/public/store/:slug", async (req, res) => {
    const store = await storage.getStoreBySlug(req.params.slug);
    if (!store || store.status !== "active") return res.status(404).json({ error: "ไม่พบร้านค้า" });
    res.json({ store: { id: store.id, name: store.name, slug: store.slug, description: store.description, logo: store.logo, theme: store.theme, currency: store.currency } });
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
    if (!customerName || !items || items.length === 0) {
      return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบ" });
    }
    
    let subtotal = items.reduce((s: number, item: any) => s + (item.price * item.qty), 0);
    let discount = 0;

    // Apply discount if provided
    if (discountCode) {
      const discounts = await storage.getDiscountsByStore(store.id);
      const disc = discounts.find(d => d.code.toLowerCase() === discountCode.toLowerCase() && d.active);
      if (disc) {
        discount = disc.type === "percentage" ? (subtotal * disc.value / 100) : disc.value;
        // Increment usage
        await storage.updateDiscount(disc.id, { usedCount: (disc.usedCount || 0) + 1 });
      }
    }

    const total = subtotal - discount;

    const order = await storage.createOrder(store.id, {
      customerName,
      customerEmail: customerEmail || "",
      customerPhone: customerPhone || "",
      subtotal,
      discount,
      total: Math.max(0, total),
      status: "pending",
      paymentMethod: paymentMethod || "bank_transfer",
      paymentStatus: "pending",
      items,
      shippingAddress: shippingAddress || "",
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

    // Create/update customer record
    if (customerEmail || customerPhone) {
      try {
        await storage.createCustomer(store.id, { name: customerName, email: customerEmail || "", phone: customerPhone || "" });
      } catch (_) {}
    }

    res.json(order);
  });

  // =================== SHOPPING MALL (aggregate all stores) ===================

  app.get("/api/public/mall/products", async (req, res) => {
    try {
      const { category, search, limit, offset } = req.query;
      const allProducts = await storage.getAllActiveProducts();
      let filtered = allProducts;

      if (category && category !== "all") {
        filtered = filtered.filter((p: any) => p.category === category);
      }
      if (search) {
        const q = (search as string).toLowerCase();
        filtered = filtered.filter((p: any) => 
          p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
        );
      }

      const total = filtered.length;
      const lim = Math.min(parseInt(limit as string) || 48, 100);
      const off = parseInt(offset as string) || 0;
      filtered = filtered.slice(off, off + lim);

      res.json({ products: filtered, total, limit: lim, offset: off });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/public/mall/stores", async (req, res) => {
    try {
      const allStores = await storage.getAllActiveStores();
      res.json(allStores);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/public/mall/categories", async (req, res) => {
    try {
      const allProducts = await storage.getAllActiveProducts();
      const catMap = new Map<string, number>();
      for (const p of allProducts) {
        if (p.category) {
          catMap.set(p.category, (catMap.get(p.category) || 0) + 1);
        }
      }
      const cats = [...catMap.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
      res.json(cats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
