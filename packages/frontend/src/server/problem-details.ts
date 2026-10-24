const STATUS_TITLES = {
  400: "Bad Request",
  401: "Unauthorized",
  429: "Too Many Requests",
} as const;

/**
 * An RFC 9457 Problem Details response
 */
export const problemResponse = ({
  status,
  detail,
  headers,
}: {
  status: keyof typeof STATUS_TITLES;
  detail?: string;
  headers?: Headers;
}) => {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("Content-Type", "application/problem+json");

  return new Response(
    JSON.stringify({
      title: STATUS_TITLES[status],
      status,
      ...(detail === undefined ? {} : { detail }),
    }),
    { status, headers: responseHeaders },
  );
};
