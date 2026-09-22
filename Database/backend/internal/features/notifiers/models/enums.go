package notifier_models

type NotificationType string

const (
	NotificationTypeAll NotificationType = "ALL"

	NotificationTypeBackupSuccess NotificationType = "BACKUP_SUCCESS"
	NotificationTypeBackupFailed  NotificationType = "BACKUP_FAILED"

	NotificationTypeHealthcheckSuccess NotificationType = "HEALTHCHECK_SUCCESS"
	NotificationTypeHealthcheckFailed  NotificationType = "HEALTHCHECK_FAILED"

	NotificationTypeVerificationSuccess NotificationType = "VERIFICATION_SUCCESS"
	NotificationTypeVerificationFailed  NotificationType = "VERIFICATION_FAILED"
)
