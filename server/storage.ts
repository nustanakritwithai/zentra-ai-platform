import type { User, InsertUser, Store, InsertStore, Product, InsertProduct, Order, InsertOrder, AiAgent, InsertAiAgent, Customer, InsertCustomer, Category, InsertCategory, Discount, InsertDiscount } from "@shared/schema";
import { supabaseAdmin } from "./supabase";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  // Stores
  getStore(id: number): Promise<Store | undefined>;
  getStoreBySlug(slug: string): Promise<Store | undefined>;
  getStoresByUser(userId: number): Promise<Store[]>;
  getAllActiveStores(): Promise<Store[]>;
  createStore(userId: number, store: InsertStore): Promise<Store>;
  updateStore(id: number, data: Partial<Store>): Promise<Store | undefined>;
  // Products
  getProduct(id: number): Promise<Product | undefined>;
  getProductsByStore(storeId: number): Promise<Product[]>;
  getAllActiveProducts(): Promise<Product[]>;
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
  createAiAgent(storeId: number, agent: any): Promise<AiAgent>;
  updateAiAgent(id: number, data: Partial<AiAgent>): Promise<AiAgent | undefined>;
  // Customers
  getCustomer(id: number): Promise<Customer | undefined>;
  getCustomersByStore(storeId: number): Promise<Customer[]>;
  createCustomer(storeId: number, customer: InsertCustomer): Promise<Customer>;
  // Categories
  getCategoriesByStore(storeId: number): Promise<Category[]>;
  createCategory(storeId: number, cat: any): Promise<Category>;
  updateCategory(id: number, data: Partial<Category>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  // Discounts
  getDiscountsByStore(storeId: number): Promise<Discount[]>;
  createDiscount(storeId: number, disc: any): Promise<Discount>;
  updateDiscount(id: number, data: Partial<Discount>): Promise<Discount | undefined>;
  deleteDiscount(id: number): Promise<boolean>;
  // LINE Messages
  createLineMessage(storeId: number, msg: any): Promise<any>;
  getLineMessagesByStore(storeId: number): Promise<any[]>;
  // Dashboard
  getDashboardStats(storeId: number): Promise<any>;
  getChartData(storeId: number): Promise<any>;
}

function toCamel(row: any): any {
  if (!row) return row;
  const result: any = {};
  for (const key of Object.keys(row)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = row[key];
  }
  return result;
}

function toSnake(obj: any): any {
  if (!obj) return obj;
  const result: any = {};
  for (const key of Object.keys(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    result[snakeKey] = obj[key];
  }
  return result;
}

// Only include keys that exist in the DB schema (skip unknown columns)
function filterKnownColumns(data: any, knownCols: string[]): any {
  const result: any = {};
  for (const key of Object.keys(data)) {
    if (knownCols.includes(key)) {
      result[key] = data[key];
    }
  }
  return result;
}

// Known columns per table (what actually exists in Supabase)
const STORES_COLS = ['id', 'user_id', 'name', 'slug', 'description', 'logo', 'theme', 'currency', 'status'];
const PRODUCTS_COLS = ['id', 'store_id', 'name', 'description', 'price', 'compare_price', 'category', 'image', 'stock', 'status', 'ai_score'];
const ORDERS_COLS = ['id', 'store_id', 'customer_name', 'customer_email', 'total', 'status', 'items', 'shipping_address', 'created_at'];
const CUSTOMERS_COLS = ['id', 'store_id', 'name', 'email', 'phone', 'total_orders', 'total_spent', 'segment'];

// Track which new tables/columns exist (updated at runtime)
let newTablesReady = false;
let newColumnsReady = false;

async function checkNewTables(): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.from("categories").select("id").limit(1);
    if (!error) {
      console.log("[Supabase] ✓ New tables (categories, discounts, line_messages) exist");
      return true;
    }
  } catch {}
  return false;
}

async function checkNewColumns(): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.from("stores").select("line_channel_id").limit(1);
    if (!error) {
      console.log("[Supabase] ✓ New columns on stores/products/orders exist");
      return true;
    }
  } catch {}
  return false;
}

// ============ HybridStorage: Supabase for core + MemFallback for new ============
export class HybridStorage implements IStorage {
  private ready: Promise<boolean>;
  private isConnected = false;
  
  // In-memory stores for tables that don't exist yet in Supabase
  private categoriesMap: Map<number, any> = new Map();
  private discountsMap: Map<number, any> = new Map();
  private lineMessagesMap: Map<number, any> = new Map();
  private nextId = { category: 100, discount: 100, lineMsg: 100 };
  // Cache for extra fields that Supabase doesn't have yet
  private storeExtras: Map<number, any> = new Map();
  private productExtras: Map<number, any> = new Map();
  private orderExtras: Map<number, any> = new Map();

  constructor() {
    this.ready = this.init();
    this.seedDefaults();
  }

  private seedDefaults() {
    // Default categories for demo store
    const cats = [
      { storeId: 1, name: "ทั่วไป", slug: "general", description: null, image: null, parentId: null, sortOrder: 0 },
      { storeId: 1, name: "อุปกรณ์อิเล็กทรอนิกส์", slug: "electronics", description: null, image: null, parentId: null, sortOrder: 1 },
      { storeId: 1, name: "เสื้อผ้า", slug: "clothing", description: null, image: null, parentId: null, sortOrder: 2 },
      { storeId: 1, name: "รองเท้า", slug: "shoes", description: null, image: null, parentId: null, sortOrder: 3 },
      { storeId: 1, name: "กระเป๋า", slug: "bags", description: null, image: null, parentId: null, sortOrder: 4 },
    ];
    cats.forEach((c, i) => this.categoriesMap.set(i + 1, { ...c, id: i + 1 }));
    this.discountsMap.set(1, { id: 1, storeId: 1, code: "WELCOME10", type: "percentage", value: 10, minPurchase: 500, maxUses: 100, usedCount: 12, active: true, expiresAt: "2026-12-31T23:59:59" });
  }

