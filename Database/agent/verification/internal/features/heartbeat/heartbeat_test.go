package heartbeat

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"databasus-verification-agent/internal/config"
	"databasus-verification-agent/internal/features/api"
	"databasus-verification-agent/internal/testutil"
)

func Test_Beat_WhenNoJobsRegistered_ReportsCapacityWithRamConvertedToGbAndNoVerificationIDs(t *testing.T) {
	var body map[string]any

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.NoError(t, json.NewDecoder(r.Body).Decode(&body))
		_ = json.NewEncoder(w).Encode(map[string]any{
			"lastSeenAt":           time.Now().UTC().Format(time.RFC3339),
			"abortVerificationIds": []string{},
		})
	}))
	t.Cleanup(server.Close)

	client := api.NewClient(server.URL, "tok", "agent-1", testutil.DiscardLogger())
	capacity := config.Capacity{
		MaxCPU:            8,
		MaxRAMMb:          4096,
		MaxDiskGb:         100,
		MaxConcurrentJobs: 4,
	}

	NewHeartbeater(client, capacity, testutil.DiscardLogger()).sendHeartbeat(t.Context(), testutil.DiscardLogger())

	assert.Equal(t, float64(8), body["maxCpu"])
	assert.Equal(t, float64(4), body["maxRamGb"], "4096 MB must be reported as 4 GB")
	assert.Equal(t, float64(100), body["maxDiskGb"])
	assert.Equal(t, float64(4), body["maxConcurrentJobs"])
	assert.Equal(t, []any{}, body["currentVerificationIds"])
}

func Test_Beat_WhenJobRegistered_ReportsItsIDAsCurrentVerificationID(t *testing.T) {
	var body map[string]any

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.NoError(t, json.NewDecoder(r.Body).Decode(&body))
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"lastSeenAt":           time.Now().UTC().Format(time.RFC3339),
			"abortVerificationIds": []string{},
		})
	}))
	t.Cleanup(server.Close)

	client := api.NewClient(server.URL, "tok", "agent-1", testutil.DiscardLogger())
	hb := NewHeartbeater(client, config.Capacity{}, testutil.DiscardLogger())

	jobID := uuid.New()
	hb.TrackVerification(jobID, func() {})

	hb.sendHeartbeat(t.Context(), testutil.DiscardLogger())

	ids, ok := body["currentVerificationIds"].([]any)
	require.True(t, ok)
	require.Len(t, ids, 1)
	assert.Equal(t, jobID.String(), ids[0])
}

func Test_Beat_WhenResponseListsAbortID_CancelsMatchingJobAndRecordsAbort(t *testing.T) {
	abortID := uuid.New()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"lastSeenAt":           time.Now().UTC().Format(time.RFC3339),
			"abortVerificationIds": []string{abortID.String()},
		})
	}))
	t.Cleanup(server.Close)

	client := api.NewClient(server.URL, "tok", "agent-1", testutil.DiscardLogger())
	hb := NewHeartbeater(client, config.Capacity{}, testutil.DiscardLogger())

	canceled := make(chan struct{})
	hb.TrackVerification(abortID, func() { close(canceled) })

	hb.sendHeartbeat(t.Context(), testutil.DiscardLogger())

	select {
	case <-canceled:
	case <-time.After(2 * time.Second):
		t.Fatal("registered job's context was not cancelled on server abort")
	}

	assert.True(t, hb.IsAborted(abortID),
		"the abort set must be recorded for the runner's pre-FAILED re-check")
}

func Test_Heartbeater_Run_WhenCalledTwice_Panics(t *testing.T) {
	client := api.NewClient("http://127.0.0.1:0", "tok", "agent-1", testutil.DiscardLogger())
	heartbeater := NewHeartbeater(client, config.Capacity{}, testutil.DiscardLogger())

	ctx, cancel := context.WithCancel(t.Context())
	cancel()
	heartbeater.Run(ctx)

	assert.Panics(t, func() { heartbeater.Run(ctx) })
}

func Test_Heartbeater_Run_WhenContextCanceled_StopsPromptly(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{
			"lastSeenAt":           time.Now().UTC().Format(time.RFC3339),
			"abortVerificationIds": []string{},
		})
	}))
	t.Cleanup(server.Close)

	client := api.NewClient(server.URL, "tok", "agent-1", testutil.DiscardLogger())
	heartbeater := NewHeartbeater(client, config.Capacity{MaxConcurrentJobs: 1}, testutil.DiscardLogger())

	ctx, cancel := context.WithCancel(t.Context())
	stopped := make(chan struct{})

	go func() {
		heartbeater.Run(ctx)
		close(stopped)
	}()

	cancel()

	select {
	case <-stopped:
	case <-time.After(5 * time.Second):
		t.Fatal("Run did not return after context cancellation")
	}
}
