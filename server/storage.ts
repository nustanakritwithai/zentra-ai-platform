import type { User, InsertUser, Store, InsertStore, Product, InsertProduct, Order, InsertOrder, AiAgent, InsertAiAgent, Customer, InsertCustomer } from "@shared/schema";
import { supabaseAdmin } from "./supabase";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  // Stores
  getStore(id: number): Promise<Store | undefined>;
  getStoresByUser(userId: number): Promise<Store[]>;
  createStore(userId: number, store: InsertStore): Promise<Store>;
  updateStore(id: number, data: Partial<Store>): Promise<Store | undefined>;
  // Products
  getProduct(id: number): Promise<Product | undefined>;
  getProductsByStore(storeId: number): Promise<Product[]>;
  createProduct(storeId: number, product: InsertProduct): Promise<Product>;
  updateProduct(id: number, data: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  // Orders
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersByStore(storeId: number): Promise<Order[]>;
  createOrder(storeId: number, order: InsertOrder): Promise<Order>;
  updateOrder(id: number, data: Partial<Order>): Promise<Order | undefined>;
  // AI Agents
  getAiAgent(id: number): Promise<AiAgent | undefined>;
  getAiAgentsByStore(storeId: number): Promise<AiAgent[]>;
  updateAiAgent(id: number, data: Partial<AiAgent>): Promise<AiAgent | undefined>;
  // Customers
  getCustomer(id: number): Promise<Customer | undefined>;
  getCustomersByStore(storeId: number): Promise<Customer[]>;
  createCustomer(storeId: number, customer: InsertCustomer): Promise<Customer>;
  // Dashboard
  getDashboardStats(storeId: number): Promise<any>;
  getChartData(storeId: number): Promise<any>;
}

// Helper: convert snake_case DB rows to camelCase TypeScript objects
function toCamel(row: any): any {
  if (!row) return row;
  const result: any = {};
  for (const key of Object.keys(row)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = row[key];
  }
  return result;
}