  private async init(): Promise<boolean> {
    try {
      const { data, error } = await supabaseAdmin.from("users").select("id").limit(1);
      if (error) { console.log("[Supabase] Tables not ready:", error.message); return false; }
      this.isConnected = true;
      console.log("[Supabase] ✓ Connected to core tables");
      
      // Check new tables and columns
      newTablesReady = await checkNewTables();
      newColumnsReady = await checkNewColumns();
      
      if (newColumnsReady) {
        STORES_COLS.push('line_channel_id', 'line_channel_secret', 'line_access_token', 'payment_methods', 'bank_account', 'stripe_key');
        PRODUCTS_COLS.push('cost', 'images', 'low_stock_threshold', 'sku', 'barcode', 'weight', 'seo_title', 'seo_description', 'affiliate_url', 'affiliate_source', 'affiliate_commission');
        ORDERS_COLS.push('subtotal', 'discount', 'shipping_cost', 'payment_method', 'payment_status', 'payment_proof', 'tracking_number', 'notes');
        CUSTOMERS_COLS.push('line_user_id');
      }
      
      return true;
    } catch (e: any) { console.log("[Supabase] Connection failed:", e.message); return false; }
  }

  async ensureReady() {
    await this.ready;
    return this.isConnected;
  }

  // === USERS ===
  async getUser(id: number) { const { data } = await supabaseAdmin.from("users").select("*").eq("id", id).single(); return data ? toCamel(data) : undefined; }
  async getUserByEmail(email: string) { const { data } = await supabaseAdmin.from("users").select("*").eq("email", email).single(); return data ? toCamel(data) : undefined; }
  async createUser(user: InsertUser) {
    const { data, error } = await supabaseAdmin.from("users").insert({ email: user.email, password: user.password, name: user.name }).select().single();
    if (error) throw new Error(error.message); return toCamel(data);
  }
  async updateUser(id: number, update: Partial<User>) {
    const { data } = await supabaseAdmin.from("users").update(toSnake(update)).eq("id", id).select().single();
    return data ? toCamel(data) : undefined;
  }

  // === STORES ===
  async getStore(id: number) {
    const { data } = await supabaseAdmin.from("stores").select("*").eq("id", id).single();
    if (!data) return undefined;
    const base = toCamel(data);
    const extras = this.storeExtras.get(id) || {};
    return { ...base, lineChannelId: null, lineChannelSecret: null, lineAccessToken: null, paymentMethods: null, bankAccount: null, stripeKey: null, ...extras };
  }
  async getStoreBySlug(slug: string) {
    const { data } = await supabaseAdmin.from("stores").select("*").eq("slug", slug).single();
    if (!data) return undefined;
    const base = toCamel(data);
    const extras = this.storeExtras.get(data.id) || {};
    return { ...base, lineChannelId: null, lineChannelSecret: null, lineAccessToken: null, paymentMethods: null, bankAccount: null, stripeKey: null, ...extras };
  }
  async getStoresByUser(userId: number) {
    const { data } = await supabaseAdmin.from("stores").select("*").eq("user_id", userId);
    return (data || []).map((d: any) => {
      const base = toCamel(d);
      const extras = this.storeExtras.get(d.id) || {};
      return { ...base, lineChannelId: null, lineChannelSecret: null, lineAccessToken: null, paymentMethods: null, bankAccount: null, stripeKey: null, ...extras };
    });
  }
  async getAllActiveStores() { const { data } = await supabaseAdmin.from("stores").select("*").eq("status", "active"); return (data || []).map(toCamel); }
  async createStore(userId: number, store: InsertStore) {
    const snaked = toSnake(store);
    const dbData = filterKnownColumns({ user_id: userId, ...snaked }, STORES_COLS);
    const { data, error } = await supabaseAdmin.from("stores").insert(dbData).select().single();
    if (error) throw new Error(error.message); return toCamel(data);
  }
  async updateStore(id: number, update: Partial<Store>) {
    const snaked = toSnake(update);
    const dbData = filterKnownColumns(snaked, STORES_COLS);
    
    // Save extra fields in memory
    const extraFields = ['line_channel_id', 'line_channel_secret', 'line_access_token', 'payment_methods', 'bank_account', 'stripe_key'];
    const extras: any = {};
    for (const field of extraFields) {
      if (snaked[field] !== undefined) {
        const camelField = field.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        extras[camelField] = snaked[field];
      }
    }
    if (Object.keys(extras).length > 0) {
      const existing = this.storeExtras.get(id) || {};
      this.storeExtras.set(id, { ...existing, ...extras });
    }
    
    if (Object.keys(dbData).length > 0) {
      const { data } = await supabaseAdmin.from("stores").update(dbData).eq("id", id).select().single();
      if (!data) return undefined;
      const base = toCamel(data);
      const allExtras = this.storeExtras.get(id) || {};
      return { ...base, lineChannelId: null, lineChannelSecret: null, lineAccessToken: null, paymentMethods: null, bankAccount: null, stripeKey: null, ...allExtras };
    }
    
    // If only extra fields, return from cache
    const { data } = await supabaseAdmin.from("stores").select("*").eq("id", id).single();
    if (!data) return undefined;
    const allExtras = this.storeExtras.get(id) || {};
    return { ...toCamel(data), lineChannelId: null, lineChannelSecret: null, lineAccessToken: null, paymentMethods: null, bankAccount: null, stripeKey: null, ...allExtras };
  }

