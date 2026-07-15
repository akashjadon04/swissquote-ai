-- ══════════════════════════════════════════════════════════════════
-- SwissQuote AI — Supabase Database Schema
-- Run this in Supabase SQL Editor → Run
-- All tables prefixed with sq_
-- ══════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────
-- 1. sq_clients
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sq_clients (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  address       TEXT,
  postal        TEXT,
  city          TEXT,
  contact_person TEXT,
  phone         TEXT,
  email         TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 2. sq_suppliers
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sq_suppliers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code          TEXT NOT NULL UNIQUE,   -- NSB, ST, GM
  name          TEXT NOT NULL,
  contact_email TEXT,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed suppliers
INSERT INTO sq_suppliers (code, name) VALUES
  ('NSB', 'Nussbaum'),
  ('ST',  'Sanitas Troesch'),
  ('GM',  'Getaz Miauton')
ON CONFLICT (code) DO NOTHING;

-- ─────────────────────────────────────────
-- 3. sq_catalogue_articles
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sq_catalogue_articles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id   UUID NOT NULL REFERENCES sq_suppliers(id) ON DELETE CASCADE,
  reference     TEXT NOT NULL,
  description   TEXT NOT NULL,
  specification TEXT,                  -- Ø54, DN28, G3/4, etc.
  category      TEXT,                  -- tubes, robinetterie, raccords, isolation, etc.
  unit          TEXT NOT NULL DEFAULT 'p',
  unit_price    NUMERIC(10, 2) NOT NULL DEFAULT 0,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (supplier_id, reference)
);

CREATE INDEX IF NOT EXISTS idx_catalogue_supplier ON sq_catalogue_articles(supplier_id);
CREATE INDEX IF NOT EXISTS idx_catalogue_category  ON sq_catalogue_articles(category);
CREATE INDEX IF NOT EXISTS idx_catalogue_spec       ON sq_catalogue_articles(specification);

-- ─────────────────────────────────────────
-- 4. sq_users (technicians + admin)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sq_users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'technician', -- technician | admin
  auth_user_id  UUID,                               -- links to Supabase Auth
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default technician (Alec Landenberg)
INSERT INTO sq_users (email, full_name, role) VALUES
  ('alec@jjpallud.ch', 'Alec Landenberg', 'technician')
ON CONFLICT (email) DO NOTHING;

-- ─────────────────────────────────────────
-- 5. sq_configurations
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sq_configurations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key           TEXT NOT NULL UNIQUE,
  value         JSONB NOT NULL,
  description   TEXT,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default configuration values
