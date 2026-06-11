-- ============================================
-- Migration 003: Create carbon_entries table
-- ============================================

CREATE TABLE IF NOT EXISTS carbon_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(50) NOT NULL,
  amount FLOAT NOT NULL CHECK (amount > 0),
  unit VARCHAR(20) NOT NULL,
  emissions_kg FLOAT NOT NULL CHECK (emissions_kg >= 0),
  entry_date DATE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Primary query pattern: user's entries by date (dashboard, history)
CREATE INDEX IF NOT EXISTS idx_carbon_entries_user_date
  ON carbon_entries(user_id, entry_date DESC);

-- Category filter queries (breakdown charts)
CREATE INDEX IF NOT EXISTS idx_carbon_entries_user_category
  ON carbon_entries(user_id, category, entry_date DESC);

-- Date range queries for summaries
CREATE INDEX IF NOT EXISTS idx_carbon_entries_date_range
  ON carbon_entries(entry_date, user_id);
