package encryption

import (
	"crypto/rand"
	"math/big"
)

// GenerateComplexPassword creates a password that meets common cloud provider requirements:
// - At least one lowercase letter
// - At least one uppercase letter
// - At least one digit
// - At least one special character
// - 24 characters for security
func GenerateComplexPassword() string {
	const (
		lowercase = "abcdefghijklmnopqrstuvwxyz"
		uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
		digits    = "0123456789"
		special   = "!@#$%^&*()-_=+"
		all       = lowercase + uppercase + digits + special
	)

	password := make([]byte, 24)

	// Ensure at least one character from each required set
	password[0] = randomChar(lowercase)
	password[1] = randomChar(uppercase)
	password[2] = randomChar(digits)
	password[3] = randomChar(special)

	// Fill the rest with random characters from all sets
	for i := 4; i < len(password); i++ {
		password[i] = randomChar(all)
	}

	// Shuffle the password to avoid predictable positions
	shuffleBytes(password)

	return string(password)
}

func randomChar(charset string) byte {
	n, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
	if err != nil {
		return charset[0]
	}
	return charset[n.Int64()]
}

func shuffleBytes(b []byte) {
	for i := len(b) - 1; i > 0; i-- {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(i+1)))
		if err != nil {
			continue
		}
		j := n.Int64()
		b[i], b[j] = b[j], b[i]
	}
}
