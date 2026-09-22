package verification_agents

import "errors"

var (
	ErrAgentNotFound     = errors.New("verification agent not found")
	ErrInvalidAgentToken = errors.New("invalid agent token")
)
