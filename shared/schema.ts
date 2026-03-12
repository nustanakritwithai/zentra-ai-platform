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
});

export const products = pgTable("products", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  storeId: integer("store_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  comparePrice: real("compare_price"),
  category: text("category"),
  image: text("image"),
  stock: integer("stock").notNull().default(0),
  status: text("status").notNull().default("active"),
  aiScore: real("ai_score"),
});

export const orders = pgTable("orders", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  storeId: integer("store_id").notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  total: real("total").notNull(),
  status: text("status").notNull().default("pending"),
  items: jsonb("items").notNull(),
  shippingAddress: text("shipping_address"),
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
  totalOrders: integer("total_orders").notNull().default(0),
  totalSpent: real("total_spent").notNull().default(0),
  segment: text("segment").default("new"),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, onboarded: true, plan: true, avatar: true });
export const insertStoreSchema = createInsertSchema(stores).omit({ id: true, userId: true, status: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, storeId: true, aiScore: true, status: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, storeId: true, createdAt: true });
export const insertAiAgentSchema = createInsertSchema(aiAgents).omit({ id: true, storeId: true, performance: true, status: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, storeId: true, totalOrders: true, totalSpent: true, segment: true });

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
