import type { User, InsertUser, Store, InsertStore, Product, InsertProduct, Order, InsertOrder, AiAgent, InsertAiAgent, Customer, InsertCustomer, Category, InsertCategory, Discount, InsertDiscount, BlogPost, InsertBlogPost, Employee, InsertEmployee, StockLog, InsertStockLog } from "@shared/schema";
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
  getStoreCount(userId: number): Promise<number>;
  getAllActiveStores(): Promise<Store[]>;
  createStore(userId: number, store: InsertStore): Promise<Store>;
  updateStore(id: number, data: Partial<Store>): Promise<Store | undefined>;
  deleteStore(id: number): Promise<boolean>;
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
  updateCustomer(id: number, data: Partial<Customer>): Promise<Customer | undefined>;
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
  // Blog Posts
  getBlogPostsByStore(storeId: number | null): Promise<BlogPost[]>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: number, data: Partial<BlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: number): Promise<boolean>;
  getAllPublishedPosts(): Promise<BlogPost[]>;
  // Employees
  getEmployeesByStore(storeId: number): Promise<Employee[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, data: Partial<Employee>): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<boolean>;
  // Stock Logs
  getStockLogsByStore(storeId: number): Promise<StockLog[]>;
  createStockLog(log: InsertStockLog): Promise<StockLog>;
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
let STORES_COLS = ['id', 'user_id', 'name', 'slug', 'description', 'logo', 'theme', 'currency', 'status'];

// Dynamically add storefront_layout column if it exists in DB
export function enableStorefrontLayoutColumn() {
  if (!STORES_COLS.includes('storefront_layout')) {
    STORES_COLS.push('storefront_layout');
    console.log('[Storage] storefront_layout column enabled for persistence');
  }
}
const PRODUCTS_COLS = ['id', 'store_id', 'name', 'description', 'price', 'compare_price', 'category', 'image', 'stock', 'status', 'ai_score'];
const ORDERS_COLS = ['id', 'store_id', 'customer_name', 'customer_email', 'total', 'status', 'items', 'shipping_address', 'created_at'];
const CUSTOMERS_COLS = ['id', 'store_id', 'name', 'email', 'phone', 'total_orders', 'total_spent', 'segment'];

// In-memory overflow storage for extra fields that don't exist in Supabase
const extraFields = new Map<string, Map<number, any>>(); // "table:id" => extra fields
function getExtra(table: string, id: number): any { return extraFields.get(table)?.get(id) || {}; }
function setExtra(table: string, id: number, data: any): void {
  if (!extraFields.has(table)) extraFields.set(table, new Map());
  const existing = extraFields.get(table)!.get(id) || {};
  extraFields.get(table)!.set(id, { ...existing, ...data });
}
function mergeExtra(table: string, row: any): any {
  if (!row || !row.id) return row;
  return { ...row, ...getExtra(table, row.id) };
}

// In-memory tables for tables not in Supabase
const memTables: Record<string, any[]> = {
  blogPosts: [],
  employees: [],
  stockLogs: [],
  lineMessages: [],
};
let memIdCounters: Record<string, number> = {
  blogPosts: 1,
  employees: 1,
  stockLogs: 1,
  lineMessages: 1,
};

class HybridStorage implements IStorage {
  // =================== USERS (Supabase) ===================

