import { useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { toast } from 'react-hot-toast';

import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';

type ErrorBoundaryState = {
  hasError: boolean;
  error: unknown;
  componentStack: string;
  displayError: boolean;
};

const RetryErrorButton = ({ reset }: { reset: () => void }) => {
  const queryClient = useQueryClient();

  return (
    <Button
      $variant="outline"
      onClick={async () => {
        queryClient.clear();
        await queryClient.invalidateQueries();
        reset();
      }}
    >
      Reset cache and retry
    </Button>
  );
};

const initialState: ErrorBoundaryState = {
  hasError: false,
  error: undefined,
  componentStack: '',
  displayError: false,
};

export class ErrorBoundary extends React.Component<{
  children: React.ReactNode;
}> {
  override state = initialState;

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
          <Alert $variant="destructive" className="flex flex-col gap-2">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription className="flex gap-2">
              <RetryErrorButton
                reset={() => {
                  this.setState(initialState);
                }}
              />

              <Button
                $variant="outline"
                onClick={() => {
                  this.setState({ displayError: true });
                }}
              >
                Display error
              </Button>
              <Button
                $variant="outline"
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
              </Button>
            </AlertDescription>

            {displayError && (
              <div className="mt-4 text-xs">
                <pre>
                  {errorMessage}
                  <br />
                  {componentStack
                    .split('\n')
                    .map((line) => line.trim())
                    .filter((line) => line !== '')
                    .map((line, index) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <React.Fragment key={index}>
                        {'> '}
                        {line}
                        <br />
                      </React.Fragment>
                    ))}
                </pre>
              </div>
            )}
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}
