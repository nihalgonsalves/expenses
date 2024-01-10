import { Collapsible } from "@radix-ui/react-collapsible";
import * as Sentry from "@sentry/react";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import { toast } from "react-hot-toast";

import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";
import { CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";

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

export const ErrorBoundary = ({ children }: { children: React.ReactNode }) => (
  <Sentry.ErrorBoundary
    fallback={({ error, componentStack, resetError }) => {
      const errorMessage =
        error instanceof Error
          ? error.message
              .split("\n")
              .map((line) => line.trim())
              .join(" ")
          : "Unknown Error";

      return (
        <Collapsible className="p-4">
          <Alert $variant="destructive" className="flex flex-col gap-2">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription className="flex gap-2">
              <RetryErrorButton reset={resetError} />

              <CollapsibleTrigger asChild>
                <Button $variant="outline">Display error</Button>
              </CollapsibleTrigger>
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
                  toast.success("Copied");
                }}
              >
                Copy to Clipboard
              </Button>
            </AlertDescription>

            <CollapsibleContent className="mt-4 text-xs">
              <pre>
                {errorMessage}
                <br />
                {componentStack
                  .split("\n")
                  .map((line) => line.trim())
                  .filter((line) => line !== "")
                  .map((line, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <React.Fragment key={index}>
                      {"> "}
                      {line}
                      <br />
                    </React.Fragment>
                  ))}
              </pre>
            </CollapsibleContent>
          </Alert>
        </Collapsible>
      );
    }}
  >
    {children}
  </Sentry.ErrorBoundary>
);
