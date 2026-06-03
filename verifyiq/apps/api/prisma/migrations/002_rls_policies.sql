-- 002_rls_policies.sql
-- Row-Level Security — multi-tenant org isolation + audit log append-only

-- ── Enable RLS on all tables ──────────────────────────────────────────────────
ALTER TABLE organizations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys               ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_results   ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_flags            ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs             ENABLE ROW LEVEL SECURITY;

-- ── Org isolation policy ─────────────────────────────────────────────────────
-- NestJS sets: SET LOCAL app.current_org_id = '<org_id>' at start of each request

CREATE POLICY org_isolation ON verification_requests
    USING (org_id = current_setting('app.current_org_id', TRUE)::text);

CREATE POLICY org_isolation ON api_keys
    USING (org_id = current_setting('app.current_org_id', TRUE)::text);

CREATE POLICY org_isolation ON verification_results
    USING (
        request_id IN (
            SELECT id FROM verification_requests
            WHERE org_id = current_setting('app.current_org_id', TRUE)::text
        )
    );

CREATE POLICY org_isolation ON fraud_flags
    USING (
        request_id IN (
            SELECT id FROM verification_requests
            WHERE org_id = current_setting('app.current_org_id', TRUE)::text
        )
    );

CREATE POLICY org_isolation ON audit_logs
    USING (
        request_id IS NULL
        OR request_id IN (
            SELECT id FROM verification_requests
            WHERE org_id = current_setting('app.current_org_id', TRUE)::text
        )
    );

-- ── Audit log: APPEND-ONLY — no UPDATE or DELETE allowed by anyone ────────────
CREATE RULE no_update_audit AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;
CREATE RULE no_delete_audit AS ON DELETE TO audit_logs DO INSTEAD NOTHING;
