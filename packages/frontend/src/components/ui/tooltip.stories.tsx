import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button } from "./button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

const meta: Meta<typeof Tooltip> = {
  component: Tooltip,
  render: (props) => (
    <TooltipProvider {...props}>
      <Tooltip>
        <TooltipTrigger render={<Button $variant="outline">Hover</Button>} />
        <TooltipContent>
          <p>Add to library</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByRole("button"));

    await waitFor(async () => {
      await expect(
        within(canvas.getByRole("tooltip")).getByText("Add to library"),
      ).toBeVisible();
    });
  },
};

type Story = StoryObj<typeof Tooltip>;

export const Base: Story = {};

export default meta;
