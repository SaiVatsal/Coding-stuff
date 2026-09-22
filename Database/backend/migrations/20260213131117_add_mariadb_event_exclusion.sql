-- +goose Up
-- +goose StatementBegin
ALTER TABLE mariadb_databases
    ADD COLUMN IF NOT EXISTS is_exclude_events BOOLEAN NOT NULL DEFAULT FALSE;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE mariadb_databases
    DROP COLUMN IF EXISTS is_exclude_events;
-- +goose StatementEnd
