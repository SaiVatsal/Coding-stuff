-- +goose Up
-- +goose StatementBegin
ALTER TABLE email_notifiers
    ADD COLUMN is_insecure_skip_verify BOOLEAN NOT NULL DEFAULT FALSE;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE email_notifiers
    DROP COLUMN is_insecure_skip_verify;
-- +goose StatementEnd