  async getUser(id: number): Promise<User | undefined> {
    const { data } = await supabaseAdmin.from("users").select("*").eq("id", id).single();
    if (!data) return undefined;
    return mergeExtra("users", toCamel(data)) as User;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data } = await supabaseAdmin.from("users").select("*").eq("email", email).single();
    if (!data) return undefined;
    return mergeExtra("users", toCamel(data)) as User;
  }

  async createUser(user: InsertUser): Promise<User> {
    const { data, error } = await supabaseAdmin.from("users").insert({
      email: user.email, password: user.password, name: user.name
    }).select().single();
    if (error) throw new Error(error.message);
    return toCamel(data) as User;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const snaked = toSnake(updates);
    const dbData = filterKnownColumns(snaked, ['name', 'email', 'password', 'plan', 'avatar', 'onboarded']);
    const extraData: any = {};
    for (const [k, v] of Object.entries(updates)) {
      const sk = k.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
      if (!['name', 'email', 'password', 'plan', 'avatar', 'onboarded', 'id'].includes(sk)) {
        extraData[k] = v;
      }
    }
    if (Object.keys(dbData).length > 0) {
      const { data, error } = await supabaseAdmin.from("users").update(dbData).eq("id", id).select().single();
      if (error) throw new Error(error.message);
      if (Object.keys(extraData).length > 0) setExtra("users", id, extraData);
      return mergeExtra("users", toCamel(data)) as User;
    }
    if (Object.keys(extraData).length > 0) {
      setExtra("users", id, extraData);
      return this.getUser(id);
    }
    return this.getUser(id);
  }

  // =================== STORES (Supabase + extras) ===================

  async getStore(id: number): Promise<Store | undefined> {
    const { data } = await supabaseAdmin.from("stores").select("*").eq("id", id).single();
    if (!data) return undefined;
    return mergeExtra("stores", toCamel(data)) as Store;
  }

  async getStoreBySlug(slug: string): Promise<Store | undefined> {
    const { data } = await supabaseAdmin.from("stores").select("*").eq("slug", slug).single();
    if (!data) return undefined;
    return mergeExtra("stores", toCamel(data)) as Store;
  }

  async getStoresByUser(userId: number): Promise<Store[]> {
    const { data } = await supabaseAdmin.from("stores").select("*").eq("user_id", userId);
    return (data || []).map(r => mergeExtra("stores", toCamel(r)) as Store);
  }

  async getStoreCount(userId: number): Promise<number> {
    const { count, error } = await supabaseAdmin.from("stores").select("id", { count: "exact", head: true }).eq("user_id", userId);
    if (error) return 0;
    return count || 0;
  }

  async getAllActiveStores(): Promise<Store[]> {
    const { data } = await supabaseAdmin.from("stores").select("*").eq("status", "active");
    return (data || []).map(r => mergeExtra("stores", toCamel(r)) as Store);
  }

  async createStore(userId: number, store: InsertStore): Promise<Store> {
    const snaked = toSnake(store);
    const dbData = filterKnownColumns({ ...snaked, user_id: userId }, [...STORES_COLS, 'user_id']);
    const { data, error } = await supabaseAdmin.from("stores").insert(dbData).select().single();
    if (error) throw new Error(error.message);
    const result = toCamel(data) as Store;
    // Store extra fields in memory
    const extraData: any = {};
    for (const [k, v] of Object.entries(store as any)) {
      const sk = k.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
      if (!STORES_COLS.includes(sk) && sk !== 'user_id' && v !== undefined) {
        extraData[k] = v;
      }
    }
    if (Object.keys(extraData).length > 0) setExtra("stores", result.id, extraData);
    return mergeExtra("stores", result) as Store;
  }

  async updateStore(id: number, updates: Partial<Store>): Promise<Store | undefined> {
    const snaked = toSnake(updates);
    const dbData = filterKnownColumns(snaked, STORES_COLS.filter(c => c !== 'id'));
    const extraData: any = {};
    for (const [k, v] of Object.entries(updates)) {
      const sk = k.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
      if (!STORES_COLS.includes(sk) && k !== 'id') {
        extraData[k] = v;
      }
    }
    if (Object.keys(dbData).length > 0) {
      await supabaseAdmin.from("stores").update(dbData).eq("id", id);
    }
    if (Object.keys(extraData).length > 0) setExtra("stores", id, extraData);
    return this.getStore(id);
  }

  async deleteStore(id: number): Promise<boolean> {
    // Delete related data first
    await supabaseAdmin.from("products").delete().eq("store_id", id);
    await supabaseAdmin.from("orders").delete().eq("store_id", id);
    await supabaseAdmin.from("customers").delete().eq("store_id", id);
    await supabaseAdmin.from("categories").delete().eq("store_id", id);
    await supabaseAdmin.from("discounts").delete().eq("store_id", id);
    try { await supabaseAdmin.from("ai_agents").delete().eq("store_id", id); } catch {}
    const { error } = await supabaseAdmin.from("stores").delete().eq("id", id);
    extraFields.get("stores")?.delete(id);
    return !error;
  }

  // =================== PRODUCTS (Supabase + extras) ===================

  async getProduct(id: number): Promise<Product | undefined> {
    const { data } = await supabaseAdmin.from("products").select("*").eq("id", id).single();
    if (!data) return undefined;
    return mergeExtra("products", toCamel(data)) as Product;
  }

  async getProductsByStore(storeId: number): Promise<Product[]> {
    const { data } = await supabaseAdmin.from("products").select("*").eq("store_id", storeId);
    return (data || []).map(r => mergeExtra("products", toCamel(r)) as Product);
  }

  async getAllActiveProducts(): Promise<Product[]> {
    const { data } = await supabaseAdmin.from("products").select("*").eq("status", "active");
    return (data || []).map(r => mergeExtra("products", toCamel(r)) as Product);
  }

  async createProduct(storeId: number, product: InsertProduct): Promise<Product> {
    const snaked = toSnake(product);
    const dbData = filterKnownColumns({ ...snaked, store_id: storeId }, [...PRODUCTS_COLS, 'store_id']);
    const { data, error } = await supabaseAdmin.from("products").insert(dbData).select().single();
    if (error) throw new Error(error.message);
    const result = toCamel(data) as Product;
    const extraData: any = {};
    for (const [k, v] of Object.entries(product as any)) {
      const sk = k.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
      if (!PRODUCTS_COLS.includes(sk) && sk !== 'store_id' && v !== undefined) {
        extraData[k] = v;
      }
    }
    if (Object.keys(extraData).length > 0) setExtra("products", result.id, extraData);
    return mergeExtra("products", result) as Product;
  }

  async updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined> {
    const snaked = toSnake(updates);
    const dbData = filterKnownColumns(snaked, PRODUCTS_COLS.filter(c => c !== 'id'));
    const extraData: any = {};
    for (const [k, v] of Object.entries(updates)) {
      const sk = k.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
      if (!PRODUCTS_COLS.includes(sk) && k !== 'id') {
        extraData[k] = v;
      }
    }
    if (Object.keys(dbData).length > 0) {
      await supabaseAdmin.from("products").update(dbData).eq("id", id);
    }
    if (Object.keys(extraData).length > 0) setExtra("products", id, extraData);
    return this.getProduct(id);
  }

  async deleteProduct(id: number): Promise<boolean> {
    const { error } = await supabaseAdmin.from("products").delete().eq("id", id);
    extraFields.get("products")?.delete(id);
    return !error;
  }

  // =================== ORDERS (Supabase + extras) ===================

  async getOrder(id: number): Promise<Order | undefined> {
    const { data } = await supabaseAdmin.from("orders").select("*").eq("id", id).single();
    if (!data) return undefined;
    return mergeExtra("orders", toCamel(data)) as Order;
  }

  async getOrdersByStore(storeId: number): Promise<Order[]> {
    const { data } = await supabaseAdmin.from("orders").select("*").eq("store_id", storeId).order("id", { ascending: false });
    return (data || []).map(r => mergeExtra("orders", toCamel(r)) as Order);
  }

  async createOrder(storeId: number, order: any): Promise<Order> {
    const snaked = toSnake(order);
    const dbData = filterKnownColumns({ ...snaked, store_id: storeId, created_at: new Date().toISOString() }, [...ORDERS_COLS, 'store_id']);
    const { data, error } = await supabaseAdmin.from("orders").insert(dbData).select().single();
    if (error) throw new Error(error.message);
    const result = toCamel(data) as Order;
    const extraData: any = {};
    for (const [k, v] of Object.entries(order)) {
      const sk = k.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
      if (!ORDERS_COLS.includes(sk) && sk !== 'store_id' && v !== undefined) {
        extraData[k] = v;
      }
    }
    if (Object.keys(extraData).length > 0) setExtra("orders", result.id, extraData);
    return mergeExtra("orders", result) as Order;
  }

  async updateOrder(id: number, updates: Partial<Order>): Promise<Order | undefined> {
    const snaked = toSnake(updates);
    const dbData = filterKnownColumns(snaked, ORDERS_COLS.filter(c => c !== 'id'));
    const extraData: any = {};
    for (const [k, v] of Object.entries(updates)) {
      const sk = k.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
      if (!ORDERS_COLS.includes(sk) && k !== 'id') {
        extraData[k] = v;
      }
    }
    if (Object.keys(dbData).length > 0) {
      await supabaseAdmin.from("orders").update(dbData).eq("id", id);
    }
    if (Object.keys(extraData).length > 0) setExtra("orders", id, extraData);
    return this.getOrder(id);
  }

  // =================== AI AGENTS (Supabase) ===================

  async getAiAgent(id: number): Promise<AiAgent | undefined> {
    try {
      const { data } = await supabaseAdmin.from("ai_agents").select("*").eq("id", id).single();
      if (!data) return undefined;
      return toCamel(data) as AiAgent;
    } catch { return undefined; }
  }

  async getAiAgentsByStore(storeId: number): Promise<AiAgent[]> {
    try {
      const { data, error } = await supabaseAdmin.from("ai_agents").select("*").eq("store_id", storeId);
      if (error || !data) return [];
      return data.map(r => toCamel(r) as AiAgent);
    } catch { return []; }
  }

  async createAiAgent(storeId: number, agent: any): Promise<AiAgent> {
    try {
      const { data, error } = await supabaseAdmin.from("ai_agents").insert({
        store_id: storeId,
        type: agent.type,
        name: agent.name,
        description: agent.description || "",
        enabled: agent.enabled ?? true,
        config: agent.config || {},
        performance: agent.performance ?? Math.floor(Math.random() * 20 + 80),
        status: "active",
        icon: agent.icon || "Sparkles",
      }).select().single();
      if (error) throw new Error(error.message);
      return toCamel(data) as AiAgent;
    } catch (e: any) {
      // Fallback to in-memory
      const id = Date.now() + Math.floor(Math.random() * 1000);
      const created = {
        id, storeId, type: agent.type, name: agent.name,
        description: agent.description || "", enabled: agent.enabled ?? true,
        config: agent.config || {}, performance: agent.performance ?? Math.floor(Math.random() * 20 + 80),
        status: "active", icon: agent.icon || "Sparkles",
      } as AiAgent;
      return created;
    }
  }

  async updateAiAgent(id: number, updates: Partial<AiAgent>): Promise<AiAgent | undefined> {
    try {
      const snaked = toSnake(updates);
      const { data, error } = await supabaseAdmin.from("ai_agents").update(snaked).eq("id", id).select().single();
      if (error) throw error;
      return toCamel(data) as AiAgent;
    } catch { return undefined; }
  }

  // =================== CUSTOMERS (Supabase + extras) ===================

  async getCustomer(id: number): Promise<Customer | undefined> {
    const { data } = await supabaseAdmin.from("customers").select("*").eq("id", id).single();
    if (!data) return undefined;
    return mergeExtra("customers", toCamel(data)) as Customer;
  }

  async getCustomersByStore(storeId: number): Promise<Customer[]> {
    const { data } = await supabaseAdmin.from("customers").select("*").eq("store_id", storeId);
    return (data || []).map(r => mergeExtra("customers", toCamel(r)) as Customer);
  }

  async createCustomer(storeId: number, customer: InsertCustomer): Promise<Customer> {
    const snaked = toSnake(customer);
    const dbData = filterKnownColumns({ ...snaked, store_id: storeId }, [...CUSTOMERS_COLS, 'store_id']);
    const { data, error } = await supabaseAdmin.from("customers").insert(dbData).select().single();
    if (error) throw new Error(error.message);
    return toCamel(data) as Customer;
  }

  async updateCustomer(id: number, updates: Partial<Customer>): Promise<Customer | undefined> {
    const snaked = toSnake(updates);
    const dbData = filterKnownColumns(snaked, CUSTOMERS_COLS.filter(c => c !== 'id'));
    if (Object.keys(dbData).length > 0) {
      await supabaseAdmin.from("customers").update(dbData).eq("id", id);
    }
    const extraData: any = {};
    for (const [k, v] of Object.entries(updates)) {
      const sk = k.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
      if (!CUSTOMERS_COLS.includes(sk) && k !== 'id') extraData[k] = v;
    }
    if (Object.keys(extraData).length > 0) setExtra("customers", id, extraData);
    return this.getCustomer(id);
  }

  // =================== CATEGORIES (Supabase) ===================

  async getCategoriesByStore(storeId: number): Promise<Category[]> {
    try {
      const { data, error } = await supabaseAdmin.from("categories").select("*").eq("store_id", storeId).order("sort_order", { ascending: true });
      if (error || !data) return [];
      return data.map(r => toCamel(r) as Category);
    } catch { return []; }
  }

  async createCategory(storeId: number, cat: any): Promise<Category> {
    try {
      const { data, error } = await supabaseAdmin.from("categories").insert({
        store_id: storeId, name: cat.name, slug: cat.slug, description: cat.description || null,
        image: cat.image || null, parent_id: cat.parentId || null, sort_order: cat.sortOrder || 0,
      }).select().single();
      if (error) throw error;
      return toCamel(data) as Category;
    } catch {
      return { id: Date.now(), storeId, name: cat.name, slug: cat.slug, description: cat.description || null, image: null, parentId: null, sortOrder: 0 } as Category;
    }
  }

  async updateCategory(id: number, updates: Partial<Category>): Promise<Category | undefined> {
    try {
      const snaked = toSnake(updates);
      const { data } = await supabaseAdmin.from("categories").update(snaked).eq("id", id).select().single();
      return data ? toCamel(data) as Category : undefined;
    } catch { return undefined; }
  }

  async deleteCategory(id: number): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin.from("categories").delete().eq("id", id);
      return !error;
    } catch { return false; }
  }

  // =================== DISCOUNTS (Supabase) ===================

  async getDiscountsByStore(storeId: number): Promise<Discount[]> {
    try {
      const { data, error } = await supabaseAdmin.from("discounts").select("*").eq("store_id", storeId);
      if (error || !data) return [];
      return data.map(r => toCamel(r) as Discount);
    } catch { return []; }
  }

  async createDiscount(storeId: number, disc: any): Promise<Discount> {
    try {
      const { data, error } = await supabaseAdmin.from("discounts").insert({
        store_id: storeId, code: disc.code, type: disc.type || "percentage",
        value: disc.value, min_purchase: disc.minPurchase || null, max_uses: disc.maxUses || null,
        active: disc.active ?? true, expires_at: disc.expiresAt || null,
      }).select().single();
      if (error) throw error;
      return toCamel(data) as Discount;
    } catch {
      return { id: Date.now(), storeId, code: disc.code, type: disc.type || "percentage", value: disc.value, minPurchase: null, maxUses: null, usedCount: 0, active: true, expiresAt: null } as Discount;
    }
  }

  async updateDiscount(id: number, updates: Partial<Discount>): Promise<Discount | undefined> {
    try {
      const snaked = toSnake(updates);
      const { data } = await supabaseAdmin.from("discounts").update(snaked).eq("id", id).select().single();
      return data ? toCamel(data) as Discount : undefined;
    } catch { return undefined; }
  }

  async deleteDiscount(id: number): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin.from("discounts").delete().eq("id", id);
      return !error;
    } catch { return false; }
  }

  // =================== LINE MESSAGES (in-memory) ===================

  async createLineMessage(storeId: number, msg: any): Promise<any> {
    const id = memIdCounters.lineMessages++;
    const record = { id, storeId, ...msg };
    memTables.lineMessages.push(record);
    return record;
  }

  async getLineMessagesByStore(storeId: number): Promise<any[]> {
    return memTables.lineMessages.filter(m => m.storeId === storeId);
  }

  // =================== BLOG POSTS (in-memory) ===================

  async getBlogPostsByStore(storeId: number | null): Promise<BlogPost[]> {
    return memTables.blogPosts.filter(p => storeId === null ? p.storeId === null : p.storeId === storeId);
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    return memTables.blogPosts.find(p => p.slug === slug);
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const id = memIdCounters.blogPosts++;
    const record = { ...post, id, createdAt: new Date().toISOString(), publishedAt: post.status === "published" ? new Date().toISOString() : null } as BlogPost;
    memTables.blogPosts.push(record);
    return record;
  }

  async updateBlogPost(id: number, updates: Partial<BlogPost>): Promise<BlogPost | undefined> {
    const idx = memTables.blogPosts.findIndex(p => p.id === id);
    if (idx < 0) return undefined;
    if (updates.status === "published" && !memTables.blogPosts[idx].publishedAt) {
      updates.publishedAt = new Date().toISOString();
    }
    memTables.blogPosts[idx] = { ...memTables.blogPosts[idx], ...updates };
    return memTables.blogPosts[idx];
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    const idx = memTables.blogPosts.findIndex(p => p.id === id);
    if (idx < 0) return false;
    memTables.blogPosts.splice(idx, 1);
    return true;
  }

  async getAllPublishedPosts(): Promise<BlogPost[]> {
    return memTables.blogPosts.filter(p => p.status === "published");
  }

  // =================== EMPLOYEES (in-memory) ===================

  async getEmployeesByStore(storeId: number): Promise<Employee[]> {
    return memTables.employees.filter(e => e.storeId === storeId);
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const id = memIdCounters.employees++;
    const record = { ...employee, id, active: employee.active ?? true } as Employee;
    memTables.employees.push(record);
    return record;
  }

  async updateEmployee(id: number, updates: Partial<Employee>): Promise<Employee | undefined> {
    const idx = memTables.employees.findIndex(e => e.id === id);
    if (idx < 0) return undefined;
    memTables.employees[idx] = { ...memTables.employees[idx], ...updates };
    return memTables.employees[idx];
  }

  async deleteEmployee(id: number): Promise<boolean> {
    const idx = memTables.employees.findIndex(e => e.id === id);
    if (idx < 0) return false;
    memTables.employees.splice(idx, 1);
    return true;
  }

  // =================== STOCK LOGS (in-memory) ===================

  async getStockLogsByStore(storeId: number): Promise<StockLog[]> {
    return memTables.stockLogs.filter(l => l.storeId === storeId);
  }

  async createStockLog(log: InsertStockLog): Promise<StockLog> {
    const id = memIdCounters.stockLogs++;
    const record = { ...log, id, createdAt: new Date().toISOString() } as StockLog;
    memTables.stockLogs.push(record);
    return record;
  }

  // =================== DASHBOARD ===================

  async getDashboardStats(storeId: number): Promise<any> {
    const products = await this.getProductsByStore(storeId);
    const orders = await this.getOrdersByStore(storeId);
    const customers = await this.getCustomersByStore(storeId);

    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const pendingOrders = orders.filter(o => o.status === "pending").length;
    const lowStockCount = products.filter(p => p.stock <= (p.lowStockThreshold || 5)).length;

    return {
      totalProducts: products.length,
      totalOrders: orders.length,
      totalCustomers: customers.length,
      totalRevenue,
      pendingOrders,
      lowStockCount,
      averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
    };
  }

  async getChartData(storeId: number): Promise<any> {
    const orders = await this.getOrdersByStore(storeId);
    // Group by date
    const dailyMap = new Map<string, number>();
    for (const order of orders) {
      const date = order.createdAt ? order.createdAt.split("T")[0] : new Date().toISOString().split("T")[0];
      dailyMap.set(date, (dailyMap.get(date) || 0) + (order.total || 0));
    }

    // Generate last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      days.push({ date: key, revenue: dailyMap.get(key) || 0 });
    }
    return days;
  }
}

export const storage = new HybridStorage();
