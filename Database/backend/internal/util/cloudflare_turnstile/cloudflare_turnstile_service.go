package cloudflare_turnstile

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type CloudflareTurnstileService struct {
	secretKey string
	siteKey   string
}

type cloudflareTurnstileResponse struct {
	Success     bool      `json:"success"`
	ChallengeTS time.Time `json:"challenge_ts"`
	Hostname    string    `json:"hostname"`
	ErrorCodes  []string  `json:"error-codes"`
}

const cloudflareTurnstileVerifyURL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

func (s *CloudflareTurnstileService) IsEnabled() bool {
	return s.secretKey != ""
}

func (s *CloudflareTurnstileService) VerifyToken(token, remoteIP string) (bool, error) {
	if !s.IsEnabled() {
		return true, nil
	}

	if token == "" {
		return false, errors.New("cloudflare Turnstile token is required")
	}

	formData := url.Values{}
	formData.Set("secret", s.secretKey)
	formData.Set("response", token)
	formData.Set("remoteip", remoteIP)

	req, err := http.NewRequestWithContext(
		context.Background(), "POST", cloudflareTurnstileVerifyURL, strings.NewReader(formData.Encode()),
	)
	if err != nil {
		return false, fmt.Errorf("failed to create Cloudflare Turnstile request: %w", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return false, fmt.Errorf("failed to verify Cloudflare Turnstile: %w", err)
	}
	defer func() {
		_ = resp.Body.Close()
	}()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return false, fmt.Errorf("failed to read Cloudflare Turnstile response: %w", err)
	}

	var turnstileResp cloudflareTurnstileResponse
	if err := json.Unmarshal(body, &turnstileResp); err != nil {
		return false, fmt.Errorf("failed to parse Cloudflare Turnstile response: %w", err)
	}

	if !turnstileResp.Success {
		return false, fmt.Errorf(
			"cloudflare Turnstile verification failed: %v",
			turnstileResp.ErrorCodes,
		)
	}

	return true, nil
}
