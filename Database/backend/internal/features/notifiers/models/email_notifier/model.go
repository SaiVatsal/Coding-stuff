package email_notifier

import (
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"log/slog"
	"mime"
	"net"
	"net/smtp"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"

	notifier_models "databasus-backend/internal/features/notifiers/models"
	"databasus-backend/internal/util/encryption"
)

const (
	ImplicitTLSPort = 465
	DefaultTimeout  = 5 * time.Second
	MIMETypeHTML    = "text/html"
	MIMECharsetUTF8 = "UTF-8"
)

type EmailNotifier struct {
	NotifierID           uuid.UUID `json:"notifierId"           gorm:"primaryKey;type:uuid;column:notifier_id"`
	TargetEmail          string    `json:"targetEmail"          gorm:"not null;type:varchar(255);column:target_email"`
	SMTPHost             string    `json:"smtpHost"             gorm:"not null;type:varchar(255);column:smtp_host"`
	SMTPPort             int       `json:"smtpPort"             gorm:"not null;column:smtp_port"`
	SMTPUser             string    `json:"smtpUser"             gorm:"type:varchar(255);column:smtp_user"`
	SMTPPassword         string    `json:"smtpPassword"         gorm:"type:varchar(255);column:smtp_password"`
	From                 string    `json:"from"                 gorm:"type:varchar(255);column:from_email"`
	IsInsecureSkipVerify bool      `json:"isInsecureSkipVerify" gorm:"default:false;column:is_insecure_skip_verify"`
}

func (e *EmailNotifier) TableName() string {
	return "email_notifiers"
}

func (e *EmailNotifier) Validate(encryptor encryption.FieldEncryptor) error {
	if e.TargetEmail == "" {
		return errors.New("target email is required")
	}

	if e.SMTPHost == "" {
		return errors.New("SMTP host is required")
	}

	if e.SMTPPort == 0 {
		return errors.New("SMTP port is required")
	}

	// Authentication is optional - both user and password must be provided together or both empty
	if (e.SMTPUser == "") != (e.SMTPPassword == "") {
		return errors.New("SMTP user and password must both be provided or both be empty")
	}

	return nil
}

func (e *EmailNotifier) Send(
	encryptor encryption.FieldEncryptor,
	_ *slog.Logger,
	notification notifier_models.Notification,
) error {
	var smtpPassword string
	if e.SMTPPassword != "" {
		decrypted, err := encryptor.Decrypt(e.SMTPPassword)
		if err != nil {
			return fmt.Errorf("failed to decrypt SMTP password: %w", err)
		}
		smtpPassword = decrypted
	}

	from := e.From
	if from == "" {
		from = e.SMTPUser
		if from == "" {
			from = "noreply@" + e.SMTPHost
		}
	}

	emailContent := e.buildEmailContent(notification.Heading, notification.Message, from)
	isAuthRequired := e.SMTPUser != "" && smtpPassword != ""

	if e.SMTPPort == ImplicitTLSPort {
		return e.sendImplicitTLS(emailContent, from, smtpPassword, isAuthRequired)
	}
	return e.sendStartTLS(emailContent, from, smtpPassword, isAuthRequired)
}

func (e *EmailNotifier) HideSensitiveData() {
	e.SMTPPassword = ""
}

func (e *EmailNotifier) Update(incoming *EmailNotifier) {
	e.TargetEmail = incoming.TargetEmail
	e.SMTPHost = incoming.SMTPHost
	e.SMTPPort = incoming.SMTPPort
	e.SMTPUser = incoming.SMTPUser
	e.From = incoming.From
	e.IsInsecureSkipVerify = incoming.IsInsecureSkipVerify

	if incoming.SMTPPassword != "" {
		e.SMTPPassword = incoming.SMTPPassword
	}
}

