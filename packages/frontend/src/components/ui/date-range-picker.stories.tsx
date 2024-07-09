import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";

import { DateRangePicker } from "./date-range-picker";

const meta: Meta<typeof DateRangePicker> = {
  component: DateRangePicker,
  argTypes: {},
  args: {},
  render: (props) => (
    <DateRangePicker
      {...props}
      initialDateFrom="2024-01-01"
      initialDateTo="2024-12-31"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button"));
  },
};

type Story = StoryObj<typeof DateRangePicker>;

export const Base: Story = {};

export default meta;
