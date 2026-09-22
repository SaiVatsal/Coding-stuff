package verification_config

import (
	"fmt"
	"slices"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"databasus-backend/internal/features/intervals"
)

type BackupVerificationConfig struct {
	DatabaseID uuid.UUID `json:"databaseId" gorm:"column:database_id;type:uuid;primaryKey;not null"`

	IsScheduledVerificationEnabled bool `json:"isScheduledVerificationEnabled" gorm:"column:is_scheduled_verification_enabled;type:boolean;not null;default:false"`

	ScheduleType         VerificationScheduleType `json:"scheduleType"         gorm:"column:schedule_type;type:text;not null;default:'AFTER_BACKUP'"`
	VerificationInterval intervals.Interval       `json:"verificationInterval" gorm:"embedded"`

	SendNotificationsOn       []VerificationNotificationType `json:"sendNotificationsOn" gorm:"-"`
	SendNotificationsOnString string                         `json:"-"                   gorm:"column:send_notifications_on;type:text;not null;default:''"`

	CreatedAt time.Time `json:"createdAt" gorm:"column:created_at"`
	UpdatedAt time.Time `json:"updatedAt" gorm:"column:updated_at"`
}

func (BackupVerificationConfig) TableName() string {
	return "backup_verification_configs"
}

func (c *BackupVerificationConfig) BeforeSave(tx *gorm.DB) error {
	if len(c.SendNotificationsOn) > 0 {
		notificationTypes := make([]string, len(c.SendNotificationsOn))

		for i, notificationType := range c.SendNotificationsOn {
			notificationTypes[i] = string(notificationType)
		}

		c.SendNotificationsOnString = strings.Join(notificationTypes, ",")
	} else {
		c.SendNotificationsOnString = ""
	}

	return nil
}

func (c *BackupVerificationConfig) AfterFind(tx *gorm.DB) error {
	if c.SendNotificationsOnString != "" {
		notificationTypes := strings.Split(c.SendNotificationsOnString, ",")
		c.SendNotificationsOn = make([]VerificationNotificationType, len(notificationTypes))

		for i, notificationType := range notificationTypes {
			c.SendNotificationsOn[i] = VerificationNotificationType(notificationType)
		}
	} else {
		c.SendNotificationsOn = []VerificationNotificationType{}
	}

	return nil
}

func (c *BackupVerificationConfig) Validate() error {
	if c.ScheduleType != VerificationScheduleInterval && c.ScheduleType != VerificationScheduleAfterBackup {
		return fmt.Errorf("invalid verification schedule type: %q", c.ScheduleType)
	}

	if c.IsScheduledVerificationEnabled && c.ScheduleType == VerificationScheduleInterval {
		if err := c.VerificationInterval.Validate(); err != nil {
			return fmt.Errorf("verification interval: %w", err)
		}
	}

	for _, n := range c.SendNotificationsOn {
		switch n {
		case NotificationVerificationSuccess,
			NotificationVerificationFailed:
		default:
			return fmt.Errorf("invalid verification notification type: %q", n)
		}
	}

	return nil
}

func (c *BackupVerificationConfig) Copy(newDatabaseID uuid.UUID) *BackupVerificationConfig {
	return &BackupVerificationConfig{
		DatabaseID:                     newDatabaseID,
		IsScheduledVerificationEnabled: c.IsScheduledVerificationEnabled,
		ScheduleType:                   c.ScheduleType,
		VerificationInterval:           c.VerificationInterval.Copy(),
		SendNotificationsOn:            slices.Clone(c.SendNotificationsOn),
	}
}
