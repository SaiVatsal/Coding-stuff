package api

import "errors"

// ErrReportGone signals the report route returned 410 — the row is no longer
// this agent's. The caller logs at info and drops; it is never retried.
var ErrReportGone = errors.New("verification no longer owned by this agent")

// ErrReportBudgetExhausted is the cause attached when report retries exceed
// reportRetryBudget; the run is then reclaimed by the backend on the agent's
// next heartbeat.
var ErrReportBudgetExhausted = errors.New("report retry budget exhausted")
