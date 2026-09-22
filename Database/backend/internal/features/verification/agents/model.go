package verification_agents

import (
	"time"

	"github.com/google/uuid"
)

type Agent struct {
	ID        uuid.UUID `json:"id"   gorm:"column:id"`
	Name      string    `json:"name" gorm:"column:name"`
	TokenHash string    `json:"-"    gorm:"column:token_hash"`

	MaxCPU            int `json:"maxCpu"            gorm:"column:max_cpu"`
	MaxRAMGb          int `json:"maxRamGb"          gorm:"column:max_ram_gb"`
	MaxDiskGb         int `json:"maxDiskGb"         gorm:"column:max_disk_gb"`
	MaxConcurrentJobs int `json:"maxConcurrentJobs" gorm:"column:max_concurrent_jobs"`

	LastSeenAt *time.Time `json:"lastSeenAt,omitzero" gorm:"column:last_seen_at"`
	CreatedAt  time.Time  `json:"createdAt"           gorm:"column:created_at"`
	DeletedAt  *time.Time `json:"-"                   gorm:"column:deleted_at"`
}

func (Agent) TableName() string {
	return "verification_agents"
}

func (a *Agent) IsDeleted() bool {
	return a.DeletedAt != nil
}

type AgentCapacity struct {
	MaxCPU            int
	MaxRAMGb          int
	MaxDiskGb         int
	MaxConcurrentJobs int
}
