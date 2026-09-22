package container

import (
	"context"
	"fmt"
	"log/slog"
)

// purgeEngine is the Docker seam for the startup purge — the same three methods
// the unit tests fake, rather than the whole Docker surface.
type purgeEngine interface {
	ListManaged(ctx context.Context, agentID string) ([]ManagedContainer, error)
	RemoveContainer(ctx context.Context, containerID string) error
	RemoveNetwork(ctx context.Context, networkID string) error
}

// purgeAgentContainers runs once at startup, with no age grace and no
// active-set check, so each agent process begins from a clean slate
// ("always fresh").
//
// Best-effort by design: a per-item failure is logged and skipped, and a
// failed listing is logged and ignored, never blocking startup. Container and
// network names are per-UUID (databasus-verif-<uuid>), so a leftover never
// collides with a fresh run; degraded (a few stale containers until the next
// restart) beats refusing to start on a transient Docker hiccup.
func purgeAgentContainers(ctx context.Context, engine purgeEngine, agentID string, log *slog.Logger) {
	managed, err := engine.ListManaged(ctx, agentID)
	if err != nil {
		log.Warn("startup purge could not list managed containers", "error", err)

		return
	}

	if len(managed) == 0 {
		return
	}

	removed := 0
	for _, mc := range managed {
		if err := engine.RemoveContainer(ctx, mc.ID); err != nil {
			log.Warn("startup purge failed to remove container",
				"verification_id", mc.VerificationID, "error", err)

			continue
		}

		if mc.NetworkID != "" {
			if err := engine.RemoveNetwork(ctx, mc.NetworkID); err != nil {
				log.Warn("startup purge failed to remove network",
					"verification_id", mc.VerificationID, "error", err)
			}
		}

		removed++
	}

	log.Info(fmt.Sprintf("startup purge removed %d stale container(s)", removed))
}
