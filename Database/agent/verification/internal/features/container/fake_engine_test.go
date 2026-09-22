package container

import "context"

type fakePurgeEngine struct {
	managed            []ManagedContainer
	removedContainer   []string
	removedNetwork     []string
	listErr            error
	removeContainerErr error
}

func (f *fakePurgeEngine) ListManaged(context.Context, string) ([]ManagedContainer, error) {
	return f.managed, f.listErr
}

func (f *fakePurgeEngine) RemoveContainer(_ context.Context, id string) error {
	if f.removeContainerErr != nil {
		return f.removeContainerErr
	}

	f.removedContainer = append(f.removedContainer, id)

	return nil
}

func (f *fakePurgeEngine) RemoveNetwork(_ context.Context, id string) error {
	f.removedNetwork = append(f.removedNetwork, id)

	return nil
}
