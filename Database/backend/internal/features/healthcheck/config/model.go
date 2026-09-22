package healthcheck_config

import (
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type HealthcheckConfig struct {
	DatabaseID uuid.UUID `json:"databaseId" gorm:"column:database_id;type:uuid;primaryKey"`

	IsHealthcheckEnabled              bool `json:"isHealthcheckEnabled"              gorm:"column:is_healthcheck_enabled;type:boolean;not null"`
	IsSentNotificationWhenUnavailable bool `json:"isSentNotificationWhenUnavailable" gorm:"column:is_sent_notification_when_unavailable;type:boolean;not null"`

	IntervalMinutes                int `json:"intervalMinutes"                gorm:"column:interval_minutes;type:int;not null"`
	AttemptsBeforeConcideredAsDown int `json:"attemptsBeforeConcideredAsDown" gorm:"column:attempts_before_considered_as_down;type:int;not null"`
	StoreAttemptsDays              int `json:"storeAttemptsDays"              gorm:"column:store_attempts_days;type:int;not null"`
}

func (c *HealthcheckConfig) TableName() string {
	return "healthcheck_configs"
}

func (c *HealthcheckConfig) BeforeSave(tx *gorm.DB) error {
	if err := c.Validate(); err != nil {
		return err
	}

	return nil
}

func (c *HealthcheckConfig) Validate() error {
	if c.IntervalMinutes <= 0 {
		return errors.New("interval minutes must be greater than 0")
	}

	if c.AttemptsBeforeConcideredAsDown <= 0 {
		return errors.New("attempts before considered as down must be greater than 0")
	}

	if c.StoreAttemptsDays <= 0 {
		return errors.New("store attempts days must be greater than 0")
	}

	return nil
}
