import React from 'react';
import { toast } from 'react-hot-toast';

type ErrorBoundaryState = {
  hasError: boolean;
  error: unknown;
  componentStack: string;
  displayError: boolean;
};
export class ErrorBoundary extends React.Component<{
  children: React.ReactNode;
}> {
  override state: ErrorBoundaryState = {
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
    const { displayError, hasError, error, componentStack } = this.state;

    if (hasError) {
      const errorMessage =
        error instanceof Error
          ? error.message
              .split('\n')
              .map((line) => line.trim())
              .join(' ')
          : 'Unknown Error';

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
                await navigator.clipboard.writeText(
                  JSON.stringify(
                    {
                      errorMessage,
                      componentStack,
                      location: window.location.toString(),
                    },
                    null,
                    2,
                  ),
                );
                toast.success('Copied');
              }}
            >
              Copy to Clipboard
            </button>
          </div>

          {displayError && (
            <div className="mockup-code text-xs mt-4">
              <pre data-prefix={1}>
                <code>{errorMessage}</code>
              </pre>

              {componentStack
                .split('\n')
                .map((line) => line.trim())
                .filter((line) => line !== '')
                .map((line, index) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <pre key={index} data-prefix={index + 2}>
                    <code>
                      {'> '}
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
