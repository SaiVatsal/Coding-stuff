-- +goose Up
-- +goose StatementBegin
ALTER TABLE webhook_records
    ADD COLUMN is_skipped BOOLEAN NOT NULL DEFAULT FALSE;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE webhook_records
    DROP COLUMN is_skipped;
-- +goose StatementEnd
