import type { Meta, StoryObj } from "@storybook/react-vite";
import { Fragment } from "react";

import { ScrollArea } from "./scroll-area";
import { Separator } from "./separator";

const tags = Array.from({ length: 50 }).map(
  (_, i, a) => `v1.2.0-beta.${a.length - i}`,
);

const meta: Meta<typeof ScrollArea> = {
  component: ScrollArea,
  render: (props) => (
    <ScrollArea
      {...props}
      viewportClassName="max-h-96"
      rootClassName="rounded-md border w-48"
    >
      <div className="p-4">
        <h4 className="mb-4 text-sm leading-none font-medium">Tags</h4>
        {tags.map((tag) => (
          <Fragment key={tag}>
            <div className="text-sm">{tag}</div>
            <Separator className="my-2" />
          </Fragment>
        ))}
      </div>
    </ScrollArea>
  ),
};

type Story = StoryObj<typeof ScrollArea>;

export const Base: Story = {};

export default meta;
