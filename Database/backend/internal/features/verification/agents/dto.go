package verification_agents

import (
	"time"

	"github.com/google/uuid"
)

type CreateAgentRequest struct {
	Name string `json:"name" binding:"required,min=1,max=200"`
}

type CreatedAgentResponse struct {
	Agent *Agent `json:"agent"`
	Token string `json:"token"`
}

type RotateTokenResponse struct {
	Token string `json:"token"`
}

type AvailabilityResponse struct {
	Count     int64 `json:"count"`
	HasAgents bool  `json:"hasAgents"`
}

type HeartbeatRequest struct {
	MaxCPU            int `json:"maxCpu"            binding:"min=0"`
	MaxRAMGb          int `json:"maxRamGb"          binding:"min=0"`
	MaxDiskGb         int `json:"maxDiskGb"         binding:"min=0"`
	MaxConcurrentJobs int `json:"maxConcurrentJobs" binding:"min=0"`

	// What the agent thinks it's running. Server returns the
	// subset to abort if some information is outdated
	CurrentVerificationIDs []uuid.UUID `json:"currentVerificationIds"`
}

type HeartbeatResponse struct {
	LastSeenAt time.Time `json:"lastSeenAt"`

	// IDs that vanished, were flipped to CANCELED or are no longer owned
	// by this agent. So it needs to drop them.
	AbortVerificationIDs []uuid.UUID `json:"abortVerificationIds"`
}
