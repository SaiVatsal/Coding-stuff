package telemetry

import (
	"encoding/json"
	"log/slog"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func newTestLoader(t *testing.T) (*InstanceFileLoader, string) {
	t.Helper()
	dir := t.TempDir()
	path := filepath.Join(dir, "instance.json")

	return NewInstanceFileLoader(path, slog.New(slog.DiscardHandler)), path
}

func Test_LoadOrCreate_WhenFileMissing_CreatesNewWithUUIDAndToday(t *testing.T) {
	loader, path := newTestLoader(t)

	instance, ok := loader.LoadOrCreate()
	require.True(t, ok)
	require.NotNil(t, instance)

	_, err := uuid.Parse(instance.InstanceID)
	require.NoError(t, err, "instance id should be a valid UUID")

	assert.Equal(t, time.Now().UTC().Format("2006-01-02"), instance.InstalledAt)

	data, err := os.ReadFile(path)
	require.NoError(t, err)

	var persisted Instance
	require.NoError(t, json.Unmarshal(data, &persisted))
	assert.Equal(t, instance.InstanceID, persisted.InstanceID)
	assert.Equal(t, instance.InstalledAt, persisted.InstalledAt)
}

func Test_LoadOrCreate_WhenFileExists_ReturnsExisting(t *testing.T) {
	loader, _ := newTestLoader(t)

	first, ok := loader.LoadOrCreate()
	require.True(t, ok)

	second, ok := loader.LoadOrCreate()
	require.True(t, ok)

	assert.Equal(t, first.InstanceID, second.InstanceID)
	assert.Equal(t, first.InstalledAt, second.InstalledAt)
}

func Test_LoadOrCreate_WhenFileCorrupt_ReturnsFalse(t *testing.T) {
	loader, path := newTestLoader(t)

	require.NoError(t, os.WriteFile(path, []byte("not-json"), 0o600))

	instance, ok := loader.LoadOrCreate()
	assert.False(t, ok)
	assert.Nil(t, instance)
}

func Test_LoadOrCreate_WhenFileEmpty_ReturnsFalse(t *testing.T) {
	loader, path := newTestLoader(t)

	require.NoError(t, os.WriteFile(path, []byte("{}"), 0o600))

	instance, ok := loader.LoadOrCreate()
	assert.False(t, ok)
	assert.Nil(t, instance)
}

func Test_LoadOrCreate_WhenDirectoryUnwritable_ReturnsFalse(t *testing.T) {
	dir := t.TempDir()
	// Point at a path whose parent is a regular file — making the
	// MkdirAll/WriteFile sequence impossible regardless of OS permissions.
	blocker := filepath.Join(dir, "blocker")
	require.NoError(t, os.WriteFile(blocker, []byte("x"), 0o600))

	path := filepath.Join(blocker, "nested", "instance.json")
	loader := NewInstanceFileLoader(path, slog.New(slog.DiscardHandler))

	instance, ok := loader.LoadOrCreate()
	assert.False(t, ok)
	assert.Nil(t, instance)
}
