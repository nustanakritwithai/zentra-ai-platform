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
  storefrontLayout: jsonb("storefront_layout"), // StorefrontLayout JSON
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

// ============= Payment Architecture v1 =============

// Platform subscriptions (B2B - seller plans)
export const subscriptions = pgTable("subscriptions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  plan: text("plan").notNull().default("free"), // free, pro, enterprise
  status: text("status").notNull().default("active"), // active, past_due, canceled, trialing
  provider: text("provider").notNull().default("stripe"), // stripe, opn
  providerSubscriptionId: text("provider_subscription_id"),
  providerCustomerId: text("provider_customer_id"),
  currentPeriodStart: text("current_period_start"),
  currentPeriodEnd: text("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  trialEnd: text("trial_end"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

// Platform billing invoices
export const billingInvoices = pgTable("billing_invoices", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  subscriptionId: integer("subscription_id").notNull(),
  userId: integer("user_id").notNull(),
  amount: real("amount").notNull(), // THB
  currency: text("currency").notNull().default("THB"),
  status: text("status").notNull().default("pending"), // pending, paid, failed, refunded
  providerInvoiceId: text("provider_invoice_id"),
  paidAt: text("paid_at"),
  periodStart: text("period_start"),
  periodEnd: text("period_end"),
  createdAt: text("created_at"),
});

// Merchant payment accounts (B2C - how merchants receive money)
export const merchantPaymentAccounts = pgTable("merchant_payment_accounts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  storeId: integer("store_id").notNull(),
  provider: text("provider").notNull().default("opn"), // opn, manual
  opnPublicKey: text("opn_public_key"),
  opnSecretKeyHash: text("opn_secret_key_hash"), // hashed, never raw
  promptpayEnabled: boolean("promptpay_enabled").default(false),
  promptpayId: text("promptpay_id"), // phone or national ID
  truemoneyEnabled: boolean("truemoney_enabled").default(false),
  bankTransferEnabled: boolean("bank_transfer_enabled").default(false),
  bankName: text("bank_name"),
  bankAccountNumber: text("bank_account_number"),
  bankAccountName: text("bank_account_name"),
  webhookEndpoint: text("webhook_endpoint"),
  webhookSecret: text("webhook_secret"),
  active: boolean("active").default(true),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

// Payment transactions (every customer payment attempt)
export const paymentTransactions = pgTable("payment_transactions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  storeId: integer("store_id").notNull(),
  orderId: integer("order_id"),
  amount: real("amount").notNull(), // THB
  currency: text("currency").notNull().default("THB"),
  method: text("method").notNull(), // promptpay, truemoney, bank_transfer, credit_card
  status: text("status").notNull().default("pending"), // pending, processing, successful, failed, refunded, expired
  providerChargeId: text("provider_charge_id"),
  providerRef: text("provider_ref"),
  qrCodeUrl: text("qr_code_url"),
  expiresAt: text("expires_at"),
  paidAt: text("paid_at"),
  failureCode: text("failure_code"),
  failureMessage: text("failure_message"),
  metadata: jsonb("metadata"), // extra provider data
  createdAt: text("created_at"),
});

// Payment webhooks log (audit trail)
export const paymentWebhooks = pgTable("payment_webhooks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  provider: text("provider").notNull(), // omise, stripe
  eventType: text("event_type").notNull(),
  eventId: text("event_id"),
  payload: jsonb("payload").notNull(),
  processed: boolean("processed").default(false),
  processedAt: text("processed_at"),
  error: text("error"),
  createdAt: text("created_at"),
});

// Platform payouts to merchants
export const platformPayouts = pgTable("platform_payouts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  storeId: integer("store_id").notNull(),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("THB"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  method: text("method").notNull(), // bank_transfer
  bankName: text("bank_name"),
  bankAccountNumber: text("bank_account_number"),
  bankAccountName: text("bank_account_name"),
  providerPayoutId: text("provider_payout_id"),
  periodStart: text("period_start"),
  periodEnd: text("period_end"),
  transactionCount: integer("transaction_count"),
  platformFee: real("platform_fee"),
  netAmount: real("net_amount"),
  completedAt: text("completed_at"),
  createdAt: text("created_at"),
});

