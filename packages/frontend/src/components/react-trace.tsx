import { CopyToClipboardPlugin } from "@react-trace/plugin-copy-to-clipboard";
import { OpenEditorPlugin } from "@react-trace/plugin-open-editor";
import { Trace } from "@react-trace/core";
import { ClientOnly } from "@tanstack/react-router";

export const ReactTrace = () => (
  <ClientOnly>
    <Trace
      // oxlint-disable-next-line typescript/no-unsafe-assignment
      root={import.meta.env["VITE_ROOT"]}
      plugins={[CopyToClipboardPlugin(), OpenEditorPlugin()]}
    />
  </ClientOnly>
);
