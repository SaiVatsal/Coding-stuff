-- +goose Up
-- +goose StatementBegin

-- Create webhook notifiers table
CREATE TABLE webhook_notifiers (
    notifier_id    UUID PRIMARY KEY,
    webhook_url    TEXT NOT NULL,
    webhook_method TEXT NOT NULL
);

ALTER TABLE webhook_notifiers
    ADD CONSTRAINT fk_webhook_notifiers_notifier
    FOREIGN KEY (notifier_id)
    REFERENCES notifiers (id)
    ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP TABLE IF EXISTS webhook_notifiers;

-- +goose StatementEnd
