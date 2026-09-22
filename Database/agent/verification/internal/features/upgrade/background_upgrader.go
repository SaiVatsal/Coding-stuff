package upgrade

import (
	"context"
	"fmt"
	"log/slog"
	"sync/atomic"
	"time"

	"databasus-verification-agent/internal/features/api"
)

const backgroundCheckInterval = 10 * time.Second

type BackgroundUpgrader struct {
	apiClient      *api.Client
	currentVersion string
	isDev          bool
	cancel         context.CancelFunc
	hasRun         atomic.Bool
	isUpgraded     atomic.Bool
	log            *slog.Logger
	done           chan struct{}
}

func NewBackgroundUpgrader(
	apiClient *api.Client,
	currentVersion string,
	isDev bool,
	cancel context.CancelFunc,
	log *slog.Logger,
) *BackgroundUpgrader {
	return &BackgroundUpgrader{
		apiClient,
		currentVersion,
		isDev,
		cancel,
		atomic.Bool{},
		atomic.Bool{},
		log,
		make(chan struct{}),
	}
}

func (u *BackgroundUpgrader) Run(ctx context.Context) {
	if u.hasRun.Swap(true) {
		panic(fmt.Sprintf("%T.Run() called multiple times", u))
	}

	defer close(u.done)

	ticker := time.NewTicker(backgroundCheckInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if u.checkAndUpgrade() {
				return
			}
		}
	}
}

func (u *BackgroundUpgrader) IsUpgraded() bool {
	return u.isUpgraded.Load()
}

func (u *BackgroundUpgrader) WaitForCompletion(timeout time.Duration) {
	select {
	case <-u.done:
	case <-time.After(timeout):
	}
}

func (u *BackgroundUpgrader) checkAndUpgrade() bool {
	isUpgraded, err := CheckAndUpdate(u.apiClient, u.currentVersion, u.isDev, u.log)
	if err != nil {
		u.log.Warn("Background update check failed", "error", err)

		return false
	}

	if !isUpgraded {
		return false
	}

	u.log.Info("Background upgrade complete, restarting...")
	u.isUpgraded.Store(true)
	u.cancel()

	return true
}
