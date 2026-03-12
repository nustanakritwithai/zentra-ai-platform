import { sql } from "drizzle-orm";
import { pgTable, text, integer, boolean, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  plan: text("plan").notNull().default("free"),
  role: text("role").notNull().default("seller"), // seller, buyer, admin
  onboarded: boolean("onboarded").notNull().default(false),
});

export const stores = pgTable("stores", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  logo: text("logo"),
  theme: text("theme").notNull().default("modern-dark"),
  currency: text("currency").notNull().default("THB"),
  status: text("status").notNull().default("active"),
  // LINE OA integration
  lineChannelId: text("line_channel_id"),
  lineChannelSecret: text("line_channel_secret"),
  lineAccessToken: text("line_access_token"),
  // Payment settings
  paymentMethods: jsonb("payment_methods"),
  bankAccount: jsonb("bank_account"),
  stripeKey: text("stripe_key"),
  // Meta / Facebook integration
  metaPixelId: text("meta_pixel_id"),
  metaAccessToken: text("meta_access_token"),
  metaCatalogId: text("meta_catalog_id"),
  // SEO settings
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  seoKeywords: text("seo_keywords"),
  // Store customization
  customCss: text("custom_css"),
  customBanner: text("custom_banner"),
  storeThemeConfig: jsonb("store_theme_config"), // { primaryColor, layout, font, heroStyle }
  // Loyalty
  loyaltyEnabled: boolean("loyalty_enabled").default(false),
  loyaltyPointsPerBaht: real("loyalty_points_per_baht").default(1),
  // Tax
  taxEnabled: boolean("tax_enabled").default(false),
  taxRate: real("tax_rate").default(7),
});

export const products = pgTable("products", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  storeId: integer("store_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  comparePrice: real("compare_price"),
  cost: real("cost"),
  category: text("category"),
  image: text("image"),
  images: jsonb("images"),
  stock: integer("stock").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").default(5),
  sku: text("sku"),
  barcode: text("barcode"),
  weight: real("weight"),
  status: text("status").notNull().default("active"),
  aiScore: real("ai_score"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  // Affiliate fields - enhanced
  affiliateUrl: text("affiliate_url"),
  affiliateSource: text("affiliate_source"),
  affiliateCommission: real("affiliate_commission"),
  affiliateType: text("affiliate_type"), // "resell" | "clickbait" - #2 feature
  affiliateBackendLink: text("affiliate_backend_link"), // hidden link for resell type
  // Product options/variants
  options: jsonb("options"), // [{name, values: []}]
  variants: jsonb("variants"), // [{optionValues: {}, price, stock, sku}]
});

export const orders = pgTable("orders", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  storeId: integer("store_id").notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  total: real("total").notNull(),
  subtotal: real("subtotal"),
  discount: real("discount"),
  shippingCost: real("shipping_cost"),
  status: text("status").notNull().default("pending"),
  paymentMethod: text("payment_method"),
  paymentStatus: text("payment_status").default("pending"),
  paymentProof: text("payment_proof"),
  items: jsonb("items").notNull(),
  shippingAddress: text("shipping_address"),
  trackingNumber: text("tracking_number"),
  notes: text("notes"),
  source: text("source").default("online"), // online, pos
  employeeId: integer("employee_id"),
  createdAt: text("created_at"),
});

export const aiAgents = pgTable("ai_agents", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  storeId: integer("store_id").notNull(),
  type: text("type").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  enabled: boolean("enabled").notNull().default(true),
  config: jsonb("config"),
  performance: real("performance"),
  status: text("status").notNull().default("active"),
  icon: text("icon"),
});

export const customers = pgTable("customers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  storeId: integer("store_id").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  lineUserId: text("line_user_id"),
  totalOrders: integer("total_orders").notNull().default(0),
  totalSpent: real("total_spent").notNull().default(0),
  loyaltyPoints: integer("loyalty_points").default(0),
  segment: text("segment").default("new"),
  tags: jsonb("tags"),
  notes: text("notes"),
  address: text("address"),
});

export const categories = pgTable("categories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  storeId: integer("store_id").notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  image: text("image"),
  parentId: integer("parent_id"),
  sortOrder: integer("sort_order").default(0),
});

export const discounts = pgTable("discounts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  storeId: integer("store_id").notNull(),
  code: text("code").notNull(),
  type: text("type").notNull().default("percentage"),
  value: real("value").notNull(),
  minPurchase: real("min_purchase"),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").default(0),
  active: boolean("active").default(true),
  expiresAt: text("expires_at"),
});

export const lineMessages = pgTable("line_messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  storeId: integer("store_id").notNull(),
  lineUserId: text("line_user_id").notNull(),
  direction: text("direction").notNull(),
  messageType: text("message_type").notNull(),
  content: text("content"),
  timestamp: text("timestamp"),
});

// Blog / Articles system (#14)
export const blogPosts = pgTable("blog_posts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  storeId: integer("store_id"), // null = platform blog
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  coverImage: text("cover_image"),
  category: text("category"),
  tags: jsonb("tags"),
  status: text("status").notNull().default("draft"), // draft, published
  authorId: integer("author_id"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  createdAt: text("created_at"),
  publishedAt: text("published_at"),
});

// Employees (#3)
export const employees = pgTable("employees", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  storeId: integer("store_id").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  role: text("role").notNull().default("staff"), // admin, manager, staff, cashier
  permissions: jsonb("permissions"), // { products: true, orders: true, ... }
  pin: text("pin"), // POS PIN
  active: boolean("active").default(true),
});

// Stock transfer logs (#3)
export const stockLogs = pgTable("stock_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  storeId: integer("store_id").notNull(),
  productId: integer("product_id").notNull(),
  type: text("type").notNull(), // adjustment, transfer, production, count
  quantity: integer("quantity").notNull(),
  reason: text("reason"),
  employeeId: integer("employee_id"),
  createdAt: text("created_at"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, onboarded: true, plan: true, avatar: true, role: true });
export const insertStoreSchema = createInsertSchema(stores).omit({ id: true, userId: true, status: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, storeId: true, aiScore: true, status: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, storeId: true, createdAt: true });
export const insertAiAgentSchema = createInsertSchema(aiAgents).omit({ id: true, storeId: true, performance: true, status: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, storeId: true, totalOrders: true, totalSpent: true, segment: true, loyaltyPoints: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, storeId: true });
export const insertDiscountSchema = createInsertSchema(discounts).omit({ id: true, storeId: true, usedCount: true });
export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({ id: true, createdAt: true, publishedAt: true });
export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true });
export const insertStockLogSchema = createInsertSchema(stockLogs).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Store = typeof stores.$inferSelect;
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type AiAgent = typeof aiAgents.$inferSelect;
export type InsertAiAgent = z.infer<typeof insertAiAgentSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Discount = typeof discounts.$inferSelect;
export type InsertDiscount = z.infer<typeof insertDiscountSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type StockLog = typeof stockLogs.$inferSelect;
export type InsertStockLog = z.infer<typeof insertStockLogSchema>;
