-- +goose Up
-- +goose StatementBegin

CREATE TABLE verification_agents (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                 TEXT        NOT NULL,
    token_hash           TEXT        NOT NULL,
    max_cpu              INTEGER     NOT NULL DEFAULT 0,
    max_ram_gb           INTEGER     NOT NULL DEFAULT 0,
    max_disk_gb          INTEGER     NOT NULL DEFAULT 0,
    max_concurrent_jobs  INTEGER     NOT NULL DEFAULT 0,
    last_seen_at         TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at           TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_verification_agents_token_hash
    ON verification_agents (token_hash);

ALTER TABLE backup_configs
    ADD COLUMN interval_type   TEXT,
    ADD COLUMN time_of_day     TEXT,
    ADD COLUMN weekday         INTEGER,
    ADD COLUMN day_of_month    INTEGER,
    ADD COLUMN cron_expression TEXT;

UPDATE backup_configs bc
SET interval_type   = i.interval,
    time_of_day     = i.time_of_day,
    weekday         = i.weekday,
    day_of_month    = i.day_of_month,
    cron_expression = i.cron_expression
FROM intervals i
WHERE bc.backup_interval_id = i.id;

UPDATE backup_configs
SET interval_type = 'DAILY',
    time_of_day   = '04:00'
WHERE interval_type IS NULL;

ALTER TABLE backup_configs
    ALTER COLUMN interval_type SET NOT NULL;

ALTER TABLE backup_configs
    DROP CONSTRAINT IF EXISTS fk_backup_config_backup_interval_id;

ALTER TABLE backup_configs
    DROP COLUMN backup_interval_id;

DROP TABLE intervals;

CREATE TABLE backup_verification_configs (
    database_id                       UUID PRIMARY KEY,

    is_scheduled_verification_enabled BOOLEAN     NOT NULL DEFAULT FALSE,

    interval_type                     TEXT        NOT NULL DEFAULT 'WEEKLY',
    time_of_day                       TEXT,
    weekday                           INTEGER,
    day_of_month                      INTEGER,
    cron_expression                   TEXT,

    send_notifications_on             TEXT        NOT NULL DEFAULT '',
    schedule_type                     TEXT        NOT NULL DEFAULT 'AFTER_BACKUP',

    created_at                        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE backup_verification_configs
    ADD CONSTRAINT fk_backup_verification_configs_database
    FOREIGN KEY (database_id)
    REFERENCES databases (id)
    ON DELETE CASCADE;

CREATE TABLE restore_verifications (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    database_id                 UUID        NOT NULL,
    backup_id                   UUID        NOT NULL,
    agent_id                    UUID,

    trigger                     TEXT        NOT NULL,
    status                      TEXT        NOT NULL DEFAULT 'PENDING',

    attempt_count               INTEGER     NOT NULL DEFAULT 1,

    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at                  TIMESTAMPTZ,
    finished_at                 TIMESTAMPTZ,

    restore_duration_ms         BIGINT,
    verify_duration_ms          BIGINT,

    pg_restore_exit_code        INTEGER,
    db_size_bytes_after_restore BIGINT,
    table_count                 INTEGER,
    schema_count                INTEGER,
    fail_message                TEXT
);

ALTER TABLE restore_verifications
    ADD CONSTRAINT fk_restore_verifications_database
    FOREIGN KEY (database_id)
    REFERENCES databases (id)
    ON DELETE CASCADE;

ALTER TABLE restore_verifications
    ADD CONSTRAINT fk_restore_verifications_backup
    FOREIGN KEY (backup_id)
    REFERENCES backups (id)
    ON DELETE CASCADE;

ALTER TABLE restore_verifications
    ADD CONSTRAINT fk_restore_verifications_agent
    FOREIGN KEY (agent_id)
    REFERENCES verification_agents (id)
    ON DELETE SET NULL;

CREATE INDEX idx_restore_verifications_database_created
    ON restore_verifications (database_id, created_at);

CREATE INDEX idx_restore_verifications_status_created
    ON restore_verifications (status, created_at);

CREATE INDEX idx_restore_verifications_agent_status
    ON restore_verifications (agent_id, status);

CREATE TABLE restore_verification_table_stats (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restore_verification_id UUID    NOT NULL,
    schema_name             TEXT    NOT NULL,
    name                    TEXT    NOT NULL,
    row_count               BIGINT  NOT NULL
);

ALTER TABLE restore_verification_table_stats
    ADD CONSTRAINT fk_restore_verification_table_stats_verification
    FOREIGN KEY (restore_verification_id)
    REFERENCES restore_verifications (id)
    ON DELETE CASCADE;

CREATE INDEX idx_restore_verification_table_stats_verification
    ON restore_verification_table_stats (restore_verification_id);

ALTER TABLE backups
    ADD COLUMN restore_verification_status TEXT NOT NULL DEFAULT 'NOT_VERIFIED';

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

ALTER TABLE backups
    DROP COLUMN restore_verification_status;

DROP TABLE restore_verification_table_stats;
DROP TABLE restore_verifications;
DROP TABLE backup_verification_configs;
DROP TABLE verification_agents;

CREATE TABLE intervals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interval        TEXT NOT NULL,
    time_of_day     TEXT,
    weekday         INTEGER,
    day_of_month    INTEGER,
    cron_expression TEXT
);

ALTER TABLE backup_configs ADD COLUMN backup_interval_id UUID;

DO $$
DECLARE
    bc RECORD;
    new_id UUID;
BEGIN
    FOR bc IN SELECT database_id, interval_type, time_of_day, weekday, day_of_month, cron_expression
              FROM backup_configs WHERE backup_interval_id IS NULL
    LOOP
        INSERT INTO intervals (id, interval, time_of_day, weekday, day_of_month, cron_expression)
        VALUES (gen_random_uuid(), bc.interval_type, bc.time_of_day, bc.weekday, bc.day_of_month, bc.cron_expression)
        RETURNING id INTO new_id;

        UPDATE backup_configs SET backup_interval_id = new_id WHERE database_id = bc.database_id;
    END LOOP;
END $$;

ALTER TABLE backup_configs ALTER COLUMN backup_interval_id SET NOT NULL;

ALTER TABLE backup_configs
    ADD CONSTRAINT fk_backup_config_backup_interval_id
    FOREIGN KEY (backup_interval_id)
    REFERENCES intervals (id);

ALTER TABLE backup_configs
    DROP COLUMN interval_type,
    DROP COLUMN time_of_day,
    DROP COLUMN weekday,
    DROP COLUMN day_of_month,
    DROP COLUMN cron_expression;

-- +goose StatementEnd
