-- 001_initial_schema.sql
-- VerifyIQ — Initial PostgreSQL 16 Schema
-- Run via: psql $DATABASE_URL -f 001_initial_schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- organizations
CREATE TABLE organizations (
    id          TEXT PRIMARY KEY DEFAULT ('org_' || gen_random_uuid()::text),
    name        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- api_keys (hashed — raw key never stored)
CREATE TABLE api_keys (
    id          TEXT PRIMARY KEY DEFAULT ('key_' || gen_random_uuid()::text),
    hashed_key  TEXT NOT NULL UNIQUE,
    org_id      TEXT NOT NULL REFERENCES organizations(id),
    rate_limit  INT NOT NULL DEFAULT 100,
    revoked_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name        TEXT
);

-- verification_requests
CREATE TABLE verification_requests (
    id              TEXT PRIMARY KEY DEFAULT ('req_' || gen_random_uuid()::text),
    org_id          TEXT NOT NULL REFERENCES organizations(id),
    document_type   TEXT NOT NULL CHECK (document_type IN (
                        'CREDIT_CARD','PASSPORT','AADHAAR','VOTER_ID','DRIVING_LICENCE'
                    )),
    status          TEXT NOT NULL DEFAULT 'PROCESSING' CHECK (status IN (
                        'PROCESSING','APPROVED','REJECTED','MANUAL_REVIEW'
                    )),
    risk_score      FLOAT,
    verdict         TEXT CHECK (verdict IN ('APPROVED','REJECTED','MANUAL_REVIEW')),
    image_path      TEXT,
    image_deleted_at TIMESTAMPTZ,
    submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ,
    deleted_at      TIMESTAMPTZ  -- soft delete
);

-- verification_results
CREATE TABLE verification_results (
    id                TEXT PRIMARY KEY DEFAULT ('res_' || gen_random_uuid()::text),
    request_id        TEXT NOT NULL UNIQUE REFERENCES verification_requests(id),
    checks_json       JSONB NOT NULL,
    reasoning_json    JSONB NOT NULL,
    -- PII fields encrypted at rest in production via pgp_sym_encrypt
    extracted_json    JSONB NOT NULL,
    model_version     TEXT NOT NULL,
    processing_time_ms INT NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- fraud_flags
CREATE TABLE fraud_flags (
    id          TEXT PRIMARY KEY DEFAULT ('flag_' || gen_random_uuid()::text),
    request_id  TEXT NOT NULL REFERENCES verification_requests(id),
    flag_type   TEXT NOT NULL,
    severity    TEXT NOT NULL CHECK (severity IN ('HIGH','MEDIUM','LOW')),
    confidence  FLOAT NOT NULL,
    description TEXT NOT NULL,
    evidence    TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- audit_logs (APPEND-ONLY — enforced by RLS rules in 002)
CREATE TABLE audit_logs (
    id          TEXT PRIMARY KEY DEFAULT ('aud_' || gen_random_uuid()::text),
    request_id  TEXT REFERENCES verification_requests(id),
    event       TEXT NOT NULL CHECK (event IN (
                    'SUBMITTED','PROCESSING','COMPLETED','ACCESSED','DELETED'
                )),
    actor       TEXT NOT NULL,
    ip_address  TEXT NOT NULL,
    metadata    JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- ml_model_versions
CREATE TABLE ml_model_versions (
    id             TEXT PRIMARY KEY DEFAULT ('mlv_' || gen_random_uuid()::text),
    name           TEXT NOT NULL,
    version        TEXT NOT NULL,
    checksum       TEXT NOT NULL,
    accuracy       FLOAT,
    auc_score      FLOAT,
    is_production  BOOLEAN NOT NULL DEFAULT FALSE,
    deployed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_at    TIMESTAMPTZ,
    UNIQUE (name, version)
);

-- updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
