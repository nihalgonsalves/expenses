import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge } from "./badge";

const meta: Meta<typeof Badge> = {
  component: Badge,
  args: {
    variant: "default",
  },
  render: (props) => <Badge {...props}>{props.variant}</Badge>,
};

type Story = StoryObj<typeof Badge>;

export const Default: Story = {};

export const Secondary: Story = { args: { variant: "secondary" } };

export const Outline: Story = { args: { variant: "outline" } };

export const Destructive: Story = { args: { variant: "destructive" } };

export default meta;
