-- +goose Up
-- +goose StatementBegin
ALTER TABLE mysql_databases
    ADD COLUMN privileges TEXT NOT NULL DEFAULT '';

ALTER TABLE mariadb_databases
    ADD COLUMN privileges TEXT NOT NULL DEFAULT '';

ALTER TABLE mariadb_databases
    DROP COLUMN is_exclude_events;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE mariadb_databases
    ADD COLUMN is_exclude_events BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE mariadb_databases
    DROP COLUMN privileges;

ALTER TABLE mysql_databases
    DROP COLUMN privileges;
-- +goose StatementEnd
