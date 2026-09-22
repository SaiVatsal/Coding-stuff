package verification_config

type VerificationNotificationType string

const (
	NotificationVerificationSuccess VerificationNotificationType = "VERIFICATION_SUCCESS"
	NotificationVerificationFailed  VerificationNotificationType = "VERIFICATION_FAILED"
)

type VerificationScheduleType string

const (
	VerificationScheduleInterval    VerificationScheduleType = "INTERVAL"
	VerificationScheduleAfterBackup VerificationScheduleType = "AFTER_BACKUP"
)
