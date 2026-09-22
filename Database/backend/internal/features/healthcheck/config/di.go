package healthcheck_config

import (
	"sync"

	"databasus-backend/internal/features/audit_logs"
	"databasus-backend/internal/features/databases"
	workspaces_services "databasus-backend/internal/features/workspaces/services"
	"databasus-backend/internal/util/logger"
)

var (
	healthcheckConfigRepository = &HealthcheckConfigRepository{}
	healthcheckConfigService    = &HealthcheckConfigService{
		databases.GetDatabaseService(),
		healthcheckConfigRepository,
		workspaces_services.GetWorkspaceService(),
		audit_logs.GetAuditLogService(),
		logger.GetLogger(),
	}
)

var healthcheckConfigController = &HealthcheckConfigController{
	healthcheckConfigService,
}

func GetHealthcheckConfigService() *HealthcheckConfigService {
	return healthcheckConfigService
}

func GetHealthcheckConfigController() *HealthcheckConfigController {
	return healthcheckConfigController
}

var SetupDependencies = sync.OnceFunc(func() {
	databases.
		GetDatabaseService().
		AddDbCreationListener(healthcheckConfigService)
})