func (e *EmailNotifier) EncryptSensitiveData(encryptor encryption.FieldEncryptor) error {
	if e.SMTPPassword != "" {
		encrypted, err := encryptor.Encrypt(e.SMTPPassword)
		if err != nil {
			return fmt.Errorf("failed to encrypt SMTP password: %w", err)
		}
		e.SMTPPassword = encrypted
	}
	return nil
}

func getHelloName() string {
	hostname, err := os.Hostname()

	if err != nil || hostname == "" {
		return "localhost"
	}

	return hostname
}

// encodeRFC2047 encodes a string using RFC 2047 MIME encoding for email headers
// This ensures compatibility with SMTP servers that don't support SMTPUTF8
func encodeRFC2047(s string) string {
	// mime.QEncoding handles UTF-8 → =?UTF-8?Q?...?= encoding
	// This allows non-ASCII characters (emojis, accents, etc.) in email headers
	// while maintaining compatibility with all SMTP servers
	return mime.QEncoding.Encode("UTF-8", s)
}

// sanitizeHeaderValue strips CR, LF, and NUL to prevent SMTP header injection:
// a CRLF inside a header value would start a new header (e.g. Bcc:) or
// terminate the header block, letting an attacker rewrite the envelope.
func sanitizeHeaderValue(value string) string {
	value = strings.ReplaceAll(value, "\r", "")
	value = strings.ReplaceAll(value, "\n", "")
	value = strings.ReplaceAll(value, "\x00", "")

	return value
}

func (e *EmailNotifier) buildEmailContent(heading, message, from string) []byte {
	safeHeading := sanitizeHeaderValue(heading)
	safeFrom := sanitizeHeaderValue(from)
	safeTargetEmail := sanitizeHeaderValue(e.TargetEmail)
	safeSMTPHost := sanitizeHeaderValue(e.SMTPHost)

	// Encode Subject header using RFC 2047 to avoid SMTPUTF8 requirement
	// This ensures compatibility with SMTP servers that don't support SMTPUTF8
	encodedSubject := encodeRFC2047(safeHeading)
	subject := fmt.Sprintf("Subject: %s\r\n", encodedSubject)
	dateHeader := fmt.Sprintf("Date: %s\r\n", time.Now().UTC().Format(time.RFC1123Z))
	messageID := fmt.Sprintf("Message-ID: <%s@%s>\r\n", uuid.New().String(), safeSMTPHost)

	mimeHeaders := fmt.Sprintf(
		"MIME-version: 1.0;\nContent-Type: %s; charset=\"%s\";\n\n",
		MIMETypeHTML,
		MIMECharsetUTF8,
	)

	// Encode From header display name if it contains non-ASCII
	encodedFrom := encodeRFC2047(safeFrom)
	fromHeader := fmt.Sprintf("From: %s\r\n", encodedFrom)

	toHeader := fmt.Sprintf("To: %s\r\n", safeTargetEmail)

	return []byte(fromHeader + toHeader + subject + dateHeader + messageID + mimeHeaders + message)
}

func (e *EmailNotifier) sendImplicitTLS(
	emailContent []byte,
	from string,
	password string,
	isAuthRequired bool,
) error {
	createClient := func() (*smtp.Client, func(), error) {
		return e.createImplicitTLSClient()
	}

	client, cleanup, err := e.authenticateWithRetry(createClient, password, isAuthRequired)
	if err != nil {
		return err
	}
	defer cleanup()

	return e.sendEmail(client, from, emailContent)
}

func (e *EmailNotifier) sendStartTLS(
	emailContent []byte,
	from string,
	password string,
	isAuthRequired bool,
) error {
	createClient := func() (*smtp.Client, func(), error) {
		return e.createStartTLSClient()
	}

	client, cleanup, err := e.authenticateWithRetry(createClient, password, isAuthRequired)
	if err != nil {
		return err
	}
	defer cleanup()

	return e.sendEmail(client, from, emailContent)
}

