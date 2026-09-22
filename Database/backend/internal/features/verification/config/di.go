package verification_config

import (
	"sync"

	"databasus-backend/internal/features/audit_logs"
	"databasus-backend/internal/features/databases"
	workspaces_services "databasus-backend/internal/features/workspaces/services"
	"databasus-backend/internal/util/logger"
)

var verificationConfigRepository = &VerificationConfigRepository{}

var verificationConfigService = &VerificationConfigService{
	verificationConfigRepository,
	databases.GetDatabaseService(),
	workspaces_services.GetWorkspaceService(),
	audit_logs.GetAuditLogService(),
	logger.GetLogger(),
}

var verificationConfigController = &VerificationConfigController{
	verificationConfigService,
}

func GetVerificationConfigService() *VerificationConfigService {
	return verificationConfigService
}

func GetVerificationConfigController() *VerificationConfigController {
	return verificationConfigController
}

var SetupDependencies = sync.OnceFunc(func() {
	databases.GetDatabaseService().AddDbCopyListener(verificationConfigService)
})
