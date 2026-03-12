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
  paymentMethods: jsonb("payment_methods"), // { promptpay: true, bankTransfer: true, stripe: false }
  bankAccount: jsonb("bank_account"), // { bankName, accountNumber, accountName }
  stripeKey: text("stripe_key"),
});

export const products = pgTable("products", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  storeId: integer("store_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  comparePrice: real("compare_price"),
  cost: real("cost"), // ต้นทุน
  category: text("category"),
  image: text("image"),
  images: jsonb("images"), // array of { url, ratio } for multiple images
  stock: integer("stock").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").default(5),
  sku: text("sku"),
  barcode: text("barcode"),
  weight: real("weight"),
  status: text("status").notNull().default("active"),
  aiScore: real("ai_score"),
  // SEO fields
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  // Affiliate fields
  affiliateUrl: text("affiliate_url"),
  affiliateSource: text("affiliate_source"), // shopee, lazada, etc
  affiliateCommission: real("affiliate_commission"),
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
  paymentProof: text("payment_proof"), // URL to payment slip image
  items: jsonb("items").notNull(),
  shippingAddress: text("shipping_address"),
  trackingNumber: text("tracking_number"),
  notes: text("notes"),
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
  segment: text("segment").default("new"),
  tags: jsonb("tags"),
  notes: text("notes"),
});

// Custom Categories per store
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

// Discount / Coupon system
export const discounts = pgTable("discounts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  storeId: integer("store_id").notNull(),
  code: text("code").notNull(),
  type: text("type").notNull().default("percentage"), // percentage, fixed
  value: real("value").notNull(),
  minPurchase: real("min_purchase"),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").default(0),
  active: boolean("active").default(true),
  expiresAt: text("expires_at"),
});

// LINE messages log
export const lineMessages = pgTable("line_messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  storeId: integer("store_id").notNull(),
  lineUserId: text("line_user_id").notNull(),
  direction: text("direction").notNull(), // inbound, outbound
  messageType: text("message_type").notNull(), // text, image, sticker
  content: text("content"),
  timestamp: text("timestamp"),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, onboarded: true, plan: true, avatar: true });
export const insertStoreSchema = createInsertSchema(stores).omit({ id: true, userId: true, status: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, storeId: true, aiScore: true, status: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, storeId: true, createdAt: true });
export const insertAiAgentSchema = createInsertSchema(aiAgents).omit({ id: true, storeId: true, performance: true, status: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, storeId: true, totalOrders: true, totalSpent: true, segment: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, storeId: true });
export const insertDiscountSchema = createInsertSchema(discounts).omit({ id: true, storeId: true, usedCount: true });

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