INSERT INTO sq_configurations (key, value, description) VALUES
  ('quote_counter',        '"21648"',                  'Sequential quote number counter'),
  ('default_margin_pct',   '15',                       'Default materials margin %'),
  ('default_vat_rate',     '0.081',                    'Swiss TVA rate'),
  ('default_travel_fee',   '45',                       'Default travel fee CHF'),
  ('default_canton',       '"Genève"',                 'Default canton'),
  ('preferred_supplier',   '"NSB"',                    'Default preferred supplier code'),
  ('gemini_daily_requests','1500',                     'Max Gemini API calls per day'),
  ('company_info', '{
    "name": "J.J. Pallud SA",
    "address": "Route de Frontenex 62",
    "postal": "1207",
    "city": "Genève",
    "phone": "+41 22 700 00 00",
    "email": "info@jjpallud.ch",
    "tva_number": "CHE-123.456.789 TVA"
  }', 'Company details used in PDF headers'),
  ('labour_rates', '{
    "Genève": 145,
    "Vaud": 138,
    "Valais": 125,
    "Fribourg": 130,
    "Neuchâtel": 133,
    "Jura": 128,
    "Berne": 135,
    "Zürich": 148,
    "Bâle": 142,
    "Lucerne": 136
  }', 'Labour rate CHF/h by canton')
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────
-- 6. sq_quotes
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sq_quotes (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_number          TEXT NOT NULL UNIQUE,
  status                TEXT NOT NULL DEFAULT 'draft',
  -- References
  created_by            UUID REFERENCES sq_users(id),
  client_id             UUID REFERENCES sq_clients(id),
  -- Client info (denormalized for PDF independence)
  client_name           TEXT,
  client_address        TEXT,
  client_postal         TEXT,
  client_city           TEXT,
  client_contact        TEXT,
  -- Project
  building_address      TEXT,
  apartment_zone        TEXT,
  subject_line          TEXT,
  -- AI fields
  original_description  TEXT,
  ai_extraction         JSONB,
  ai_provider           TEXT,
  intervention_type     TEXT,
  technical_summary     TEXT,
  ai_confidence         NUMERIC(4,3),
  -- Config
  preferred_supplier    TEXT DEFAULT 'NSB',
  canton                TEXT DEFAULT 'Genève',
  -- Financials
  materials_subtotal    NUMERIC(12,2),
  materials_margin_pct  NUMERIC(5,2) DEFAULT 15,
  materials_margin      NUMERIC(12,2),
  labour_hours          NUMERIC(8,2),
  labour_rate           NUMERIC(8,2) DEFAULT 145,
  labour_total          NUMERIC(12,2),
  travel_fee            NUMERIC(8,2) DEFAULT 45,
  subtotal_excl_vat     NUMERIC(12,2),
  vat_rate              NUMERIC(5,4) DEFAULT 0.081,
  vat_amount            NUMERIC(12,2),
  total_incl_vat        NUMERIC(12,2),
  -- Flags
  has_missing_items     BOOLEAN NOT NULL DEFAULT FALSE,
  exclusions            JSONB DEFAULT '[]',
  -- Company info snapshot
  company_name          TEXT,
  company_address       TEXT,
  technician_name       TEXT,
  -- Version
  version               INTEGER NOT NULL DEFAULT 1,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotes_status     ON sq_quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_client_id  ON sq_quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON sq_quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_number     ON sq_quotes(quote_number);

-- ─────────────────────────────────────────
-- 7. sq_quote_sections
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sq_quote_sections (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id      UUID NOT NULL REFERENCES sq_quotes(id) ON DELETE CASCADE,
  section_code  TEXT,
  section_label TEXT,
  description   TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sections_quote ON sq_quote_sections(quote_id);

-- ─────────────────────────────────────────
-- 8. sq_quote_items
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sq_quote_items (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id             UUID NOT NULL REFERENCES sq_quotes(id) ON DELETE CASCADE,
  section_id           UUID REFERENCES sq_quote_sections(id) ON DELETE CASCADE,
  catalogue_article_id UUID REFERENCES sq_catalogue_articles(id),
  supplier_id          UUID REFERENCES sq_suppliers(id),
  reference            TEXT,
  description          TEXT NOT NULL,
  specification        TEXT,
  quantity             NUMERIC(10,3) NOT NULL DEFAULT 1,
  unit                 TEXT NOT NULL DEFAULT 'p',
  unit_price           NUMERIC(10,2),
  line_total           NUMERIC(12,2),
  ai_label             TEXT,
  ai_confidence        NUMERIC(4,3),
  is_missing           BOOLEAN NOT NULL DEFAULT FALSE,
  is_manually_added    BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order           INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_quote   ON sq_quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_items_section ON sq_quote_items(section_id);
CREATE INDEX IF NOT EXISTS idx_items_missing ON sq_quote_items(is_missing);

-- ─────────────────────────────────────────
-- 9. sq_audit_logs
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sq_audit_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type  TEXT NOT NULL,  -- quote | config | client | catalogue
  entity_id    UUID,
  action       TEXT NOT NULL,  -- create | update | delete | duplicate | pdf_generated
  actor_id     UUID REFERENCES sq_users(id),
  diff         JSONB,
  meta         JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON sq_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_time   ON sq_audit_logs(created_at DESC);

-- ─────────────────────────────────────────
-- 10. Trigger: auto-update updated_at
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['sq_clients', 'sq_catalogue_articles', 'sq_quotes']
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%s_updated_at ON %s;
       CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON %s
       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      tbl, tbl, tbl, tbl
    );
  END LOOP;
END;
$$;

-- ─────────────────────────────────────────
-- Done! All tables created.
-- ─────────────────────────────────────────
SELECT 'SwissQuote AI schema installed successfully' AS status;
