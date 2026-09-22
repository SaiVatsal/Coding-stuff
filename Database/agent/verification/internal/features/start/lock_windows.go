package start

import (
	"log/slog"
	"os"
)

func AcquireLock(log *slog.Logger) (*os.File, error) {
	log.Warn("Process locking is not supported on Windows, skipping")

	return nil, nil
}

func ReleaseLock(f *os.File) {
	if f != nil {
		_ = f.Close()
	}
}
