-- +goose Up
-- +goose StatementBegin
ALTER TABLE backup_configs
    ADD COLUMN is_retry_if_failed      BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN max_failed_tries_count  INT     NOT NULL DEFAULT 0;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE backup_configs
    DROP COLUMN is_retry_if_failed,
    DROP COLUMN max_failed_tries_count;
-- +goose StatementEnd
