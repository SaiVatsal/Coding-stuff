package verification_config

import (
	"databasus-backend/internal/features/intervals"
)

type SaveBackupVerificationConfigDTO struct {
	IsScheduledVerificationEnabled bool                           `json:"isScheduledVerificationEnabled"`
	ScheduleType                   VerificationScheduleType       `json:"scheduleType"`
	VerificationInterval           intervals.Interval             `json:"verificationInterval"`
	SendNotificationsOn            []VerificationNotificationType `json:"sendNotificationsOn"`
}
