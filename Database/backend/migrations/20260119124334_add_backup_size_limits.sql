-- +goose Up
-- +goose StatementBegin

ALTER TABLE backup_configs
    ADD COLUMN max_backup_size_mb        BIGINT  NOT NULL DEFAULT 0,
    ADD COLUMN max_backups_total_size_mb BIGINT  NOT NULL DEFAULT 0;

ALTER TABLE backups
    ADD COLUMN is_skip_retry             BOOLEAN NOT NULL DEFAULT FALSE;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

ALTER TABLE backup_configs
    DROP COLUMN IF EXISTS max_backups_total_size_mb,
    DROP COLUMN IF EXISTS max_backup_size_mb;

ALTER TABLE backups
    DROP COLUMN IF EXISTS is_skip_retry;

-- +goose StatementEnd
