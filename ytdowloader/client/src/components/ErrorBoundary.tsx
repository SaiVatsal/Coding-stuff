import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="glass-card-static p-8 max-w-md text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[rgba(239,68,68,0.1)] mb-4">
              <AlertTriangle className="w-8 h-8 text-[var(--color-error)]" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-[var(--color-text-primary)]">
              Something went wrong
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button className="btn-gradient" onClick={this.handleReset}>
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
