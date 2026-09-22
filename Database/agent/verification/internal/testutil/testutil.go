// Package testutil holds helpers shared across the verification agent's
// package tests.
package testutil

import "log/slog"

// DiscardLogger returns a no-op logger so tests don't write to the rotating
// log file or stdout.
func DiscardLogger() *slog.Logger {
	return slog.New(slog.DiscardHandler)
}
