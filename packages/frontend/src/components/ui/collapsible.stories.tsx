import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronsUpDownIcon } from "lucide-react";

import { Button } from "./button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./collapsible";

const meta: Meta<typeof Collapsible> = {
  component: Collapsible,
  render: (props) => (
    <Collapsible {...props} className="w-[350px] space-y-2">
      <div className="flex items-center justify-between space-x-4 px-4">
        <h4 className="text-sm font-semibold">
          @peduarte starred 3 repositories
        </h4>
        <CollapsibleTrigger asChild>
          <Button $variant="ghost" $size="sm">
            <ChevronsUpDownIcon className="size-4" />
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-xs">
        @radix-ui/primitives
      </div>
      <CollapsibleContent className="space-y-2">
        <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-xs">
          @radix-ui/colors
        </div>
        <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-xs">
          @stitches/react
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
};

type Story = StoryObj<typeof Collapsible>;

export const Base: Story = {};

export default meta;
