package telemetry

import (
	"encoding/json"
	"log/slog"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
)

type Instance struct {
	InstanceID  string `json:"instanceID"`
	InstalledAt string `json:"installedAt"`
}

type InstanceFileLoader struct {
	path   string
	logger *slog.Logger
}

func NewInstanceFileLoader(path string, logger *slog.Logger) *InstanceFileLoader {
	return &InstanceFileLoader{path: path, logger: logger}
}

// LoadOrCreate returns (instance, true) on success and (nil, false) when the
// file cannot be read or written. Telemetry is skipped on failure rather than
// falling back to an ephemeral UUID — phantom new instances on every restart
// would pollute the central counts.
func (l *InstanceFileLoader) LoadOrCreate() (*Instance, bool) {
	data, err := os.ReadFile(l.path)
	if err == nil {
		var instance Instance

		if err := json.Unmarshal(data, &instance); err != nil {
			l.logger.Warn("telemetry instance file is corrupt; skipping telemetry",
				"path", l.path, "error", err)
			return nil, false
		}

		if instance.InstanceID == "" {
			l.logger.Warn("telemetry instance file is missing instanceID; skipping telemetry",
				"path", l.path)
			return nil, false
		}

		return &instance, true
	}

	if !os.IsNotExist(err) {
		l.logger.Warn("failed to read telemetry instance file; skipping telemetry",
			"path", l.path, "error", err)
		return nil, false
	}

	instance := &Instance{
		InstanceID:  uuid.New().String(),
		InstalledAt: time.Now().UTC().Format("2006-01-02"),
	}

	encoded, err := json.Marshal(instance)
	if err != nil {
		l.logger.Warn("failed to encode telemetry instance file; skipping telemetry",
			"path", l.path, "error", err)
		return nil, false
	}

	if err := os.MkdirAll(filepath.Dir(l.path), 0o700); err != nil {
		l.logger.Warn("failed to create telemetry instance file directory; skipping telemetry",
			"path", l.path, "error", err)
		return nil, false
	}

	if err := os.WriteFile(l.path, encoded, 0o600); err != nil {
		l.logger.Warn("failed to write telemetry instance file; skipping telemetry",
			"path", l.path, "error", err)
		return nil, false
	}

	return instance, true
}