  // === PRODUCTS ===
  async getProduct(id: number) {
    const { data } = await supabaseAdmin.from("products").select("*").eq("id", id).single();
    if (!data) return undefined;
    const extras = this.productExtras.get(id) || {};
    return { ...toCamel(data), cost: null, images: null, lowStockThreshold: 5, sku: null, barcode: null, weight: null, seoTitle: null, seoDescription: null, affiliateUrl: null, affiliateSource: null, affiliateCommission: null, ...extras };
  }
  async getProductsByStore(storeId: number) {
    const { data } = await supabaseAdmin.from("products").select("*").eq("store_id", storeId);
    return (data || []).map((d: any) => {
      const extras = this.productExtras.get(d.id) || {};
      return { ...toCamel(d), cost: null, images: null, lowStockThreshold: 5, sku: null, barcode: null, weight: null, seoTitle: null, seoDescription: null, affiliateUrl: null, affiliateSource: null, affiliateCommission: null, ...extras };
    });
  }
  async getAllActiveProducts() {
    const { data } = await supabaseAdmin.from("products").select("*, stores!inner(name, slug)").eq("status", "active").eq("stores.status", "active");
    if (!data) {
      const { data: prods } = await supabaseAdmin.from("products").select("*").eq("status", "active");
      return (prods || []).map(toCamel);
    }
    return (data || []).map((p: any) => ({ ...toCamel(p), storeName: p.stores?.name, storeSlug: p.stores?.slug }));
  }
  async createProduct(storeId: number, product: InsertProduct) {
    const snaked = toSnake(product);
    const dbData = filterKnownColumns({ store_id: storeId, ...snaked, status: "active", ai_score: Math.floor(Math.random() * 30) + 70 }, PRODUCTS_COLS);
    const { data, error } = await supabaseAdmin.from("products").insert(dbData).select().single();
    if (error) throw new Error(error.message);
    
    // Save extra fields
    const extraFields = ['cost', 'images', 'low_stock_threshold', 'sku', 'barcode', 'weight', 'seo_title', 'seo_description', 'affiliate_url', 'affiliate_source', 'affiliate_commission'];
    const extras: any = {};
    for (const field of extraFields) {
      if (snaked[field] !== undefined) {
        const camelField = field.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        extras[camelField] = snaked[field];
      }
    }
    if (Object.keys(extras).length > 0) {
      this.productExtras.set(data.id, extras);
    }
    
    return { ...toCamel(data), ...extras };
  }
  async updateProduct(id: number, update: Partial<Product>) {
    const snaked = toSnake(update);
    const dbData = filterKnownColumns(snaked, PRODUCTS_COLS);
    
    const extraFields = ['cost', 'images', 'low_stock_threshold', 'sku', 'barcode', 'weight', 'seo_title', 'seo_description', 'affiliate_url', 'affiliate_source', 'affiliate_commission'];
    const extras: any = {};
    for (const field of extraFields) {
      if (snaked[field] !== undefined) {
        const camelField = field.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        extras[camelField] = snaked[field];
      }
    }
    if (Object.keys(extras).length > 0) {
      const existing = this.productExtras.get(id) || {};
      this.productExtras.set(id, { ...existing, ...extras });
    }
    
    if (Object.keys(dbData).length > 0) {
      const { data } = await supabaseAdmin.from("products").update(dbData).eq("id", id).select().single();
      if (!data) return undefined;
      const allExtras = this.productExtras.get(id) || {};
      return { ...toCamel(data), ...allExtras };
    }
    
    const { data } = await supabaseAdmin.from("products").select("*").eq("id", id).single();
    if (!data) return undefined;
    const allExtras = this.productExtras.get(id) || {};
    return { ...toCamel(data), ...allExtras };
  }
  async deleteProduct(id: number) { const { error } = await supabaseAdmin.from("products").delete().eq("id", id); this.productExtras.delete(id); return !error; }

