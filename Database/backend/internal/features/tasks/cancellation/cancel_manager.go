package task_cancellation

import (
	"context"
	"log/slog"
	"sync"

	"github.com/google/uuid"

	cache_utils "databasus-backend/internal/util/cache"
)

const taskCancelChannel = "task:cancel"

type TaskCancelManager struct {
	mu          sync.RWMutex
	cancelFuncs map[uuid.UUID]context.CancelFunc
	pubsub      *cache_utils.PubSubManager
	logger      *slog.Logger
}

func (m *TaskCancelManager) StartSubscription() {
	ctx := context.Background()

	handler := func(message string) {
		taskID, err := uuid.Parse(message)
		if err != nil {
			m.logger.Error("Invalid task ID in cancel message", "message", message, "error", err)
			return
		}

		m.mu.Lock()
		defer m.mu.Unlock()

		cancelFunc, exists := m.cancelFuncs[taskID]
		if exists {
			cancelFunc()
			delete(m.cancelFuncs, taskID)
			m.logger.Info("Cancelled task via Pub/Sub", "taskID", taskID)
		}
	}

	err := m.pubsub.Subscribe(ctx, taskCancelChannel, handler)
	if err != nil {
		m.logger.Error("Failed to subscribe to task cancel channel", "error", err)
	} else {
		m.logger.Info("Successfully subscribed to task cancel channel")
	}
}

func (m *TaskCancelManager) RegisterTask(task uuid.UUID, cancelFunc context.CancelFunc) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.cancelFuncs[task] = cancelFunc
	m.logger.Debug("Registered task", "taskID", task)
}

func (m *TaskCancelManager) CancelTask(taskID uuid.UUID) error {
	ctx := context.Background()

	err := m.pubsub.Publish(ctx, taskCancelChannel, taskID.String())
	if err != nil {
		m.logger.Error("Failed to publish cancel message", "taskID", taskID, "error", err)
		return err
	}

	m.logger.Info("Published task cancel message", "taskID", taskID)
	return nil
}

func (m *TaskCancelManager) UnregisterTask(taskID uuid.UUID) {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.cancelFuncs, taskID)
	m.logger.Debug("Unregistered task", "taskID", taskID)
}
