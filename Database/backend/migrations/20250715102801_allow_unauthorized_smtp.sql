-- +goose Up
-- +goose StatementBegin

ALTER TABLE email_notifiers
    ALTER COLUMN smtp_user DROP NOT NULL,
    ALTER COLUMN smtp_password DROP NOT NULL;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

ALTER TABLE email_notifiers
    ALTER COLUMN smtp_user SET NOT NULL,
    ALTER COLUMN smtp_password SET NOT NULL;

-- +goose StatementEnd
