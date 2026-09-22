-- +goose Up
-- +goose StatementBegin

CREATE TABLE database_plans ( 
    database_id               UUID PRIMARY KEY,
    max_backup_size_mb        BIGINT NOT NULL,
    max_backups_total_size_mb BIGINT NOT NULL,
    max_storage_period        TEXT NOT NULL
);

ALTER TABLE database_plans
    ADD CONSTRAINT fk_database_plans_database_id
    FOREIGN KEY (database_id)
    REFERENCES databases (id)
    ON DELETE CASCADE;

CREATE INDEX idx_database_plans_database_id ON database_plans (database_id);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP INDEX IF EXISTS idx_database_plans_database_id;

ALTER TABLE database_plans DROP CONSTRAINT IF EXISTS fk_database_plans_database_id;

DROP TABLE IF EXISTS database_plans;

-- +goose StatementEnd
