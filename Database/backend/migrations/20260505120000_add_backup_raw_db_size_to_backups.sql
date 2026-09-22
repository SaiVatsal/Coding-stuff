-- +goose Up
ALTER TABLE backups
    ADD COLUMN backup_raw_db_size_mb DOUBLE PRECISION NOT NULL DEFAULT 0;

-- +goose Down
ALTER TABLE backups
    DROP COLUMN backup_raw_db_size_mb;
