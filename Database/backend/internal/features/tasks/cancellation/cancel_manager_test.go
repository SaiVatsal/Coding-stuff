package task_cancellation

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func Test_RegisterTask_TaskRegisteredSuccessfully(t *testing.T) {
	manager := taskCancelManager

	taskID := uuid.New()
	_, cancel := context.WithCancel(t.Context())
	defer cancel()

	manager.RegisterTask(taskID, cancel)

	manager.mu.RLock()
	_, exists := manager.cancelFuncs[taskID]
	manager.mu.RUnlock()
	assert.True(t, exists, "Task should be registered")
}

func Test_UnregisterTask_TaskUnregisteredSuccessfully(t *testing.T) {
	manager := taskCancelManager

	taskID := uuid.New()
	_, cancel := context.WithCancel(t.Context())
	defer cancel()

	manager.RegisterTask(taskID, cancel)
	manager.UnregisterTask(taskID)

	manager.mu.RLock()
	_, exists := manager.cancelFuncs[taskID]
	manager.mu.RUnlock()
	assert.False(t, exists, "Task should be unregistered")
}

func Test_CancelTask_OnSameInstance_TaskCancelledViaPubSub(t *testing.T) {
	manager := taskCancelManager

	taskID := uuid.New()
	ctx, cancel := context.WithCancel(t.Context())

	cancelled := false
	var mu sync.Mutex

	wrappedCancel := func() {
		mu.Lock()
		cancelled = true
		mu.Unlock()
		cancel()
	}

	manager.RegisterTask(taskID, wrappedCancel)
	manager.StartSubscription()
	time.Sleep(100 * time.Millisecond)

	err := manager.CancelTask(taskID)
	assert.NoError(t, err, "Cancel should not return error")

	time.Sleep(500 * time.Millisecond)

	mu.Lock()
	wasCancelled := cancelled
	mu.Unlock()

	assert.True(t, wasCancelled, "Cancel function should have been called")
	assert.Error(t, ctx.Err(), "Context should be cancelled")
}

func Test_CancelTask_FromDifferentInstance_TaskCancelledOnRunningInstance(t *testing.T) {
	manager1 := taskCancelManager
	manager2 := taskCancelManager

	taskID := uuid.New()
	ctx, cancel := context.WithCancel(t.Context())

	cancelled := false
	var mu sync.Mutex

	wrappedCancel := func() {
		mu.Lock()
		cancelled = true
		mu.Unlock()
		cancel()
	}

	manager1.RegisterTask(taskID, wrappedCancel)

	manager1.StartSubscription()
	manager2.StartSubscription()
	time.Sleep(100 * time.Millisecond)

	err := manager2.CancelTask(taskID)
	assert.NoError(t, err, "Cancel should not return error")

	time.Sleep(500 * time.Millisecond)

	mu.Lock()
	wasCancelled := cancelled
	mu.Unlock()

	assert.True(t, wasCancelled, "Cancel function should have been called on instance 1")
	assert.Error(t, ctx.Err(), "Context should be cancelled")
}

func Test_CancelTask_WhenTaskDoesNotExist_NoErrorReturned(t *testing.T) {
	manager := taskCancelManager

	manager.StartSubscription()
	time.Sleep(100 * time.Millisecond)

	nonExistentID := uuid.New()
	err := manager.CancelTask(nonExistentID)
	assert.NoError(t, err, "Cancelling non-existent task should not error")
}

func Test_CancelTask_WithMultipleTasks_AllTasksCancelled(t *testing.T) {
	manager := taskCancelManager

	numTasks := 5
	taskIDs := make([]uuid.UUID, numTasks)
	contexts := make([]context.Context, numTasks)
	cancels := make([]context.CancelFunc, numTasks)
	cancelledFlags := make([]bool, numTasks)
	var mu sync.Mutex

	for i := range numTasks {
		taskIDs[i] = uuid.New()
		contexts[i], cancels[i] = context.WithCancel(t.Context())

		idx := i
		wrappedCancel := func() {
			mu.Lock()
			cancelledFlags[idx] = true
			mu.Unlock()
			cancels[idx]()
		}

		manager.RegisterTask(taskIDs[i], wrappedCancel)
	}

	manager.StartSubscription()
	time.Sleep(100 * time.Millisecond)

	for i := range numTasks {
		err := manager.CancelTask(taskIDs[i])
		assert.NoError(t, err, "Cancel should not return error")
	}

	time.Sleep(1 * time.Second)

	mu.Lock()
	for i := range numTasks {
		assert.True(t, cancelledFlags[i], "Task %d should be cancelled", i)
		assert.Error(t, contexts[i].Err(), "Context %d should be cancelled", i)
	}
	mu.Unlock()
}

func Test_CancelTask_AfterUnregister_TaskNotCancelled(t *testing.T) {
	manager := taskCancelManager

	taskID := uuid.New()
	_, cancel := context.WithCancel(t.Context())
	defer cancel()

	cancelled := false
	var mu sync.Mutex

	wrappedCancel := func() {
		mu.Lock()
		cancelled = true
		mu.Unlock()
		cancel()
	}

	manager.RegisterTask(taskID, wrappedCancel)
	manager.StartSubscription()
	time.Sleep(100 * time.Millisecond)

	manager.UnregisterTask(taskID)

	err := manager.CancelTask(taskID)
	assert.NoError(t, err, "Cancel should not return error")

	time.Sleep(500 * time.Millisecond)

	mu.Lock()
	wasCancelled := cancelled
	mu.Unlock()

	assert.False(t, wasCancelled, "Cancel function should not be called after unregister")
}
