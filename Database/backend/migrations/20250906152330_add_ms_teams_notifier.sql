-- +goose Up
-- +goose StatementBegin

CREATE TABLE teams_notifiers (
     notifier_id        UUID PRIMARY KEY,
     power_automate_url TEXT NOT NULL
);

ALTER TABLE teams_notifiers
    ADD CONSTRAINT fk_teams_notifiers_notifier
    FOREIGN KEY (notifier_id)
    REFERENCES notifiers (id)
    ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS teams_notifiers;
-- +goose StatementEnd
