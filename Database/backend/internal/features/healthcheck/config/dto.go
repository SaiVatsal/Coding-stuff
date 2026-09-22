package healthcheck_config

import (
	"github.com/google/uuid"
)

type HealthcheckConfigDTO struct {
	DatabaseID                        uuid.UUID `json:"databaseId"`
	IsHealthcheckEnabled              bool      `json:"isHealthcheckEnabled"`
	IsSentNotificationWhenUnavailable bool      `json:"isSentNotificationWhenUnavailable"`

	IntervalMinutes                int `json:"intervalMinutes"`
	AttemptsBeforeConcideredAsDown int `json:"attemptsBeforeConcideredAsDown"`
	StoreAttemptsDays              int `json:"storeAttemptsDays"`
}

func (dto *HealthcheckConfigDTO) ToDTO() *HealthcheckConfig {
	return &HealthcheckConfig{
		DatabaseID: dto.DatabaseID,

		IsHealthcheckEnabled:              dto.IsHealthcheckEnabled,
		IsSentNotificationWhenUnavailable: dto.IsSentNotificationWhenUnavailable,

		IntervalMinutes:                dto.IntervalMinutes,
		AttemptsBeforeConcideredAsDown: dto.AttemptsBeforeConcideredAsDown,
		StoreAttemptsDays:              dto.StoreAttemptsDays,
	}
}
