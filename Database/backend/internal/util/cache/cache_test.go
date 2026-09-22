package cache_utils

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func Test_ClearAllCache_AfterClear_CacheIsEmpty(t *testing.T) {
	client := getCache()

	// Arrange: Set up multiple cache entries with different prefixes
	testKeys := []struct {
		prefix string
		key    string
		value  string
	}{
		{"test:user:", "user1", "John Doe"},
		{"test:user:", "user2", "Jane Smith"},
		{"test:session:", "session1", "abc123"},
		{"test:session:", "session2", "def456"},
		{"test:data:", "item1", "value1"},
	}

	// Set all test keys
	for _, tk := range testKeys {
		cacheUtil := NewCacheUtil[string](client, tk.prefix)
		cacheUtil.Set(tk.key, &tk.value)
	}

	// Verify keys were set correctly before clearing
	for _, tk := range testKeys {
		cacheUtil := NewCacheUtil[string](client, tk.prefix)
		retrieved := cacheUtil.Get(tk.key)
		assert.NotNil(t, retrieved, "Key %s should exist before clearing", tk.prefix+tk.key)
		assert.Equal(t, tk.value, *retrieved, "Retrieved value should match set value")
	}

	// Act: Clear all cache
	err := ClearAllCache()

	// Assert: No error returned
	assert.NoError(t, err, "ClearAllCache should not return an error")

	// Assert: All keys should be deleted
	for _, tk := range testKeys {
		cacheUtil := NewCacheUtil[string](client, tk.prefix)
		retrieved := cacheUtil.Get(tk.key)
		assert.Nil(t, retrieved, "Key %s should be deleted after clearing", tk.prefix+tk.key)
	}
}

func Test_SetWithExpiration_SetsCorrectTTL(t *testing.T) {
	client := getCache()

	// Create a cache utility
	testPrefix := "test:ttl:"
	cacheUtil := NewCacheUtil[string](client, testPrefix)

	// Set a value with 1-hour expiration
	testKey := "key1"
	testValue := "test value"
	oneHour := 1 * time.Hour

	cacheUtil.SetWithExpiration(testKey, &testValue, oneHour)

	// Verify the value was set
	retrieved := cacheUtil.Get(testKey)
	assert.NotNil(t, retrieved, "Value should be stored")
	assert.Equal(t, testValue, *retrieved, "Retrieved value should match")

	// Check the TTL using Valkey TTL command
	ctx, cancel := context.WithTimeout(t.Context(), DefaultCacheTimeout)
	defer cancel()

	fullKey := testPrefix + testKey
	ttlResult := client.Do(ctx, client.B().Ttl().Key(fullKey).Build())
	assert.NoError(t, ttlResult.Error(), "TTL command should not error")

	ttlSeconds, err := ttlResult.AsInt64()
	assert.NoError(t, err, "TTL should be retrievable as int64")

	// TTL should be approximately 1 hour (3600 seconds)
	// Allow for a small margin (within 10 seconds of 3600)
	expectedTTL := int64(3600)
	assert.GreaterOrEqual(t, ttlSeconds, expectedTTL-10, "TTL should be close to 1 hour")
	assert.LessOrEqual(t, ttlSeconds, expectedTTL, "TTL should not exceed 1 hour")

	// Clean up
	cacheUtil.Invalidate(testKey)
}
