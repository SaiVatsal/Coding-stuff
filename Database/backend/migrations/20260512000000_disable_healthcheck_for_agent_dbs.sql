-- +goose Up
-- +goose StatementBegin
UPDATE healthcheck_configs
SET is_healthcheck_enabled = FALSE
WHERE database_id IN (
    SELECT pd.database_id
    FROM postgresql_databases pd
    WHERE pd.backup_type = 'WAL_V1'
);

UPDATE databases
SET health_status = NULL
WHERE id IN (
    SELECT pd.database_id
    FROM postgresql_databases pd
    WHERE pd.backup_type = 'WAL_V1'
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- No-op: rolling this back would silently re-enable healthchecks
-- that are guaranteed to fail for agent-managed (WAL_V1) databases.
SELECT 1;
-- +goose StatementEnd
