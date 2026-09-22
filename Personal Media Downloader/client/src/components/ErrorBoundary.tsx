import { Component, ReactNode } from 'react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { error?: Error }> {
  state = { error: undefined as Error | undefined };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { console.error(error); }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen grid place-items-center p-6">
          <div className="card max-w-md text-center space-y-3">
            <div className="text-3xl">⚠️</div>
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="text-sm text-zinc-400">{this.state.error.message}</p>
            <button className="btn-primary" onClick={() => location.reload()}>Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
