package users_repositories

var (
	userRepository          = &UserRepository{}
	usersSettingsRepository = &UsersSettingsRepository{}
	passwordResetRepository = &PasswordResetRepository{}
)

func GetUserRepository() *UserRepository {
	return userRepository
}

func GetUsersSettingsRepository() *UsersSettingsRepository {
	return usersSettingsRepository
}

func GetPasswordResetRepository() *PasswordResetRepository {
	return passwordResetRepository
}
