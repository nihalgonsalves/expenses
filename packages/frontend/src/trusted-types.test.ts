import { config } from "zod";
import { describe, expect, it } from "vitest";
import { allowHTML, allowScriptURL } from "./trusted-types";

const BASE = "https://expenses.example/sheets/1";

describe("allowHTML", () => {
  it("allows React's script element markup", () => {
    expect(allowHTML("<script></script>")).toBe("<script></script>");
  });

  it.each([
    "",
    "<b>hi</b>",
    "<script>alert(1)</script>",
    "<img src=x onerror=alert(1)>",
    "<script></script><script></script>",
  ])("rejects %j", (html) => {
    expect(allowHTML(html)).toBeNull();
  });
});

describe("allowScriptURL", () => {
  it.each([
    [
      "/assets/worker-bundler-abc.js",
      "https://expenses.example/assets/worker-bundler-abc.js",
    ],
    [
      "https://expenses.example/assets/index-abc.js",
      "https://expenses.example/assets/index-abc.js",
    ],
    ["/sw.js", "https://expenses.example/sw.js"],
  ])(
    "allows same-origin assets and the service worker: %j",
    (url, expected) => {
      expect(allowScriptURL(url, BASE, false)).toBe(expected);
    },
  );

  it.each([
    "/api/user",
    "/sw.js/x",
    "/assets/../api/x",
    "/assets-evil/x.js",
    "https://evil.example/assets/x.js",
    "//evil.example/assets/x.js",
    "data:text/javascript,alert(1)",
    "blob:https://expenses.example/0000",
    "javascript:alert(1)",
  ])("rejects %j", (url) => {
    expect(allowScriptURL(url, BASE, false)).toBeNull();
  });

  it("allows any same-origin path in dev", () => {
    expect(allowScriptURL("/node_modules/x.js?worker_file", BASE, true)).toBe(
      "https://expenses.example/node_modules/x.js?worker_file",
    );
    expect(allowScriptURL("https://evil.example/x.js", BASE, true)).toBeNull();
  });
});

it("shares zod's global config object", () => {
  // install-trusted-types.ts sets jitless via this global, before zod loads
  expect(config()).toBe(globalThis.__zod_globalConfig);
});
