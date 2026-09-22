-- +goose Up
-- +goose StatementBegin
ALTER TABLE s3_storages
    ADD COLUMN s3_storage_class TEXT NOT NULL DEFAULT '';
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE s3_storages
    DROP COLUMN s3_storage_class;
-- +goose StatementEnd
