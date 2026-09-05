import { TanStackDevtools } from "@tanstack/react-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { DevTools as JotaiDevTools } from "jotai-devtools";

if (import.meta.env.DEV) {
  void import("./devtools.css");
  void import("jotai-devtools/styles.css");
}

const MailpitPanel = () => (
  <iframe
    title="Mailpit"
    src="http://localhost:8025"
    referrerPolicy="no-referrer"
    // oxlint-disable-next-line react/iframe-missing-sandbox
    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads"
    style={{
      border: 0,
      display: "block",
      height: "100%",
      width: "100%",
    }}
  />
);

export const Devtools = () => (
  <TanStackDevtools
    config={{
      defaultOpen: false,
      panelLocation: "bottom",
      triggerMode: "floating",
      position: "bottom-left",
    }}
    plugins={[
      {
        id: "tanstack-query",
        name: "TanStack Query",
        render: <ReactQueryDevtoolsPanel style={{ height: "100%" }} />,
      },
      {
        id: "tanstack-router",
        name: "TanStack Router",
        render: <TanStackRouterDevtoolsPanel />,
      },
      {
        id: "jotai",
        name: "Jotai",
        render: <JotaiDevTools isInitialOpen />,
      },
      {
        id: "mailpit",
        name: "Mailpit",
        render: <MailpitPanel />,
      },
    ]}
  />
);
