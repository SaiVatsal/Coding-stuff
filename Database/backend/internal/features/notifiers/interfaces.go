package notifiers

import (
	"log/slog"

	"github.com/google/uuid"

	notifier_models "databasus-backend/internal/features/notifiers/models"
	"databasus-backend/internal/util/encryption"
)

type NotificationSender interface {
	Send(
		encryptor encryption.FieldEncryptor,
		logger *slog.Logger,
		notification notifier_models.Notification,
	) error

	Validate(encryptor encryption.FieldEncryptor) error

	HideSensitiveData()

	EncryptSensitiveData(encryptor encryption.FieldEncryptor) error
}

type NotifierDatabaseCounter interface {
	GetNotifierAttachedDatabasesIDs(notifierID uuid.UUID) ([]uuid.UUID, error)
}
