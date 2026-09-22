-- +goose Up
ALTER TABLE backups
    ADD COLUMN upload_completed_at TIMESTAMPTZ;

-- +goose Down
ALTER TABLE backups
    DROP COLUMN upload_completed_at;
