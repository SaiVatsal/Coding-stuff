package verifier

import (
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func Test_ComputeAnalyzeTimeout_ScalesWithSizeWithinFloorAndCap(t *testing.T) {
	maxTimeout := 10 * time.Minute

	// Empty DB → exactly the 60s floor; a tiny DB stays close to it.
	assert.Equal(t, analyzeTimeoutMin, computeAnalyzeTimeout(0, maxTimeout))
	tiny := computeAnalyzeTimeout(50*1024*1024, maxTimeout)
	assert.GreaterOrEqual(t, tiny, analyzeTimeoutMin)
	assert.Less(t, tiny, analyzeTimeoutMin+2*time.Second)

	// 10 GB → 60s + 10*30s = 360s, below the cap.
	assert.Equal(t, 360*time.Second, computeAnalyzeTimeout(10*1024*1024*1024, maxTimeout))

	// Huge DB → capped at maxTimeout, never unbounded.
	assert.Equal(t, maxTimeout, computeAnalyzeTimeout(500*1024*1024*1024, maxTimeout))
}

func Test_TierQueries_ExcludeSystemSchemas(t *testing.T) {
	for _, sql := range []string{schemaCountSQL, tableCountSQL, tableStatsSQL} {
		assert.Contains(t, sql, "pg_catalog")
		assert.Contains(t, sql, "information_schema")
		assert.Contains(t, sql, "pg_toast")
		assert.Contains(t, sql, excludedSchemaRegex)
	}

	assert.True(t, strings.HasPrefix(dbSizeSQL, "SELECT pg_database_size"))
	assert.Contains(t, tableCountSQL, "BASE TABLE")
	assert.Contains(t, tableStatsSQL, "LIMIT 100")
}
