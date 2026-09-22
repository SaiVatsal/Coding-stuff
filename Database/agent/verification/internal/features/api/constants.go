package api

import "time"

const (
	versionPath                 = "/api/v1/system/version"
	verificationAgentBinaryPath = "/api/v1/system/verification-agent"
	heartbeatPathFmt            = "/api/v1/agent/verification/%s/heartbeat"

	claimPathFmt        = "/api/v1/agent/verifications/%s/claim"
	backupStreamPathFmt = "/api/v1/agent/verifications/%s/%s/backup-stream"
	reportPathFmt       = "/api/v1/agent/verifications/%s/%s/report"

	apiCallTimeout   = 30 * time.Second
	maxRetryAttempts = 3
	retryBaseDelay   = 1 * time.Second

	maxBackoff = 32 * time.Second

	agentVersionHeader = "X-Databasus-Version"
)

// Forces revalidation at any intermediary already holding a stale entry —
// response-side no-store only stops a proxy from caching from now on.
var noCacheHeaders = map[string]string{
	"Cache-Control": "no-cache",
	"Pragma":        "no-cache",
}

// timeAfterFn is time.After in production; tests swap it to avoid real sleeps in
// the report retry loop. reportRetryBudget is the report retry deadline (60s in
// production); tests shrink it to exercise budget exhaustion without a 60s
// wall-clock wait.
var (
	timeAfterFn       = time.After
	reportRetryBudget = 60 * time.Second
)