  // === ORDERS ===
  async getOrder(id: number) {
    const { data } = await supabaseAdmin.from("orders").select("*").eq("id", id).single();
    if (!data) return undefined;
    const extras = this.orderExtras.get(id) || {};
    return { ...toCamel(data), subtotal: null, discount: null, shippingCost: null, paymentMethod: null, paymentStatus: "pending", paymentProof: null, trackingNumber: null, notes: null, ...extras };
  }
  async getOrdersByStore(storeId: number) {
    const { data } = await supabaseAdmin.from("orders").select("*").eq("store_id", storeId);
    return (data || []).map((d: any) => {
      const extras = this.orderExtras.get(d.id) || {};
      return { ...toCamel(d), subtotal: null, discount: null, shippingCost: null, paymentMethod: null, paymentStatus: "pending", paymentProof: null, trackingNumber: null, notes: null, ...extras };
    });
  }
  async createOrder(storeId: number, order: InsertOrder) {
    const snaked = toSnake(order);
    const dbData = filterKnownColumns({ store_id: storeId, ...snaked, created_at: new Date().toISOString() }, ORDERS_COLS);
    const { data, error } = await supabaseAdmin.from("orders").insert(dbData).select().single();
    if (error) throw new Error(error.message);
    
    const extraFields = ['subtotal', 'discount', 'shipping_cost', 'payment_method', 'payment_status', 'payment_proof', 'tracking_number', 'notes'];
    const extras: any = {};
    for (const field of extraFields) {
      if (snaked[field] !== undefined) {
        const camelField = field.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        extras[camelField] = snaked[field];
      }
    }
    if (Object.keys(extras).length > 0) {
      this.orderExtras.set(data.id, extras);
    }
    
    return { ...toCamel(data), ...extras };
  }
  async updateOrder(id: number, update: Partial<Order>) {
    const snaked = toSnake(update);
    const dbData = filterKnownColumns(snaked, ORDERS_COLS);
    
    const extraFields = ['subtotal', 'discount', 'shipping_cost', 'payment_method', 'payment_status', 'payment_proof', 'tracking_number', 'notes'];
    const extras: any = {};
    for (const field of extraFields) {
      if (snaked[field] !== undefined) {
        const camelField = field.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        extras[camelField] = snaked[field];
      }
    }
    if (Object.keys(extras).length > 0) {
      const existing = this.orderExtras.get(id) || {};
      this.orderExtras.set(id, { ...existing, ...extras });
    }
    
    if (Object.keys(dbData).length > 0) {
      const { data } = await supabaseAdmin.from("orders").update(dbData).eq("id", id).select().single();
      if (!data) return undefined;
      const allExtras = this.orderExtras.get(id) || {};
      return { ...toCamel(data), ...allExtras };
    }
    
    const { data } = await supabaseAdmin.from("orders").select("*").eq("id", id).single();
    if (!data) return undefined;
    const allExtras = this.orderExtras.get(id) || {};
    return { ...toCamel(data), ...allExtras };
  }

  // === AI AGENTS (fully in Supabase) ===
  async getAiAgent(id: number) { const { data } = await supabaseAdmin.from("ai_agents").select("*").eq("id", id).single(); return data ? toCamel(data) : undefined; }
  async getAiAgentsByStore(storeId: number) { const { data } = await supabaseAdmin.from("ai_agents").select("*").eq("store_id", storeId); return (data || []).map(toCamel); }
  async createAiAgent(storeId: number, agent: any) {
    const { data, error } = await supabaseAdmin.from("ai_agents").insert({ store_id: storeId, type: agent.type, name: agent.name, description: agent.description || "", enabled: agent.enabled ?? true, config: agent.config || {}, performance: Math.floor(Math.random() * 20) + 75, status: agent.enabled ? "active" : "paused", icon: agent.icon || "Bot" }).select().single();
    if (error) throw new Error(error.message); return toCamel(data);
  }
  async updateAiAgent(id: number, update: Partial<AiAgent>) {
    const { data } = await supabaseAdmin.from("ai_agents").update(toSnake(update)).eq("id", id).select().single();
    return data ? toCamel(data) : undefined;
  }

  // === CUSTOMERS ===
  async getCustomer(id: number) { const { data } = await supabaseAdmin.from("customers").select("*").eq("id", id).single(); return data ? toCamel(data) : undefined; }
  async getCustomersByStore(storeId: number) { const { data } = await supabaseAdmin.from("customers").select("*").eq("store_id", storeId); return (data || []).map(toCamel); }
  async createCustomer(storeId: number, customer: InsertCustomer) {
    const snaked = toSnake(customer);
    const dbData = filterKnownColumns({ store_id: storeId, ...snaked, total_orders: 0, total_spent: 0, segment: "new" }, CUSTOMERS_COLS);
    const { data, error } = await supabaseAdmin.from("customers").insert(dbData).select().single();
    if (error) throw new Error(error.message); return toCamel(data);
  }

  // === CATEGORIES (in-memory, or Supabase if tables exist) ===
  async getCategoriesByStore(storeId: number) {
    if (newTablesReady) {
      const { data } = await supabaseAdmin.from("categories").select("*").eq("store_id", storeId).order("sort_order");
      return (data || []).map(toCamel);
    }
    return [...this.categoriesMap.values()].filter(c => c.storeId === storeId).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }
  async createCategory(storeId: number, cat: any) {
    if (newTablesReady) {
      const { data, error } = await supabaseAdmin.from("categories").insert({ store_id: storeId, ...toSnake(cat) }).select().single();
      if (error) throw new Error(error.message); return toCamel(data);
    }
    const id = this.nextId.category++;
    const c = { id, storeId, ...cat };
    this.categoriesMap.set(id, c);
    return c;
  }
  async updateCategory(id: number, update: Partial<Category>) {
    if (newTablesReady) {
      const { data } = await supabaseAdmin.from("categories").update(toSnake(update)).eq("id", id).select().single();
      return data ? toCamel(data) : undefined;
    }
    const c = this.categoriesMap.get(id);
    if (!c) return undefined;
    const up = { ...c, ...update, id };
    this.categoriesMap.set(id, up);
    return up;
  }
  async deleteCategory(id: number) {
    if (newTablesReady) {
      const { error } = await supabaseAdmin.from("categories").delete().eq("id", id);
      return !error;
    }
    return this.categoriesMap.delete(id);
  }

