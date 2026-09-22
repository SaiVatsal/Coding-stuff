package users_repositories

import (
	"time"

	"github.com/google/uuid"

	users_models "databasus-backend/internal/features/users/models"
	"databasus-backend/internal/storage"
)

type PasswordResetRepository struct{}

func (r *PasswordResetRepository) CreateResetCode(code *users_models.PasswordResetCode) error {
	if code.ID == uuid.Nil {
		code.ID = uuid.New()
	}

	return storage.GetDb().Create(code).Error
}

func (r *PasswordResetRepository) GetValidCodeByUserID(
	userID uuid.UUID,
) (*users_models.PasswordResetCode, error) {
	var code users_models.PasswordResetCode
	err := storage.GetDb().
		Where("user_id = ? AND is_used = ? AND expires_at > ?", userID, false, time.Now().UTC()).
		Order("created_at DESC").
		First(&code).Error
	if err != nil {
		return nil, err
	}

	return &code, nil
}

func (r *PasswordResetRepository) MarkCodeAsUsed(codeID uuid.UUID) error {
	return storage.GetDb().Model(&users_models.PasswordResetCode{}).
		Where("id = ?", codeID).
		Update("is_used", true).Error
}

func (r *PasswordResetRepository) DeleteExpiredCodes() error {
	return storage.GetDb().
		Where("expires_at < ?", time.Now().UTC()).
		Delete(&users_models.PasswordResetCode{}).Error
}

func (r *PasswordResetRepository) CountRecentCodesByUserID(
	userID uuid.UUID,
	since time.Time,
) (int64, error) {
	var count int64

	err := storage.GetDb().Model(&users_models.PasswordResetCode{}).
		Where("user_id = ? AND created_at > ?", userID, since).
		Count(&count).Error

	return count, err
}
