-- +goose Up
-- +goose StatementBegin

ALTER TABLE notifiers
    DROP CONSTRAINT fk_notifiers_workspace_id;

ALTER TABLE notifiers
    ADD CONSTRAINT fk_notifiers_workspace_id
    FOREIGN KEY (workspace_id)
    REFERENCES workspaces (id)
    ON DELETE CASCADE;

ALTER TABLE storages
    DROP CONSTRAINT fk_storages_workspace_id;

ALTER TABLE storages
    ADD CONSTRAINT fk_storages_workspace_id
    FOREIGN KEY (workspace_id)
    REFERENCES workspaces (id)
    ON DELETE CASCADE;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

ALTER TABLE notifiers
    DROP CONSTRAINT fk_notifiers_workspace_id;

ALTER TABLE notifiers
    ADD CONSTRAINT fk_notifiers_workspace_id
    FOREIGN KEY (workspace_id)
    REFERENCES workspaces (id);

ALTER TABLE storages
    DROP CONSTRAINT fk_storages_workspace_id;

ALTER TABLE storages
    ADD CONSTRAINT fk_storages_workspace_id
    FOREIGN KEY (workspace_id)
    REFERENCES workspaces (id);

-- +goose StatementEnd