// Platform fee configuration
export const platformFees = pgTable("platform_fees", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  plan: text("plan").notNull(), // free, pro, enterprise
  feeType: text("fee_type").notNull(), // percentage, fixed
  feeValue: real("fee_value").notNull(), // e.g. 3.5 for 3.5%, or 15 for ฿15
  minFee: real("min_fee"), // minimum fee per transaction
  maxFee: real("max_fee"), // maximum fee cap
  active: boolean("active").default(true),
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
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBillingInvoiceSchema = createInsertSchema(billingInvoices).omit({ id: true, createdAt: true });
export const insertMerchantPaymentAccountSchema = createInsertSchema(merchantPaymentAccounts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPaymentTransactionSchema = createInsertSchema(paymentTransactions).omit({ id: true, createdAt: true });
export const insertPaymentWebhookSchema = createInsertSchema(paymentWebhooks).omit({ id: true, createdAt: true });
export const insertPlatformPayoutSchema = createInsertSchema(platformPayouts).omit({ id: true, createdAt: true });
export const insertPlatformFeeSchema = createInsertSchema(platformFees).omit({ id: true, createdAt: true });

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
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type BillingInvoice = typeof billingInvoices.$inferSelect;
export type InsertBillingInvoice = z.infer<typeof insertBillingInvoiceSchema>;
export type MerchantPaymentAccount = typeof merchantPaymentAccounts.$inferSelect;
export type InsertMerchantPaymentAccount = z.infer<typeof insertMerchantPaymentAccountSchema>;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type InsertPaymentTransaction = z.infer<typeof insertPaymentTransactionSchema>;
export type PaymentWebhook = typeof paymentWebhooks.$inferSelect;
export type InsertPaymentWebhook = z.infer<typeof insertPaymentWebhookSchema>;
export type PlatformPayout = typeof platformPayouts.$inferSelect;
export type InsertPlatformPayout = z.infer<typeof insertPlatformPayoutSchema>;
export type PlatformFee = typeof platformFees.$inferSelect;
export type InsertPlatformFee = z.infer<typeof insertPlatformFeeSchema>;

// Storefront Layout types
export interface StorefrontSection {
  id: string;
  type: "hero" | "categories" | "productGrid" | "benefitBar" | "footer" | "aiRecommendation" | "navbar" | "storeName" | "aiStatus" | "promoBanner" | "trustReviews" | "featuredCollection";
  visible: boolean;
  props: Record<string, any>;
}

export interface StorefrontLayout {
  templateId: string;
  theme: {
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
    borderRadius: string;
  };
  sections: StorefrontSection[];
}

// Plan limits configuration
export const PLAN_LIMITS: Record<string, {
  maxStores: number;
  label: string;
  labelTh: string;
  priceThb: number;
  features: string[];
}> = {
  free: {
    maxStores: 1,
    label: "Free",
    labelTh: "ฟรี",
    priceThb: 0,
    features: ["1 ร้านค้า", "สินค้าไม่จำกัด", "AI Agent พื้นฐาน", "PromptPay QR", "ค่าธรรมเนียม 3.5%"],
  },
  pro: {
    maxStores: 5,
    label: "Pro",
    labelTh: "โปร",
    priceThb: 990,
    features: ["5 ร้านค้า", "สินค้าไม่จำกัด", "AI Agent ทั้งหมด", "PromptPay + TrueMoney", "ค่าธรรมเนียม 2.5%", "LINE OA Integration", "รายงานขั้นสูง"],
  },
  enterprise: {
    maxStores: 999,
    label: "Enterprise",
    labelTh: "องค์กร",
    priceThb: 2990,
    features: ["ร้านค้าไม่จำกัด", "สินค้าไม่จำกัด", "AI Agent ทั้งหมด + Custom", "ทุกช่องทางชำระเงิน", "ค่าธรรมเนียม 1.5%", "LINE OA + Meta Integration", "รายงาน + API Access", "Priority Support"],
  },
};

export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}
