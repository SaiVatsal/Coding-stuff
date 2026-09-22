package system_agent

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func buildAgentDownloadRouter(t *testing.T) *gin.Engine {
	t.Helper()

	gin.SetMode(gin.TestMode)

	t.Chdir(t.TempDir())
	require.NoError(t, os.MkdirAll("agent-binaries", 0o755))
	require.NoError(t, os.WriteFile(
		verificationAgentBinaryPaths["amd64"], []byte("\x7fELF fake agent"), 0o755,
	))

	router := gin.New()
	GetAgentController().RegisterRoutes(router.Group("/api/v1"))

	return router
}

func Test_DownloadVerificationAgent_WhenBinaryExists_SendsVersionHeader(t *testing.T) {
	t.Setenv("APP_VERSION", "3.45.0")

	router := buildAgentDownloadRouter(t)

	response := httptest.NewRecorder()
	router.ServeHTTP(
		response,
		httptest.NewRequest(http.MethodGet, "/api/v1/system/verification-agent?arch=amd64", nil),
	)

	assert.Equal(t, http.StatusOK, response.Code)
	assert.Equal(t, "3.45.0", response.Header().Get(AgentVersionHeader))
	assert.Equal(t, "application/octet-stream", response.Header().Get("Content-Type"))
}

func Test_DownloadVerificationAgent_WhenArchIsUnknown_ReturnsBadRequest(t *testing.T) {
	router := buildAgentDownloadRouter(t)

	response := httptest.NewRecorder()
	router.ServeHTTP(
		response,
		httptest.NewRequest(http.MethodGet, "/api/v1/system/verification-agent?arch=riscv64", nil),
	)

	assert.Equal(t, http.StatusBadRequest, response.Code)
	assert.Empty(t, response.Header().Get(AgentVersionHeader))
}

func Test_DownloadVerificationAgent_WhenBinaryIsMissing_ReturnsNotFound(t *testing.T) {
	router := buildAgentDownloadRouter(t)
	require.NoError(t, os.Remove(filepath.Clean(verificationAgentBinaryPaths["amd64"])))

	response := httptest.NewRecorder()
	router.ServeHTTP(
		response,
		httptest.NewRequest(http.MethodGet, "/api/v1/system/verification-agent?arch=amd64", nil),
	)

	assert.Equal(t, http.StatusNotFound, response.Code)
}
