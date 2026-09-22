-- +goose Up
-- +goose StatementBegin

-- Add healthcheck columns to databases table
ALTER TABLE databases 
    ADD COLUMN health_status TEXT DEFAULT 'AVAILABLE';

-- Create healthcheck configs table
CREATE TABLE healthcheck_configs (
    database_id                           UUID PRIMARY KEY,
    is_healthcheck_enabled                BOOLEAN NOT NULL DEFAULT TRUE,
    is_sent_notification_when_unavailable BOOLEAN NOT NULL DEFAULT TRUE,
    interval_minutes                      INT NOT NULL,
    attempts_before_considered_as_down    INT NOT NULL,
    store_attempts_days                   INT NOT NULL
);

ALTER TABLE healthcheck_configs
    ADD CONSTRAINT fk_healthcheck_configs_database_id
    FOREIGN KEY (database_id)
    REFERENCES databases (id)
    ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;

CREATE INDEX idx_healthcheck_configs_database_id ON healthcheck_configs (database_id);

-- Create healthcheck attempts table
CREATE TABLE healthcheck_attempts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    database_id UUID NOT NULL,
    status      TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL
);

ALTER TABLE healthcheck_attempts
    ADD CONSTRAINT fk_healthcheck_attempts_database_id
    FOREIGN KEY (database_id)
    REFERENCES databases (id)
    ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;

CREATE INDEX idx_healthcheck_attempts_database_id_created_at ON healthcheck_attempts (database_id, created_at);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP INDEX IF EXISTS idx_healthcheck_attempts_database_id_created_at;
DROP INDEX IF EXISTS idx_healthcheck_configs_database_id;

DROP TABLE IF EXISTS healthcheck_attempts;
DROP TABLE IF EXISTS healthcheck_configs;

ALTER TABLE databases
    DROP COLUMN health_status;
-- +goose StatementEnd
