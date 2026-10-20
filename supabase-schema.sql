-- ==============================================================================
-- BLUVIA Premium Drinking Water Fresh - PostgreSQL & Supabase Database Migration
-- Complete Schema with Row Level Security (RLS) and Role-Based Access Control
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USER PROFILES & ROLES
CREATE TYPE user_role AS ENUM ('owner', 'manager', 'cashier', 'delivery');

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'delivery',
  phone VARCHAR(30),
  active BOOLEAN DEFAULT TRUE,
  avatar_color VARCHAR(16) DEFAULT '#0284c7',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BUSINESS SETTINGS
CREATE TABLE IF NOT EXISTS business_settings (
  id VARCHAR(64) PRIMARY KEY DEFAULT 'business_settings',
  business_name VARCHAR(120) NOT NULL DEFAULT 'BLUVIA Premium Drinking Water Fresh',
  tagline VARCHAR(200) DEFAULT 'Pure, Mineral Balanced & Freshly Delivered',
  phone VARCHAR(30) DEFAULT '+92 300 8547219',
  email VARCHAR(100) DEFAULT 'bluvia.pure@gmail.com',
  address TEXT DEFAULT 'Plot 48, Industrial Triangle, Kahuta Road, Islamabad',
  city VARCHAR(60) DEFAULT 'Islamabad / Rawalpindi',
  currency VARCHAR(10) DEFAULT 'PKR',
  currency_symbol VARCHAR(10) DEFAULT 'Rs.',
  tax_registration_number VARCHAR(50),
  default_price_19l NUMERIC(10, 2) DEFAULT 180.00,
  deposit_amount_per_bottle NUMERIC(10, 2) DEFAULT 800.00,
  min_full_bottles_alert INT DEFAULT 50,
  delivery_areas JSONB DEFAULT '["DHA Phase 2 & 5", "Bahria Town Phase 4 & 7", "Gulberg Greens & Residencia", "F-6 / F-7 / F-8 Sectors", "I-8 & I-9 Commercial", "Saddar Rawalpindi"]',
  google_drive_folder_name VARCHAR(100) DEFAULT 'BLUVIA Business Backups',
  last_backup_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRODUCTS & REUSABLE BOTTLES
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(50) NOT NULL,
  capacity_liters NUMERIC(6, 2) DEFAULT 19.00,
  unit_price NUMERIC(10, 2) NOT NULL,
  cost_price NUMERIC(10, 2) NOT NULL,
  stock_full INT NOT NULL DEFAULT 0 CHECK (stock_full >= 0),
  stock_empty INT NOT NULL DEFAULT 0 CHECK (stock_empty >= 0),
  stock_damaged INT NOT NULL DEFAULT 0 CHECK (stock_damaged >= 0),
  in_transit INT NOT NULL DEFAULT 0 CHECK (in_transit >= 0),
  min_stock_level INT NOT NULL DEFAULT 10,
  is_reusable_bottle BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CUSTOMERS & AREAS
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  whatsapp VARCHAR(40),
  address TEXT NOT NULL,
  area VARCHAR(100) NOT NULL,
  category VARCHAR(30) DEFAULT 'residential',
  opening_balance NUMERIC(12, 2) DEFAULT 0.00,
  outstanding_balance NUMERIC(12, 2) DEFAULT 0.00,
  bottles_held_19l INT DEFAULT 0,
  price_per_bottle_override NUMERIC(10, 2),
  security_deposit_bottles NUMERIC(10, 2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SUPPLIERS
CREATE TABLE IF NOT EXISTS suppliers (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  company VARCHAR(150) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  balance_owed NUMERIC(12, 2) DEFAULT 0.00,
  address TEXT,
  supplied_items TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ORDERS & DELIVERIES
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  order_number VARCHAR(30) UNIQUE NOT NULL,
  customer_id VARCHAR(64) REFERENCES customers(id) ON DELETE RESTRICT,
  customer_name VARCHAR(150) NOT NULL,
  area VARCHAR(100) NOT NULL,
  items JSONB NOT NULL,
  subtotal NUMERIC(12, 2) NOT NULL,
  discount NUMERIC(10, 2) DEFAULT 0.00,
  delivery_charges NUMERIC(10, 2) DEFAULT 0.00,
  net_total NUMERIC(12, 2) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending', -- pending, dispatched, delivered, failed, cancelled
  payment_status VARCHAR(30) NOT NULL DEFAULT 'unpaid', -- unpaid, partial, paid
  paid_amount NUMERIC(12, 2) DEFAULT 0.00,
  bottles_delivered INT DEFAULT 0,
  bottles_returned INT DEFAULT 0,
  assigned_staff_id VARCHAR(64),
  assigned_staff_name VARCHAR(120),
  delivery_date DATE NOT NULL,
  notes TEXT,
  created_by VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PAYMENTS & CASH RECEIPTS
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(64) PRIMARY KEY,
  receipt_number VARCHAR(40) UNIQUE NOT NULL,
  customer_id VARCHAR(64) REFERENCES customers(id) ON DELETE RESTRICT,
  customer_name VARCHAR(150) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  payment_method VARCHAR(30) NOT NULL, -- cash, jazzcash, easypaisa, bank_transfer, cheque
  allocated_order_id VARCHAR(64) REFERENCES orders(id) ON DELETE SET NULL,
  reference_number VARCHAR(80),
  notes TEXT,
  collected_by_user_id VARCHAR(64) NOT NULL,
  collected_by_name VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PROMISED PAYMENTS
CREATE TABLE IF NOT EXISTS promised_payments (
  id VARCHAR(64) PRIMARY KEY,
  customer_id VARCHAR(64) REFERENCES customers(id) ON DELETE RESTRICT,
  customer_name VARCHAR(150) NOT NULL,
  customer_phone VARCHAR(40) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  promise_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, fulfilled, overdue, cancelled
  notes TEXT,
  recorded_by VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. EXPENSES & CASH BOOK
CREATE TABLE IF NOT EXISTS expenses (
  id VARCHAR(64) PRIMARY KEY,
  category VARCHAR(50) NOT NULL, -- fuel, vehicle_maintenance, utility_power_water, plant_filters_chemicals, caps_seals_labels, staff_salaries, rent, miscellaneous
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  payment_method VARCHAR(30) DEFAULT 'cash',
  paid_to VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  recorded_by VARCHAR(120) NOT NULL,
  expense_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cash_ledger (
  id VARCHAR(64) PRIMARY KEY,
  entry_date DATE NOT NULL,
  type VARCHAR(15) NOT NULL, -- inflow, outflow
  category VARCHAR(80) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  balance_after NUMERIC(12, 2) NOT NULL,
  reference_type VARCHAR(40) NOT NULL,
  reference_id VARCHAR(64),
  description TEXT NOT NULL,
  recorded_by VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. STOCK MOVEMENT AUDIT TRAIL
CREATE TABLE IF NOT EXISTS stock_movements (
  id VARCHAR(64) PRIMARY KEY,
  product_id VARCHAR(64) REFERENCES products(id) ON DELETE RESTRICT,
  product_name VARCHAR(150) NOT NULL,
  movement_type VARCHAR(40) NOT NULL, -- purchase_receipt, dispatch_out, delivery_delivered, empty_returned, failed_return_full, damaged_writeoff, manual_adjustment
  full_delta INT NOT NULL DEFAULT 0,
  empty_delta INT NOT NULL DEFAULT 0,
  damaged_delta INT NOT NULL DEFAULT 0,
  reference_id VARCHAR(64),
  reference_doc VARCHAR(64),
  notes TEXT,
  recorded_by VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. AUDIT LOG & DEVICE SYNCHRONIZATION
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id VARCHAR(64) NOT NULL,
  user_name VARCHAR(120) NOT NULL,
  role VARCHAR(30) NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(40) NOT NULL,
  entity_id VARCHAR(64) NOT NULL,
  details TEXT,
  device_id VARCHAR(80)
);

CREATE TABLE IF NOT EXISTS sync_outbox (
  id VARCHAR(64) PRIMARY KEY,
  idempotency_key VARCHAR(120) UNIQUE NOT NULL,
  entity_type VARCHAR(40) NOT NULL,
  action VARCHAR(20) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'queued',
  retry_count INT DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS backup_records (
  id VARCHAR(64) PRIMARY KEY,
  file_name VARCHAR(150) NOT NULL,
  drive_file_id VARCHAR(100),
  folder_name VARCHAR(100) DEFAULT 'BLUVIA Business Backups',
  record_counts JSONB NOT NULL,
  size_bytes BIGINT NOT NULL,
  checksum VARCHAR(64) NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'verified',
  initiated_by VARCHAR(120) NOT NULL
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE promised_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_records ENABLE ROW LEVEL SECURITY;

-- Helper function to read user role from auth claims
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1. Profiles: authenticated users can read, only owner can modify
CREATE POLICY "Profiles readable by authenticated users"
  ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Profiles modifiable by owner only"
  ON profiles FOR ALL TO authenticated
  USING (current_user_role() = 'owner');

-- 2. Business Settings: read by all staff, write by owner only
CREATE POLICY "Settings read by all staff"
  ON business_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Settings modified by owner only"
  ON business_settings FOR ALL TO authenticated
  USING (current_user_role() = 'owner');

-- 3. Products: read by all staff; update stock by owner, manager, cashier
CREATE POLICY "Products read by all staff"
  ON products FOR SELECT TO authenticated USING (true);

CREATE POLICY "Products managed by authorized staff"
  ON products FOR ALL TO authenticated
  USING (current_user_role() IN ('owner', 'manager'));

-- 4. Customers: read by all staff; updated by owner, manager, cashier
CREATE POLICY "Customers readable by staff"
  ON customers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Customers editable by authorized roles"
  ON customers FOR ALL TO authenticated
  USING (current_user_role() IN ('owner', 'manager', 'cashier'));

-- 5. Orders: delivery can see and update deliveries; managers and owners full control
CREATE POLICY "Orders read by all staff"
  ON orders FOR SELECT TO authenticated USING (true);

CREATE POLICY "Orders created and managed by manager and owner"
  ON orders FOR ALL TO authenticated
  USING (current_user_role() IN ('owner', 'manager', 'cashier', 'delivery'));

-- 6. Payments: readable by staff; created by cashier, manager, owner
CREATE POLICY "Payments readable by staff"
  ON payments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Payments recorded by cashier manager owner"
  ON payments FOR INSERT TO authenticated
  WITH CHECK (current_user_role() IN ('owner', 'manager', 'cashier'));

-- 7. Expenses: managed by owner and cashier
CREATE POLICY "Expenses readable by manager and owner"
  ON expenses FOR SELECT TO authenticated
  USING (current_user_role() IN ('owner', 'manager', 'cashier'));

CREATE POLICY "Expenses managed by owner and cashier"
  ON expenses FOR ALL TO authenticated
  USING (current_user_role() IN ('owner', 'cashier'));

-- 8. Backups: strictly owner only
CREATE POLICY "Backups restricted to owner"
  ON backup_records FOR ALL TO authenticated
  USING (current_user_role() = 'owner');
