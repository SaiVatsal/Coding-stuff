-- +goose Up
-- +goose StatementBegin

ALTER TABLE backup_configs
    DROP CONSTRAINT fk_backup_config_storage_id;

ALTER TABLE backup_configs
    ADD CONSTRAINT fk_backup_config_storage_id
    FOREIGN KEY (storage_id)
    REFERENCES storages (id)
    ON DELETE CASCADE;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

ALTER TABLE backup_configs
    DROP CONSTRAINT fk_backup_config_storage_id;

ALTER TABLE backup_configs
    ADD CONSTRAINT fk_backup_config_storage_id
    FOREIGN KEY (storage_id)
    REFERENCES storages (id);

-- +goose StatementEnd
