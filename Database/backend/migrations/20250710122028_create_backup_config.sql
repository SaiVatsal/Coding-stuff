-- +goose Up
-- +goose StatementBegin

-- Create backup_configs table
CREATE TABLE backup_configs (
    database_id             UUID PRIMARY KEY,
    is_backups_enabled      BOOLEAN NOT NULL DEFAULT FALSE,
    store_period            TEXT NOT NULL,
    backup_interval_id      UUID NOT NULL,
    storage_id              UUID,
    send_notifications_on   TEXT NOT NULL,
    cpu_count               INT NOT NULL DEFAULT 1
);

-- Add foreign key constraint
ALTER TABLE backup_configs
    ADD CONSTRAINT fk_backup_config_database_id
    FOREIGN KEY (database_id)
    REFERENCES databases (id)
    ON DELETE CASCADE;

ALTER TABLE backup_configs
    ADD CONSTRAINT fk_backup_config_backup_interval_id
    FOREIGN KEY (backup_interval_id)
    REFERENCES intervals (id);

ALTER TABLE backup_configs
    ADD CONSTRAINT fk_backup_config_storage_id
    FOREIGN KEY (storage_id)
    REFERENCES storages (id);

-- Migrate data from databases table to backup_configs table
INSERT INTO backup_configs (
    database_id,
    is_backups_enabled,
    store_period,
    backup_interval_id,
    storage_id,
    send_notifications_on,
    cpu_count
)
SELECT 
    d.id,
    TRUE,
    d.store_period,
    d.backup_interval_id,
    d.storage_id,
    d.send_notifications_on,
    COALESCE(p.cpu_count, 1)
FROM databases d
LEFT JOIN postgresql_databases p ON d.id = p.database_id;

-- Remove backup-related columns from databases table
ALTER TABLE databases DROP COLUMN store_period;
ALTER TABLE databases DROP COLUMN backup_interval_id;
ALTER TABLE databases DROP COLUMN storage_id;
ALTER TABLE databases DROP COLUMN send_notifications_on;

-- Remove cpu_count column from postgresql_databases table
ALTER TABLE postgresql_databases DROP COLUMN cpu_count;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

-- Re-add backup-related columns to databases table
ALTER TABLE databases ADD COLUMN store_period TEXT;
ALTER TABLE databases ADD COLUMN backup_interval_id UUID;
ALTER TABLE databases ADD COLUMN storage_id UUID;
ALTER TABLE databases ADD COLUMN send_notifications_on TEXT;

-- Re-add cpu_count column to postgresql_databases table
ALTER TABLE postgresql_databases ADD COLUMN cpu_count INT NOT NULL DEFAULT 1;

-- Migrate data back from backup_configs to databases and postgresql_databases tables
UPDATE databases d
SET 
    store_period = bc.store_period,
    backup_interval_id = bc.backup_interval_id,
    storage_id = bc.storage_id,
    send_notifications_on = bc.send_notifications_on
FROM backup_configs bc
WHERE d.id = bc.database_id;

UPDATE postgresql_databases p
SET cpu_count = bc.cpu_count
FROM backup_configs bc
WHERE p.database_id = bc.database_id;

-- Drop backup_configs table
DROP TABLE backup_configs;

-- +goose StatementEnd