func (e *EmailNotifier) createImplicitTLSClient() (*smtp.Client, func(), error) {
	addr := net.JoinHostPort(e.SMTPHost, fmt.Sprintf("%d", e.SMTPPort))
	tlsConfig := &tls.Config{
		ServerName:         e.SMTPHost,
		InsecureSkipVerify: e.IsInsecureSkipVerify,
	}
	dialer := &net.Dialer{Timeout: DefaultTimeout}

	conn, err := (&tls.Dialer{NetDialer: dialer, Config: tlsConfig}).DialContext(context.Background(), "tcp", addr)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to connect to SMTP server: %w", err)
	}

	client, err := smtp.NewClient(conn, e.SMTPHost)
	if err != nil {
		_ = conn.Close()
		return nil, nil, fmt.Errorf("failed to create SMTP client: %w", err)
	}

	return client, func() { _ = client.Quit() }, nil
}

func (e *EmailNotifier) createStartTLSClient() (*smtp.Client, func(), error) {
	addr := net.JoinHostPort(e.SMTPHost, fmt.Sprintf("%d", e.SMTPPort))
	dialer := &net.Dialer{Timeout: DefaultTimeout}

	conn, err := dialer.Dial("tcp", addr)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to connect to SMTP server: %w", err)
	}

	client, err := smtp.NewClient(conn, e.SMTPHost)
	if err != nil {
		_ = conn.Close()
		return nil, nil, fmt.Errorf("failed to create SMTP client: %w", err)
	}

	if err := client.Hello(getHelloName()); err != nil {
		_ = client.Quit()
		_ = conn.Close()
		return nil, nil, fmt.Errorf("SMTP hello failed: %w", err)
	}

	if ok, _ := client.Extension("STARTTLS"); ok {
		if err := client.StartTLS(&tls.Config{
			ServerName:         e.SMTPHost,
			InsecureSkipVerify: e.IsInsecureSkipVerify,
		}); err != nil {
			_ = client.Quit()
			_ = conn.Close()
			return nil, nil, fmt.Errorf("STARTTLS failed: %w", err)
		}
	}

	return client, func() { _ = client.Quit() }, nil
}

func (e *EmailNotifier) authenticateWithRetry(
	createClient func() (*smtp.Client, func(), error),
	password string,
	isAuthRequired bool,
) (*smtp.Client, func(), error) {
	client, cleanup, err := createClient()
	if err != nil {
		return nil, nil, err
	}

	if !isAuthRequired {
		return client, cleanup, nil
	}

	// Try PLAIN auth first
	plainAuth := smtp.PlainAuth("", e.SMTPUser, password, e.SMTPHost)
	if err := client.Auth(plainAuth); err == nil {
		return client, cleanup, nil
	}

	// PLAIN auth failed, connection may be closed - recreate and try LOGIN auth
	cleanup()

	client, cleanup, err = createClient()
	if err != nil {
		return nil, nil, err
	}

	loginAuth := &loginAuth{username: e.SMTPUser, password: password}
	if err := client.Auth(loginAuth); err != nil {
		cleanup()
		return nil, nil, fmt.Errorf("SMTP authentication failed: %w", err)
	}

	return client, cleanup, nil
}

func (e *EmailNotifier) sendEmail(client *smtp.Client, from string, content []byte) error {
	if err := client.Mail(from); err != nil {
		return fmt.Errorf("failed to set sender: %w", err)
	}

	if err := client.Rcpt(e.TargetEmail); err != nil {
		return fmt.Errorf("failed to set recipient: %w", err)
	}

	writer, err := client.Data()
	if err != nil {
		return fmt.Errorf("failed to get data writer: %w", err)
	}

	if _, err = writer.Write(content); err != nil {
		return fmt.Errorf("failed to write email content: %w", err)
	}

	if err = writer.Close(); err != nil {
		return fmt.Errorf("failed to close data writer: %w", err)
	}

	return nil
}
