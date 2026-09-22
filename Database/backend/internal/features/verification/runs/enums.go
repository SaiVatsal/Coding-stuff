package verification_runs

type VerificationStatus string

const (
	VerificationStatusPending   VerificationStatus = "PENDING"
	VerificationStatusRunning   VerificationStatus = "RUNNING"
	VerificationStatusCompleted VerificationStatus = "COMPLETED"
	VerificationStatusFailed    VerificationStatus = "FAILED"
	VerificationStatusCanceled  VerificationStatus = "CANCELED"
)

type VerificationTrigger string

const (
	VerificationTriggerManual      VerificationTrigger = "MANUAL"
	VerificationTriggerScheduled   VerificationTrigger = "SCHEDULED"
	VerificationTriggerAfterBackup VerificationTrigger = "AFTER_BACKUP"
)

type FailureReason string

// Agent-side reasons are retried up to MaxAgentSideAttempts because the same
// input may succeed on the next agent. Backup-side reasons go terminal on the
// first failure — retrying the same dump produces the same rejection and only
// delays the user notification.
const (
	FailureReasonAgentLostContact  FailureReason = "AGENT_LOST_CONTACT"  // reaper: agent stopped heartbeating mid-run
	FailureReasonAgentRemoved      FailureReason = "AGENT_REMOVED"       // reaper: owning agent was deleted; requeue so another agent can pick it up
	FailureReasonAgentSetupFailed  FailureReason = "AGENT_SETUP_FAILED"  // agent reported FAILED before pg_restore ran (download/container/OOM)
	FailureReasonAgentDroppedJob   FailureReason = "AGENT_DROPPED_JOB"   // heartbeat: still-online agent stopped reporting a RUNNING job it owns
	FailureReasonBackupRejected    FailureReason = "BACKUP_REJECTED"     // agent reported FAILED with pg_restore non-zero exit
	FailureReasonDiskLimitExceeded FailureReason = "DISK_LIMIT_EXCEEDED" // restore exceeded the server-computed per-job disk budget; terminal (the same budget fails identically on retry)
	FailureReasonRestoredTooSmall  FailureReason = "RESTORED_TOO_SMALL"  // restored DB is below minRestoredSizeRatio of the recorded raw size
	FailureReasonUnclaimedTooLong  FailureReason = "UNCLAIMED_TOO_LONG"  // PENDING row sat unclaimed past maxPendingDuration
)
