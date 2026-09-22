-- +goose Up
-- +goose StatementBegin

-- Create users table
CREATE TABLE users (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email                  TEXT NOT NULL,
    hashed_password        TEXT NOT NULL,
    password_creation_time TIMESTAMPTZ NOT NULL,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    role                   TEXT NOT NULL
);

CREATE UNIQUE INDEX users_email_idx ON users (email);

-- Create secret keys table
CREATE TABLE secret_keys (
    secret TEXT NOT NULL
);

CREATE UNIQUE INDEX secret_keys_secret_idx ON secret_keys (secret);

-- Create notifiers table
CREATE TABLE notifiers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    name            VARCHAR(255) NOT NULL,
    notifier_type   VARCHAR(50) NOT NULL,
    last_send_error TEXT
);

CREATE INDEX idx_notifiers_user_id ON notifiers (user_id);

-- Create telegram notifiers table
CREATE TABLE telegram_notifiers (
    notifier_id    UUID PRIMARY KEY,
    bot_token      TEXT NOT NULL,
    target_chat_id TEXT NOT NULL
);

ALTER TABLE telegram_notifiers
    ADD CONSTRAINT fk_telegram_notifiers_notifier
    FOREIGN KEY (notifier_id)
    REFERENCES notifiers (id)
    ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- Create email notifiers table
CREATE TABLE email_notifiers (
    notifier_id   UUID PRIMARY KEY,
    target_email  VARCHAR(255) NOT NULL,
    smtp_host     VARCHAR(255) NOT NULL,
    smtp_port     INTEGER NOT NULL,
    smtp_user     VARCHAR(255) NOT NULL,
    smtp_password VARCHAR(255) NOT NULL
);

ALTER TABLE email_notifiers
    ADD CONSTRAINT fk_email_notifiers_notifier
    FOREIGN KEY (notifier_id)
    REFERENCES notifiers (id)
    ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- Create storages table
CREATE TABLE storages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    type            TEXT NOT NULL,
    name            TEXT NOT NULL,
    last_save_error TEXT
);

CREATE INDEX idx_storages_user_id ON storages (user_id);

-- Create local storages table
CREATE TABLE local_storages (
    storage_id UUID PRIMARY KEY
);

ALTER TABLE local_storages
    ADD CONSTRAINT fk_local_storages_storage
    FOREIGN KEY (storage_id)
    REFERENCES storages (id)
    ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- Create S3 storages table
CREATE TABLE s3_storages (
    storage_id    UUID PRIMARY KEY,
    s3_bucket     TEXT NOT NULL,
    s3_region     TEXT NOT NULL,
    s3_access_key TEXT NOT NULL,
    s3_secret_key TEXT NOT NULL,
    s3_endpoint   TEXT
);

ALTER TABLE s3_storages
    ADD CONSTRAINT fk_s3_storages_storage
    FOREIGN KEY (storage_id)
    REFERENCES storages (id)
    ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- Create intervals table
CREATE TABLE intervals (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interval     TEXT NOT NULL,
    time_of_day  TEXT,
    weekday      INT,
    day_of_month INT
);

-- Create databases table
CREATE TABLE databases (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                   UUID NOT NULL,
    name                      TEXT NOT NULL,
    type                      TEXT NOT NULL,
    backup_interval_id        UUID NOT NULL,
    storage_id                UUID NOT NULL,
    store_period              TEXT NOT NULL,
    last_backup_time          TIMESTAMPTZ,
    last_backup_error_message TEXT,
    send_notifications_on     TEXT NOT NULL DEFAULT ''
);

ALTER TABLE databases
    ADD CONSTRAINT fk_databases_backup_interval_id
    FOREIGN KEY (backup_interval_id)
    REFERENCES intervals (id)
    ON DELETE RESTRICT;

ALTER TABLE databases
    ADD CONSTRAINT fk_databases_user_id
    FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON DELETE CASCADE;

ALTER TABLE databases
    ADD CONSTRAINT fk_databases_storage_id
    FOREIGN KEY (storage_id)
    REFERENCES storages (id)
    ON DELETE RESTRICT;

