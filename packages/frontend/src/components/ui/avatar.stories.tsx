import type { Meta, StoryObj } from "@storybook/react-vite";

import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

const meta: Meta<typeof Avatar> = {
  component: Avatar,
  render: (props) => (
    <Avatar {...props}>
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  ),
};

type Story = StoryObj<typeof Avatar>;

export const Base: Story = {};

export const Fallback: Story = {
  render: (props) => (
    <Avatar {...props}>
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  ),
};

export default meta;
