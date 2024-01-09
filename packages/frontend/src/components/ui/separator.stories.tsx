import type { Meta, StoryObj } from "@storybook/react";

import { Separator } from "./separator";

const meta: Meta<typeof Separator> = {
  component: Separator,
  render: () => (
    <div className="flex flex-col gap-2">
      <div>
        <h4 className="text-sm font-medium leading-none">Radix Primitives</h4>
        <p className="text-muted-foreground text-sm">
          An open-source UI component library.
        </p>
      </div>
      <Separator className="my-4" />
      <div className="flex h-5 items-center gap-2 text-sm">
        <div>Blog</div>
        <Separator orientation="vertical" />
        <div>Docs</div>
        <Separator orientation="vertical" />
        <div>Source</div>
      </div>
    </div>
  ),
};

type Story = StoryObj<typeof Separator>;

export const Base: Story = {};

export default meta;
