package workspaces_interfaces

import "github.com/google/uuid"

type WorkspaceDeletionListener interface {
	OnBeforeWorkspaceDeletion(workspaceID uuid.UUID) error
}

type EmailSender interface {
	SendEmail(to, subject, body string) error
}
