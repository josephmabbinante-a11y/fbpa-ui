-- Opscale Multi-Tenant Schema
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'TENANT_ADMIN', 'OPS', 'CARRIER')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT non_super_admin_has_tenant CHECK (
    role = 'SUPER_ADMIN' OR tenant_id IS NOT NULL
  )
);

CREATE TABLE IF NOT EXISTS tenant_settings (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  loadboard_enabled BOOLEAN NOT NULL DEFAULT true,
  bidding_enabled BOOLEAN NOT NULL DEFAULT true,
  bid_expiration_hours INT NOT NULL DEFAULT 24,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  sms_notifications BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  feature_name VARCHAR(100) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(tenant_id, feature_name)
);

CREATE TABLE IF NOT EXISTS carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  mc_number VARCHAR(50),
  insurance_status VARCHAR(50) DEFAULT 'unknown',
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  reference_number VARCHAR(100),
  origin VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  equipment_type VARCHAR(100),
  pickup_date DATE,
  delivery_date DATE,
  target_rate NUMERIC(10,2),
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'awarded', 'covered')),
  bidding_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS load_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  carrier_id UUID NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
  bid_amount NUMERIC(10,2) NOT NULL,
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES users(id),
  tenant_id UUID REFERENCES tenants(id),
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(100),
  entity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loads_tenant_id ON loads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_load_bids_load_id ON load_bids(load_id);
CREATE INDEX IF NOT EXISTS idx_load_bids_tenant_id ON load_bids(tenant_id);
CREATE INDEX IF NOT EXISTS idx_carriers_tenant_id ON carriers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_features_tenant_id ON tenant_features(tenant_id);
CREATE INDEX IF NOT EXISTS idx_admin_log_admin_user ON admin_activity_log(admin_user_id);
