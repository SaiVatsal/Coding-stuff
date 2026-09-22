//go:build !windows

package start

import (
	"context"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"databasus-verification-agent/internal/logger"
)

func Test_NewLockWatcher_CapturesInode(t *testing.T) {
	setupTempDir(t)
	log := logger.GetLogger()

	lockFile, err := AcquireLock(log)
	require.NoError(t, err)
	defer ReleaseLock(lockFile)

	_, cancel := context.WithCancel(t.Context())
	defer cancel()

	watcher, err := NewLockWatcher(lockFile, cancel, log)
	require.NoError(t, err)
	assert.NotZero(t, watcher.originalInode)
}

func Test_LockWatcher_FileUnchanged_ContextNotCancelled(t *testing.T) {
	setupTempDir(t)
	log := logger.GetLogger()

	lockFile, err := AcquireLock(log)
	require.NoError(t, err)
	defer ReleaseLock(lockFile)

	ctx, cancel := context.WithCancel(t.Context())
	defer cancel()

	watcher, err := NewLockWatcher(lockFile, cancel, log)
	require.NoError(t, err)

	watcher.check()
	watcher.check()
	watcher.check()

	select {
	case <-ctx.Done():
		t.Fatal("context should not be cancelled when lock file is unchanged")
	default:
	}
}

func Test_LockWatcher_FileDeleted_CancelsContext(t *testing.T) {
	setupTempDir(t)
	log := logger.GetLogger()

	lockFile, err := AcquireLock(log)
	require.NoError(t, err)
	defer ReleaseLock(lockFile)

	ctx, cancel := context.WithCancel(t.Context())
	defer cancel()

	watcher, err := NewLockWatcher(lockFile, cancel, log)
	require.NoError(t, err)

	err = os.Remove(lockFileName)
	require.NoError(t, err)

	watcher.check()

	select {
	case <-ctx.Done():
	default:
		t.Fatal("context should be cancelled when lock file is deleted")
	}
}

func Test_LockWatcher_FileReplacedWithDifferentInode_CancelsContext(t *testing.T) {
	setupTempDir(t)
	log := logger.GetLogger()

	lockFile, err := AcquireLock(log)
	require.NoError(t, err)
	defer ReleaseLock(lockFile)

	ctx, cancel := context.WithCancel(t.Context())
	defer cancel()

	watcher, err := NewLockWatcher(lockFile, cancel, log)
	require.NoError(t, err)

	err = os.Remove(lockFileName)
	require.NoError(t, err)

	err = os.WriteFile(lockFileName, []byte("99999\n"), 0o644)
	require.NoError(t, err)

	watcher.check()

	select {
	case <-ctx.Done():
	default:
		t.Fatal("context should be cancelled when lock file inode changes")
	}
}
