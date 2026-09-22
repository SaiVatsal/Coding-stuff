package encryption

import (
	"encoding/base64"
	"fmt"
	"io"

	"github.com/google/uuid"
)

// EncryptionSetup holds the result of setting up encryption for a backup stream.
type EncryptionSetup struct {
	Writer      *EncryptionWriter
	SaltBase64  string
	NonceBase64 string
}

// SetupEncryptionWriter generates salt/nonce, creates an EncryptionWriter, and
// returns the base64-encoded salt and nonce for storage on the backup record.
func SetupEncryptionWriter(
	baseWriter io.Writer,
	masterKey string,
	backupID uuid.UUID,
) (*EncryptionSetup, error) {
	salt, err := GenerateSalt()
	if err != nil {
		return nil, fmt.Errorf("failed to generate salt: %w", err)
	}

	nonce, err := GenerateNonce()
	if err != nil {
		return nil, fmt.Errorf("failed to generate nonce: %w", err)
	}

	encWriter, err := NewEncryptionWriter(baseWriter, masterKey, backupID, salt, nonce)
	if err != nil {
		return nil, fmt.Errorf("failed to create encryption writer: %w", err)
	}

	return &EncryptionSetup{
		Writer:      encWriter,
		SaltBase64:  base64.StdEncoding.EncodeToString(salt),
		NonceBase64: base64.StdEncoding.EncodeToString(nonce),
	}, nil
}
