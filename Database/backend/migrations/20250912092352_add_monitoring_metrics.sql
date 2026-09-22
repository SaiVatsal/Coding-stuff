-- +goose Up
-- +goose StatementBegin

-- Create postgres_monitoring_settings table
CREATE TABLE postgres_monitoring_settings (
    database_id                             UUID PRIMARY KEY,
    is_db_resources_monitoring_enabled      BOOLEAN NOT NULL DEFAULT FALSE,
    monitoring_interval_seconds             BIGINT NOT NULL DEFAULT 60,
    installed_extensions_raw                TEXT
);

-- Add foreign key constraint for postgres_monitoring_settings
ALTER TABLE postgres_monitoring_settings
    ADD CONSTRAINT fk_postgres_monitoring_settings_database_id
    FOREIGN KEY (database_id)
    REFERENCES databases (id)
    ON DELETE CASCADE;

-- Create postgres_monitoring_metrics table
CREATE TABLE postgres_monitoring_metrics (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    database_id UUID NOT NULL,
    metric      TEXT NOT NULL,
    value_type  TEXT NOT NULL,
    value       DOUBLE PRECISION NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL
);

-- Add foreign key constraint for postgres_monitoring_metrics
ALTER TABLE postgres_monitoring_metrics
    ADD CONSTRAINT fk_postgres_monitoring_metrics_database_id
    FOREIGN KEY (database_id)
    REFERENCES databases (id)
    ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX idx_postgres_monitoring_metrics_database_id
    ON postgres_monitoring_metrics (database_id);

CREATE INDEX idx_postgres_monitoring_metrics_created_at
    ON postgres_monitoring_metrics (created_at);

CREATE INDEX idx_postgres_monitoring_metrics_database_metric_created_at
    ON postgres_monitoring_metrics (database_id, metric, created_at);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

-- Drop indexes first
DROP INDEX IF EXISTS idx_postgres_monitoring_metrics_database_metric_created_at;
DROP INDEX IF EXISTS idx_postgres_monitoring_metrics_created_at;
DROP INDEX IF EXISTS idx_postgres_monitoring_metrics_database_id;

-- Drop tables in reverse order
DROP TABLE IF EXISTS postgres_monitoring_metrics;
DROP TABLE IF EXISTS postgres_monitoring_settings;

-- +goose StatementEnd
