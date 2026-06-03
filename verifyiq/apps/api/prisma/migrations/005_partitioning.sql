-- 005_partitioning.sql
-- Monthly partitions for audit_logs (2 years forward)

-- Create default partition first
CREATE TABLE audit_logs_default PARTITION OF audit_logs DEFAULT;

-- Create monthly partitions for 2026–2027
DO $$
DECLARE
    y INT;
    m INT;
    start_date DATE;
    end_date DATE;
    partition_name TEXT;
BEGIN
    FOR y IN 2026..2027 LOOP
        FOR m IN 1..12 LOOP
            start_date := make_date(y, m, 1);
            end_date   := start_date + INTERVAL '1 month';
            partition_name := format('audit_logs_%s_%s', y, lpad(m::text, 2, '0'));

            EXECUTE format(
                'CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_logs
                 FOR VALUES FROM (%L) TO (%L)',
                partition_name, start_date, end_date
            );
        END LOOP;
    END LOOP;
END $$;
