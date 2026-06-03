-- 004_audit_triggers.sql
-- updated_at auto-maintenance + audit log validation trigger

-- Auto-update updated_at on organizations
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Validate audit log events before insert
CREATE OR REPLACE FUNCTION validate_audit_event()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.event NOT IN ('SUBMITTED','PROCESSING','COMPLETED','ACCESSED','DELETED') THEN
        RAISE EXCEPTION 'Invalid audit event: %', NEW.event;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_event_check
    BEFORE INSERT ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION validate_audit_event();

-- Auto-resolve: when status set to APPROVED/REJECTED/MANUAL_REVIEW, set resolved_at
CREATE OR REPLACE FUNCTION auto_set_resolved_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('APPROVED','REJECTED','MANUAL_REVIEW') AND OLD.status = 'PROCESSING' THEN
        NEW.resolved_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vr_auto_resolve
    BEFORE UPDATE ON verification_requests
    FOR EACH ROW EXECUTE FUNCTION auto_set_resolved_at();
