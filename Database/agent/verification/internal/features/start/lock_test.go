//go:build !windows

package start

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"databasus-verification-agent/internal/logger"
)

func Test_AcquireLock_LockFileCreatedWithPID(t *testing.T) {
	setupTempDir(t)
	log := logger.GetLogger()

	lockFile, err := AcquireLock(log)
	require.NoError(t, err)
	defer ReleaseLock(lockFile)

	data, err := os.ReadFile(lockFileName)
	require.NoError(t, err)

	pid, err := strconv.Atoi(strings.TrimSpace(string(data)))
	require.NoError(t, err)
	assert.Equal(t, os.Getpid(), pid)
}

func Test_AcquireLock_SecondAcquireFails_WhenFirstHeld(t *testing.T) {
	setupTempDir(t)
	log := logger.GetLogger()

	first, err := AcquireLock(log)
	require.NoError(t, err)
	defer ReleaseLock(first)

	second, err := AcquireLock(log)
	assert.Nil(t, second)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "another instance is already running")
	assert.Contains(t, err.Error(), fmt.Sprintf("PID %d", os.Getpid()))
}

func Test_AcquireLock_StaleLockReacquired_WhenProcessDead(t *testing.T) {
	setupTempDir(t)
	log := logger.GetLogger()

	err := os.WriteFile(lockFileName, []byte("999999999\n"), 0o644)
	require.NoError(t, err)

	lockFile, err := AcquireLock(log)
	require.NoError(t, err)
	defer ReleaseLock(lockFile)

	data, err := os.ReadFile(lockFileName)
	require.NoError(t, err)

	pid, err := strconv.Atoi(strings.TrimSpace(string(data)))
	require.NoError(t, err)
	assert.Equal(t, os.Getpid(), pid)
}

func Test_ReleaseLock_LockFileRemoved(t *testing.T) {
	setupTempDir(t)
	log := logger.GetLogger()

	lockFile, err := AcquireLock(log)
	require.NoError(t, err)

	ReleaseLock(lockFile)

	_, err = os.Stat(lockFileName)
	assert.True(t, os.IsNotExist(err))
}

func Test_AcquireLock_ReacquiredAfterRelease(t *testing.T) {
	setupTempDir(t)
	log := logger.GetLogger()

	first, err := AcquireLock(log)
	require.NoError(t, err)
	ReleaseLock(first)

	second, err := AcquireLock(log)
	require.NoError(t, err)
	defer ReleaseLock(second)

	data, err := os.ReadFile(lockFileName)
	require.NoError(t, err)

	pid, err := strconv.Atoi(strings.TrimSpace(string(data)))
	require.NoError(t, err)
	assert.Equal(t, os.Getpid(), pid)
}

func Test_isProcessAlive_ReturnsTrueForSelf(t *testing.T) {
	assert.True(t, isProcessAlive(os.Getpid()))
}

func Test_isProcessAlive_ReturnsFalseForNonExistentPID(t *testing.T) {
	assert.False(t, isProcessAlive(999999999))
}

func Test_readLockPID_ParsesValidPID(t *testing.T) {
	setupTempDir(t)

	f, err := os.CreateTemp("", "lock-test-*")
	require.NoError(t, err)
	defer os.Remove(f.Name())

	_, err = f.WriteString("12345\n")
	require.NoError(t, err)

	pid, err := readLockPID(f)
	require.NoError(t, err)
	assert.Equal(t, 12345, pid)
}

func Test_readLockPID_ReturnsErrorForEmptyFile(t *testing.T) {
	setupTempDir(t)

	f, err := os.CreateTemp("", "lock-test-*")
	require.NoError(t, err)
	defer os.Remove(f.Name())

	_, err = readLockPID(f)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "lock file is empty")
}

func setupTempDir(t *testing.T) string {
	t.Helper()

	origDir, err := os.Getwd()
	require.NoError(t, err)

	dir := t.TempDir()
	require.NoError(t, os.Chdir(dir))

	t.Cleanup(func() { _ = os.Chdir(origDir) })

	return dir
}
