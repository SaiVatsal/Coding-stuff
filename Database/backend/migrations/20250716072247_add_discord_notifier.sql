-- +goose Up
-- +goose StatementBegin

-- Create discord notifiers table
CREATE TABLE discord_notifiers (
    notifier_id          UUID PRIMARY KEY,
    channel_webhook_url  TEXT NOT NULL
);

ALTER TABLE discord_notifiers
    ADD CONSTRAINT fk_discord_notifiers_notifier
    FOREIGN KEY (notifier_id)
    REFERENCES notifiers (id)
    ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP TABLE IF EXISTS discord_notifiers;

-- +goose StatementEnd
