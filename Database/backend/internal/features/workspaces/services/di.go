package workspaces_services

import (
	"databasus-backend/internal/features/audit_logs"
	"databasus-backend/internal/features/email"
	users_services "databasus-backend/internal/features/users/services"
	workspaces_interfaces "databasus-backend/internal/features/workspaces/interfaces"
	workspaces_repositories "databasus-backend/internal/features/workspaces/repositories"
	"databasus-backend/internal/util/logger"
)

var (
	workspaceRepository  = &workspaces_repositories.WorkspaceRepository{}
	membershipRepository = &workspaces_repositories.MembershipRepository{}
)

var workspaceService = &WorkspaceService{
	workspaceRepository,
	membershipRepository,
	users_services.GetUserService(),
	audit_logs.GetAuditLogService(),
	users_services.GetSettingsService(),
	[]workspaces_interfaces.WorkspaceDeletionListener{},
}

var membershipService = &MembershipService{
	membershipRepository,
	workspaceRepository,
	users_services.GetUserService(),
	audit_logs.GetAuditLogService(),
	workspaceService,
	users_services.GetSettingsService(),
	email.GetEmailSMTPSender(),
	logger.GetLogger(),
}

func GetWorkspaceService() *WorkspaceService {
	return workspaceService
}

func GetMembershipService() *MembershipService {
	return membershipService
}
