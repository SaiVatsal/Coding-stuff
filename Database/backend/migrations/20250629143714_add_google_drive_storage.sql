-- +goose Up
-- +goose StatementBegin

-- Create google drive storages table
CREATE TABLE google_drive_storages (
    storage_id       UUID PRIMARY KEY,
    client_id        TEXT NOT NULL,
    client_secret    TEXT NOT NULL,
    token_json       TEXT NOT NULL
);

ALTER TABLE google_drive_storages
    ADD CONSTRAINT fk_google_drive_storages_storage
    FOREIGN KEY (storage_id)
    REFERENCES storages (id)
    ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP TABLE IF EXISTS google_drive_storages;

-- +goose StatementEnd
