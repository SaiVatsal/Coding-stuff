-- +goose Up
-- +goose StatementBegin
ALTER TABLE postgresql_databases
    ADD COLUMN IF NOT EXISTS exclude_tables TEXT NOT NULL DEFAULT '';

ALTER TABLE mariadb_databases
    ADD COLUMN IF NOT EXISTS exclude_tables TEXT NOT NULL DEFAULT '';

ALTER TABLE mysql_databases
    ADD COLUMN IF NOT EXISTS exclude_tables TEXT NOT NULL DEFAULT '';

ALTER TABLE mongodb_databases
    ADD COLUMN IF NOT EXISTS exclude_collections TEXT NOT NULL DEFAULT '';
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE postgresql_databases
    DROP COLUMN IF EXISTS exclude_tables;

ALTER TABLE mariadb_databases
    DROP COLUMN IF EXISTS exclude_tables;

ALTER TABLE mysql_databases
    DROP COLUMN IF EXISTS exclude_tables;

ALTER TABLE mongodb_databases
    DROP COLUMN IF EXISTS exclude_collections;
-- +goose StatementEnd
