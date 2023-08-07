import React from 'react';
import { toast } from 'react-hot-toast';

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  {
    hasError: boolean;
    error: unknown;
    componentStack: string;
    displayError: boolean;
  }
> {
  override state = {
    hasError: false,
    error: undefined,
    componentStack: '',
    displayError: false,
  };

  static getDerivedStateFromError(_error: unknown) {
    return { hasError: true };
  }

  override componentDidCatch(error: unknown, info: React.ErrorInfo) {
    this.setState({ error, componentStack: info.componentStack });
  }

  override render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="p-4">
          <div className="alert alert-warning">
            <h3 className="font-bold">Something went wrong</h3>
            <div className="flex-grow" />
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                this.setState({ displayError: true });
              }}
            >
              Display error
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={async () => {
                await navigator.clipboard.writeText(this.state.componentStack);
                toast.success('Copied');
              }}
            >
              Copy to Clipboard
            </button>
          </div>

          {this.state.displayError && (
            <div className="mockup-code text-xs mt-4">
              {this.state.componentStack
                .split('\n')
                .map((line) => line.trim())
                .filter((line) => line !== '')
                .map((line, index) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <pre key={index} data-prefix={index + 1}>
                    <code>
                      {index !== 0 && '> '}
                      {line}
                    </code>
                  </pre>
                ))}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
