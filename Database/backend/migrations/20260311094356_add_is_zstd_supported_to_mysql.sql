-- +goose Up
-- +goose StatementBegin
ALTER TABLE mysql_databases
    ADD COLUMN is_zstd_supported BOOLEAN NOT NULL DEFAULT TRUE;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE mysql_databases
    DROP COLUMN is_zstd_supported;
-- +goose StatementEnd