  // === DISCOUNTS (in-memory, or Supabase if tables exist) ===
  async getDiscountsByStore(storeId: number) {
    if (newTablesReady) {
      const { data } = await supabaseAdmin.from("discounts").select("*").eq("store_id", storeId);
      return (data || []).map(toCamel);
    }
    return [...this.discountsMap.values()].filter(d => d.storeId === storeId);
  }
  async createDiscount(storeId: number, disc: any) {
    if (newTablesReady) {
      const { data, error } = await supabaseAdmin.from("discounts").insert({ store_id: storeId, ...toSnake(disc), used_count: 0 }).select().single();
      if (error) throw new Error(error.message); return toCamel(data);
    }
    const id = this.nextId.discount++;
    const d = { id, storeId, ...disc, usedCount: 0 };
    this.discountsMap.set(id, d);
    return d;
  }
  async updateDiscount(id: number, update: Partial<Discount>) {
    if (newTablesReady) {
      const { data } = await supabaseAdmin.from("discounts").update(toSnake(update)).eq("id", id).select().single();
      return data ? toCamel(data) : undefined;
    }
    const d = this.discountsMap.get(id);
    if (!d) return undefined;
    const up = { ...d, ...update, id };
    this.discountsMap.set(id, up);
    return up;
  }
  async deleteDiscount(id: number) {
    if (newTablesReady) {
      const { error } = await supabaseAdmin.from("discounts").delete().eq("id", id);
      return !error;
    }
    return this.discountsMap.delete(id);
  }

  // === LINE MESSAGES (in-memory, or Supabase if tables exist) ===
  async createLineMessage(storeId: number, msg: any) {
    if (newTablesReady) {
      const { data, error } = await supabaseAdmin.from("line_messages").insert({ store_id: storeId, ...toSnake(msg) }).select().single();
      if (error) throw new Error(error.message); return toCamel(data);
    }
    const id = this.nextId.lineMsg++;
    const m = { id, storeId, ...msg };
    this.lineMessagesMap.set(id, m);
    return m;
  }
  async getLineMessagesByStore(storeId: number) {
    if (newTablesReady) {
      const { data } = await supabaseAdmin.from("line_messages").select("*").eq("store_id", storeId).order("timestamp", { ascending: false }).limit(100);
      return (data || []).map(toCamel);
    }
    return [...this.lineMessagesMap.values()].filter(m => m.storeId === storeId).sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
  }

  // === DASHBOARD ===
  async getDashboardStats(storeId: number) {
    const { data: orders } = await supabaseAdmin.from("orders").select("*").eq("store_id", storeId);
    const { data: products } = await supabaseAdmin.from("products").select("*").eq("store_id", storeId);
    const { data: customers } = await supabaseAdmin.from("customers").select("*").eq("store_id", storeId);
    const allOrders = orders || []; const allProducts = products || []; const allCustomers = customers || [];
    const totalRevenue = allOrders.filter((o: any) => o.status !== "cancelled").reduce((s: number, o: any) => s + (o.total || 0), 0);
    const today = new Date().toISOString().split("T")[0];
    const todayRevenue = allOrders.filter((o: any) => o.created_at?.startsWith(today) && o.status !== "cancelled").reduce((s: number, o: any) => s + (o.total || 0), 0);
    return { todayRevenue, monthRevenue: totalRevenue, totalOrders: allOrders.length, pendingOrders: allOrders.filter((o: any) => o.status === "pending").length, totalProducts: allProducts.length, totalCustomers: allCustomers.length, newCustomers: allCustomers.filter((c: any) => c.segment === "new").length, conversionRate: 4.8 };
  }
  async getChartData(_storeId: number) {
    return [
      { date: "6 มี.ค.", revenue: 32400, orders: 8 }, { date: "7 มี.ค.", revenue: 45200, orders: 12 },
      { date: "8 มี.ค.", revenue: 38900, orders: 10 }, { date: "9 มี.ค.", revenue: 52100, orders: 15 },
      { date: "10 มี.ค.", revenue: 61300, orders: 18 }, { date: "11 มี.ค.", revenue: 48700, orders: 14 },
      { date: "12 มี.ค.", revenue: 67500, orders: 21 },
    ];
  }
}

// ============ Full In-Memory Fallback ============
export class MemStorage implements IStorage {
  private users: Map<number, any> = new Map();
  private stores: Map<number, any> = new Map();
  private products: Map<number, any> = new Map();
  private orders: Map<number, any> = new Map();
  private aiAgents: Map<number, any> = new Map();
  private customers: Map<number, any> = new Map();
  private categoriesMap: Map<number, any> = new Map();
  private discountsMap: Map<number, any> = new Map();
  private lineMessagesMap: Map<number, any> = new Map();
  private nextId = { user: 2, store: 2, product: 9, order: 6, agent: 7, customer: 11, category: 6, discount: 2, lineMsg: 1 };

  constructor() { this.seed(); }