// Helper: convert camelCase to snake_case for DB inserts
function toSnake(obj: any): any {
  if (!obj) return obj;
  const result: any = {};
  for (const key of Object.keys(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    result[snakeKey] = obj[key];
  }
  return result;
}

export class SupabaseStorage implements IStorage {
  private ready: Promise<boolean>;
  private isConnected = false;

  constructor() {
    this.ready = this.checkConnection();
  }

  private async checkConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabaseAdmin.from("users").select("id").limit(1);
      if (error) {
        console.log("[Supabase] Tables not ready:", error.message);
        return false;
      }
      console.log("[Supabase] ✓ Connected and tables exist");
      this.isConnected = true;
      return true;
    } catch (e: any) {
      console.log("[Supabase] Connection failed:", e.message);
      return false;
    }
  }

  async ensureReady() {
    await this.ready;
    if (!this.isConnected) {
      // Retry once
      this.isConnected = await this.checkConnection();
    }
    return this.isConnected;
  }

  // === USERS ===
  async getUser(id: number): Promise<User | undefined> {
    const { data } = await supabaseAdmin.from("users").select("*").eq("id", id).single();
    return data ? toCamel(data) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data } = await supabaseAdmin.from("users").select("*").eq("email", email).single();
    return data ? toCamel(data) : undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const { data, error } = await supabaseAdmin
      .from("users")
      .insert({ email: user.email, password: user.password, name: user.name })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toCamel(data);
  }

  async updateUser(id: number, update: Partial<User>): Promise<User | undefined> {
    const { data } = await supabaseAdmin
      .from("users")
      .update(toSnake(update))
      .eq("id", id)
      .select()
      .single();
    return data ? toCamel(data) : undefined;
  }

  // === STORES ===
  async getStore(id: number): Promise<Store | undefined> {
    const { data } = await supabaseAdmin.from("stores").select("*").eq("id", id).single();
    return data ? toCamel(data) : undefined;
  }

  async getStoresByUser(userId: number): Promise<Store[]> {
    const { data } = await supabaseAdmin.from("stores").select("*").eq("user_id", userId);
    return (data || []).map(toCamel);
  }

  async createStore(userId: number, store: InsertStore): Promise<Store> {
    const { data, error } = await supabaseAdmin
      .from("stores")
      .insert({ user_id: userId, ...toSnake(store) })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toCamel(data);
  }

  async updateStore(id: number, update: Partial<Store>): Promise<Store | undefined> {
    const { data } = await supabaseAdmin
      .from("stores")
      .update(toSnake(update))
      .eq("id", id)
      .select()
      .single();
    return data ? toCamel(data) : undefined;
  }

  // === PRODUCTS ===
  async getProduct(id: number): Promise<Product | undefined> {
    const { data } = await supabaseAdmin.from("products").select("*").eq("id", id).single();
    return data ? toCamel(data) : undefined;
  }

  async getProductsByStore(storeId: number): Promise<Product[]> {
    const { data } = await supabaseAdmin.from("products").select("*").eq("store_id", storeId);
    return (data || []).map(toCamel);
  }

  async createProduct(storeId: number, product: InsertProduct): Promise<Product> {
    const { data, error } = await supabaseAdmin
      .from("products")
      .insert({
        store_id: storeId,
        ...toSnake(product),
        status: "active",
        ai_score: Math.floor(Math.random() * 30) + 70,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toCamel(data);
  }

  async updateProduct(id: number, update: Partial<Product>): Promise<Product | undefined> {
    const { data } = await supabaseAdmin
      .from("products")
      .update(toSnake(update))
      .eq("id", id)
      .select()
      .single();
    return data ? toCamel(data) : undefined;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const { error } = await supabaseAdmin.from("products").delete().eq("id", id);
    return !error;
  }

  // === ORDERS ===
  async getOrder(id: number): Promise<Order | undefined> {
    const { data } = await supabaseAdmin.from("orders").select("*").eq("id", id).single();
    return data ? toCamel(data) : undefined;
  }

  async getOrdersByStore(storeId: number): Promise<Order[]> {
    const { data } = await supabaseAdmin.from("orders").select("*").eq("store_id", storeId);
    return (data || []).map(toCamel);
  }

  async createOrder(storeId: number, order: InsertOrder): Promise<Order> {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .insert({
        store_id: storeId,
        ...toSnake(order),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toCamel(data);
  }

  async updateOrder(id: number, update: Partial<Order>): Promise<Order | undefined> {
    const { data } = await supabaseAdmin
      .from("orders")
      .update(toSnake(update))
      .eq("id", id)
      .select()
      .single();
    return data ? toCamel(data) : undefined;
  }

  // === AI AGENTS ===
  async getAiAgent(id: number): Promise<AiAgent | undefined> {
    const { data } = await supabaseAdmin.from("ai_agents").select("*").eq("id", id).single();
    return data ? toCamel(data) : undefined;
  }

  async getAiAgentsByStore(storeId: number): Promise<AiAgent[]> {
    const { data } = await supabaseAdmin.from("ai_agents").select("*").eq("store_id", storeId);
    return (data || []).map(toCamel);
  }

  async updateAiAgent(id: number, update: Partial<AiAgent>): Promise<AiAgent | undefined> {
    const { data } = await supabaseAdmin
      .from("ai_agents")
      .update(toSnake(update))
      .eq("id", id)
      .select()
      .single();
    return data ? toCamel(data) : undefined;
  }

  // === CUSTOMERS ===
  async getCustomer(id: number): Promise<Customer | undefined> {
    const { data } = await supabaseAdmin.from("customers").select("*").eq("id", id).single();
    return data ? toCamel(data) : undefined;
  }

  async getCustomersByStore(storeId: number): Promise<Customer[]> {
    const { data } = await supabaseAdmin.from("customers").select("*").eq("store_id", storeId);
    return (data || []).map(toCamel);
  }

  async createCustomer(storeId: number, customer: InsertCustomer): Promise<Customer> {
    const { data, error } = await supabaseAdmin
      .from("customers")
      .insert({
        store_id: storeId,
        ...toSnake(customer),
        total_orders: 0,
        total_spent: 0,
        segment: "new",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toCamel(data);
  }

  // === DASHBOARD ===
  async getDashboardStats(storeId: number) {
    const { data: orders } = await supabaseAdmin.from("orders").select("*").eq("store_id", storeId);
    const { data: products } = await supabaseAdmin.from("products").select("*").eq("store_id", storeId);
    const { data: customers } = await supabaseAdmin.from("customers").select("*").eq("store_id", storeId);

    const allOrders = orders || [];
    const allProducts = products || [];
    const allCustomers = customers || [];

    const totalRevenue = allOrders.filter((o: any) => o.status !== "cancelled").reduce((s: number, o: any) => s + (o.total || 0), 0);
    const today = new Date().toISOString().split("T")[0];
    const todayRevenue = allOrders.filter((o: any) => o.created_at?.startsWith(today) && o.status !== "cancelled").reduce((s: number, o: any) => s + (o.total || 0), 0);

    return {
      todayRevenue,
      monthRevenue: totalRevenue,
      totalOrders: allOrders.length,
      pendingOrders: allOrders.filter((o: any) => o.status === "pending").length,
      totalProducts: allProducts.length,
      totalCustomers: allCustomers.length,
      newCustomers: allCustomers.filter((c: any) => c.segment === "new").length,
      conversionRate: 4.8,
    };
  }

  async getChartData(storeId: number) {
    return [
      { date: "6 มี.ค.", revenue: 32400, orders: 8 },
      { date: "7 มี.ค.", revenue: 45200, orders: 12 },
      { date: "8 มี.ค.", revenue: 38900, orders: 10 },
      { date: "9 มี.ค.", revenue: 52100, orders: 15 },
      { date: "10 มี.ค.", revenue: 61300, orders: 18 },
      { date: "11 มี.ค.", revenue: 48700, orders: 14 },
      { date: "12 มี.ค.", revenue: 67500, orders: 21 },
    ];
  }
}

// Fallback in-memory storage (used when Supabase tables don't exist yet)
export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private stores: Map<number, Store> = new Map();
  private products: Map<number, Product> = new Map();
  private orders: Map<number, Order> = new Map();
  private aiAgents: Map<number, AiAgent> = new Map();
  private customers: Map<number, Customer> = new Map();
  private nextId = { user: 2, store: 2, product: 9, order: 6, agent: 7, customer: 11 };

  constructor() {
    this.seed();
  }

  private seed() {
    this.users.set(1, { id: 1, email: "demo@zentra.ai", password: "password123", name: "สมชาย ใจดี", avatar: null, plan: "pro", onboarded: true });
    this.stores.set(1, { id: 1, userId: 1, name: "ZentraMart", slug: "zentramart", description: "ร้านค้าออนไลน์ที่ขับเคลื่อนด้วย AI", logo: null, theme: "modern-dark", currency: "THB", status: "active" });

    const prods: Omit<Product, "id">[] = [
      { storeId: 1, name: "Nike Air Max 270 React", description: "รองเท้าวิ่งน้ำหนักเบา ระบายอากาศดี", price: 5990, comparePrice: 7490, category: "รองเท้า", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400", stock: 45, status: "active", aiScore: 97 },
      { storeId: 1, name: "Apple Watch Ultra 3", description: "นาฬิกาอัจฉริยะรุ่นล่าสุด", price: 29900, comparePrice: 32900, category: "อุปกรณ์อิเล็กทรอนิกส์", image: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400", stock: 23, status: "active", aiScore: 94 },
      { storeId: 1, name: "Gucci GG Marmont Mini", description: "กระเป๋าสะพายหนังแท้", price: 45500, comparePrice: 52000, category: "กระเป๋า", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400", stock: 12, status: "active", aiScore: 91 },
      { storeId: 1, name: "Sony WH-1000XM6", description: "หูฟังตัดเสียงรบกวนระดับพรีเมียม", price: 12990, comparePrice: 14990, category: "อุปกรณ์อิเล็กทรอนิกส์", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400", stock: 67, status: "active", aiScore: 95 },
      { storeId: 1, name: "เสื้อยืด Oversize Cotton", description: "เสื้อยืดผ้าฝ้ายออร์แกนิก ใส่สบาย", price: 590, comparePrice: 890, category: "เสื้อผ้า", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400", stock: 234, status: "active", aiScore: 82 },
      { storeId: 1, name: "Samsung Galaxy S26 Ultra", description: "สมาร์ทโฟนเรือธงพร้อม AI", price: 44900, comparePrice: null, category: "อุปกรณ์อิเล็กทรอนิกส์", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400", stock: 18, status: "active", aiScore: 96 },
      { storeId: 1, name: "กางเกงยีนส์ Slim Fit", description: "กางเกงยีนส์ทรงเข้ารูป ผ้ายืด", price: 1290, comparePrice: 1790, category: "เสื้อผ้า", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400", stock: 89, status: "active", aiScore: 78 },
      { storeId: 1, name: "MacBook Pro M5 16\"", description: "แล็ปท็อปสำหรับมืออาชีพ", price: 89900, comparePrice: null, category: "อุปกรณ์อิเล็กทรอนิกส์", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400", stock: 8, status: "draft", aiScore: 88 },
    ];
    prods.forEach((p, i) => this.products.set(i + 1, { ...p, id: i + 1 }));

    const orderData: Omit<Order, "id">[] = [
      { storeId: 1, customerName: "นภา วงศ์สุข", customerEmail: "napa@email.com", total: 5990, status: "delivered", items: [{ productId: 1, name: "Nike Air Max 270 React", price: 5990, qty: 1 }], shippingAddress: "123 ถ.สุขุมวิท กรุงเทพฯ 10110", createdAt: "2026-03-11T10:30:00" },
      { storeId: 1, customerName: "ธนกร เจริญผล", customerEmail: "thanakorn@email.com", total: 42890, status: "shipped", items: [{ productId: 2, name: "Apple Watch Ultra 3", price: 29900, qty: 1 }, { productId: 4, name: "Sony WH-1000XM6", price: 12990, qty: 1 }], shippingAddress: "456 ถ.พหลโยธิน กรุงเทพฯ 10400", createdAt: "2026-03-11T14:20:00" },
      { storeId: 1, customerName: "สมหญิง แก้วใส", customerEmail: "somying@email.com", total: 45500, status: "confirmed", items: [{ productId: 3, name: "Gucci GG Marmont Mini", price: 45500, qty: 1 }], shippingAddress: "789 ถ.เพชรบุรี กรุงเทพฯ 10310", createdAt: "2026-03-12T09:15:00" },
      { storeId: 1, customerName: "วิชัย สมบัติดี", customerEmail: "wichai@email.com", total: 1880, status: "pending", items: [{ productId: 5, name: "เสื้อยืด Oversize Cotton", price: 590, qty: 2 }, { productId: 7, name: "กางเกงยีนส์ Slim Fit", price: 1290, qty: 1 }] as any, shippingAddress: "321 ถ.รัชดาภิเษก กรุงเทพฯ 10320", createdAt: "2026-03-12T11:45:00" },
      { storeId: 1, customerName: "อรุณ ศรีทอง", customerEmail: "arun@email.com", total: 44900, status: "cancelled", items: [{ productId: 6, name: "Samsung Galaxy S26 Ultra", price: 44900, qty: 1 }], shippingAddress: "654 ถ.ลาดพร้าว กรุงเทพฯ 10230", createdAt: "2026-03-10T16:00:00" },
    ];
    orderData.forEach((o, i) => this.orders.set(i + 1, { ...o, id: i + 1 }));

    const agents: Omit<AiAgent, "id">[] = [
      { storeId: 1, type: "shopping_assistant", name: "Shopping Assistant", description: "ผู้ช่วยช้อปปิ้ง AI แนะนำสินค้าตาม lifestyle ของลูกค้า", enabled: true, config: { responseSpeed: 8, creativity: 7, language: "th" }, performance: 94, status: "active", icon: "ShoppingBag" },
      { storeId: 1, type: "recommendation", name: "Recommendation Engine", description: "เครื่องมือแนะนำสินค้าแบบ Real-time ด้วย Collaborative Filtering", enabled: true, config: { algorithm: "hybrid", minConfidence: 0.7, maxSuggestions: 8 }, performance: 91, status: "active", icon: "Sparkles" },
      { storeId: 1, type: "dynamic_pricing", name: "Dynamic Pricing", description: "ปรับราคาอัตโนมัติตามอุปสงค์และราคาคู่แข่ง", enabled: true, config: { maxDiscount: 30, priceFloor: 0.7, updateFrequency: "hourly" }, performance: 87, status: "processing", icon: "TrendingUp" },
      { storeId: 1, type: "customer_support", name: "Customer Support", description: "ตอบคำถามลูกค้า 24/7 ด้วย AI ที่เข้าใจภาษาธรรมชาติ", enabled: true, config: { responseSpeed: 9, escalationThreshold: 0.3, tone: "friendly" }, performance: 96, status: "active", icon: "Headphones" },
      { storeId: 1, type: "inventory_forecast", name: "Inventory Forecast", description: "พยากรณ์สต็อกสินค้าและแจ้งเตือนเมื่อใกล้หมด", enabled: true, config: { forecastDays: 30, safetyStock: 10, autoReorder: false }, performance: 82, status: "active", icon: "BarChart3" },
      { storeId: 1, type: "visual_search", name: "Visual Search", description: "ค้นหาสินค้าด้วยรูปภาพ ใช้ Computer Vision ขั้นสูง", enabled: false, config: { accuracy: "high", maxResults: 12, similarityThreshold: 0.8 }, performance: 78, status: "paused", icon: "Eye" },
    ];
    agents.forEach((a, i) => this.aiAgents.set(i + 1, { ...a, id: i + 1 }));

    const custs: Omit<Customer, "id">[] = [
      { storeId: 1, name: "นภา วงศ์สุข", email: "napa@email.com", phone: "081-234-5678", totalOrders: 12, totalSpent: 45600, segment: "vip" },
      { storeId: 1, name: "ธนกร เจริญผล", email: "thanakorn@email.com", phone: "089-876-5432", totalOrders: 8, totalSpent: 128900, segment: "vip" },
      { storeId: 1, name: "สมหญิง แก้วใส", email: "somying@email.com", phone: "062-345-6789", totalOrders: 3, totalSpent: 52300, segment: "returning" },
      { storeId: 1, name: "วิชัย สมบัติดี", email: "wichai@email.com", phone: "095-111-2222", totalOrders: 1, totalSpent: 1880, segment: "new" },
      { storeId: 1, name: "อรุณ ศรีทอง", email: "arun@email.com", phone: "086-333-4444", totalOrders: 5, totalSpent: 89700, segment: "returning" },
      { storeId: 1, name: "พิมพ์ชนก ลีลา", email: "pimchanok@email.com", phone: "091-555-6666", totalOrders: 0, totalSpent: 0, segment: "new" },
      { storeId: 1, name: "กิตติ มั่นคง", email: "kitti@email.com", phone: "084-777-8888", totalOrders: 15, totalSpent: 234500, segment: "vip" },
      { storeId: 1, name: "รัตนา ดีงาม", email: "rattana@email.com", phone: "063-999-0000", totalOrders: 2, totalSpent: 7890, segment: "at_risk" },
      { storeId: 1, name: "ประสิทธิ์ พัฒนา", email: "prasit@email.com", phone: "087-111-3333", totalOrders: 6, totalSpent: 67800, segment: "returning" },
      { storeId: 1, name: "จิราภรณ์ สุขสันต์", email: "jiraporn@email.com", phone: "098-444-5555", totalOrders: 1, totalSpent: 12990, segment: "new" },
    ];
    custs.forEach((c, i) => this.customers.set(i + 1, { ...c, id: i + 1 }));
  }

  async getUser(id: number) { return this.users.get(id); }
  async getUserByEmail(email: string) { return [...this.users.values()].find(u => u.email === email); }
  async createUser(user: InsertUser): Promise<User> {
    const id = this.nextId.user++;
    const newUser: User = { id, ...user, avatar: null, plan: "free", onboarded: false };
    this.users.set(id, newUser);
    return newUser;
  }
  async updateUser(id: number, data: Partial<User>) {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...data, id };
    this.users.set(id, updated);
    return updated;
  }
  async getStore(id: number) { return this.stores.get(id); }
  async getStoresByUser(userId: number) { return [...this.stores.values()].filter(s => s.userId === userId); }
  async createStore(userId: number, store: InsertStore): Promise<Store> {
    const id = this.nextId.store++;
    const newStore: Store = { id, userId, ...store, status: "active" };
    this.stores.set(id, newStore);
    return newStore;
  }
  async updateStore(id: number, data: Partial<Store>) {
    const store = this.stores.get(id);
    if (!store) return undefined;
    const updated = { ...store, ...data, id };
    this.stores.set(id, updated);
    return updated;
  }
  async getProduct(id: number) { return this.products.get(id); }
  async getProductsByStore(storeId: number) { return [...this.products.values()].filter(p => p.storeId === storeId); }
  async createProduct(storeId: number, product: InsertProduct): Promise<Product> {
    const id = this.nextId.product++;
    const newProduct: Product = { id, storeId, ...product, status: "active", aiScore: Math.floor(Math.random() * 30) + 70 };
    this.products.set(id, newProduct);
    return newProduct;
  }
  async updateProduct(id: number, data: Partial<Product>) {
    const product = this.products.get(id);
    if (!product) return undefined;
    const updated = { ...product, ...data, id };
    this.products.set(id, updated);
    return updated;
  }
  async deleteProduct(id: number) { return this.products.delete(id); }
  async getOrder(id: number) { return this.orders.get(id); }
  async getOrdersByStore(storeId: number) { return [...this.orders.values()].filter(o => o.storeId === storeId); }
  async createOrder(storeId: number, order: InsertOrder): Promise<Order> {
    const id = this.nextId.order++;
    const newOrder: Order = { id, storeId, ...order, createdAt: new Date().toISOString() };
    this.orders.set(id, newOrder);
    return newOrder;
  }
  async updateOrder(id: number, data: Partial<Order>) {
    const order = this.orders.get(id);
    if (!order) return undefined;
    const updated = { ...order, ...data, id };
    this.orders.set(id, updated);
    return updated;
  }
  async getAiAgent(id: number) { return this.aiAgents.get(id); }
  async getAiAgentsByStore(storeId: number) { return [...this.aiAgents.values()].filter(a => a.storeId === storeId); }
  async updateAiAgent(id: number, data: Partial<AiAgent>) {
    const agent = this.aiAgents.get(id);
    if (!agent) return undefined;
    const updated = { ...agent, ...data, id };
    this.aiAgents.set(id, updated);
    return updated;
  }
  async getCustomer(id: number) { return this.customers.get(id); }
  async getCustomersByStore(storeId: number) { return [...this.customers.values()].filter(c => c.storeId === storeId); }
  async createCustomer(storeId: number, customer: InsertCustomer): Promise<Customer> {
    const id = this.nextId.customer++;
    const newCustomer: Customer = { id, storeId, ...customer, totalOrders: 0, totalSpent: 0, segment: "new" };
    this.customers.set(id, newCustomer);
    return newCustomer;
  }
  async getDashboardStats(storeId: number) {
    const orders = [...this.orders.values()].filter(o => o.storeId === storeId);
    const products = [...this.products.values()].filter(p => p.storeId === storeId);
    const customers = [...this.customers.values()].filter(c => c.storeId === storeId);
    const totalRevenue = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
    const todayRevenue = orders.filter(o => o.createdAt?.startsWith("2026-03-12") && o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
    return {
      todayRevenue, monthRevenue: totalRevenue, totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === "pending").length,
      totalProducts: products.length, totalCustomers: customers.length,
      newCustomers: customers.filter(c => c.segment === "new").length, conversionRate: 4.8,
    };
  }
  async getChartData(storeId: number) {
    return [
      { date: "6 มี.ค.", revenue: 32400, orders: 8 },
      { date: "7 มี.ค.", revenue: 45200, orders: 12 },
      { date: "8 มี.ค.", revenue: 38900, orders: 10 },
      { date: "9 มี.ค.", revenue: 52100, orders: 15 },
      { date: "10 มี.ค.", revenue: 61300, orders: 18 },
      { date: "11 มี.ค.", revenue: 48700, orders: 14 },
      { date: "12 มี.ค.", revenue: 67500, orders: 21 },
    ];
  }
}

// Initialize storage: try Supabase first, fallback to MemStorage
async function initStorage(): Promise<IStorage> {
  const sb = new SupabaseStorage();
  const connected = await sb.ensureReady();
  if (connected) {
    console.log("[Storage] Using Supabase ✓");
    return sb;
  }
  console.log("[Storage] Supabase tables not ready — using in-memory storage (data resets on restart)");
  return new MemStorage();
}

// Export a promise-based storage that resolves to the right implementation
let _storage: IStorage | null = null;
const _storagePromise = initStorage().then((s) => { _storage = s; return s; });

// Proxy that awaits storage initialization on first call
export const storage: IStorage = new Proxy({} as IStorage, {
  get(_target, prop: string) {
    return async (...args: any[]) => {
      const s = _storage || await _storagePromise;
      return (s as any)[prop](...args);
    };
  },
});
