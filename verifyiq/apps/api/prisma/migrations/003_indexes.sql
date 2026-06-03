-- 003_indexes.sql
-- Performance indexes for all primary query patterns

-- Dashboard: org verifications sorted by date
CREATE INDEX idx_vr_org_date     ON verification_requests (org_id, submitted_at DESC);

-- Status queue: pending jobs
CREATE INDEX idx_vr_status_queue ON verification_requests (status, submitted_at)
    WHERE deleted_at IS NULL;

-- Audit trail: per-request sorted
CREATE INDEX idx_audit_request   ON audit_logs (request_id, created_at DESC);

-- Fraud investigation
CREATE INDEX idx_flags_request   ON fraud_flags (request_id, severity);

-- JSONB full-text search on extracted fields
CREATE INDEX idx_results_jsonb   ON verification_results USING GIN (extracted_json);
CREATE INDEX idx_results_checks  ON verification_results USING GIN (checks_json);

-- API key lookup
CREATE INDEX idx_keys_hashed     ON api_keys (hashed_key)
    WHERE revoked_at IS NULL;

-- ML model versions: current production
CREATE INDEX idx_mlv_production  ON ml_model_versions (name, is_production)
    WHERE is_production = TRUE;
