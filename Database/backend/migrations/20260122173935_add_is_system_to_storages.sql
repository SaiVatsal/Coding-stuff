-- +goose Up
-- +goose StatementBegin
ALTER TABLE storages
    ADD COLUMN is_system BOOLEAN NOT NULL DEFAULT FALSE;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE storages
    DROP COLUMN is_system;
-- +goose StatementEnd
