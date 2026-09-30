-- TerraMind-X: PostgreSQL schema for historical AGMARKNET/CEDA market data
-- Target: Maharashtra + Tamil Nadu, 2007-01-01 through 2026-12-31
-- PostgreSQL 14+ recommended.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS market_states (
    state_id INTEGER PRIMARY KEY,
    state_name TEXT NOT NULL UNIQUE,
    census_code INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS commodities (
    commodity_id INTEGER PRIMARY KEY,
    commodity_name TEXT NOT NULL,
    category TEXT,
    raw_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS market_prices (
    id BIGSERIAL PRIMARY KEY,
    state_id INTEGER NOT NULL REFERENCES market_states(state_id),
    state_name TEXT NOT NULL,
    district_id INTEGER NOT NULL DEFAULT 0,
    district_name TEXT NOT NULL DEFAULT '',
    market_id INTEGER NOT NULL DEFAULT 0,
    market_name TEXT NOT NULL DEFAULT '',
    commodity_id INTEGER NOT NULL REFERENCES commodities(commodity_id),
    commodity_name TEXT NOT NULL,
    variety_name TEXT NOT NULL DEFAULT '',
    grade_name TEXT NOT NULL DEFAULT '',
    observed_date DATE NOT NULL,
    min_price NUMERIC(14,2),
    max_price NUMERIC(14,2),
    modal_price NUMERIC(14,2),
    price_unit TEXT,
    source TEXT NOT NULL DEFAULT 'CEDA-Agmarknet',
    source_url TEXT NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    raw_json JSONB,
    UNIQUE (
        state_id, district_id, district_name, market_id, market_name,
        commodity_id, commodity_name, variety_name, grade_name, observed_date
    ),
    CHECK (
        min_price IS NULL OR min_price >= 0
    ),
    CHECK (
        max_price IS NULL OR max_price >= 0
    ),
    CHECK (
        modal_price IS NULL OR modal_price >= 0
    )
);

CREATE TABLE IF NOT EXISTS market_arrivals (
    id BIGSERIAL PRIMARY KEY,
    state_id INTEGER NOT NULL REFERENCES market_states(state_id),
    state_name TEXT NOT NULL,
    district_id INTEGER NOT NULL DEFAULT 0,
    district_name TEXT NOT NULL DEFAULT '',
    market_id INTEGER NOT NULL DEFAULT 0,
    market_name TEXT NOT NULL DEFAULT '',
    commodity_id INTEGER NOT NULL REFERENCES commodities(commodity_id),
    commodity_name TEXT NOT NULL,
    variety_name TEXT NOT NULL DEFAULT '',
    grade_name TEXT NOT NULL DEFAULT '',
    observed_date DATE NOT NULL,
    arrival_qty NUMERIC(18,4),
    arrival_unit TEXT,
    source TEXT NOT NULL DEFAULT 'CEDA-Agmarknet',
    source_url TEXT NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    raw_json JSONB,
    UNIQUE (
        state_id, district_id, district_name, market_id, market_name,
        commodity_id, commodity_name, variety_name, grade_name, observed_date
    ),
    CHECK (
        arrival_qty IS NULL OR arrival_qty >= 0
    )
);

CREATE TABLE IF NOT EXISTS ingestion_checkpoints (
    source TEXT NOT NULL,
    state_id INTEGER NOT NULL,
    commodity_id INTEGER NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    price_status TEXT NOT NULL DEFAULT 'pending',
    arrival_status TEXT NOT NULL DEFAULT 'pending',
    attempts INTEGER NOT NULL DEFAULT 0,
    last_http_status INTEGER,
    last_error TEXT,
    rows_price INTEGER NOT NULL DEFAULT 0,
    rows_arrival INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (source, state_id, commodity_id, period_start)
);

CREATE TABLE IF NOT EXISTS ingestion_runs (
    run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    states JSONB NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'running',
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_market_prices_lookup
ON market_prices (state_id, commodity_id, observed_date);

CREATE INDEX IF NOT EXISTS idx_market_prices_market_date
ON market_prices (market_id, commodity_id, observed_date);

CREATE INDEX IF NOT EXISTS idx_market_arrivals_lookup
ON market_arrivals (state_id, commodity_id, observed_date);

CREATE INDEX IF NOT EXISTS idx_market_arrivals_market_date
ON market_arrivals (market_id, commodity_id, observed_date);

CREATE INDEX IF NOT EXISTS idx_checkpoint_pending
ON ingestion_checkpoints (price_status, arrival_status, period_start);

COMMENT ON TABLE market_prices IS
'Daily wholesale price observations from CEDA/Agricultural Marketing data.';
COMMENT ON TABLE market_arrivals IS
'Daily agricultural market arrival quantities from CEDA/Agricultural Marketing data.';
COMMENT ON TABLE ingestion_checkpoints IS
'Month-level resumability ledger. A completed month is never downloaded again unless forced.';
