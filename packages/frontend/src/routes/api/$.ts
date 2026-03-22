import { getBaseApiUrl } from "#/utils/get-api-base-url";
import { createFileRoute } from "@tanstack/react-router";
import { getRequestIP } from "@tanstack/react-start/server";

async function proxyRequest(request: Request, splat: string | undefined) {
  const url = new URL(request.url);
  const targetUrl = new URL(`/${splat ?? ""}${url.search}`, getBaseApiUrl());

  const headers = new Headers(request.headers);

  const ip = getRequestIP({ xForwardedFor: true });
  if (ip) headers.set("x-forwarded-for", ip);

  const hasBody = !["GET", "HEAD"].includes(request.method);
  const body = hasBody ? await request.arrayBuffer() : null;

  const upstream = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: body && body.byteLength > 0 ? body : null,
    redirect: "manual",
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: upstream.headers,
  });
}

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: async ({ request, params }) => proxyRequest(request, params._splat),
      POST: async ({ request, params }) => proxyRequest(request, params._splat),
      PUT: async ({ request, params }) => proxyRequest(request, params._splat),
      PATCH: async ({ request, params }) =>
        proxyRequest(request, params._splat),
      DELETE: async ({ request, params }) =>
        proxyRequest(request, params._splat),
      OPTIONS: async ({ request, params }) =>
        proxyRequest(request, params._splat),
      HEAD: async ({ request, params }) => proxyRequest(request, params._splat),
    },
  },
});
