package encryption

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"

	"databasus-backend/internal/features/encryption/secrets"
)

const encryptedPrefix = "enc:"

type SecretKeyFieldEncryptor struct {
	secretKeyService *secrets.SecretKeyService
}

func (e *SecretKeyFieldEncryptor) Encrypt(plaintext string) (string, error) {
	if plaintext == "" {
		return "", nil
	}

	if e.isEncrypted(plaintext) {
		return plaintext, nil
	}

	masterKey, err := e.secretKeyService.GetSecretKey()
	if err != nil {
		return "", fmt.Errorf("failed to get master key: %w", err)
	}

	block, err := aes.NewCipher([]byte(masterKey)[:32])
	if err != nil {
		return "", fmt.Errorf("failed to create cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("failed to create GCM: %w", err)
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return "", fmt.Errorf("failed to generate nonce: %w", err)
	}

	ciphertext := gcm.Seal(nil, nonce, []byte(plaintext), nil)

	nonceBase64 := base64.StdEncoding.EncodeToString(nonce)
	ciphertextBase64 := base64.StdEncoding.EncodeToString(ciphertext)

	return fmt.Sprintf("%s%s:%s", encryptedPrefix, nonceBase64, ciphertextBase64), nil
}

func (e *SecretKeyFieldEncryptor) Decrypt(ciphertext string) (string, error) {
	if ciphertext == "" {
		return "", nil
	}

	if !e.isEncrypted(ciphertext) {
		return ciphertext, nil
	}

	parts := strings.SplitN(ciphertext, ":", 3)
	if len(parts) != 3 {
		return "", errors.New("invalid encrypted format")
	}

	nonceBase64 := parts[1]
	ciphertextBase64 := parts[2]

	nonce, err := base64.StdEncoding.DecodeString(nonceBase64)
	if err != nil {
		return "", fmt.Errorf("failed to decode nonce: %w", err)
	}

	encryptedData, err := base64.StdEncoding.DecodeString(ciphertextBase64)
	if err != nil {
		return "", fmt.Errorf("failed to decode ciphertext: %w", err)
	}

	masterKey, err := e.secretKeyService.GetSecretKey()
	if err != nil {
		return "", fmt.Errorf("failed to get master key: %w", err)
	}

	block, err := aes.NewCipher([]byte(masterKey)[:32])
	if err != nil {
		return "", fmt.Errorf("failed to create cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("failed to create GCM: %w", err)
	}

	plaintext, err := gcm.Open(nil, nonce, encryptedData, nil)
	if err != nil {
		return "", fmt.Errorf("failed to decrypt: %w", err)
	}

	return string(plaintext), nil
}

func (e *SecretKeyFieldEncryptor) isEncrypted(value string) bool {
	return strings.HasPrefix(value, encryptedPrefix)
}
