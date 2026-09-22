-- +goose Up

ALTER TABLE backup_configs
    ADD COLUMN retention_policy_type  TEXT NOT NULL DEFAULT 'TIME_PERIOD',
    ADD COLUMN retention_time_period  TEXT NOT NULL DEFAULT '',
    ADD COLUMN retention_count        INT  NOT NULL DEFAULT 0,
    ADD COLUMN retention_gfs_hours    INT  NOT NULL DEFAULT 0,
    ADD COLUMN retention_gfs_days     INT  NOT NULL DEFAULT 0,
    ADD COLUMN retention_gfs_weeks    INT  NOT NULL DEFAULT 0,
    ADD COLUMN retention_gfs_months   INT  NOT NULL DEFAULT 0,
    ADD COLUMN retention_gfs_years    INT  NOT NULL DEFAULT 0;

UPDATE backup_configs
SET retention_time_period = store_period;

ALTER TABLE backup_configs
    DROP COLUMN store_period;

-- +goose Down

ALTER TABLE backup_configs
    ADD COLUMN store_period TEXT NOT NULL DEFAULT 'WEEK';

UPDATE backup_configs
SET store_period = CASE
    WHEN retention_time_period != '' THEN retention_time_period
    ELSE 'WEEK'
END;

ALTER TABLE backup_configs
    DROP COLUMN retention_policy_type,
    DROP COLUMN retention_time_period,
    DROP COLUMN retention_count,
    DROP COLUMN retention_gfs_hours,
    DROP COLUMN retention_gfs_days,
    DROP COLUMN retention_gfs_weeks,
    DROP COLUMN retention_gfs_months,
    DROP COLUMN retention_gfs_years;
