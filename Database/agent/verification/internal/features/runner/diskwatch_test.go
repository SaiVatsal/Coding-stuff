package runner

import (
	"context"
	"errors"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"databasus-verification-agent/internal/testutil"
)

type fakeDiskProbe struct {
	mu     sync.Mutex
	values []int64
	errs   []error
	calls  int
}

func (p *fakeDiskProbe) GetDiskUsageBytes(context.Context) (int64, error) {
	p.mu.Lock()
	defer p.mu.Unlock()

	i := p.calls
	if i >= len(p.values) {
		i = len(p.values) - 1
	}

	p.calls++

	var err error
	if p.calls-1 < len(p.errs) {
		err = p.errs[p.calls-1]
	}

	return p.values[i], err
}

func newTestDiskWatcher(probe diskUsageProber, ceilingBytes int64, onLimitExceeded func()) *diskWatcher {
	w := newDiskWatcher(probe, ceilingBytes, onLimitExceeded, testutil.DiscardLogger())
	w.interval = time.Millisecond

	return w
}

func Test_DiskWatcher_WhenUsageReachesCeiling_FiresOnce(t *testing.T) {
	var fired atomic.Int32
	done := make(chan struct{})

	w := newTestDiskWatcher(
		&fakeDiskProbe{values: []int64{100}}, 100,
		func() { fired.Add(1); close(done) },
	)

	go w.run(t.Context())

	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Fatal("watcher never fired despite usage at ceiling")
	}

	time.Sleep(20 * time.Millisecond)
	assert.Equal(t, int32(1), fired.Load(), "onLimitExceeded must fire exactly once")
}

func Test_DiskWatcher_WhenUsageBelowCeiling_NeverFires(t *testing.T) {
	var fired atomic.Int32
	ctx, cancel := context.WithCancel(t.Context())

	w := newTestDiskWatcher(
		&fakeDiskProbe{values: []int64{50}}, 100,
		func() { fired.Add(1) },
	)

	stopped := make(chan struct{})
	go func() { w.run(ctx); close(stopped) }()

	time.Sleep(30 * time.Millisecond)
	cancel()

	select {
	case <-stopped:
	case <-time.After(2 * time.Second):
		t.Fatal("watcher did not stop on context cancel")
	}

	assert.Equal(t, int32(0), fired.Load(), "must not fire while under the ceiling")
}

func Test_DiskWatcher_WhenProbeErrorsThenRecovers_DoesNotTripOnError(t *testing.T) {
	var fired atomic.Int32
	done := make(chan struct{})

	probe := &fakeDiskProbe{
		values: []int64{0, 0, 200},
		errs:   []error{errors.New("daemon busy"), errors.New("daemon busy"), nil},
	}

	w := newTestDiskWatcher(probe, 100, func() { fired.Add(1); close(done) })

	go w.run(t.Context())

	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Fatal("watcher never fired after probe recovered above ceiling")
	}

	assert.Equal(t, int32(1), fired.Load(),
		"a probe error must not trip the watcher nor stop the loop")
}

func Test_DiskWatcher_WhenContextCancelled_StopsWithoutFiring(t *testing.T) {
	var fired atomic.Int32
	ctx, cancel := context.WithCancel(t.Context())

	w := newTestDiskWatcher(
		&fakeDiskProbe{values: []int64{10}}, 100,
		func() { fired.Add(1) },
	)

	stopped := make(chan struct{})
	go func() { w.run(ctx); close(stopped) }()

	cancel()

	select {
	case <-stopped:
	case <-time.After(2 * time.Second):
		t.Fatal("watcher did not return after context cancel")
	}

	require.Equal(t, int32(0), fired.Load())
}
