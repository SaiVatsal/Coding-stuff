package container

type ManagedContainer struct {
	ID             string
	NetworkID      string
	VerificationID string
	CreatedUnix    int64
}
