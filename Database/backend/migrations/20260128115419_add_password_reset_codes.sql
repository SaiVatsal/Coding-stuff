-- +goose Up
-- +goose StatementBegin

CREATE TABLE password_reset_codes (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL,
    hashed_code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE password_reset_codes
    ADD CONSTRAINT fk_password_reset_codes_user_id
    FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON DELETE CASCADE;

CREATE INDEX idx_password_reset_codes_user_id ON password_reset_codes (user_id);
CREATE INDEX idx_password_reset_codes_expires_at ON password_reset_codes (expires_at);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP INDEX IF EXISTS idx_password_reset_codes_expires_at;
DROP INDEX IF EXISTS idx_password_reset_codes_user_id;
DROP TABLE IF EXISTS password_reset_codes;

-- +goose StatementEnd
