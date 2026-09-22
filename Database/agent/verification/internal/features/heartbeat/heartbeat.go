package heartbeat

import (
	"context"
	"fmt"
	"log/slog"
	"sync"
	"sync/atomic"
	"time"

	"github.com/google/uuid"

	"databasus-verification-agent/internal/config"
	"databasus-verification-agent/internal/features/api"
)

const (
	jobName           = "verification_heartbeat"
	heartbeatInterval = 30 * time.Second
)

// Heartbeater periodically reports the agent's capacity and the set of
// in-flight verification IDs (the backend reclaims any RUNNING job absent from
// that set), and acts on the abort list in the response. It is the single
// source of truth for which verifications are active and records the last
// abort set so the runner can re-check it immediately before any FAILED report
// (the abort/report-race mitigation).
type Heartbeater struct {
	api      *api.Client
	capacity config.Capacity
	hasRun   atomic.Bool

	mu        sync.Mutex
	registry  map[uuid.UUID]context.CancelFunc
	lastAbort map[uuid.UUID]struct{}

	log *slog.Logger
}

func NewHeartbeater(apiClient *api.Client, capacity config.Capacity, log *slog.Logger) *Heartbeater {
	return &Heartbeater{
		api:       apiClient,
		capacity:  capacity,
		registry:  make(map[uuid.UUID]context.CancelFunc),
		lastAbort: make(map[uuid.UUID]struct{}),
		log:       log,
	}
}

func (h *Heartbeater) Run(ctx context.Context) {
	if h.hasRun.Swap(true) {
		panic(fmt.Sprintf("%T.Run() called multiple times", h))
	}

	logger := h.log.With("job_id", uuid.New(), "job_name", jobName)
	logger.Info("heartbeat loop started")

	ticker := time.NewTicker(heartbeatInterval)
	defer ticker.Stop()

	if ctx.Err() == nil {
		h.sendHeartbeat(ctx, logger)
	}

	for {
		select {
		case <-ctx.Done():
			logger.Info("heartbeat loop stopped")

			return
		case <-ticker.C:
			h.sendHeartbeat(ctx, logger)
		}
	}
}

// TrackVerification must be called before the container/network exists so the
// ID rides the heartbeat envelope and is reachable by an abort the instant it
// has any artifact.
func (h *Heartbeater) TrackVerification(id uuid.UUID, cancel context.CancelFunc) {
	h.mu.Lock()
	defer h.mu.Unlock()

	h.registry[id] = cancel
}

func (h *Heartbeater) UntrackVerification(id uuid.UUID) {
	h.mu.Lock()
	defer h.mu.Unlock()

	delete(h.registry, id)
}

func (h *Heartbeater) GetRunningVerificationIDs() []uuid.UUID {
	h.mu.Lock()
	defer h.mu.Unlock()

	ids := make([]uuid.UUID, 0, len(h.registry))
	for id := range h.registry {
		ids = append(ids, id)
	}

	return ids
}

func (h *Heartbeater) IsAborted(id uuid.UUID) bool {
	h.mu.Lock()
	defer h.mu.Unlock()

	_, aborted := h.lastAbort[id]

	return aborted
}

func (h *Heartbeater) sendHeartbeat(ctx context.Context, logger *slog.Logger) {
	request := api.HeartbeatRequest{
		MaxCPU:                 h.capacity.MaxCPU,
		MaxRAMGb:               h.capacity.MaxRAMMb / 1024,
		MaxDiskGb:              h.capacity.MaxDiskGb,
		MaxConcurrentJobs:      h.capacity.MaxConcurrentJobs,
		CurrentVerificationIDs: h.GetRunningVerificationIDs(),
	}

	response, err := h.api.Heartbeat(ctx, request)
	if err != nil {
		logger.Warn("heartbeat failed, will retry next tick", "error", err)

		return
	}

	h.abortVerifications(response.AbortVerificationIDs, logger)

	logger.Debug(fmt.Sprintf(
		"heartbeat ok: last_seen_at=%s", response.LastSeenAt.UTC().Format(time.RFC3339)))
}

func (h *Heartbeater) abortVerifications(abortIDs []uuid.UUID, logger *slog.Logger) {
	h.mu.Lock()
	defer h.mu.Unlock()

	h.lastAbort = make(map[uuid.UUID]struct{}, len(abortIDs))
	for _, id := range abortIDs {
		h.lastAbort[id] = struct{}{}

		if cancel, registered := h.registry[id]; registered {
			logger.Info(fmt.Sprintf("aborting verification %s on server request", id))
			cancel()
		}
	}
}