CREATE INDEX idx_databases_user_id ON databases (user_id);
CREATE INDEX idx_databases_storage_id ON databases (storage_id);

-- Create postgresql databases table
CREATE TABLE postgresql_databases (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    database_id UUID,
    version     TEXT NOT NULL,
    host        TEXT NOT NULL,
    port        INT NOT NULL,
    username    TEXT NOT NULL,
    password    TEXT NOT NULL,
    database    TEXT,
    is_https    BOOLEAN NOT NULL DEFAULT FALSE,
    cpu_count   INT NOT NULL,
    restore_id  UUID
);

ALTER TABLE postgresql_databases
    ADD CONSTRAINT uk_postgresql_databases_database_id
    UNIQUE (database_id);

CREATE INDEX idx_postgresql_databases_database_id ON postgresql_databases (database_id);
CREATE INDEX idx_postgresql_databases_restore_id ON postgresql_databases (restore_id);

-- Create database notifiers association table
CREATE TABLE database_notifiers (
    database_id UUID NOT NULL,
    notifier_id UUID NOT NULL,
    PRIMARY KEY (database_id, notifier_id)
);

ALTER TABLE database_notifiers
    ADD CONSTRAINT fk_database_notifiers_database_id
    FOREIGN KEY (database_id)
    REFERENCES databases (id)
    ON DELETE CASCADE;

ALTER TABLE database_notifiers
    ADD CONSTRAINT fk_database_notifiers_notifier_id
    FOREIGN KEY (notifier_id)
    REFERENCES notifiers (id)
    ON DELETE RESTRICT;

CREATE INDEX idx_database_notifiers_database_id ON database_notifiers (database_id);

-- Create backups table
CREATE TABLE backups (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    database_id        UUID NOT NULL,
    storage_id         UUID NOT NULL,
    status             TEXT NOT NULL,
    fail_message       TEXT,
    backup_size_mb     DOUBLE PRECISION NOT NULL DEFAULT 0,
    backup_duration_ms BIGINT NOT NULL DEFAULT 0,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE backups
    ADD CONSTRAINT fk_backups_database_id
    FOREIGN KEY (database_id)
    REFERENCES databases (id)
    ON DELETE CASCADE;

ALTER TABLE backups
    ADD CONSTRAINT fk_backups_storage_id
    FOREIGN KEY (storage_id)
    REFERENCES storages (id)
    ON DELETE RESTRICT;

CREATE INDEX idx_backups_database_id_created_at ON backups (database_id, created_at DESC);
CREATE INDEX idx_backups_status_created_at ON backups (status, created_at DESC);

-- Create restores table
CREATE TABLE restores (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_id           UUID NOT NULL,
    status              TEXT NOT NULL,
    fail_message        TEXT,
    restore_duration_ms BIGINT NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE restores
    ADD CONSTRAINT fk_restores_backup_id
    FOREIGN KEY (backup_id)
    REFERENCES backups (id)
    ON DELETE CASCADE;

ALTER TABLE postgresql_databases
    ADD CONSTRAINT fk_postgresql_databases_restore_id
    FOREIGN KEY (restore_id)
    REFERENCES restores (id)
    ON DELETE CASCADE;

CREATE INDEX idx_restores_backup_id_created_at ON restores (backup_id, created_at);
CREATE INDEX idx_restores_status_created_at ON restores (status, created_at);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP TABLE IF EXISTS restores;
DROP TABLE IF EXISTS backups;
DROP TABLE IF EXISTS database_notifiers;
DROP TABLE IF EXISTS postgresql_databases;
DROP TABLE IF EXISTS databases;
DROP TABLE IF EXISTS intervals;
DROP TABLE IF EXISTS s3_storages;
DROP TABLE IF EXISTS local_storages;
DROP TABLE IF EXISTS storages;
DROP TABLE IF EXISTS email_notifiers;
DROP TABLE IF EXISTS telegram_notifiers;
DROP TABLE IF EXISTS notifiers;
DROP TABLE IF EXISTS secret_keys;
DROP TABLE IF EXISTS users;

-- +goose StatementEnd
