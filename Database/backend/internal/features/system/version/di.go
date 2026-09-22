package system_version

var versionController = &VersionController{}

func GetVersionController() *VersionController {
	return versionController
}
