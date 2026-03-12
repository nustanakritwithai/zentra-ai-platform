import type { Express } from "express";
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

export async function registerRoutes(server: Server, app: Express): Promise<void> {
  // Simple session tracking (no localStorage needed)
  let currentUserId: number | null = null;

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

  // AUTH
  app.post("/api/auth/register", async (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบ" });
    const existing = await storage.getUserByEmail(email);
    if (existing) return res.status(400).json({ error: "อีเมลนี้ถูกใช้แล้ว" });
    const user = await storage.createUser({ email, password, name });
    // Auto-create a store for new user
    const slug = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    await storage.createStore(user.id, { name: `${name}'s Store`, slug, description: "", theme: "modern-dark", currency: "THB" });
    currentUserId = user.id;
    res.json({ user: { ...user, password: undefined } });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await storage.getUserByEmail(email);
    if (!user || user.password !== password) return res.status(401).json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    currentUserId = user.id;
    res.json({ user: { ...user, password: undefined } });
  });

  app.get("/api/auth/me", async (req, res) => {
    // Auto-login as demo user if no session
    if (!currentUserId) currentUserId = 1;
    const user = await storage.getUser(currentUserId);
    if (!user) return res.status(401).json({ error: "ไม่พบผู้ใช้" });
    res.json({ user: { ...user, password: undefined } });
  });

  app.post("/api/auth/logout", (req, res) => {
    currentUserId = null;
    res.json({ ok: true });
  });

  // STORES
  app.get("/api/stores", async (req, res) => {
    if (!currentUserId) return res.status(401).json({ error: "กรุณาเข้าสู่ระบบ" });
    const stores = await storage.getStoresByUser(currentUserId);
    res.json(stores);
  });

  app.get("/api/stores/:id", async (req, res) => {
    const store = await storage.getStore(Number(req.params.id));
    if (!store) return res.status(404).json({ error: "ไม่พบร้านค้า" });
    res.json(store);
  });

  app.post("/api/stores", async (req, res) => {
    if (!currentUserId) return res.status(401).json({ error: "กรุณาเข้าสู่ระบบ" });
    const store = await storage.createStore(currentUserId, req.body);
    res.json(store);
  });

  app.put("/api/stores/:id", async (req, res) => {
    const store = await storage.updateStore(Number(req.params.id), req.body);
    if (!store) return res.status(404).json({ error: "ไม่พบร้านค้า" });
    res.json(store);
  });

  // PRODUCTS
  app.get("/api/products", async (req, res) => {
    const storeId = Number(req.query.storeId) || 1;
    const products = await storage.getProductsByStore(storeId);
    res.json(products);
  });

  app.post("/api/products", async (req, res) => {
    const storeId = Number(req.body.storeId) || 1;
    const product = await storage.createProduct(storeId, req.body);
    res.json(product);
  });

  app.put("/api/products/:id", async (req, res) => {
    const product = await storage.updateProduct(Number(req.params.id), req.body);
    if (!product) return res.status(404).json({ error: "ไม่พบสินค้า" });
    res.json(product);
  });

  app.delete("/api/products/:id", async (req, res) => {
    const ok = await storage.deleteProduct(Number(req.params.id));
    res.json({ ok });
  });

  // ORDERS
  app.get("/api/orders", async (req, res) => {
    const storeId = Number(req.query.storeId) || 1;
    const orders = await storage.getOrdersByStore(storeId);
    res.json(orders);
  });

  app.post("/api/orders", async (req, res) => {
    const storeId = Number(req.body.storeId) || 1;
    const order = await storage.createOrder(storeId, req.body);
    res.json(order);
  });

  app.put("/api/orders/:id", async (req, res) => {
    const order = await storage.updateOrder(Number(req.params.id), req.body);
    if (!order) return res.status(404).json({ error: "ไม่พบคำสั่งซื้อ" });
    res.json(order);
  });

  // CUSTOMERS
  app.get("/api/customers", async (req, res) => {
    const storeId = Number(req.query.storeId) || 1;
    const customers = await storage.getCustomersByStore(storeId);
    res.json(customers);
  });

  app.post("/api/customers", async (req, res) => {
    const storeId = Number(req.body.storeId) || 1;
    const customer = await storage.createCustomer(storeId, req.body);
    res.json(customer);
  });

  // AI AGENTS
  app.get("/api/ai-agents", async (req, res) => {
    const storeId = Number(req.query.storeId) || 1;
    const agents = await storage.getAiAgentsByStore(storeId);
    res.json(agents);
  });

  app.put("/api/ai-agents/:id", async (req, res) => {
    const agent = await storage.updateAiAgent(Number(req.params.id), req.body);
    if (!agent) return res.status(404).json({ error: "ไม่พบ AI Agent" });
    res.json(agent);
  });

  // DASHBOARD
  app.get("/api/dashboard/stats", async (req, res) => {
    const storeId = Number(req.query.storeId) || 1;
    const stats = await storage.getDashboardStats(storeId);
    res.json(stats);
  });

  app.get("/api/dashboard/chart", async (req, res) => {
    const storeId = Number(req.query.storeId) || 1;
    const data = await storage.getChartData(storeId);
    res.json(data);
  });

  // AI CHAT (Gemini + Memory + RAG)
  app.post("/api/ai-chat", async (req, res) => {
    try {
      const { agentType, message } = req.body;
      if (!agentType || !message) return res.status(400).json({ error: "กรุณาระบุ agentType และ message" });
      const storeId = Number(req.body.storeId) || 1;
      const result = await chatWithAgent(agentType, message, storeId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "AI ไม่สามารถตอบกลับได้" });
    }
  });

  app.get("/api/ai-chat/history/:agentType", async (req, res) => {
    const storeId = Number(req.query.storeId) || 1;
    const history = getChatHistory(req.params.agentType, storeId);
    res.json(history);
  });

  app.delete("/api/ai-chat/history/:agentType", async (req, res) => {
    const storeId = Number(req.query.storeId) || 1;
    clearChatHistory(req.params.agentType, storeId);
    res.json({ ok: true });
  });

  // KNOWLEDGE BASE CRUD
  app.get("/api/knowledge-base", async (req, res) => {
    const storeId = Number(req.query.storeId) || 1;
    const entries = getKnowledgeEntries(storeId);
    res.json(entries);
  });

  app.post("/api/knowledge-base", async (req, res) => {
    const storeId = Number(req.body.storeId) || 1;
    const { title, content, category } = req.body;
    if (!title || !content || !category) {
      return res.status(400).json({ error: "กรุณากรอก title, content, category" });
    }
    const entry = addKnowledgeEntry(storeId, { title, content, category });
    res.json(entry);
  });

  app.delete("/api/knowledge-base/:id", async (req, res) => {
    const ok = deleteKnowledgeEntry(Number(req.params.id));
    res.json({ ok });
  });

  // Re-index store data for RAG
  app.post("/api/knowledge-base/reindex", async (req, res) => {
    try {
      const storeId = Number(req.body.storeId) || 1;
      const result = await reindexStore(storeId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "ไม่สามารถ reindex ได้" });
    }
  });

  // MEMORY + RAG Stats
  app.get("/api/ai/stats", async (req, res) => {
    const storeId = Number(req.query.storeId) || 1;
    const memory = getMemoryStats();
    const rag = getRAGStats(storeId);
    res.json({ memory, rag });
  });

}
