package runner

import (
	"sync"
	"sync/atomic"
	"testing"

	"github.com/stretchr/testify/assert"
)

func Test_Pool_Saturated_ReflectsSlotOccupancyAsJobsStartAndFinish(t *testing.T) {
	pool := NewPool(2)
	assert.False(t, pool.Saturated())

	release := make(chan struct{})
	var started sync.WaitGroup
	started.Add(2)

	for range 2 {
		pool.Go(func() {
			started.Done()
			<-release
		})
	}

	started.Wait()
	assert.True(t, pool.Saturated(), "pool must report saturated at MaxConcurrentJobs")

	close(release)
	pool.Wait()
	assert.False(t, pool.Saturated(), "slots must be released when jobs finish")
}

func Test_Pool_WhenFloodedWithJobs_NeverExceedsCapAndWaitDrainsAll(t *testing.T) {
	const capLimit = 4
	pool := NewPool(capLimit)

	var concurrent, maxConcurrent atomic.Int32

	for range 100 {
		pool.Go(func() {
			cur := concurrent.Add(1)
			for {
				observed := maxConcurrent.Load()
				if cur <= observed || maxConcurrent.CompareAndSwap(observed, cur) {
					break
				}
			}

			concurrent.Add(-1)
		})
	}

	pool.Wait()

	assert.LessOrEqual(t, int(maxConcurrent.Load()), capLimit,
		"concurrency must never exceed the slot count")
	assert.Equal(t, int32(0), concurrent.Load(), "Wait must drain every job")
}
