-- +goose Up
-- +goose StatementBegin
ALTER TABLE databases
    ADD COLUMN agent_token              TEXT,
    ADD COLUMN is_agent_token_generated BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX idx_databases_agent_token ON databases (agent_token) WHERE agent_token IS NOT NULL;

ALTER TABLE postgresql_databases
    ADD COLUMN backup_type TEXT NOT NULL DEFAULT 'PG_DUMP';

ALTER TABLE postgresql_databases
    ALTER COLUMN host     DROP NOT NULL,
    ALTER COLUMN port     DROP NOT NULL,
    ALTER COLUMN username DROP NOT NULL,
    ALTER COLUMN password DROP NOT NULL;

ALTER TABLE backups
    ADD COLUMN pg_wal_backup_type   TEXT,
    ADD COLUMN pg_wal_start_segment TEXT,
    ADD COLUMN pg_wal_stop_segment  TEXT,
    ADD COLUMN pg_version           TEXT,
    ADD COLUMN pg_wal_segment_name  TEXT;

CREATE INDEX idx_backups_pg_wal_segment_name
    ON backups (database_id, pg_wal_segment_name)
    WHERE pg_wal_segment_name IS NOT NULL;

CREATE INDEX idx_backups_pg_wal_backup_type_created
    ON backups (database_id, pg_wal_backup_type, created_at DESC)
    WHERE pg_wal_backup_type IS NOT NULL;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS idx_backups_pg_wal_segment_name;
DROP INDEX IF EXISTS idx_backups_pg_wal_backup_type_created;

ALTER TABLE backups
    DROP COLUMN pg_wal_backup_type,
    DROP COLUMN pg_wal_start_segment,
    DROP COLUMN pg_wal_stop_segment,
    DROP COLUMN pg_version,
    DROP COLUMN pg_wal_segment_name;

UPDATE postgresql_databases
SET host = 'localhost' WHERE host IS NULL OR host = '';

UPDATE postgresql_databases
SET port = 5432 WHERE port IS NULL OR port = 0;

UPDATE postgresql_databases
SET username = 'postgres' WHERE username IS NULL OR username = '';

UPDATE postgresql_databases
SET password = 'stubpassword' WHERE password IS NULL OR password = '';

ALTER TABLE postgresql_databases
    DROP COLUMN backup_type;

ALTER TABLE postgresql_databases
    ALTER COLUMN host     SET NOT NULL,
    ALTER COLUMN port     SET NOT NULL,
    ALTER COLUMN username SET NOT NULL,
    ALTER COLUMN password SET NOT NULL;

DROP INDEX IF EXISTS idx_databases_agent_token;

ALTER TABLE databases
    DROP COLUMN agent_token,
    DROP COLUMN is_agent_token_generated;
-- +goose StatementEnd
