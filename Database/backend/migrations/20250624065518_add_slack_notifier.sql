-- +goose Up
-- +goose StatementBegin

-- Create slack notifiers table
CREATE TABLE slack_notifiers (
    notifier_id       UUID PRIMARY KEY,
    bot_token         TEXT NOT NULL,
    target_chat_id    TEXT NOT NULL
);

ALTER TABLE slack_notifiers
    ADD CONSTRAINT fk_slack_notifiers_notifier
    FOREIGN KEY (notifier_id)
    REFERENCES notifiers (id)
    ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP TABLE IF EXISTS slack_notifiers;

-- +goose StatementEnd
