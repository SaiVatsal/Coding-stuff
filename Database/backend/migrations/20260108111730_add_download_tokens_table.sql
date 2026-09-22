-- +goose Up
-- +goose StatementBegin

CREATE TABLE download_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token      TEXT NOT NULL UNIQUE,
    backup_id  UUID NOT NULL,
    user_id    UUID NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE download_tokens
    ADD CONSTRAINT fk_download_tokens_backup_id
    FOREIGN KEY (backup_id)
    REFERENCES backups (id)
    ON DELETE CASCADE;

ALTER TABLE download_tokens
    ADD CONSTRAINT fk_download_tokens_user_id
    FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON DELETE CASCADE;

CREATE INDEX idx_download_tokens_token ON download_tokens (token);
CREATE INDEX idx_download_tokens_expires_at ON download_tokens (expires_at);
CREATE INDEX idx_download_tokens_backup_id ON download_tokens (backup_id);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP INDEX IF EXISTS idx_download_tokens_backup_id;
DROP INDEX IF EXISTS idx_download_tokens_expires_at;
DROP INDEX IF EXISTS idx_download_tokens_token;

ALTER TABLE download_tokens DROP CONSTRAINT IF EXISTS fk_download_tokens_user_id;
ALTER TABLE download_tokens DROP CONSTRAINT IF EXISTS fk_download_tokens_backup_id;

DROP TABLE IF EXISTS download_tokens;

-- +goose StatementEnd
