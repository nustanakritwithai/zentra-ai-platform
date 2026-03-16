-- ============================================================
-- ZENTRA AI Platform — Payment Architecture v1
-- Supabase/PostgreSQL Migration
-- ============================================================

-- 1. Platform Subscriptions (B2B)
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  provider TEXT NOT NULL DEFAULT 'stripe',
  provider_subscription_id TEXT,
  provider_customer_id TEXT,
  current_period_start TEXT,
  current_period_end TEXT,
  cancel_at_period_end BOOLEAN DEFAULT false,
  trial_end TEXT,
  created_at TEXT DEFAULT now()::TEXT,
  updated_at TEXT DEFAULT now()::TEXT
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- 2. Billing Invoices
CREATE TABLE IF NOT EXISTS billing_invoices (
  id SERIAL PRIMARY KEY,
  subscription_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'THB',
  status TEXT NOT NULL DEFAULT 'pending',
  provider_invoice_id TEXT,
  paid_at TEXT,
  period_start TEXT,
  period_end TEXT,
  created_at TEXT DEFAULT now()::TEXT
);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_user_id ON billing_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_subscription_id ON billing_invoices(subscription_id);

-- 3. Merchant Payment Accounts (B2C)
CREATE TABLE IF NOT EXISTS merchant_payment_accounts (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL,
  provider TEXT NOT NULL DEFAULT 'opn',
  opn_public_key TEXT,
  opn_secret_key_hash TEXT,
  promptpay_enabled BOOLEAN DEFAULT false,
  promptpay_id TEXT,
  truemoney_enabled BOOLEAN DEFAULT false,
  bank_transfer_enabled BOOLEAN DEFAULT false,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_account_name TEXT,
  webhook_endpoint TEXT,
  webhook_secret TEXT,
  active BOOLEAN DEFAULT true,
  created_at TEXT DEFAULT now()::TEXT,
  updated_at TEXT DEFAULT now()::TEXT
);

CREATE INDEX IF NOT EXISTS idx_merchant_payment_accounts_store_id ON merchant_payment_accounts(store_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_merchant_payment_accounts_store_active ON merchant_payment_accounts(store_id) WHERE active = true;

-- 4. Payment Transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL,
  order_id INTEGER,
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'THB',
  method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  provider_charge_id TEXT,
  provider_ref TEXT,
  qr_code_url TEXT,
  expires_at TEXT,
  paid_at TEXT,
  failure_code TEXT,
  failure_message TEXT,
  metadata JSONB,
  created_at TEXT DEFAULT now()::TEXT
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_store_id ON payment_transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider_charge ON payment_transactions(provider_charge_id);

-- 5. Payment Webhooks Log
CREATE TABLE IF NOT EXISTS payment_webhooks (
  id SERIAL PRIMARY KEY,
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_id TEXT,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TEXT,
  error TEXT,
  created_at TEXT DEFAULT now()::TEXT
);

CREATE INDEX IF NOT EXISTS idx_payment_webhooks_provider ON payment_webhooks(provider);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_event_id ON payment_webhooks(event_id);

-- 6. Platform Payouts
CREATE TABLE IF NOT EXISTS platform_payouts (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'THB',
  status TEXT NOT NULL DEFAULT 'pending',
  method TEXT NOT NULL,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_account_name TEXT,
  provider_payout_id TEXT,
  period_start TEXT,
  period_end TEXT,
  transaction_count INTEGER,
  platform_fee REAL,
  net_amount REAL,
  completed_at TEXT,
  created_at TEXT DEFAULT now()::TEXT
);

CREATE INDEX IF NOT EXISTS idx_platform_payouts_store_id ON platform_payouts(store_id);
CREATE INDEX IF NOT EXISTS idx_platform_payouts_status ON platform_payouts(status);

-- 7. Platform Fee Configuration
CREATE TABLE IF NOT EXISTS platform_fees (
  id SERIAL PRIMARY KEY,
  plan TEXT NOT NULL,
  fee_type TEXT NOT NULL,
  fee_value REAL NOT NULL,
  min_fee REAL,
  max_fee REAL,
  active BOOLEAN DEFAULT true,
  created_at TEXT DEFAULT now()::TEXT
);

CREATE INDEX IF NOT EXISTS idx_platform_fees_plan ON platform_fees(plan);

-- Seed default platform fees
INSERT INTO platform_fees (plan, fee_type, fee_value, min_fee, active)
VALUES
  ('free', 'percentage', 3.5, 1, true),
  ('pro', 'percentage', 2.5, 1, true),
  ('enterprise', 'percentage', 1.5, 1, true)
ON CONFLICT DO NOTHING;
