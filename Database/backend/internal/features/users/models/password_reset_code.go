package users_models

import (
	"time"

	"github.com/google/uuid"
)

type PasswordResetCode struct {
	ID         uuid.UUID `json:"id"        gorm:"column:id"`
	UserID     uuid.UUID `json:"userId"    gorm:"column:user_id"`
	HashedCode string    `json:"-"         gorm:"column:hashed_code"`
	ExpiresAt  time.Time `json:"expiresAt" gorm:"column:expires_at"`
	IsUsed     bool      `json:"isUsed"    gorm:"column:is_used"`
	CreatedAt  time.Time `json:"createdAt" gorm:"column:created_at"`
}

func (PasswordResetCode) TableName() string {
	return "password_reset_codes"
}

func (p *PasswordResetCode) IsValid() bool {
	return !p.IsUsed && time.Now().UTC().Before(p.ExpiresAt)
}
