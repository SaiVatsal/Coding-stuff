package runner

import "sync"

// Pool is a plain bounded-concurrency semaphore. There is deliberately no
// disk math here — the server is the sole disk-admission authority; the pool
// only caps how many verifications run at once.
type Pool struct {
	slots chan struct{}
	wg    sync.WaitGroup
}

func NewPool(maxConcurrentJobs int) *Pool {
	return &Pool{slots: make(chan struct{}, maxConcurrentJobs)}
}

func (p *Pool) Saturated() bool {
	return len(p.slots) == cap(p.slots)
}

// Go acquires a slot and runs fn in a goroutine, releasing the slot when fn
// returns. The runner loop is the only producer and only calls Go after
// Saturated() == false, so the send never blocks in practice.
//
// There is deliberately no recover() here. Container freshness has no periodic
// reaper — it relies on the invariant that any lost container is followed by a
// process restart (then the startup purge cleans up). A panicking job must
// therefore crash the process. Adding recovery would let a long-lived process
// leak a container with no safety net; restore a sweep before doing so.
func (p *Pool) Go(fn func()) {
	p.slots <- struct{}{}

	p.wg.Go(func() {
		defer func() { <-p.slots }()

		fn()
	})
}

// Wait blocks until every in-flight job has returned. The runner calls it on
// shutdown so deferred container teardown runs before the process exits or
// re-execs on self-update.
func (p *Pool) Wait() {
	p.wg.Wait()
}
