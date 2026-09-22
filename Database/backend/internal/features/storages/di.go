package storages

import (
	"sync"

	audit_logs "databasus-backend/internal/features/audit_logs"
	workspaces_services "databasus-backend/internal/features/workspaces/services"
	"databasus-backend/internal/util/encryption"
)

var (
	storageRepository = &StorageRepository{}
	storageService    = &StorageService{
		storageRepository,
		workspaces_services.GetWorkspaceService(),
		audit_logs.GetAuditLogService(),
		encryption.GetFieldEncryptor(),
		nil,
	}
)

var storageController = &StorageController{
	storageService,
	workspaces_services.GetWorkspaceService(),
}

func GetStorageService() *StorageService {
	return storageService
}

func GetStorageController() *StorageController {
	return storageController
}

var SetupDependencies = sync.OnceFunc(func() {
	workspaces_services.GetWorkspaceService().AddWorkspaceDeletionListener(storageService)
})
