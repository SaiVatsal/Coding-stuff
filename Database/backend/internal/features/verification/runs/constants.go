package verification_runs

import "time"

// MaxAgentSideAttempts caps how many times an agent-side failure may be retried
// before going terminal. Backup-side failures (BackupRejected, RestoredTooSmall)
// and fleet-side failures (UnclaimedTooLong) ignore this and terminal immediately.
const MaxAgentSideAttempts = 3

// minRestoredSizeRatio guards against silent backup corruption where pg_restore
// "succeeds" but produces a near-empty database. A restored DB below this ratio
// of the original raw size is treated as a backup failure.
const minRestoredSizeRatio = 0.20

// StaleAgentThreshold is how long an agent may go without a heartbeat before
// it is considered offline. The verification scheduler uses it to abandon
// jobs claimed by a silent agent; the system healthcheck uses it to surface
// dead agents that have not been retired.
// Declared as var (not const) so tests can shrink it via reassignment.
var StaleAgentThreshold = 5 * time.Minute

// agentJobReclaimGrace is the minimum age a RUNNING verification must reach
// before the backend may reclaim it from a still-online agent that no longer
// reports it. The claim transaction flips a row RUNNING and
// stamps started_at before the owning agent has registered the job and sent
// its next heartbeat, so a just-claimed row is legitimately absent from the
// owner's heartbeat for up to one cycle. This grace (~3x the agent's 30s
// heartbeat interval) keeps it safe until the owner has had at least one full
// cycle to report it. Keyed off the fixed heartbeat cadence, not the variable
// claim backoff. Declared as var (not const) so tests can shrink it.
var agentJobReclaimGrace = 90 * time.Second
