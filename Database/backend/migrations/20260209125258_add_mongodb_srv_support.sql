-- +goose Up
-- +goose StatementBegin
ALTER TABLE mongodb_databases ALTER COLUMN port DROP NOT NULL;
-- +goose StatementEnd

-- +goose StatementBegin
ALTER TABLE mongodb_databases ADD COLUMN is_srv BOOLEAN NOT NULL DEFAULT FALSE;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE mongodb_databases DROP COLUMN is_srv;
-- +goose StatementEnd

-- +goose StatementBegin
ALTER TABLE mongodb_databases ALTER COLUMN port SET NOT NULL;
-- +goose StatementEnd
