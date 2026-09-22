package restores_core

type RestoreStatus string

const (
	RestoreStatusInProgress RestoreStatus = "IN_PROGRESS"
	RestoreStatusCompleted  RestoreStatus = "COMPLETED"
	RestoreStatusFailed     RestoreStatus = "FAILED"
	RestoreStatusCanceled   RestoreStatus = "CANCELED"
)
