-- +goose Up
-- +goose StatementBegin

ALTER TABLE postgresql_databases
    ADD COLUMN ssl_mode        TEXT NOT NULL DEFAULT 'disable',
    ADD COLUMN ssl_client_cert TEXT NOT NULL DEFAULT '',
    ADD COLUMN ssl_client_key  TEXT NOT NULL DEFAULT '',
    ADD COLUMN ssl_root_cert   TEXT NOT NULL DEFAULT '';

UPDATE postgresql_databases
SET ssl_mode = 'require'
WHERE is_https = TRUE;

ALTER TABLE postgresql_databases
    DROP COLUMN is_https;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

ALTER TABLE postgresql_databases
    ADD COLUMN is_https BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE postgresql_databases
SET is_https = TRUE
WHERE ssl_mode <> 'disable';

ALTER TABLE postgresql_databases
    DROP COLUMN ssl_mode,
    DROP COLUMN ssl_client_cert,
    DROP COLUMN ssl_client_key,
    DROP COLUMN ssl_root_cert;

-- +goose StatementEnd
