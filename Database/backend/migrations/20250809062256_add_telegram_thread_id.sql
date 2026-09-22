-- +goose Up
-- +goose StatementBegin

ALTER TABLE telegram_notifiers 
    ADD COLUMN thread_id BIGINT;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

ALTER TABLE telegram_notifiers 
    DROP COLUMN IF EXISTS thread_id;

-- +goose StatementEnd
