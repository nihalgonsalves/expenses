import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from '@storybook/test';

import { Button } from './button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

const meta: Meta<typeof Tooltip> = {
  component: Tooltip,
  render: (props) => (
    <TooltipProvider {...props}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Hover</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Add to library</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // https://github.com/storybookjs/storybook/issues/25258
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await userEvent.hover(canvas.getByRole('button'));

    await waitFor(async () => {
      await expect(
        within(canvas.getByRole('tooltip')).getByText('Add to library'),
      ).toBeVisible();
    });
  },
};

type Story = StoryObj<typeof Tooltip>;

export const Base: Story = {};

export default meta;
