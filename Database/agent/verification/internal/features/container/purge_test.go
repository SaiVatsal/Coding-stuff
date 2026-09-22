package container

import (
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"

	"databasus-verification-agent/internal/testutil"
)

func Test_PurgeAgentContainers_RemovesEveryContainerAndNetwork(t *testing.T) {
	engine := &fakePurgeEngine{
		managed: []ManagedContainer{
			{ID: "c1", NetworkID: "n1", VerificationID: uuid.New().String()},
			{ID: "c2", NetworkID: "n2", VerificationID: uuid.New().String()},
		},
	}

	purgeAgentContainers(t.Context(), engine, "agent-1", testutil.DiscardLogger())

	assert.ElementsMatch(t, []string{"c1", "c2"}, engine.removedContainer)
	assert.ElementsMatch(t, []string{"n1", "n2"}, engine.removedNetwork)
}

func Test_PurgeAgentContainers_WhenNetworkIDEmpty_RemovesContainerOnly(t *testing.T) {
	engine := &fakePurgeEngine{
		managed: []ManagedContainer{{ID: "c1", VerificationID: uuid.New().String()}},
	}

	purgeAgentContainers(t.Context(), engine, "agent-1", testutil.DiscardLogger())

	assert.Equal(t, []string{"c1"}, engine.removedContainer)
	assert.Empty(t, engine.removedNetwork)
}

func Test_PurgeAgentContainers_WhenListFails_RemovesNothing(t *testing.T) {
	engine := &fakePurgeEngine{
		managed: []ManagedContainer{{ID: "c1", NetworkID: "n1"}},
		listErr: errors.New("docker unreachable"),
	}

	purgeAgentContainers(t.Context(), engine, "agent-1", testutil.DiscardLogger())

	assert.Empty(t, engine.removedContainer)
	assert.Empty(t, engine.removedNetwork)
}

func Test_PurgeAgentContainers_WhenListEmpty_DoesNothing(t *testing.T) {
	engine := &fakePurgeEngine{}

	purgeAgentContainers(t.Context(), engine, "agent-1", testutil.DiscardLogger())

	assert.Empty(t, engine.removedContainer)
	assert.Empty(t, engine.removedNetwork)
}

func Test_PurgeAgentContainers_WhenContainerRemovalFails_SkipsNetworkAndContinues(t *testing.T) {
	engine := &fakePurgeEngine{
		managed: []ManagedContainer{
			{ID: "c1", NetworkID: "n1", VerificationID: uuid.New().String()},
			{ID: "c2", NetworkID: "n2", VerificationID: uuid.New().String()},
		},
		removeContainerErr: errors.New("container in use"),
	}

	assert.NotPanics(t, func() {
		purgeAgentContainers(t.Context(), engine, "agent-1", testutil.DiscardLogger())
	})

	assert.Empty(t, engine.removedContainer)
	assert.Empty(t, engine.removedNetwork)
}
