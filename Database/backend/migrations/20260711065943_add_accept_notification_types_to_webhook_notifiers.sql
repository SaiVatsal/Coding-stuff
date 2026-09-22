-- +goose Up
-- +goose StatementBegin

ALTER TABLE webhook_notifiers
    ADD COLUMN accept_notification_types TEXT NOT NULL DEFAULT '["ALL"]';

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

ALTER TABLE webhook_notifiers
    DROP COLUMN accept_notification_types;

-- +goose StatementEnd