  private seed() {
    this.users.set(1, { id: 1, email: "demo@zentra.ai", password: "password123", name: "สมชาย ใจดี", avatar: null, plan: "pro", onboarded: true });
    this.stores.set(1, { id: 1, userId: 1, name: "ZentraMart", slug: "zentramart", description: "ร้านค้าออนไลน์ที่ขับเคลื่อนด้วย AI", logo: null, theme: "modern-dark", currency: "THB", status: "active", lineChannelId: null, lineChannelSecret: null, lineAccessToken: null, paymentMethods: null, bankAccount: null, stripeKey: null });

    const base = { cost: null, images: null, lowStockThreshold: 5, sku: null, barcode: null, weight: null, seoTitle: null, seoDescription: null, affiliateUrl: null, affiliateSource: null, affiliateCommission: null };
    const prods = [
      { storeId: 1, name: "Nike Air Max 270 React", description: "รองเท้าวิ่งน้ำหนักเบา ระบายอากาศดี", price: 5990, comparePrice: 7490, category: "รองเท้า", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400", stock: 45, status: "active", aiScore: 97, ...base },
      { storeId: 1, name: "Apple Watch Ultra 3", description: "นาฬิกาอัจฉริยะรุ่นล่าสุด", price: 29900, comparePrice: 32900, category: "อุปกรณ์อิเล็กทรอนิกส์", image: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400", stock: 23, status: "active", aiScore: 94, ...base },
      { storeId: 1, name: "Gucci GG Marmont Mini", description: "กระเป๋าสะพายหนังแท้", price: 45500, comparePrice: 52000, category: "กระเป๋า", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400", stock: 12, status: "active", aiScore: 91, ...base },
      { storeId: 1, name: "Sony WH-1000XM6", description: "หูฟังตัดเสียงรบกวนระดับพรีเมียม", price: 12990, comparePrice: 14990, category: "อุปกรณ์อิเล็กทรอนิกส์", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400", stock: 67, status: "active", aiScore: 95, ...base },
      { storeId: 1, name: "เสื้อยืด Oversize Cotton", description: "เสื้อยืดผ้าฝ้ายออร์แกนิก ใส่สบาย", price: 590, comparePrice: 890, category: "เสื้อผ้า", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400", stock: 234, status: "active", aiScore: 82, ...base },
      { storeId: 1, name: "Samsung Galaxy S26 Ultra", description: "สมาร์ทโฟนเรือธงพร้อม AI", price: 44900, comparePrice: null, category: "อุปกรณ์อิเล็กทรอนิกส์", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400", stock: 18, status: "active", aiScore: 96, ...base },
      { storeId: 1, name: "กางเกงยีนส์ Slim Fit", description: "กางเกงยีนส์ทรงเข้ารูป ผ้ายืด", price: 1290, comparePrice: 1790, category: "เสื้อผ้า", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400", stock: 89, status: "active", aiScore: 78, ...base },
      { storeId: 1, name: "MacBook Pro M5 16\"", description: "แล็ปท็อปสำหรับมืออาชีพ", price: 89900, comparePrice: null, category: "อุปกรณ์อิเล็กทรอนิกส์", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400", stock: 8, status: "draft", aiScore: 88, ...base },
    ];
    prods.forEach((p, i) => this.products.set(i + 1, { ...p, id: i + 1 }));

    const oBase = { customerPhone: null, subtotal: null, discount: null, shippingCost: null, paymentMethod: null, paymentStatus: "pending", paymentProof: null, trackingNumber: null, notes: null };
    const orderData = [
      { storeId: 1, customerName: "นภา วงศ์สุข", customerEmail: "napa@email.com", total: 5990, status: "delivered", items: [{ productId: 1, name: "Nike Air Max 270 React", price: 5990, qty: 1 }], shippingAddress: "123 ถ.สุขุมวิท กรุงเทพฯ 10110", createdAt: "2026-03-11T10:30:00", ...oBase },
      { storeId: 1, customerName: "ธนกร เจริญผล", customerEmail: "thanakorn@email.com", total: 42890, status: "shipped", items: [{ productId: 2, name: "Apple Watch Ultra 3", price: 29900, qty: 1 }, { productId: 4, name: "Sony WH-1000XM6", price: 12990, qty: 1 }], shippingAddress: "456 ถ.พหลโยธิน กรุงเทพฯ 10400", createdAt: "2026-03-11T14:20:00", ...oBase },
      { storeId: 1, customerName: "สมหญิง แก้วใส", customerEmail: "somying@email.com", total: 45500, status: "confirmed", items: [{ productId: 3, name: "Gucci GG Marmont Mini", price: 45500, qty: 1 }], shippingAddress: "789 ถ.เพชรบุรี กรุงเทพฯ 10310", createdAt: "2026-03-12T09:15:00", ...oBase },
      { storeId: 1, customerName: "วิชัย สมบัติดี", customerEmail: "wichai@email.com", total: 1880, status: "pending", items: [{ productId: 5, name: "เสื้อยืด Oversize Cotton", price: 590, qty: 2 }, { productId: 7, name: "กางเกงยีนส์ Slim Fit", price: 1290, qty: 1 }], shippingAddress: "321 ถ.รัชดาภิเษก กรุงเทพฯ 10320", createdAt: "2026-03-12T11:45:00", ...oBase },
      { storeId: 1, customerName: "อรุณ ศรีทอง", customerEmail: "arun@email.com", total: 44900, status: "cancelled", items: [{ productId: 6, name: "Samsung Galaxy S26 Ultra", price: 44900, qty: 1 }], shippingAddress: "654 ถ.ลาดพร้าว กรุงเทพฯ 10230", createdAt: "2026-03-10T16:00:00", ...oBase },
    ];
    orderData.forEach((o, i) => this.orders.set(i + 1, { ...o, id: i + 1 }));

    const agents = [
      { storeId: 1, type: "shopping_assistant", name: "Shopping Assistant", description: "ผู้ช่วยช้อปปิ้ง AI แนะนำสินค้าตาม lifestyle ของลูกค้า", enabled: true, config: { responseSpeed: 8, creativity: 7, language: "th" }, performance: 94, status: "active", icon: "ShoppingBag" },
      { storeId: 1, type: "recommendation", name: "Recommendation Engine", description: "เครื่องมือแนะนำสินค้าแบบ Real-time ด้วย Collaborative Filtering", enabled: true, config: { algorithm: "hybrid", minConfidence: 0.7, maxSuggestions: 8 }, performance: 91, status: "active", icon: "Sparkles" },
      { storeId: 1, type: "dynamic_pricing", name: "Dynamic Pricing", description: "ปรับราคาอัตโนมัติตามอุปสงค์และราคาคู่แข่ง", enabled: true, config: { maxDiscount: 30, priceFloor: 0.7, updateFrequency: "hourly" }, performance: 87, status: "active", icon: "TrendingUp" },
      { storeId: 1, type: "customer_support", name: "Customer Support", description: "ตอบคำถามลูกค้า 24/7 ด้วย AI ที่เข้าใจภาษาธรรมชาติ", enabled: true, config: { responseSpeed: 9, escalationThreshold: 0.3, tone: "friendly" }, performance: 96, status: "active", icon: "Headphones" },
      { storeId: 1, type: "inventory_forecast", name: "Inventory Forecast", description: "พยากรณ์สต็อกสินค้าและแจ้งเตือนเมื่อใกล้หมด", enabled: true, config: { forecastDays: 30, safetyStock: 10, autoReorder: false }, performance: 82, status: "active", icon: "BarChart3" },
      { storeId: 1, type: "visual_search", name: "Visual Search", description: "ค้นหาสินค้าด้วยรูปภาพ ใช้ Computer Vision ขั้นสูง", enabled: false, config: { accuracy: "high", maxResults: 12, similarityThreshold: 0.8 }, performance: 78, status: "paused", icon: "Eye" },
    ];
    agents.forEach((a, i) => this.aiAgents.set(i + 1, { ...a, id: i + 1 }));

    const cBase = { lineUserId: null, tags: null, notes: null };
    const custs = [
      { storeId: 1, name: "นภา วงศ์สุข", email: "napa@email.com", phone: "081-234-5678", totalOrders: 12, totalSpent: 45600, segment: "vip", ...cBase },
      { storeId: 1, name: "ธนกร เจริญผล", email: "thanakorn@email.com", phone: "089-876-5432", totalOrders: 8, totalSpent: 128900, segment: "vip", ...cBase },
      { storeId: 1, name: "สมหญิง แก้วใส", email: "somying@email.com", phone: "062-345-6789", totalOrders: 3, totalSpent: 52300, segment: "returning", ...cBase },
      { storeId: 1, name: "วิชัย สมบัติดี", email: "wichai@email.com", phone: "095-111-2222", totalOrders: 1, totalSpent: 1880, segment: "new", ...cBase },
      { storeId: 1, name: "อรุณ ศรีทอง", email: "arun@email.com", phone: "086-333-4444", totalOrders: 5, totalSpent: 89700, segment: "returning", ...cBase },
    ];
    custs.forEach((c, i) => this.customers.set(i + 1, { ...c, id: i + 1 }));

    const cats = [
      { storeId: 1, name: "ทั่วไป", slug: "general", description: null, image: null, parentId: null, sortOrder: 0 },
      { storeId: 1, name: "อุปกรณ์อิเล็กทรอนิกส์", slug: "electronics", description: null, image: null, parentId: null, sortOrder: 1 },
      { storeId: 1, name: "เสื้อผ้า", slug: "clothing", description: null, image: null, parentId: null, sortOrder: 2 },
      { storeId: 1, name: "รองเท้า", slug: "shoes", description: null, image: null, parentId: null, sortOrder: 3 },
      { storeId: 1, name: "กระเป๋า", slug: "bags", description: null, image: null, parentId: null, sortOrder: 4 },
    ];
    cats.forEach((c, i) => this.categoriesMap.set(i + 1, { ...c, id: i + 1 }));
    this.discountsMap.set(1, { id: 1, storeId: 1, code: "WELCOME10", type: "percentage", value: 10, minPurchase: 500, maxUses: 100, usedCount: 12, active: true, expiresAt: "2026-12-31T23:59:59" });
  }

  async getUser(id: number) { return this.users.get(id); }
  async getUserByEmail(email: string) { return [...this.users.values()].find(u => u.email === email); }
  async createUser(user: InsertUser) { const id = this.nextId.user++; const u = { id, ...user, avatar: null, plan: "free", onboarded: false }; this.users.set(id, u); return u; }
  async updateUser(id: number, data: any) { const u = this.users.get(id); if (!u) return undefined; const up = { ...u, ...data, id }; this.users.set(id, up); return up; }
  async getStore(id: number) { return this.stores.get(id); }
  async getStoreBySlug(slug: string) { return [...this.stores.values()].find(s => s.slug === slug); }
  async getStoresByUser(userId: number) { return [...this.stores.values()].filter(s => s.userId === userId); }
  async getAllActiveStores() { return [...this.stores.values()].filter(s => s.status === "active"); }
  async createStore(userId: number, store: InsertStore) { const id = this.nextId.store++; const s = { id, userId, ...store, status: "active", lineChannelId: null, lineChannelSecret: null, lineAccessToken: null, paymentMethods: null, bankAccount: null, stripeKey: null }; this.stores.set(id, s); return s; }
  async updateStore(id: number, data: any) { const s = this.stores.get(id); if (!s) return undefined; const up = { ...s, ...data, id }; this.stores.set(id, up); return up; }
  async getProduct(id: number) { return this.products.get(id); }
  async getProductsByStore(storeId: number) { return [...this.products.values()].filter(p => p.storeId === storeId); }
  async getAllActiveProducts() {
    const allProds = [...this.products.values()].filter(p => p.status === "active");
    return allProds.map(p => { const store = this.stores.get(p.storeId); return { ...p, storeName: store?.name, storeSlug: store?.slug }; });
  }
  async createProduct(storeId: number, product: InsertProduct) { const id = this.nextId.product++; const p = { id, storeId, ...product, status: "active", aiScore: Math.floor(Math.random() * 30) + 70 }; this.products.set(id, p); return p; }
  async updateProduct(id: number, data: any) { const p = this.products.get(id); if (!p) return undefined; const up = { ...p, ...data, id }; this.products.set(id, up); return up; }
  async deleteProduct(id: number) { return this.products.delete(id); }
  async getOrder(id: number) { return this.orders.get(id); }
  async getOrdersByStore(storeId: number) { return [...this.orders.values()].filter(o => o.storeId === storeId); }
  async createOrder(storeId: number, order: InsertOrder) { const id = this.nextId.order++; const o = { id, storeId, ...order, createdAt: new Date().toISOString() }; this.orders.set(id, o); return o; }
  async updateOrder(id: number, data: any) { const o = this.orders.get(id); if (!o) return undefined; const up = { ...o, ...data, id }; this.orders.set(id, up); return up; }
  async getAiAgent(id: number) { return this.aiAgents.get(id); }
  async getAiAgentsByStore(storeId: number) { return [...this.aiAgents.values()].filter(a => a.storeId === storeId); }
  async createAiAgent(storeId: number, agent: any) { const id = this.nextId.agent++; const a = { id, storeId, type: agent.type, name: agent.name, description: agent.description || "", enabled: agent.enabled ?? true, config: agent.config || {}, performance: Math.floor(Math.random() * 20) + 75, status: agent.enabled ? "active" : "paused", icon: agent.icon || "Bot" }; this.aiAgents.set(id, a); return a; }
  async updateAiAgent(id: number, data: any) { const a = this.aiAgents.get(id); if (!a) return undefined; const up = { ...a, ...data, id }; this.aiAgents.set(id, up); return up; }
  async getCustomer(id: number) { return this.customers.get(id); }
  async getCustomersByStore(storeId: number) { return [...this.customers.values()].filter(c => c.storeId === storeId); }
  async createCustomer(storeId: number, customer: InsertCustomer) { const id = this.nextId.customer++; const c = { id, storeId, ...customer, totalOrders: 0, totalSpent: 0, segment: "new" }; this.customers.set(id, c); return c; }
  async getCategoriesByStore(storeId: number) { return [...this.categoriesMap.values()].filter(c => c.storeId === storeId).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)); }
  async createCategory(storeId: number, cat: any) { const id = this.nextId.category++; const c = { id, storeId, ...cat }; this.categoriesMap.set(id, c); return c; }
  async updateCategory(id: number, data: any) { const c = this.categoriesMap.get(id); if (!c) return undefined; const up = { ...c, ...data, id }; this.categoriesMap.set(id, up); return up; }
  async deleteCategory(id: number) { return this.categoriesMap.delete(id); }
  async getDiscountsByStore(storeId: number) { return [...this.discountsMap.values()].filter(d => d.storeId === storeId); }
  async createDiscount(storeId: number, disc: any) { const id = this.nextId.discount++; const d = { id, storeId, ...disc, usedCount: 0 }; this.discountsMap.set(id, d); return d; }
  async updateDiscount(id: number, data: any) { const d = this.discountsMap.get(id); if (!d) return undefined; const up = { ...d, ...data, id }; this.discountsMap.set(id, up); return up; }
  async deleteDiscount(id: number) { return this.discountsMap.delete(id); }
  async createLineMessage(storeId: number, msg: any) { const id = this.nextId.lineMsg++; const m = { id, storeId, ...msg }; this.lineMessagesMap.set(id, m); return m; }
  async getLineMessagesByStore(storeId: number) { return [...this.lineMessagesMap.values()].filter(m => m.storeId === storeId).sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || "")); }
  async getDashboardStats(storeId: number) {
    const orders = [...this.orders.values()].filter(o => o.storeId === storeId);
    const products = [...this.products.values()].filter(p => p.storeId === storeId);
    const customers = [...this.customers.values()].filter(c => c.storeId === storeId);
    const totalRevenue = orders.filter(o => o.status !== "cancelled").reduce((s: number, o: any) => s + o.total, 0);
    const todayRevenue = orders.filter(o => o.createdAt?.startsWith("2026-03-13") && o.status !== "cancelled").reduce((s: number, o: any) => s + o.total, 0);
    return { todayRevenue, monthRevenue: totalRevenue, totalOrders: orders.length, pendingOrders: orders.filter(o => o.status === "pending").length, totalProducts: products.length, totalCustomers: customers.length, newCustomers: customers.filter(c => c.segment === "new").length, conversionRate: 4.8 };
  }
  async getChartData(_storeId: number) {
    return [
      { date: "7 มี.ค.", revenue: 32400, orders: 8 }, { date: "8 มี.ค.", revenue: 45200, orders: 12 },
      { date: "9 มี.ค.", revenue: 38900, orders: 10 }, { date: "10 มี.ค.", revenue: 52100, orders: 15 },
      { date: "11 มี.ค.", revenue: 61300, orders: 18 }, { date: "12 มี.ค.", revenue: 48700, orders: 14 },
      { date: "13 มี.ค.", revenue: 67500, orders: 21 },
    ];
  }
}

// Initialize storage with HybridStorage (Supabase for core + in-memory for new tables)
async function initStorage(): Promise<IStorage> {
  const hybrid = new HybridStorage();
  const connected = await hybrid.ensureReady();
  if (connected) {
    console.log("[Storage] Using HybridStorage (Supabase core + in-memory for new tables) ✓");
    return hybrid;
  }
  console.log("[Storage] Supabase not available — using full in-memory storage");
  return new MemStorage();
}

let _storage: IStorage | null = null;
const _storagePromise = initStorage().then((s) => { _storage = s; return s; });
export const storage: IStorage = new Proxy({} as IStorage, {
  get(_target, prop: string) {
    return async (...args: any[]) => { const s = _storage || await _storagePromise; return (s as any)[prop](...args); };
  },
});
