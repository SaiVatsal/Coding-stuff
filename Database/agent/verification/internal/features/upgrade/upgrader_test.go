package upgrade

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"path/filepath"
	"sync/atomic"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"databasus-verification-agent/internal/features/api"
	"databasus-verification-agent/internal/testutil"
)

func goBuildHelper(t *testing.T, mainSrc string) string {
	t.Helper()

	dir := t.TempDir()
	src := filepath.Join(dir, "main.go")
	require.NoError(t, os.WriteFile(src, []byte(mainSrc), 0o644))

	bin := filepath.Join(dir, "helper")

	out, err := exec.Command("go", "build", "-o", bin, src).CombinedOutput()
	require.NoError(t, err, "build helper: %s", out)

	return bin
}

func buildVersionHelper(t *testing.T, version string) string {
	t.Helper()

	return goBuildHelper(t, "package main\n"+
		"import (\"fmt\"; \"os\")\n"+
		"func main(){ if len(os.Args)>1 && os.Args[1]==\"version\" { fmt.Println(\""+
		version+"\"); return }; os.Exit(2) }\n")
}

func buildHangingHelper(t *testing.T) string {
	t.Helper()

	return goBuildHelper(t, "package main\n"+
		"import \"time\"\n"+
		"func main(){ time.Sleep(30 * time.Second) }\n")
}

func Test_VerifyBinary_WhenVersionMatches_ReturnsNil(t *testing.T) {
	helper := buildVersionHelper(t, "v2.0.0")

	require.NoError(t, verifyBinary(helper, "v2.0.0"))
}

func Test_VerifyBinary_WhenVersionMismatch_ReturnsError(t *testing.T) {
	helper := buildVersionHelper(t, "v2.0.0")

	err := verifyBinary(helper, "v9.9.9")

	require.Error(t, err)
	assert.Contains(t, err.Error(), "version mismatch")
}

func Test_VerifyBinary_WhenBinaryNotExecutable_ReturnsError(t *testing.T) {
	notBinary := filepath.Join(t.TempDir(), "not-a-binary")
	require.NoError(t, os.WriteFile(notBinary, []byte("plain text"), 0o644))

	require.Error(t, verifyBinary(notBinary, "v1.0.0"))
}

func Test_VerifyBinary_WhenBinaryHangs_TimesOutInsteadOfBlocking(t *testing.T) {
	original := verifyBinaryTimeout
	verifyBinaryTimeout = 200 * time.Millisecond
	t.Cleanup(func() { verifyBinaryTimeout = original })

	hanging := buildHangingHelper(t)

	start := time.Now()
	err := verifyBinary(hanging, "v1.0.0")
	elapsed := time.Since(start)

	require.Error(t, err)
	assert.Less(t, elapsed, 10*time.Second, "verifyBinary must abort on timeout, not block")
	assert.NotContains(t, err.Error(), "version mismatch")
}

func Test_CheckAndUpdate_WhenDevelopmentMode_DoesNotContactServer(t *testing.T) {
	var hits atomic.Int32

	server := httptest.NewServer(http.HandlerFunc(func(_ http.ResponseWriter, _ *http.Request) {
		hits.Add(1)
	}))
	t.Cleanup(server.Close)

	client := api.NewClient(server.URL, "", "", testutil.DiscardLogger())

	upgraded, err := CheckAndUpdate(client, "v1.0.0", true, testutil.DiscardLogger())

	require.NoError(t, err)
	assert.False(t, upgraded)
	assert.Equal(t, int32(0), hits.Load())
}

func Test_CheckAndUpdate_WhenServerVersionMatches_DoesNotDownload(t *testing.T) {
	var downloadHits atomic.Int32

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/v1/system/version" {
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(map[string]string{"version": "v1.0.0"})
			return
		}

		downloadHits.Add(1)
	}))
	t.Cleanup(server.Close)

	client := api.NewClient(server.URL, "", "", testutil.DiscardLogger())

	upgraded, err := CheckAndUpdate(client, "v1.0.0", false, testutil.DiscardLogger())

	require.NoError(t, err)
	assert.False(t, upgraded)
	assert.Equal(t, int32(0), downloadHits.Load())
}

type fakeBackend struct {
	versionEndpointReports string
	downloadHeaderReports  string
	servedBinaryPrints     string
}

// Both callers below stop before CheckAndUpdate's os.Rename, which would
// otherwise overwrite the running test binary.
func startFakeBackend(t *testing.T, backend fakeBackend) *httptest.Server {
	t.Helper()

	binary, err := os.ReadFile(buildVersionHelper(t, backend.servedBinaryPrints))
	require.NoError(t, err)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/v1/system/version" {
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(map[string]string{"version": backend.versionEndpointReports})

			return
		}

		w.Header().Set("X-Databasus-Version", backend.downloadHeaderReports)
		_, _ = w.Write(binary)
	}))
	t.Cleanup(server.Close)

	return server
}

func Test_CheckAndUpdate_WhenServerVersionIsStaleButBinaryMatchesCurrent_SkipsUpgrade(t *testing.T) {
	server := startFakeBackend(t, fakeBackend{
		versionEndpointReports: "v3.43.0",
		downloadHeaderReports:  "v3.45.0",
		servedBinaryPrints:     "v3.45.0",
	})
	client := api.NewClient(server.URL, "", "", testutil.DiscardLogger())

	upgraded, err := CheckAndUpdate(client, "v3.45.0", false, testutil.DiscardLogger())

	require.NoError(t, err)
	assert.False(t, upgraded, "a stale /system/version must not make the agent re-exec into itself")
}

func Test_CheckAndUpdate_WhenDownloadedBinaryDisagreesWithVersionHeader_ReturnsMismatchError(t *testing.T) {
	server := startFakeBackend(t, fakeBackend{
		versionEndpointReports: "v3.46.0",
		downloadHeaderReports:  "v3.46.0",
		servedBinaryPrints:     "v3.44.0",
	})
	client := api.NewClient(server.URL, "", "", testutil.DiscardLogger())

	upgraded, err := CheckAndUpdate(client, "v3.44.0", false, testutil.DiscardLogger())

	require.Error(t, err)
	assert.False(t, upgraded)
	assert.Contains(t, err.Error(), "version mismatch")
}

func Test_CheckAndUpdate_WhenServerUnreachable_ReturnsError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(_ http.ResponseWriter, _ *http.Request) {}))
	server.Close()

	client := api.NewClient(server.URL, "", "", testutil.DiscardLogger())

	upgraded, err := CheckAndUpdate(client, "v1.0.0", false, testutil.DiscardLogger())

	require.Error(t, err)
	assert.False(t, upgraded)
	assert.Contains(t, err.Error(), "unable to check version")
}

func Test_BackgroundUpgrader_WhenDevelopmentMode_NeverUpgrades(t *testing.T) {
	client := api.NewClient("http://127.0.0.1:0", "", "", testutil.DiscardLogger())
	upgrader := NewBackgroundUpgrader(client, "v1.0.0", true, func() {}, testutil.DiscardLogger())

	assert.False(t, upgrader.checkAndUpgrade())
	assert.False(t, upgrader.IsUpgraded())
}

func Test_BackgroundUpgrader_WhenRunCalledTwice_Panics(t *testing.T) {
	client := api.NewClient("http://127.0.0.1:0", "", "", testutil.DiscardLogger())
	ctx, cancel := context.WithCancel(t.Context())
	upgrader := NewBackgroundUpgrader(client, "v1.0.0", true, cancel, testutil.DiscardLogger())

	cancel()
	upgrader.Run(ctx)

	assert.Panics(t, func() { upgrader.Run(ctx) })
}
