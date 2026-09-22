-- +goose Up
-- +goose StatementBegin
ALTER TABLE backups ADD COLUMN file_name TEXT;
-- +goose StatementEnd

-- +goose StatementBegin
UPDATE backups SET file_name = id::TEXT WHERE file_name IS NULL;
-- +goose StatementEnd

-- +goose StatementBegin
ALTER TABLE backups ALTER COLUMN file_name SET NOT NULL;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE backups DROP COLUMN file_name;
-- +goose StatementEnd
