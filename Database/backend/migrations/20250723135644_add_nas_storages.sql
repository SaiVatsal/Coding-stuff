-- +goose Up
-- +goose StatementBegin

-- Create NAS storages table
CREATE TABLE nas_storages (
    storage_id  UUID PRIMARY KEY,
    host        TEXT NOT NULL,
    port        INTEGER NOT NULL DEFAULT 445,
    share       TEXT NOT NULL,
    username    TEXT NOT NULL,
    password    TEXT NOT NULL,
    use_ssl     BOOLEAN NOT NULL DEFAULT FALSE,
    domain      TEXT,
    path        TEXT
);

ALTER TABLE nas_storages
    ADD CONSTRAINT fk_nas_storages_storage
    FOREIGN KEY (storage_id)
    REFERENCES storages (id)
    ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP TABLE IF EXISTS nas_storages;

-- +goose StatementEnd 