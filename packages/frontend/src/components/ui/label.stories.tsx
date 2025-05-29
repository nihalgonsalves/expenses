import type { Meta, StoryObj } from "@storybook/react-vite";

import { Label } from "./label";

const meta: Meta<typeof Label> = {
  component: Label,
  render: (props) => <Label {...props}>Your email address</Label>,
};

type Story = StoryObj<typeof Label>;

export const Base: Story = {};

export default meta;
