package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func assertNoStoreHeaders(t *testing.T, response *httptest.ResponseRecorder) {
	t.Helper()

	assert.Equal(t, "no-store, no-cache, must-revalidate, max-age=0", response.Header().Get("Cache-Control"))
	assert.Equal(t, "no-cache", response.Header().Get("Pragma"))
	assert.Equal(t, "0", response.Header().Get("Expires"))
}

func buildRouterWithNoStore() *gin.Engine {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(NoStoreCacheControl())
	router.GET("/api/v1/system/version", func(ctx *gin.Context) {
		ctx.JSON(http.StatusOK, gin.H{"version": "3.45.0"})
	})
	router.NoRoute(func(ctx *gin.Context) {
		ctx.String(http.StatusOK, "<html></html>")
	})

	return router
}

func Test_NoStoreCacheControl_OnApiRoute_SetsUncacheableHeaders(t *testing.T) {
	response := httptest.NewRecorder()
	buildRouterWithNoStore().ServeHTTP(
		response,
		httptest.NewRequest(http.MethodGet, "/api/v1/system/version", nil),
	)

	assert.Equal(t, http.StatusOK, response.Code)
	assertNoStoreHeaders(t, response)
}

func Test_NoStoreCacheControl_OnStaticFallbackRoute_SetsUncacheableHeaders(t *testing.T) {
	response := httptest.NewRecorder()
	buildRouterWithNoStore().ServeHTTP(
		response,
		httptest.NewRequest(http.MethodGet, "/assets/index-a1b2c3d4.js", nil),
	)

	assert.Equal(t, http.StatusOK, response.Code)
	assertNoStoreHeaders(t, response)
}
