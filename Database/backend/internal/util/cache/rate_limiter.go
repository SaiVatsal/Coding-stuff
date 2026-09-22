package cache_utils

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/valkey-io/valkey-go"
)

type RateLimiter struct {
	client valkey.Client
}

func NewRateLimiter(client valkey.Client) *RateLimiter {
	return &RateLimiter{
		client: client,
	}
}

func (r *RateLimiter) CheckLimit(
	identifier string,
	endpoint string,
	maxRequests int,
	windowDuration time.Duration,
) (bool, error) {
	requestID := uuid.New().String()
	keyPrefix := fmt.Sprintf("ratelimit:%s:%s", endpoint, identifier)
	fullKey := fmt.Sprintf("%s:%s", keyPrefix, requestID)

	ctx, cancel := context.WithTimeout(context.Background(), DefaultCacheTimeout)
	defer cancel()

	// Set the key with TTL
	setCmd := r.client.B().
		Set().
		Key(fullKey).
		Value("1").
		ExSeconds(int64(windowDuration.Seconds())).
		Build()
	if err := r.client.Do(ctx, setCmd).Error(); err != nil {
		return true, fmt.Errorf("failed to set rate limit key: %w", err)
	}

	// Count keys matching the pattern
	count, err := r.countKeys(keyPrefix)
	if err != nil {
		return true, fmt.Errorf("failed to count rate limit keys: %w", err)
	}

	return count <= maxRequests, nil
}

func (r *RateLimiter) countKeys(keyPrefix string) (int, error) {
	pattern := keyPrefix + ":*"
	cursor := uint64(0)
	totalCount := 0

	for {
		ctx, cancel := context.WithTimeout(context.Background(), DefaultCacheTimeout)

		scanCmd := r.client.B().Scan().Cursor(cursor).Match(pattern).Count(100).Build()
		result := r.client.Do(ctx, scanCmd)
		cancel()

		if result.Error() != nil {
			return 0, result.Error()
		}

		scanResult, err := result.AsScanEntry()
		if err != nil {
			return 0, err
		}

		totalCount += len(scanResult.Elements)
		cursor = scanResult.Cursor

		if cursor == 0 {
			break
		}
	}

	return totalCount, nil
}
