package middleware

import "github.com/gin-gonic/gin"

// Nothing this server returns is cacheable: the API is dynamic and often
// sensitive, and the image rewrites index.html and runtime-config.js on every
// container start. Pragma and Expires cover HTTP/1.0 intermediaries.
func NoStoreCacheControl() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		ctx.Header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
		ctx.Header("Pragma", "no-cache")
		ctx.Header("Expires", "0")
		ctx.Next()
	}
}
